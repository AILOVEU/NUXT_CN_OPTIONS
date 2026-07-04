import { fields_dict, OPTIONS_MAP, MONTH_ICON, 金额, 最大建议买入时间价 } from "~/data";
import dayjs from "dayjs";
import { formatDecimal, getRandomInt, promiseAllSequential } from "~/utils/utils";
import { useMoneyStore } from "~/stores/useMoneyStore";
import { ElMessage } from "element-plus";
import _ from "lodash";
import { blackScholesOptionPrice } from "~/utils/bs";

export function get_fist_季度月份(dataList) {
  const month_list = Array.from(new Set(dataList.map((el) => el["到期日"])));
  month_list.sort();
  let month_index = 0;
  for (let _index = 0; _index < month_list.length; _index++) {
    const day = dayjs(month_list[_index], "YYYY-MM-DD").format("MM月");
    if (["03月", "06月", "09月", "12月"].includes(day)) {
      month_index = _index;
      break;
    }
  }
  return [month_list, month_index];
}

export function filter是否保留行(symmetricData, tiledData, filteredTiledData) {
  // 第一步：预处理，为每个普通行计算flag值
  const dataWithFlags = symmetricData.map((item) => {
    if (item._split) {
      return { ...item, _flag: "_split" }; // 特殊行标记flag为null
    }
    if (item._current) {
      return { ...item, _flag: "_current" }; // 特殊行标记flag为null
    }
    // 计算普通行的flag
    const flag = filteredTiledData.filter((el) => !el["_限制展示"]).some((el) => item["行内期权名称List"].includes(el["期权名称"]));
    return { ...item, _flag: flag };
  });

  // 第二步：按_split:true分割成多个数据块
  const blocks = [];
  let currentBlock = [];

  for (const item of dataWithFlags) {
    if (item._split) {
      // 遇到分割符，先保存当前块（如果有内容）
      if (currentBlock.length > 0) {
        blocks.push(currentBlock);
        currentBlock = [];
      }
      // 分割符单独作为一个块
      blocks.push([item]);
    } else {
      currentBlock.push(item);
    }
  }
  // 处理最后一个块
  if (currentBlock.length > 0) {
    blocks.push(currentBlock);
  }

  // 第三步：处理每个数据块
  const processedBlocks = blocks.map((block) => {
    // 如果是分割符块，直接保留
    if (block.length === 1 && block[0]._split) {
      return block;
    }

    // 找出块内所有普通行的flag为true的索引
    const trueIndices = [];
    block.forEach((item, index) => {
      if ([true, "_current"].includes(item._flag)) {
        trueIndices.push(index);
      }
    });

    // 如果块内没有任何flag为true的普通行，整个块过滤掉
    if (trueIndices.length <= 1) {
      return [];
    }

    // 找到第一个和最后一个true的位置
    const firstTrueIndex = trueIndices[0];
    const lastTrueIndex = trueIndices[trueIndices.length - 1];

    // 保留从第一个true到最后一个true之间的所有行（包括_current和中间的false）
    const filteredBlock = block.slice(firstTrueIndex, lastTrueIndex + 1);

    // 移除我们添加的临时_flag属性（可选，根据你的需要）
    return filteredBlock.map(({ _flag, ...rest }) => rest);
  });

  // 第四步：合并所有处理后的块并返回
  return processedBlocks.flat();
}

function isTimeBetweenNoonMarketClosed() {
  const now = dayjs();
  const startTime = dayjs().hour(11).minute(30).second(0);
  const endTime = dayjs().hour(13).minute(0).second(0);

  return now.isAfter(startTime) && now.isBefore(endTime);
}

function isTimeAfterMarketClosed() {
  const now = dayjs();
  const startTime = dayjs().hour(15).minute(0).second(0);
  return now.isAfter(startTime);
}

function isTimeNotWorkDay() {
  // const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  // const weekNumb = dayjs(name, "YYYY-MM-DD").day();
  const now = dayjs();
  const weekday = now.day();
  return [0, 6].includes(weekday);
}

function get_最新价(row) {
  let { 最新价, 卖一, 买一 } = row;
  if (!卖一 || !买一) return 最新价;
  const 中间价 = Math.round(((卖一 + 买一) / 2) * 10000) / 10000;
  if (最新价 === "-" || !最新价) return 中间价;
  if (isTimeBetweenNoonMarketClosed() || isTimeAfterMarketClosed() || isTimeNotWorkDay()) return 最新价;
  if (最新价 > 卖一 || 最新价 < 买一) return 中间价;
  return 最新价;
}
function get_持仓金额变化(成交Json, row) {
  let targetList = 成交Json.filter((item) => [item["期权名称"], "XD" + item["期权名称"]].some((el) => el === row["期权名称"]));
  if (!targetList.length) return 0;
  let 持仓金额变化 = 0;
  targetList.forEach((item) => {
    持仓金额变化 += +item["持仓变化"] * item["成交价格"] * row["合约单位"];
  });
  return formatDecimal(持仓金额变化, 0);
}
function get_持仓变化(成交Json, row) {
  let targetList = 成交Json.filter((item) => [item["期权名称"], "XD" + item["期权名称"]].some((el) => el === row["期权名称"]));
  if (!targetList.length) return 0;
  let 持仓变化 = 0;
  targetList.forEach((item) => {
    持仓变化 += +item["持仓变化"];
  });
  return 持仓变化;
}

