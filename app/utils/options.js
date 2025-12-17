import { UNIT, fields_dict, stock_code_map, 金额 } from "~/data";
import dayjs from "dayjs";
import { useMoneyStore } from "~/stores/useMoneyStore";
import { ElMessage } from "element-plus";

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

export function get_最新价(row) {
  let { 最新价, 卖一, 买一 } = row;
  if (!卖一 || !买一) return 最新价;
  const 中间价 = Math.round(((卖一 + 买一) / 2) * 10000) / 10000;
  if (最新价 === "-" || !最新价) return 中间价;
  if (isTimeBetweenNoonMarketClosed() || isTimeAfterMarketClosed()) return 最新价;
  if (最新价 > 卖一 || 最新价 < 买一) return 中间价;
  return 最新价;
}

export function get_持仓(持仓JSON, line_dict) {
  let targetList = 持仓JSON.filter((item) => item["名称"] === line_dict["期权名称"]);
  if (!targetList.length) return 0;
  console.log('targetList',targetList)
  let 持仓 = 0;
  targetList.forEach((item) => {
    let item持仓 = +item["持仓"];
    持仓 += item["持仓类别"] === "义务仓" ? -item持仓 : item持仓;
  });
  return 持仓;
  // let target = 持仓JSON.find((item) => item["名称"] === line_dict["期权名称"]);
  // if (!target) return 0;
  // let 持仓 = +target["持仓"];
  // return target["持仓类别"] === "义务仓" ? -持仓 : 持仓;
}

export function get_option_实值(el) {
  const isCall = el["期权名称"].includes("购");
  const 实值 = isCall ? el["正股价格"] - el["行权价"] : el["行权价"] - el["正股价格"];
  return 实值 > 0 ? Math.floor(实值 * UNIT) / UNIT : 0;
}

export function get_stock_code(name) {
  let code;
  Object.keys(stock_code_map).forEach((key) => {
    if (name.includes(stock_code_map[key])) {
      code = key;
    }
  });
  return code;
}

export function get_成本价(line_dict, 持仓JSON) {
  let 成本价 = 持仓JSON.find((item) => item["名称"] === line_dict["期权名称"])?.开仓均价 || undefined;
  成本价 = 成本价 ? +成本价 : undefined;
  return 成本价;
}

export function 构建组合(all_data) {
  const { set保证金 } = useMoneyStore();
  const 持仓List = all_data.filter((el) => el["持仓"]);
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
      const 义务Option = el["期权名称"];
      const isCall = 义务Option.includes("购");
      const 义务行权价 = el["行权价"] * 1000;
      let 权利行权价 = 义务行权价 + (isCall ? -50 : 50);
      let 权利Option = 义务Option.replace(义务行权价, 权利行权价);
      let loopCount2 = 0;
      while (loopCount2 < 100 && 权利行权价 > 50 && (!持仓Map[权利Option]?.持仓 || 持仓Map[权利Option]?.持仓 < 0)) {
        loopCount2 += 1;
        权利行权价 = 权利行权价 + (isCall ? -50 : 50);
        权利Option = 义务Option.replace(义务行权价, 权利行权价);
      }
      if (loopCount2 > 99) {
        return;
      }
      const min持仓 = Math.min(Math.abs(持仓Map[权利Option].持仓), Math.abs(持仓Map[义务Option].持仓));
      组合List.push([权利Option, 义务Option, min持仓]);
      持仓Map[权利Option].持仓 = 持仓Map[权利Option].持仓 - min持仓;
      持仓Map[义务Option].持仓 = 持仓Map[义务Option].持仓 + min持仓;
      if (!持仓Map[义务Option].持仓) {
        义务仓List = 义务仓List.filter((el) => el["期权名称"] !== 义务Option);
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

export function toFixed(value, number = 0) {
  return parseFloat(value.toFixed(number));
}

export function toFloor(val) {
  return Math.floor(val);
}
export function toPrice(val) {
  return toFloor(val * UNIT);
}
// 保留一位小数
export function toPercent_1(val) {
  return toFloor(val * 1000) / 10;
}
function sleep(time) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, time);
  });
}
export async function get_target_http_data(持仓JSON, fs) {
  let curr_page = 1;
  const pz = 50;
  let all_data = [];
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
      console.log(res);
    });
    await sleep(100);
    if (!res["data"]) {
      console.log(fs + "请求完成" + all_data.length);
      break;
    }
    curr_page += 1;
    let res_data = res["data"]["diff"];
    res_data.forEach((_) => {
      all_data.push(_);
    });
    if (res_data?.length < pz) {
      console.log(fs + "请求完成" + all_data.length);
      break;
    }
  }
  return all_data;
}

