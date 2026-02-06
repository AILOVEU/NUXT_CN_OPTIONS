import { fields_dict, OPTIONS_MAP, 金额, 最大建议买入时间价 } from "~/data";
import dayjs from "dayjs";
import { formatDecimal, getRandomInt } from "~/utils/utils";
import { useMoneyStore } from "~/stores/useMoneyStore";
import { ElMessage } from "element-plus";
import _ from "lodash";

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
  }
  if (row["到期天数"] < 15) return true;
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
  let curr_page = 1;
  const pz = 50;
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
    });
    await sleep(getRandomInt(6, 12) * 1000);
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
  return tiledData;
}
let DEBUG_LIST = {};
function debug(_tiledData) {
  console.log(
    "DEBUG_LIST - ",
    _.unionBy(_tiledData, (row) => row["f333"])
  );
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
    row["Delta"] = formatDecimal(row["Delta"], 3);
    row["Gamma"] = formatDecimal(row["Gamma"], 3);
    row["Vega"] = formatDecimal(row["Vega"], 3);

    row["杠杆"] = formatDecimal(row["杠杆"], 1);
    row["到期日"] = dayjs(row["到期日"] + "", "YYYYMMDD").format("YYYY-MM-DD");
    row["最新价"] = get_最新价(row);
    // 新字段
    row["合约单位"] = 10000;
    row["千行权价"] = row["行权价"] * 1000;
    row["is旧期权"] = row["期权名称"].includes("A") && !row["期权名称"].includes("A500");
    row["沽购"] = row["期权名称"].includes("购") ? "购" : "沽";
    row["到期天数"] = dayjs(row["到期日"], "YYYY-MM-DD").diff(dayjs(), "days") + 1;
    row["到期月份"] = dayjs(row["到期日"], "YYYY-MM-DD").format("MM月");
    row["单日损耗"] = Math.floor((10 * row["Theta"] * row["合约单位"]) / 365) / 10;
    row["涨跌额"] = row["最新价"] - row["昨收"];
    row["内在价值"] = get_option_实值(row);
    row["时间价值"] = Math.floor((row["最新价"] - row["内在价值"]) * row["合约单位"]) / row["合约单位"];
    row["打和点"] = formatDecimal(row["行权价"] + (row["沽购"] === "购" ? 1 : -1) * row["最新价"], 4);
    row["正股代码"] = row["期权名称"].startsWith("中证500ETF") ? "159922" : get_stock_code(row["正股"]);
    row["正股名称"] = OPTIONS_MAP.find((el) => el.code === row["正股代码"])?.name;
    // 一手价
    row["一手买一价"] = toPrice(row["买一"], row["合约单位"]);
    row["一手卖一价"] = toPrice(row["卖一"], row["合约单位"]);
    row["一手价"] = toPrice(row["最新价"], row["合约单位"]);
    row["一手昨收价"] = toPrice(row["昨收"], row["合约单位"]);
    row["一手涨跌价"] = toPrice(row["涨跌额"], row["合约单位"]);
    row["一手时间价"] = toPrice(row["时间价值"], row["合约单位"]);
    row["一手内在价"] = toPrice(row["内在价值"], row["合约单位"]);
    row["代替正股价"] = row["Delta"] * row["正股价格"] * row["合约单位"];
    // 持仓字段
    row["持仓"] = get_持仓(持仓JSON, row);
    row["成本价"] = get_成本价(row, 持仓JSON);
    row["一手成本价"] = row["成本价"] ? toPrice(row["成本价"], row["合约单位"]) : undefined;
    row["is非法持仓"] = getIs非法持仓(row);
    tiledData.push(row);
  });
  return tiledData;
}
// 请求入口
export async function get_http_data(正股代码List, useCatch = true) {
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
    const PROMISE_LIST = OPTIONS_MAP.map((el) => el.fs)
      .filter((el) => 正股代码List.some((code) => el.includes(code)))
      .map((fs, idx) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(get_target_http_data(持仓JSON, fs));
          }, idx * 1000 * getRandomInt(8, 12));
        });
      });
    await Promise.all(PROMISE_LIST)
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
  tiledData = tiledData.filter((el) => 正股代码List.includes(el["正股代码"])); // 缓存数据过滤
  const comboList = 构建组合(tiledData);
  tiledData = tiledData.map((el) => {
    return {
      ...el,
      组合: comboList.some((item) => item.includes(el["期权名称"])),
    };
  });
  console.log("[tiledData, comboList]", [tiledData, comboList]);
  return [tiledData, comboList];
}