function get_持仓(持仓JSON, row) {
  let targetList = 持仓JSON.filter((item) => [item["名称"], "XD" + item["名称"]].some((el) => el === row["期权名称"]));
  if (!targetList.length) return 0;
  let 持仓 = 0;
  targetList.forEach((item) => {
    let item持仓 = +item["持仓"];
    持仓 += item["持仓类别"] === "义务仓" ? -item持仓 : item持仓;
  });
  return 持仓;
  // let target = 持仓JSON.find((item) => item["名称"] === row["期权名称"]);
  // if (!target) return 0;
  // let 持仓 = +target["持仓"];
  // return target["持仓类别"] === "义务仓" ? -持仓 : 持仓;
}

function get_option_实值(el) {
  const isCall = el["期权名称"].includes("购");
  const 实值 = isCall ? el["正股价格"] - el["行权价"] : el["行权价"] - el["正股价格"];
  return 实值 > 0 ? Math.floor(实值 * el["合约单位"]) / el["合约单位"] : 0;
}

function get_stock_code(name) {
  let code;
  OPTIONS_MAP.forEach((el) => {
    if (el.linkName.some((item) => name.includes(item))) {
      code = el.code;
    }
  });
  return code;
}

function get_成本价(row, 持仓JSON) {
  let 成本价 = 持仓JSON.find((item) => [item["名称"], "XD" + item["名称"]].some((el) => el === row["期权名称"]))?.开仓均价 || undefined;
  成本价 = 成本价 ? +成本价 : undefined;
  return 成本价;
}
function get组合名称(权利Item, 义务Item) {
  const 正股名称 = 权利Item["正股名称"];
  const 行权价Name = `${权利Item["千行权价"]}-${义务Item["千行权价"]}`;
  const 到期月 = dayjs(权利Item["到期日"], "YYYY-MM-DD").format("M月");
  return `${正股名称}${权利Item["沽购"]}${到期月}  ${行权价Name}`;
}
// function getIs非法持仓(row) {
//   if (row["持仓"]) {
//     if (row["一手时间价"] > row["一手内在价"] || row["一手时间价"] > 最大建议买入时间价) return true;
//     if (row["到期天数"] < 15) return true;
//   }
//   return false;
// }
export function 构建组合(tiledData) {
  const { set保证金 } = useMoneyStore();
  const 持仓List = tiledData.filter((el) => el["持仓"]);
  const 组合List = [];
  let 持仓Map = {};
  持仓List.forEach((el) => {
    持仓Map[el["期权名称"]] = { ...el };
  });
  let 义务仓List = 持仓List.filter((el) => el["持仓"] < 0);
  let loopCount = 0;
  while (义务仓List.length && loopCount < 100) {
    loopCount += 1;
    义务仓List.forEach((el) => {
      const 义务Name = el["期权名称"];
      const isCall = 义务Name.includes("购");
      const 义务行权价 = el["千行权价"];
      let 权利行权价 = 义务行权价 + (isCall ? -50 : 50);
      let 权利Name = 义务Name.replace(义务行权价, 权利行权价);
      let loopCount2 = 0;
      while (loopCount2 < 100 && 权利行权价 > 50 && (!持仓Map[权利Name]?.持仓 || 持仓Map[权利Name]?.持仓 < 0)) {
        loopCount2 += 1;
        权利行权价 = 权利行权价 + (isCall ? -50 : 50);
        权利Name = 义务Name.replace(义务行权价, 权利行权价);
      }
      if (loopCount2 > 99) {
        return;
      }
      const min持仓 = Math.min(Math.abs(持仓Map[权利Name].持仓), Math.abs(持仓Map[义务Name].持仓));
      const 组合名称 = get组合名称(持仓Map[权利Name], 持仓Map[义务Name]);
      组合List.push([权利Name, 义务Name, min持仓, 组合名称]);
      持仓Map[权利Name].持仓 = 持仓Map[权利Name].持仓 - min持仓;
      持仓Map[义务Name].持仓 = 持仓Map[义务Name].持仓 + min持仓;
      if (!持仓Map[义务Name].持仓) {
        义务仓List = 义务仓List.filter((el) => el["期权名称"] !== 义务Name);
      }
    });
  }
  // let 占用保证金 = 0;
  // 组合List.forEach((el) => {
  //   占用保证金 += el[2] * 50;
  // });
  // // 金额.占用保证金 = 占用保证金;
  // set保证金(占用保证金);
  return 组合List;
}

