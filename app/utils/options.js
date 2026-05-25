import { fields_dict, OPTIONS_MAP, 金额, 最大建议买入时间价 } from "~/data";
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
    const flag = filteredTiledData.some((el) => item["行内期权名称List"].includes(el["期权名称"]));
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
function getIs非法持仓(row) {
  if (row["持仓"]) {
    if (row["一手时间价"] > row["一手内在价"] || row["一手时间价"] > 最大建议买入时间价) return true;
    if (row["到期天数"] < 15) return true;
  }
  return false;
}
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
/**
 * 期权高盈亏比打分计算器（100分制）
 * 核心优先级：涨跌2%盈亏比 > 涨跌1%盈亏比 > 资金效率 > 低成本 > 高胜率 > 合理期限 > 低隐波
 * @param {Object} option - 期权参数对象
 * @param {number} option.正股价格 - 正股当前价格 S
 * @param {number} option.行权价 - 期权行权价 K
 * @param {number} option.最新价 - 期权当前价格 OptP
 * @param {number} option.Delta - 期权Delta值（认购为正，认沽为负）
 * @param {number} option.到期天数 - 剩余到期天数 T
 * @param {number} option.隐波 - 隐含波动率 IV（%，如20%填20）
 * @param {number} option.溢价率 - 溢价率 Prem（%，如5%填5）
 * @param {number} option.杠杆 - 真实杠杆 Lev
 * @returns {Object} 包含总分、各因子得分、关键计算指标的完整结果
 */
function calculateOptionScore(option) {
  // 解构输入参数
  let { 正股价格: S, 行权价: K, 最新价: OptP, 到期天数: T, 隐波: IV, 溢价率: Prem, 杠杆: Lev, Delta } = option;

  // --------------------------
  // 第一步：实战过滤规则（垃圾期权直接打0分）
  // --------------------------
  // 深度虚值期权（Delta绝对值<0.1）胜率极低，直接排除
  // if (Math.abs(Delta) < 0.1) {
  //     return {
  //         totalScore: 0,
  //         rating: "劣质（深度虚值，直接放弃）",
  //         filterReason: "Delta绝对值<0.1，胜率极低",
  //         factorScores: {},
  //         keyMetrics: {}
  //     };
  // }

  // // 期权价格为0或负数，数据异常
  // if (OptP <= 0) {
  //     return {
  //         totalScore: 0,
  //         rating: "劣质（数据异常）",
  //         filterReason: "期权价格≤0，数据错误",
  //         factorScores: {},
  //         keyMetrics: {}
  //     };
  // }

  // --------------------------
  // 第二步：核心基础计算（涨跌1%/2%盈亏比）
  // --------------------------
  // 涨跌后正股价格
  const S_plus1 = S * 1.01;
  const S_minus1 = S * 0.99;
  const S_plus2 = S * 1.02;
  const S_minus2 = S * 0.98;

  // 涨跌后期权理论价格（Delta线性近似法）
  const OptP_plus1 = OptP + Delta * (S_plus1 - S);
  const OptP_minus1 = OptP + Delta * (S_minus1 - S);
  const OptP_plus2 = OptP + Delta * (S_plus2 - S);
  const OptP_minus2 = OptP + Delta * (S_minus2 - S);

  // 计算涨跌1%/2%的收益和亏损（自动适配认购/认沽）
  // 认购：涨赚跌亏；认沽：跌赚涨亏（Delta正负自动处理）
  const profit_1 = Math.max(0, OptP_plus1 - OptP, OptP_minus1 - OptP);
  const loss_1 = Math.min(OptP, Math.max(0, OptP - OptP_plus1, OptP - OptP_minus1));

  const profit_2 = Math.max(0, OptP_plus2 - OptP, OptP_minus2 - OptP);
  const loss_2 = Math.min(OptP, Math.max(0, OptP - OptP_plus2, OptP - OptP_minus2));

  // 计算盈亏比（收益/亏损，避免除以0）
  const WR_1 = loss_1 > 0 ? profit_1 / loss_1 : 0;
  const WR_2 = loss_2 > 0 ? profit_2 / loss_2 : 0;

  // --------------------------
  // 第三步：七大打分因子计算（权重严格按需求）
  // --------------------------
  // 因子1：涨跌2%盈亏比（权重35分）
  const Score_WR2 = Math.min(35, WR_2 * 7);

  // 因子2：涨跌1%盈亏比（权重25分）
  const Score_WR1 = Math.min(25, WR_1 * 5);

  // 因子3：资金效率（权重15分）
  const FE = (Lev * profit_2) / OptP;
  const Score_FE = Math.min(15, FE * 2);

  // 因子4：综合成本（权重10分，负向因子）
  const costValue = Prem + (OptP / S) * 100;
  const Score_Cost = Math.max(0, 10 - costValue / 3);

  // 因子5：胜率因子（权重7分，平值胜率最高）
  const deltaDeviation = Math.abs(Math.abs(Delta) - 0.5);
  const Score_Win = Math.max(0, 7 - deltaDeviation * 14);

  // 因子6：到期时间（权重5分，7~60天最优）
  let Score_Time;
  if (T >= 7 && T <= 60) {
    Score_Time = 5;
  } else if (T < 7) {
    Score_Time = 5 * (T / 7);
  } else {
    Score_Time = 5 * (60 / T);
  }

  // 因子7：隐含波动率（权重3分，负向因子）
  const Score_IV = Math.max(0, 3 - IV / 20);

  // --------------------------
  // 第四步：计算总分和评级
  // --------------------------
  const totalScore = Score_WR2 + Score_WR1 + Score_FE + Score_Cost + Score_Win + Score_Time + Score_IV;

  // 评级判定
  let rating;
  if (totalScore >= 80) {
    rating = "极品（优先开仓，盈亏比拉满）";
  } else if (totalScore >= 60) {
    rating = "优质（稳健开仓，符合所有要求）";
  } else if (totalScore >= 40) {
    rating = "一般（轻仓观望）";
  } else {
    rating = "劣质（直接放弃）";
  }

  // --------------------------
  // 第五步：返回完整结果
  // --------------------------
  return formatDecimal(totalScore, 2);
  // return {
  //     totalScore: parseFloat(totalScore.toFixed(2)),
  //     rating,
  //     factorScores: {
  //         涨跌2%盈亏比: parseFloat(Score_WR2.toFixed(2)),
  //         涨跌1%盈亏比: parseFloat(Score_WR1.toFixed(2)),
  //         资金效率: parseFloat(Score_FE.toFixed(2)),
  //         综合成本: parseFloat(Score_Cost.toFixed(2)),
  //         胜率因子: parseFloat(Score_Win.toFixed(2)),
  //         到期时间: parseFloat(Score_Time.toFixed(2)),
  //         隐含波动率: parseFloat(Score_IV.toFixed(2))
  //     },
  //     keyMetrics: {
  //         涨跌1%盈亏比: parseFloat(WR_1.toFixed(2)),
  //         涨跌2%盈亏比: parseFloat(WR_2.toFixed(2)),
  //         涨1%收益: parseFloat(profit_1.toFixed(4)),
  //         跌1%亏损: parseFloat(loss_1.toFixed(4)),
  //         涨2%收益: parseFloat(profit_2.toFixed(4)),
  //         跌2%亏损: parseFloat(loss_2.toFixed(4)),
  //         资金效率值: parseFloat(FE.toFixed(2)),
  //         综合成本值: parseFloat(costValue.toFixed(2))
  //     }
  // };
}

