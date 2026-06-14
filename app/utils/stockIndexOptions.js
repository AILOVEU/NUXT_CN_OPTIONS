import { stock_index_fields_dict, OPTIONS_MAP, MONTH_ICON, 金额, 最大建议买入时间价 } from "~/data";
import dayjs from "dayjs";
import { formatDecimal, getRandomInt, promiseAllSequential } from "~/utils/utils";
import { useMoneyStore } from "~/stores/useMoneyStore";
import { ElMessage } from "element-plus";
import _ from "lodash";
import { blackScholesOptionPrice } from "~/utils/bs";
import { STOCK_MOCK } from "/utils/mock";
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
    const pz = 100;
    let tiledData = [];
    while (curr_page < 50) {
      // const res = await $fetch("https://push2.eastmoney.com/api/qt/clist/get", {
      const res = await $fetch("/api/queryEastmoneyStockIndex", {
        method: "get",
        params: {
          //   np: "1",
          //   fltt: "2",
          //   invt: "2",
          //   fs,
          //   fields:
          //   fid: "f3",
          //   pn: curr_page + "",
          //   pz,
          //   po: "1",
          //   dect: "1",
          //   // ut: generateRandomString(32),
          //   ut: "fa5fd1943c7b386f172d6893dbfba10b",
          //   wbp2u: "|0|1|0|web",
          //   _: dayjs().valueOf() - Math.floor(Math.random() * 100),
          fid: "f3",
          po: "1",
          pz,
          pn: curr_page + "",
          np: "1",
          fltt: "2",
          invt: "2",
          ut: "b2884a393a59ad64002292a3e90d46a5",
          fields: Object.keys(stock_index_fields_dict).join(","),
          fs: "m:11",
          // fs: "m:10+c:510050",
          // fs: "m:10,m:12",
          // fs: "m:10",
        },
      }).catch((res) => {
        console.warn(res);
        reject(false);
      });
      console.log("fs query", fs, curr_page);
      await sleep(getRandomInt(0.5, 1) * 1000);
      if (!res?.["data"]) {
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
// 提取函数
function getYearMonth(str) {
  // 正则：匹配 年份数字、月份数字
  const reg = /(\d{2})年(\d{1,2})月/;
  const match = str.match(reg);
  if (!match) return "";
  const year = match[1];
  // 月份补零为两位
  const month = match[2].padStart(2, "0");
  return year + month;
}

const 持仓JSON = [
  {
    期权名称: "沪深300购26年6月4800",
    持仓: 1,
  },
  {
    期权名称: "沪深300购26年6月4850",
    持仓: 2,
  },
  {
    期权名称: "沪深300购26年6月4900",
    持仓: 3,
  },
  {
    期权名称: "沪深300沽26年6月4600",
    持仓: 1,
  },
  {
    期权名称: "沪深300沽26年6月4550",
    持仓: 2,
  },
  {
    期权名称: "上证50购26年6月2900",
    持仓: 2,
  },
  {
    期权名称: "上证50购26年6月2950",
    持仓: 2,
  },
  {
    期权名称: "上证50购26年6月3050",
    持仓: 1,
  },
  {
    期权名称: "上证50沽26年6月2800",
    持仓: 2,
  },
  {
    期权名称: "中证1000购26年6月8600",
    持仓: 1,
  },
];
function formatRecord(_tiledData, _持仓JSON, 成交Json) {
  let tiledData = [];
  _tiledData.forEach((_) => {
    // _ 原始keyList: 最新价,期权名称,昨收,买一,卖一,持仓量,行权价,日增,隐波,溢价率,到期日,杠杆,Delta,Gamma,Theta,正股,正股价格
    let row = {};
    Object.keys(stock_index_fields_dict).forEach((key) => {
      row[stock_index_fields_dict[key]] = _[key];
    });
    row["沽购"] = row["期权名称"].includes("沽") ? "沽" : "购";
    row["合约单位"] = 100;
    row["到期年月"] = getYearMonth(row["期权名称"]);
    row["正股代码"] = row["正股"];
    row["一手价"] = formatDecimal(row["最新价"] * row["合约单位"], 0);
    row["持仓"] = 持仓JSON.find((el) => el["期权名称"] === row["期权名称"])?.["持仓"] || undefined;
    [
      // 旧字段格式化
      //   "最新价",
      //   "昨收",
      //   "买一",
      //   "卖一",
      //   "持仓量",
      //   "行权价",
      //   "日增",
      //   "隐波",
      //   "溢价率",
      //   "杠杆",
      //   "Delta",
      //   "Gamma",
      //   "Vega",
      //   "Theta",
      "正股价格",
    ].forEach((key) => {
      row[key] = row[key] ? +row[key] : 0;
    });
    // row["沽购"] = row["期权名称"].includes("购") ? "购" : "沽";

    // row["Delta"] = formatDecimal(row["Delta"], 3);
    // row["Gamma"] = formatDecimal(row["Gamma"], 3);
    // row["Vega"] = formatDecimal(row["Vega"], 3);

    // row["杠杆"] = formatDecimal(row["杠杆"], 1);
    // row["杠杆"] = row["沽购"] === "购" ? row["杠杆"] : -row["杠杆"];
    // row["到期日"] = dayjs(row["到期日"] + "", "YYYYMMDD").format("YYYY-MM-DD");
    // row["最新价"] = get_最新价(row);
    // // 新字段
    // row["合约单位"] = 10000;
    // row["千行权价"] = row["行权价"] * 1000;
    // row["is旧期权"] = row["期权名称"].includes("A") && !row["期权名称"].includes("A500");
    // row["到期天数"] = dayjs(row["到期日"], "YYYY-MM-DD").diff(dayjs(), "days") + 1;
    // row["到期月份"] = dayjs(row["到期日"], "YYYY-MM-DD").format("MM月");
    // row["到期月份icon"] = row["到期月份"] + MONTH_ICON[row["到期月份"]];

    // row["单日损耗"] = Math.floor((10 * row["Theta"] * row["合约单位"]) / 365) / 10;

    // row["涨跌额"] = row["最新价"] - row["昨收"];
    // row["内在价值"] = get_option_实值(row);
    // row["时间价值"] = Math.floor((row["最新价"] - row["内在价值"]) * row["合约单位"]) / row["合约单位"];
    // row["打和点"] = formatDecimal(row["行权价"] + (row["沽购"] === "购" ? 1 : -1) * row["最新价"], 4);
    // row["正股代码"] = row["期权名称"].startsWith("中证500ETF") ? "159922" : get_stock_code(row["正股"]);
    // row["正股名称"] = OPTIONS_MAP.find((el) => el.code === row["正股代码"])?.name;
    // row["展示正股名称"] = OPTIONS_MAP.find((el) => el.code === row["正股代码"])?.showName;
    // row["正股符号"] = OPTIONS_MAP.find((el) => el.code === row["正股代码"])?.极简Name;
    // // 一手价
    // row["一手买一价"] = toPrice(row["买一"], row["合约单位"]);
    // row["一手卖一价"] = toPrice(row["卖一"], row["合约单位"]);
    // row["一手价"] = toPrice(row["最新价"], row["合约单位"]);
    // row["一手昨收价"] = toPrice(row["昨收"], row["合约单位"]);
    // row["一手涨跌价"] = toPrice(row["涨跌额"], row["合约单位"]);
    // row["涨跌率"] = formatDecimal((100 * (row["最新价"] - row["昨收"])) / row["昨收"], 1);
    // row["一手时间价"] = toPrice(row["时间价值"], row["合约单位"]);
    // row["一手内在价"] = toPrice(row["内在价值"], row["合约单位"]);
    // row["代替正股价"] = formatDecimal(row["Delta"] * row["正股价格"] * row["合约单位"], 0);
    // // 持仓字段
    // row["持仓"] = get_持仓(持仓JSON, row);
    // row["持仓变化"] = get_持仓变化(成交Json, row);
    // row["持仓金额变化"] = get_持仓金额变化(成交Json, row);
    // row["持仓金额变化单价"] = row["持仓变化"] ? formatDecimal(row["持仓金额变化"] / row["持仓变化"], 0) : undefined;

    // row["单日总损耗"] = row["持仓"] ? formatDecimal(row["单日损耗"] * row["持仓"], 0) : NaN;
    // row["仓位"] = row["一手价"] * row["持仓"];
    // row["成本价"] = get_成本价(row, 持仓JSON);

    // row["一手成本价"] = row["成本价"] ? toPrice(row["成本价"], row["合约单位"]) : undefined;
    // row["总投入"] = row["一手成本价"] * row["持仓"];
    // row["is禁止加仓"] = row["总投入"] > 2000;
    // row["收益率"] = row["一手成本价"] ? formatDecimal((100 * (row["一手价"] - row["一手成本价"])) / row["一手成本价"], 0) : undefined;
    // row["is彩票"] = checkIs彩票(row);
    // row["展示期权名称"] = row["展示正股名称"] + row["沽购"] + row["到期月份"] + row["千行权价"];
    tiledData.push(row);
  });
  //   let 总仓位 = 0;
  //   tiledData.forEach((el) => {
  //     if (el["持仓"]) {
  //       总仓位 += el["一手价"] * el["持仓"];
  //     }
  //   });
  tiledData = tiledData.filter((row) => {
    const 溢价 = (100 * (row["行权价"] - row["正股价格"])) / row["正股价格"];
    return Math.abs(溢价) < 10;
  });

  return tiledData;
}
export async function get_http_data_stock_index(正股代码List) {
  // const _tiledData = await get_target_http_data(正股代码List, "m:11");
  // console.log(JSON.stringify(_tiledData))
  let _tiledData = STOCK_MOCK;
  let 持仓JSON = [];
  let 成交Json = [];
  let tiledData = formatRecord(_tiledData, 持仓JSON, 成交Json);
  tiledData = tiledData.filter((el) => 正股代码List.includes(el["正股代码"]));
  return [tiledData];
}