export function toPrice(val, 合约单位) {
  return Math.floor(val * 合约单位);
}
function sleep(time) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, time);
  });
}
async function get_target_http_data(持仓JSON, fs) {
  return new Promise(async (resolve, reject) => {
    let curr_page = 1;
    const pz = 20;
    let tiledData = [];
    while (curr_page < 50) {
      // const res = await $fetch("https://push2.eastmoney.com/api/qt/clist/get", {
      const res = await $fetch("/api/queryEastmoney", {
        method: "get",
        params: {
          np: "1",
          fltt: "2",
          invt: "2",
          fs,
          fields: Object.keys(fields_dict).join(","),
          fid: "f3",
          pn: curr_page + "",
          pz,
          po: "1",
          dect: "1",
          // ut: generateRandomString(32),
          ut: "fa5fd1943c7b386f172d6893dbfba10b",
          wbp2u: "|0|1|0|web",
          _: dayjs().valueOf() - Math.floor(Math.random() * 100),
          // fs: "m:10+c:510050",
          // fs: "m:10,m:12",
          // fs: "m:10",
        },
      }).catch((res) => {
        console.warn(res);
        reject(false);
      });
      console.log("fs query", fs, curr_page);
      await sleep(getRandomInt(2, 4) * 1000);
      if (!res["data"]) {
        console.log(fs + "请求完成" + tiledData.length);
        break;
      }
      curr_page += 1;
      let res_data = res["data"]["diff"];
      res_data.forEach((_) => {
        tiledData.push(_);
      });
      if (res_data?.length < pz) {
        console.log(fs + "请求完成" + tiledData.length);
        break;
      }
    }
    console.log("fs resolve", fs);
    resolve(tiledData);
  });
}
let DEBUG_LIST = {};
function debug(_tiledData) {
  console.log(
    "DEBUG_LIST - ",
    _.unionBy(_tiledData, (row) => row["f333"])
  );
}

// 处理期权数据，添加档位字段
function processOptionData(optionData) {
  // 按正股代码分组处理
  const groupedData = {};

  // 第一步：分组并提取每个正股的唯一行权价
  optionData.forEach((item) => {
    const code = item.正股代码;
    if (!groupedData[code]) {
      groupedData[code] = {
        items: [],
        strikePrices: new Set(),
        underlyingPrice: item.正股价格,
      };
    }
    groupedData[code].items.push(item);
    groupedData[code].strikePrices.add(item.行权价);
  });

  // 第二步：为每个正股计算档位
  Object.keys(groupedData).forEach((code) => {
    const group = groupedData[code];
    // 将行权价转换为数组并排序
    const sortedStrikes = Array.from(group.strikePrices).sort((a, b) => a - b);
    const underlyingPrice = group.underlyingPrice;

    // 找到平值行权价（最接近正股价格的行权价）
    let atmIndex = 0;
    let minDiff = Infinity;
    sortedStrikes.forEach((strike, index) => {
      const diff = Math.abs(strike - underlyingPrice);
      if (diff < minDiff) {
        minDiff = diff;
        atmIndex = index;
      }
    });

    // 为该组每条记录添加档位字段
    group.items.forEach((item) => {
      const strikeIndex = sortedStrikes.indexOf(item.行权价);
      const diffIndex = strikeIndex - atmIndex;

      let level;
      let levelNo;
      if (item.沽购 === "购") {
        // 认购期权：行权价>正股价=虚值，<正股价=实值
        if (diffIndex === 0) {
          level = "平值";
          levelNo = 0;
        } else if (diffIndex > 0) {
          level = `虚${diffIndex}档`;
          levelNo = -Math.abs(diffIndex);
        } else {
          level = `实${Math.abs(diffIndex)}档`;
          levelNo = Math.abs(diffIndex);
        }
      } else {
        // 沽
        // 认沽期权：行权价<正股价=虚值，>正股价=实值
        if (diffIndex === 0) {
          level = "平值";
          levelNo = 0;
        } else if (diffIndex < 0) {
          level = `虚${Math.abs(diffIndex)}档`;
          levelNo = -Math.abs(diffIndex);
        } else {
          level = `实${diffIndex}档`;
          levelNo = Math.abs(diffIndex);
        }
      }

      item.档位名称 = level;
      item.档位 = levelNo;
    });
  });

  // 返回处理后的完整数据
  return optionData;
}
function checkIs彩票(target) {
  if (target["一手价"] >= 300) return false;
  if (target["溢价率"] >= 1.5) return false;
  return true;
}