function formatRecord(_tiledData, 持仓JSON) {
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
    row["单日总损耗"] = formatDecimal(row["单日损耗"] * row["持仓"], 0);
    row["仓位"] = row["一手价"] * row["持仓"];
    row["成本价"] = get_成本价(row, 持仓JSON);
    row["一手成本价"] = row["成本价"] ? toPrice(row["成本价"], row["合约单位"]) : undefined;
    row["收益率"] = row["一手成本价"] ? formatDecimal((100 * (row["一手价"] - row["一手成本价"])) / row["一手成本价"], 0) : undefined;
    row["is非法持仓"] = getIs非法持仓(row);
    row["is彩票"] = checkIs彩票(row);
    row["展示期权名称"] = row["展示正股名称"] + row["沽购"] + row["到期月份"] + row["千行权价"];
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
    .filter((el) => !el["is旧期权"] || el["持仓"]);
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
  tiledData = tiledData.map((el) => ({
    ...el,
    评分: calculateOptionScore(el),
  }));
  return tiledData;
}

// 请求入口
// 一般只请求持仓的数据，若需要请求所有数据，不提供切回只展示持仓的模式
export async function get_http_data(
  正股代码List,
  useCatch = true, // 默认使用缓存数据
  catchAll = true // 当useCatch为false，请求接口时默认缓存所有
) {
  let _tiledData = [];
  let 持仓JSON = await $fetch("/api/queryHoldJsonByQianlong");
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

  let tiledData = formatRecord(_tiledData, 持仓JSON);
  let filteredOptionsList = OPTIONS_MAP.filter((el) => Array.from(new Set(tiledData.map((el) => el["正股代码"]))).includes(el.code));
  tiledData = tiledData.filter((el) => 正股代码List.includes(el["正股代码"])); // 缓存数据过滤
  const comboList = 构建组合(tiledData);
  tiledData = tiledData.map((el) => {
    return {
      ...el,
      组合: comboList.some((item) => item.includes(el["期权名称"])),
    };
  });
  console.log("[tiledData, comboList,filteredOptionsList]", [tiledData, comboList, filteredOptionsList]);
  return [tiledData, comboList, filteredOptionsList];
}