export async function get_http_data(正股代码List, useCatch = true) {
  console.log("正股代码List", 正股代码List);
  let _all_data = [];
  let 持仓JSON = await $fetch("/api/queryHoldJsonByQianlong");
  // let 持仓JSON = await $fetch("/api/queryHoldJsonByHuidian");
  // catch == false , 请求全量数据 , 点击按钮执行请求
  // catch == true , 请求本地数据 , 默认进来执行请求
  if (useCatch) {
    try {
      _all_data = await $fetch("/api/queryDataJson");
    } catch (e) {
      console.log("e", e);
    }
  } else {
    // $fetch("/api/querySaveData", {
    //   method: "post",
    //   body: { data: _all_data },
    // });
    const promiseList = ["m:10+c:510050", "m:10+c:510300", "m:10+c:510500", "m:10+c:588000", "m:12+c:159915", "m:12+c:159922"]
      .filter((el) => 正股代码List.some((code) => el.includes(code)))
      .map((fs, idx) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(get_target_http_data(持仓JSON, fs));
          }, idx * 2000);
        });
      });
    await Promise.all(promiseList)
      .then((list) => {
        list.forEach((el) => {
          _all_data.push(...el);
        });
        if (_all_data.length) {
          $fetch("/api/querySaveData", {
            method: "post",
            body: { data: _all_data },
          });
        }
      })
      .catch((err) => {
        ElMessage({ message: err, type: "error" });
        console.log(err);
      });
  }
  let all_data = [];
  _all_data.forEach((_) => {
    let line_dict = {};
    Object.keys(fields_dict).forEach((key) => {
      line_dict[fields_dict[key]] = _[key];
    });
    let NUMBER_TYPE_KEYS = ["最新价", "昨收", "买一", "卖一", "持仓量", "行权价", "日增", "隐波", "溢价率", "杠杆", "Delta", "Gamma", "Theta", "正股价格"];
    NUMBER_TYPE_KEYS.forEach((key) => {
      line_dict[key] = line_dict[key] ? +line_dict[key] : line_dict[key];
    });
    line_dict["沽购"] = line_dict["期权名称"].includes("购") ? "购" : "沽";
    line_dict["到期日"] = line_dict["到期日"] + "";
    line_dict["到期天数"] = dayjs(line_dict["到期日"], "YYYYMMDD").diff(dayjs(), "days") + 1;
    line_dict["到期月份"] = dayjs(line_dict["到期日"], "YYYYMMDD").format("MM月");
    line_dict["单日损耗"] = Math.floor((10 * line_dict["Theta"] * UNIT) / 365) / 10;
    line_dict["最新价"] = get_最新价(line_dict);
    line_dict["涨跌额"] = line_dict["最新价"] - line_dict["昨收"];
    line_dict["内在价值"] = get_option_实值(line_dict);
    line_dict["时间价值"] = Math.floor((line_dict["最新价"] - line_dict["内在价值"]) * UNIT) / UNIT;

    line_dict["持仓"] = get_持仓(持仓JSON, line_dict);
    line_dict["成本价"] = get_成本价(line_dict, 持仓JSON);
    line_dict["正股代码"] = line_dict["期权名称"].startsWith("中证500ETF") ? "159922" : get_stock_code(line_dict["正股"]);

    line_dict["一手价"] = toPrice(line_dict["最新价"]);
    line_dict["一手涨跌价"] = toPrice(line_dict["涨跌额"]);
    line_dict["一手成本价"] = line_dict["成本价"] ? toPrice(line_dict["成本价"]) : undefined;
    line_dict["一手时间价"] = toPrice(line_dict["时间价值"]);
    line_dict["一手内在价"] = toPrice(line_dict["内在价值"]);
    all_data.push(line_dict);
  });
  all_data = all_data.filter((el) => 正股代码List.includes(el["正股代码"]));
  const combo_list = 构建组合(all_data);
  all_data = all_data.map((el) => {
    return {
      ...el,
      组合: combo_list.some((item) => item.includes(el["期权名称"])),
    };
  });
  console.log("[all_data, combo_list]", [all_data, combo_list]);
  return [all_data, combo_list];
}

export function get_fist_季度月份(dataList) {
  const month_list = Array.from(new Set(dataList.map((el) => el["到期日"])));
  month_list.sort();
  let month_index = 0;
  for (let _index = 0; _index < month_list.length; _index++) {
    const day = dayjs(month_list[_index], "YYYYMMDD").format("MM月");
    if (["03月", "06月", "09月", "12月"].includes(day)) {
      month_index = _index;
      break;
    }
  }
  return [month_list, month_index];
}