function calculateRatio(params, diffPercent, afterDay) {
  const S = params["正股价格"];
  const K = params["行权价"];
  const r = 0.015;
  const T = params["到期天数"] / 365;
  const afterT = (params["到期天数"] - afterDay) / 365;
  const sigma = (params["隐波"] || 0.01) / 100;
  const optionType = params["沽购"] === "购" ? "call" : "put";
  const optionPrice = blackScholesOptionPrice(S, K, r, T, sigma, optionType);
  const upOptionPrice = blackScholesOptionPrice(S * (1 + diffPercent), K, r, afterT, sigma, optionType);
  const downOptionPrice = blackScholesOptionPrice(S * (1 - diffPercent), K, r, afterT, sigma, optionType);
  let res;
  if (params["沽购"] === "购") {
    res = (upOptionPrice - optionPrice) / (optionPrice - downOptionPrice);
  } else {
    res = (downOptionPrice - optionPrice) / (optionPrice - upOptionPrice);
  }
  return formatDecimal(Math.abs(res), 1);
}

/**
 * 期权综合评分计算器
 * 基于Gamma、Vega、Theta和真实杠杆率四个核心指标
 * 评分范围：0-100分，分数越高综合性价比越好
 */
class OptionScorer {
  /**
   * 构造函数，可自定义各指标权重和基准范围
   * @param {Object} customWeights - 自定义权重
   * @param {Object} customRanges - 自定义指标基准范围
   */
  constructor(customWeights = {}, customRanges = {}) {
    // 默认权重（总和为100%）
    this.weights = {
      gamma: 0.3,
      realLeverage: 0.25,
      vega: 0.25,
      theta: 0.2,
      ...customWeights,
    };

    // 验证权重总和是否为1
    const totalWeight = Object.values(this.weights).reduce((a, b) => a + b, 0);
    if (Math.abs(totalWeight - 1) > 0.001) {
      console.warn(`权重总和为${totalWeight.toFixed(4)}，建议调整为1.0`);
    }

    // 默认指标基准范围（基于A股50ETF期权和沪深300期权的常见值）
    this.ranges = {
      gamma: { min: 0.001, max: 0.05 }, // Gamma常见范围：0.001-0.05
      vega: { min: 0.001, max: 0.2 }, // Vega常见范围：0.001-0.2
      theta: { min: -0.1, max: -0.001 }, // Theta常见范围：-0.1到-0.001（均为负值）
      realLeverage: {
        min: 2,
        max: 50,
        optimal: 30, // 真实杠杆率最优值，在此附近得分最高
      },
      ...customRanges,
    };
  }

  /**
   * 标准化正向指标（越高越好）
   * @param {number} value - 实际值
   * @param {number} min - 基准最小值
   * @param {number} max - 基准最大值
   * @returns {number} 标准化分数(0-100)
   */
  #normalizePositive(value, min, max) {
    if (value <= min) return 0;
    if (value >= max) return 100;
    return ((value - min) / (max - min)) * 100;
  }

  /**
   * 标准化负向指标（越小越好，如Theta）
   * @param {number} value - 实际值
   * @param {number} min - 基准最小值（最负值）
   * @param {number} max - 基准最大值（最接近0）
   * @returns {number} 标准化分数(0-100)
   */
  #normalizeNegative(value, min, max) {
    if (value <= min) return 0;
    if (value >= max) return 100;
    return ((value - min) / (max - min)) * 100;
  }

  /**
   * 标准化双向指标（适中最好，如真实杠杆率）
   * 采用钟形曲线评分，在最优值附近得分最高
   * @param {number} value - 实际值
   * @param {number} min - 基准最小值
   * @param {number} max - 基准最大值
   * @param {number} optimal - 最优值
   * @returns {number} 标准化分数(0-100)
   */
  #normalizeBellCurve(value, min, max, optimal) {
    if (value <= min || value >= max) return 0;

    // 计算距离最优值的相对距离
    const totalRange = max - min;
    let distance;

    if (value <= optimal) {
      distance = optimal - value;
      const leftRange = optimal - min;
      return 100 * (1 - distance / leftRange);
    } else {
      distance = value - optimal;
      const rightRange = max - optimal;
      return 100 * (1 - distance / rightRange);
    }
  }

  /**
   * 计算单个期权的综合评分
   * @param {Object} optionData - 期权数据
   * @param {number} optionData.gamma - Gamma值
   * @param {number} optionData.vega - Vega值
   * @param {number} optionData.theta - Theta值
   * @param {number} optionData.realLeverage - 真实杠杆率
   * @returns {Object} 包含各分项得分和综合得分的结果
   */
  score(optionData) {
    const { gamma, vega, theta, realLeverage } = optionData;

    // 计算各分项得分
    const gammaScore = this.#normalizePositive(gamma, this.ranges.gamma.min, this.ranges.gamma.max);

    const vegaScore = this.#normalizePositive(vega, this.ranges.vega.min, this.ranges.vega.max);

    const thetaScore = this.#normalizeNegative(theta, this.ranges.theta.min, this.ranges.theta.max);

    const realLeverageScore = this.#normalizeBellCurve(realLeverage, this.ranges.realLeverage.min, this.ranges.realLeverage.max, this.ranges.realLeverage.optimal);

    // 计算综合得分
    const totalScore = gammaScore * this.weights.gamma + vegaScore * this.weights.vega + thetaScore * this.weights.theta + realLeverageScore * this.weights.realLeverage;

    return {
      total: Math.round(totalScore * 100) / 100, // 保留两位小数
      breakdown: {
        gamma: Math.round(gammaScore * 100) / 100,
        vega: Math.round(vegaScore * 100) / 100,
        theta: Math.round(thetaScore * 100) / 100,
        realLeverage: Math.round(realLeverageScore * 100) / 100,
      },
      weights: this.weights,
    };
  }

  /**
   * 批量计算多个期权的评分并排序
   * @param {Array} optionsList - 期权数据列表
   * @param {string} sortBy - 排序字段，默认为'total'
   * @param {string} order - 排序顺序，'desc'降序或'asc'升序
   * @returns {Array} 排序后的期权评分列表
   */
  scoreBatch(optionsList, sortBy = "total", order = "desc") {
    const scoredList = optionsList.map((option) => ({
      ...option,
      score: this.score(option),
    }));

    // 排序
    return scoredList.sort((a, b) => {
      const aVal = sortBy === "total" ? a.score.total : a.score.breakdown[sortBy];
      const bVal = sortBy === "total" ? b.score.total : b.score.breakdown[sortBy];
      return order === "desc" ? bVal - aVal : aVal - bVal;
    });
  }
}

// ==================== 使用示例 ====================

// 创建评分器实例（使用默认参数）
const scorer = new OptionScorer();

function formatRecord(_tiledData, 持仓JSON, 成交Json) {
  debug(_tiledData);
  let tiledData = [];
  _tiledData.forEach((_) => {
    // _ 原始keyList: 最新价,期权名称,昨收,买一,卖一,持仓量,行权价,日增,隐波,溢价率,到期日,杠杆,Delta,Gamma,Theta,正股,正股价格
    let row = {};
    Object.keys(fields_dict).forEach((key) => {
      row[fields_dict[key]] = _[key];
    });
    [
      // 旧字段格式化
      "最新价",
      "昨收",
      "买一",
      "卖一",
      "持仓量",
      "行权价",
      "日增",
      "隐波",
      "溢价率",
      "杠杆",
      "Delta",
      "Gamma",
      "Vega",
      "Theta",
      "正股价格",
    ].forEach((key) => {
      row[key] = row[key] ? +row[key] : 0;
    });
    row["沽购"] = row["期权名称"].includes("购") ? "购" : "沽";

    row["Delta"] = formatDecimal(row["Delta"], 3);
    row["Gamma"] = formatDecimal(row["Gamma"], 3);
    row["Vega"] = formatDecimal(row["Vega"], 3);

    row["杠杆"] = formatDecimal(row["杠杆"], 1);
    row["杠杆"] = row["沽购"] === "购" ? row["杠杆"] : -row["杠杆"];
    row["到期日"] = dayjs(row["到期日"] + "", "YYYYMMDD").format("YYYY-MM-DD");
    row["最新价"] = get_最新价(row);
    // 新字段
    row["合约单位"] = 10000;
    row["千行权价"] = row["行权价"] * 1000;
    row["is旧期权"] = row["期权名称"].includes("A") && !row["期权名称"].includes("A500");
    row["到期天数"] = dayjs(row["到期日"], "YYYY-MM-DD").diff(dayjs(), "days") + 1;
    row["到期月份"] = dayjs(row["到期日"], "YYYY-MM-DD").format("MM月");
    row["到期月份icon"] = row["到期月份"] + MONTH_ICON[row["到期月份"]];

    row["单日损耗"] = Math.floor((10 * row["Theta"] * row["合约单位"]) / 365) / 10;

    row["涨跌额"] = row["最新价"] - row["昨收"];
    row["内在价值"] = get_option_实值(row);
    row["时间价值"] = Math.floor((row["最新价"] - row["内在价值"]) * row["合约单位"]) / row["合约单位"];
    row["打和点"] = formatDecimal(row["行权价"] + (row["沽购"] === "购" ? 1 : -1) * row["最新价"], 4);
    row["正股代码"] = row["期权名称"].startsWith("中证500ETF") ? "159922" : get_stock_code(row["正股"]);
    row["正股名称"] = OPTIONS_MAP.find((el) => el.code === row["正股代码"])?.name;
    row["展示正股名称"] = OPTIONS_MAP.find((el) => el.code === row["正股代码"])?.showName;
    row["正股符号"] = OPTIONS_MAP.find((el) => el.code === row["正股代码"])?.极简Name;
    // 一手价
    row["一手买一价"] = toPrice(row["买一"], row["合约单位"]);
    row["一手卖一价"] = toPrice(row["卖一"], row["合约单位"]);
    row["一手价"] = toPrice(row["最新价"], row["合约单位"]);
    row["一手昨收价"] = toPrice(row["昨收"], row["合约单位"]);
    row["一手涨跌价"] = toPrice(row["涨跌额"], row["合约单位"]);
    row["涨跌率"] = formatDecimal((100 * (row["最新价"] - row["昨收"])) / row["昨收"], 1);
    row["一手时间价"] = toPrice(row["时间价值"], row["合约单位"]);
    row["一手内在价"] = toPrice(row["内在价值"], row["合约单位"]);
    row["代替正股价"] = formatDecimal(row["Delta"] * row["正股价格"] * row["合约单位"], 0);
    // 持仓字段
    row["持仓"] = get_持仓(持仓JSON, row);
    row["持仓变化"] = get_持仓变化(成交Json, row);
    row["持仓金额变化"] = get_持仓金额变化(成交Json, row);
    row["持仓金额变化单价"] = row["持仓变化"] ? formatDecimal(row["持仓金额变化"] / row["持仓变化"], 0) : undefined;

    row["单日总损耗"] = row["持仓"] ? formatDecimal(row["单日损耗"] * row["持仓"], 0) : NaN;
    row["仓位"] = row["一手价"] * row["持仓"];
    row["成本价"] = get_成本价(row, 持仓JSON);

    row["一手成本价"] = row["成本价"] ? toPrice(row["成本价"], row["合约单位"]) : undefined;
    row["总投入"] = row["一手成本价"] * row["持仓"];
    row["is禁止加仓"] = row["总投入"] > 2000;
    row["收益率"] = row["一手成本价"] ? formatDecimal((100 * (row["一手价"] - row["一手成本价"])) / row["一手成本价"], 0) : undefined;
    row["is彩票"] = checkIs彩票(row);
    row["展示期权名称"] = row["展示正股名称"] + row["沽购"] + row["到期月份"] + row["千行权价"];
    row["行权价溢价"] = (100 * (row["行权价"] - row["正股价格"])) / row["正股价格"];

    tiledData.push(row);
  });
  let 总仓位 = 0;
  tiledData.forEach((el) => {
    if (el["持仓"]) {
      总仓位 += el["一手价"] * el["持仓"];
    }
  });
  总仓位 = 总仓位 || 1;
  tiledData = tiledData
    .map((el) => ({
      ...el,
      仓位率: formatDecimal((100 * (el["一手价"] * el["持仓"])) / 总仓位, 1),
    }))
    .filter((el) => el["一手价"])
    .filter((el) => !el["is旧期权"] || el["持仓"])
    .filter((el) => !(el["到期天数"] <= 1 && dayjs().day() === 3 && dayjs().hour() >= 15));
  // console.log(
  //   "xxx",
  //   JSON.stringify(
  //     tiledData
  //       .map((el) => ({
  //         正股代码: el["正股代码"],
  //         到期日: el["正股代码"],
  //         行权价: el["行权价"],
  //         正股价格: el["正股价格"],
  //         沽购: el["沽购"],
  //       }))
  //       .filter((el) => ["510050", "510300"].includes(el["正股代码"]))
  //   )
  // );
  tiledData = processOptionData(tiledData);
  tiledData = tiledData.map((el) => {
    return {
      ...el,
      评分: Math.abs(el["Delta"]) > 0.65 ? formatDecimal((el["正股价格"] * Math.abs(el["Delta"])) / (el["内在价值"] + el["时间价值"] * Math.abs(el["Delta"])), 1) : Math.abs(el["杠杆"]),
      // 评分: scorer.score({
      //   gamma: el["Gamma"],
      //   vega: el["Vega"],
      //   theta: el["Theta"],
      //   realLeverage: el["杠杆"],
      // }).total,
      // "1.5%盈亏比": calculateRatio(el, 0.015, 5),
      // "3%盈亏比": calculateRatio(el, 0.03, 10),
    };
  });
  return tiledData;
}
export function format成交Json(成交Json) {
  let 期权List = Array.from(new Set(成交Json.map((el) => el["期权名称"])));
  return 期权List.map((期权名称) => {
    const targetList = 成交Json.filter((item) => item["期权名称"] === 期权名称) || [];
    return targetList;
    let 成交金额sum = 0;
    let 持仓变化sum = 0;
    targetList.forEach((el) => {
      成交金额sum += el["持仓变化"] * el["成交价格"];
      持仓变化sum += el["持仓变化"];
    });
    const regex = /(\d+)月.*?(\d+(?:\.\d+)?)/;
    const match = targetList[0]["期权名称"].match(regex);
    const month = match[1]; // 到期月份
    const price = match[2]; // 行权价
    let 正股代码 = targetList[0]["正股代码"];
    const 正股ShowName = OPTIONS_MAP.find((el) => el["code"] === 正股代码)?.showName;
    const 沽购 = targetList[0]["期权名称"].includes("购") ? "购" : "沽";
    return {
      沽购,
      正股ShowName,
      到期月: +month,
      行权价: +price,
      正股代码,
      期权名称,
      list: targetList,
      成交金额sum,
      持仓变化sum,
    };
  });
}

/**
 * 计算每个正股对应的所有Gamma Flip点位及涨跌幅度（支持多翻转点）
 * @param {Array} optionList - 期权数据数组，每条包含：正股代码、正股价格、行权价、到期日、隐波、沽购、持仓量
 * @param {Object} options - 可选配置
 * @param {number} options.riskFreeRate - 年化无风险利率，默认0.015（1.5%）
 * @param {number} options.contractMultiplier - 合约乘数（股/张），ETF期权默认10000
 * @param {number} options.priceRange - 价格扫描范围比例，默认0.3（±30%）
 * @param {number} options.stepRatio - 价格步长比例，默认0.001（千分之一）
 * @param {number} options.minPriceGap - 翻转点最小间隔阈值，过滤误差伪多点，默认0.001
 * @returns {Object} 键为正股代码，值包含现价、最近翻转点、全部翻转点位列表、翻转数量
 */
function calculateGammaFlip(optionList, { riskFreeRate = 0.015, contractMultiplier = 10000, priceRange = 0.3, stepRatio = 0.001, minPriceGap = 0.001 } = {}) {
  // -------------------------- 工具函数 --------------------------
  // 标准正态分布概率密度 N'(x)
  const normalPDF = (x) => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);

  // BS模型 d1
  const calcD1 = (S, K, T, r, sigma) => {
    const numerator = Math.log(S / K) + (r + 0.5 * sigma * sigma) * T;
    const denominator = sigma * Math.sqrt(T);
    return denominator === 0 ? 0 : numerator / denominator;
  };

  // 期权Gamma
  const calcGamma = (S, K, T, r, sigma) => {
    if (T <= 0 || sigma <= 0 || S <= 0) return 0;
    const d1 = calcD1(S, K, T, r, sigma);
    return normalPDF(d1) / (S * sigma * Math.sqrt(T));
  };

  // 计算剩余到期年化时间
  const getTimeToMaturity = (expiryStr) => {
    const now = new Date();
    const expiry = new Date(expiryStr);
    const msPerDay = 1000 * 60 * 60 * 24;
    const days = (expiry - now) / msPerDay;
    return Math.max(days / 365, 0.0001);
  };

  // 单合约GEX敞口
  const getContractGEX = (opt, S) => {
    const T = getTimeToMaturity(opt.到期日);
    const sigma = opt.隐波 / 100;
    const gamma = calcGamma(S, opt.行权价, T, riskFreeRate, sigma);
    const sign = opt.沽购 === "购" ? 1 : -1;
    return gamma * opt.持仓量 * contractMultiplier * S * S * 0.01 * sign;
  };

  // 单标的全合约总GEX
  const getTotalGEX = (options, S) => {
    return options.reduce((sum, opt) => sum + getContractGEX(opt, S), 0);
  };

  /**
   * 过滤间隔过近的点位，去除扫描误差产生的伪翻转点
   * @param {number[]} sortedList 升序价格数组
   * @param {number} gap 最小价格间隔
   * @returns {number[]} 过滤后点位
   */
  const filterMinGapPoints = (sortedList, gap) => {
    const result = [];
    for (const p of sortedList) {
      if (result.length === 0 || p - result[result.length - 1] > gap) {
        result.push(p);
      }
    }
    return result;
  };

  /**
   * 扫描区间找出全部Gamma翻转价格（支持多点）
   * @param {Array} options 单标的期权分组
   * @returns {number[]} 升序、去重、过滤近距离后的所有flip价格
   */
  const findAllFlipPoints = (options) => {
    if (!options.length) return [];
    const basePrice = options[0].正股价格;
    const minPrice = basePrice * (1 - priceRange);
    const maxPrice = basePrice * (1 + priceRange);
    const step = basePrice * stepRatio;

    const flipList = [];
    let prevS = minPrice;
    let prevGEX = getTotalGEX(options, prevS);

    for (let S = minPrice + step; S <= maxPrice; S += step) {
      const currGEX = getTotalGEX(options, S);
      // 仅保留正负穿越（剔除仅单点贴0但不换向的无效零点）
      const crossZero = (prevGEX > 0 && currGEX < 0) || (prevGEX < 0 && currGEX > 0);
      if (crossZero) {
        // 线性插值精确零点
        const deltaGEX = currGEX - prevGEX;
        const ratio = Math.abs(prevGEX) / Math.abs(deltaGEX);
        const flipPrice = Number((prevS + ratio * (S - prevS)).toFixed(4));
        flipList.push(flipPrice);
      }
      prevS = S;
      prevGEX = currGEX;
    }

    // 去重 + 升序 + 过滤近距离伪点位
    const uniqueSorted = [...new Set(flipList)].sort((a, b) => a - b);
    return filterMinGapPoints(uniqueSorted, minPriceGap);
  };

  // -------------------------- 主逻辑：按标的分组计算 --------------------------
  // 1. 按正股代码分组
  const groups = {};
  for (const opt of optionList) {
    if (!groups[opt.正股代码]) groups[opt.正股代码] = [];
    groups[opt.正股代码].push(opt);
  }

  // 2. 逐标的计算所有翻转点并组装结果
  const result = {};
  for (const [code, options] of Object.entries(groups)) {
    const currentPrice = options[0].正股价格;
    const flipPrices = findAllFlipPoints(options);

    // 组装每个翻转点的涨跌详情
    const flipPointsDetail = flipPrices.map((price) => {
      const priceChange = Number((price - currentPrice).toFixed(4));
      const changePercent = Number((((price - currentPrice) / currentPrice) * 100).toFixed(2));
      return {
        flipPrice: price,
        priceChange,
        changePercent,
      };
    });

    // 找到距离现价最近的翻转点（兼容旧业务单点位字段）
    let nearestFlipInfo = null;
    if (flipPointsDetail.length > 0) {
      nearestFlipInfo = flipPointsDetail.reduce((a, b) => {
        return Math.abs(a.flipPrice - currentPrice) < Math.abs(b.flipPrice - currentPrice) ? a : b;
      }, flipPointsDetail[0]);
    }

    result[code] = {
      currentPrice,
      // 兼容旧字段：最近翻转点信息，无则null
      gammaFlipPrice: nearestFlipInfo?.flipPrice ?? null,
      priceChange: nearestFlipInfo?.priceChange ?? null,
      changePercent: nearestFlipInfo?.changePercent ?? null,
      // 新增多点完整数据
      flipCount: flipPointsDetail.length,
      flipPointsDetail,
    };
  }

  return result;
}

// -------------------------- 使用示例 --------------------------
// 代入你提供的示例数据
// const demoData = [
//   {
//     Delta: -0.852,
//     Gamma: 0.491,
//     Theta: -0.3113,
//     Vega: 0.362,
//     到期日: "2026-08-26",
//     持仓量: 359,
//     日增: 23,
//     最新价: 0.6363,
//     期权名称: "创业板ETF沽8月4600",
//     正股代码: "159915",
//     正股价格: 4.037,
//     沽购: "沽",
//     行权价: 4.6,
//     隐波: 41.2
//   }
//   // ... 更多合约
// ];

// const gammaFlipResult = calculateGammaFlip(demoData);
// console.log(gammaFlipResult);

// 请求入口
// 一般只请求持仓的数据，若需要请求所有数据，不提供切回只展示持仓的模式
export async function get_http_data(
  正股代码List,
  useCatch = true, // 默认使用缓存数据
  catchAll = true // 当useCatch为false，请求接口时默认缓存所有
) {
  let _tiledData = [];
  let 持仓JSON = await $fetch("/api/queryHoldJsonByQianlong");
  let 成交Json = await $fetch("/api/queryOrderJsonByQianlong");
  if (useCatch) {
    try {
      _tiledData = await $fetch("/api/queryDataJson");
    } catch (e) {
      console.warn("e", e);
      _tiledData = [];
    }
  } else {
    // 重新请求接口时，判断时候请求所有数据
    const 持仓StockCodeList = Array.from(new Set(持仓JSON.map((el) => el["正股代码"])));
    console.log("持仓StockCodeList", 持仓StockCodeList);
    let filteredOptionsList = catchAll ? OPTIONS_MAP : OPTIONS_MAP.filter((el) => 持仓StockCodeList.includes(el.code));
    const PROMISE_LIST = filteredOptionsList
      .map((el) => el.fs)
      .filter((el) => 正股代码List.some((code) => el.includes(code)))
      .map((fs, idx) => {
        return () =>
          new Promise((resolve, reject) => {
            get_target_http_data(持仓JSON, fs)
              .then((res) => resolve(res))
              .catch((err) => reject(err));
          });
      });
    await promiseAllSequential(PROMISE_LIST)
      .then((list) => {
        list.forEach((el) => {
          _tiledData.push(...el);
        });
        if (_tiledData.length) {
          $fetch("/api/querySaveData", {
            method: "post",
            body: { data: _tiledData },
          });
        }
      })
      .catch((err) => {
        ElMessage({ message: err, type: "error" });
        console.warn(err);
      });
  }

  let tiledData = formatRecord(_tiledData, 持仓JSON, 成交Json);
  let filteredOptionsList = OPTIONS_MAP.filter((el) => Array.from(new Set(tiledData.map((el) => el["正股代码"]))).includes(el.code));
  tiledData = tiledData.filter((el) => 正股代码List.includes(el["正股代码"])); // 缓存数据过滤
  const comboList = 构建组合(tiledData);
  tiledData = tiledData.map((el) => {
    return {
      ...el,
      组合: comboList.some((item) => item.includes(el["期权名称"])),
    };
  });
  const gammaFlipResult = calculateGammaFlip(tiledData);
  console.log("[tiledData, comboList,filteredOptionsList,gammaFlipResult]", [tiledData, comboList, filteredOptionsList, gammaFlipResult]);
  let orderList = format成交Json(成交Json);
  return [tiledData, comboList, filteredOptionsList, orderList, gammaFlipResult];
}

export function format() {}
