// import csvtojson from "csvtojson";
// import iconvLite from "iconv-lite";
// import fs from "fs";
import { UNIT, fields_dict, stock_code_map, 金额 } from "~/data";
import dayjs from "dayjs";
import { useMoneyStore } from "~/stores/useMoneyStore";
import { ElMessage } from "element-plus";

function is_机会(line_dict) {
  const { 最新价, 隐波, 到期天数, 溢价率 } = line_dict;
  if (到期天数 < 15) return false;
  if (溢价率 > 10) return false;
  if (最新价 > 0.06) return false;
  if (隐波 > 25) return false;
  return true;
}

function get_最新价(row) {
  let { 最新价, 卖一, 买一 } = row;
  if (!卖一 || !买一) return 最新价;
  if (最新价 === "-" || !最新价 || 最新价 > 卖一 || 最新价 < 买一)
    return Math.round(((卖一 + 买一) / 2) * 10000) / 10000;
  return 最新价;
}
function get_持仓(持仓JSON, line_dict) {
  let target = 持仓JSON.find((item) => item["名称"] === line_dict["期权名称"]);
  if (!target) return 0;
  let 持仓 = +target["持仓"];
  return target["持仓类别"] === "义务仓" ? -持仓 : 持仓;
}

// export async function get_持仓JSON() {
//   const converterStream = fs
//     .createReadStream("public\\持仓.csv")
//     .pipe(iconvLite.decodeStream("gbk"));
//   return new Promise((resolve) => {
//     csvtojson()
//       .fromStream(converterStream)
//       .then((res) => {
//         resolve(res);
//       });
//   });
// }
function get_option_实值(el) {
  const isCall = el["期权名称"].includes("购");
  const 实值 = isCall
    ? el["正股价格"] - el["行权价"]
    : el["行权价"] - el["正股价格"];
  return 实值 > 0 ? Math.floor(实值 * UNIT) / UNIT : 0;
}
function get_stock_code(name) {
  let code;
  Object.keys(stock_code_map).forEach((key) => {
    if (stock_code_map[key] === name) {
      code = key;
    }
  });
  return code;
}
function 构建组合(all_data) {
  const { set保证金 } = useMoneyStore();
  const 持仓List = all_data.filter((el) => el["持仓"]);
  const 组合List = [];
  let 持仓Map = {};
  持仓List.forEach((el) => {
    持仓Map[el["期权名称"]] = { ...el };
  });
  let 义务仓List = 持仓List.filter((el) => el["持仓"] < 0);
  while (义务仓List.length) {
    义务仓List.forEach((el) => {
      const 义务Option = el["期权名称"];
      const isCall = 义务Option.includes("购");
      const 义务行权价 = el["行权价"] * 1000;
      let 权利行权价 = 义务行权价 + (isCall ? -50 : 50);
      let 权利Option = 义务Option.replace(义务行权价, 权利行权价);
      while (
        权利行权价 > 50 &&
        (!持仓Map[权利Option]?.持仓 || 持仓Map[权利Option]?.持仓 < 0)
      ) {
        权利行权价 = 权利行权价 + (isCall ? -50 : 50);
        权利Option = 义务Option.replace(义务行权价, 权利行权价);
      }
      const min持仓 = Math.min(
        Math.abs(持仓Map[权利Option].持仓),
        Math.abs(持仓Map[义务Option].持仓)
      );
      组合List.push([权利Option, 义务Option, min持仓]);
      持仓Map[权利Option].持仓 = 持仓Map[权利Option].持仓 - min持仓;
      持仓Map[义务Option].持仓 = 持仓Map[义务Option].持仓 + min持仓;
      if (!持仓Map[义务Option].持仓) {
        义务仓List = 义务仓List.filter((el) => el["期权名称"] !== 义务Option);
      }
    });
  }
  console.log("组合List", 组合List);
  let 占用保证金 = 0;
  组合List.forEach((el) => {
    占用保证金 += el[2] * 50;
  });
  // 金额.占用保证金 = 占用保证金;
  set保证金(占用保证金);
  return 组合List;
}
export async function get_target_http_data(持仓JSON, fs) {
  let curr_page = 1;
  const pz = 100;
  let all_data = [];
  while (curr_page < 50) {
    const res = await $fetch("https://push2.eastmoney.com/api/qt/clist/get", {
      method: "get",
      params: {
        fid: "f3",
        po: "1",
        pz,
        pn: curr_page + "",
        np: "1",
        fltt: "2",
        invt: "2",
        dect: "1",
        ut: "fa5fd1943c7b386f172d6893dbfba10b",
        fields: Object.keys(fields_dict).join(","),
        wbp2u: "|0|1|0|web",
        _: "1759371496573",
        fs,
        // fs: "m:10+c:510050",
        // fs: "m:10,m:12",
        // fs: "m:10",
      },
    });
    if (!res["data"]) {
      console.log(fs + "请求完成" + all_data.length);
      break;
    }
    curr_page += 1;
    let res_data = res["data"]["diff"];
    res_data.forEach((_) => {
      let line_dict = {};
      Object.keys(fields_dict).forEach((key) => {
        line_dict[fields_dict[key]] = _[key];
      });
      line_dict["沽购"] = line_dict["期权名称"].includes("购") ? "购" : "沽";
      line_dict["到期天数"] =
        dayjs(line_dict["到期日"] + "", "YYYYMMDD").diff(dayjs(), "days") + 1;
      line_dict["单日损耗"] =
        Math.floor((10 * line_dict["Theta"] * UNIT) / 365) / 10;
      line_dict["最新价"] = get_最新价(line_dict);
      line_dict["内在价值"] = get_option_实值(line_dict);
      line_dict["时间价值"] =
        Math.floor((line_dict["最新价"] - line_dict["内在价值"]) * UNIT) / UNIT;
      line_dict["持仓"] = get_持仓(持仓JSON, line_dict);
      line_dict["机会"] = is_机会(line_dict);
      line_dict["到期日"] = line_dict["到期日"] + "";
      line_dict["成本价"] =
        持仓JSON.find((item) => item["名称"] === line_dict["期权名称"])
          ?.开仓均价 || undefined;
      line_dict["成本价"] = line_dict["成本价"]
        ? +line_dict["成本价"]
        : undefined;
      line_dict["正股代码"] = line_dict["期权名称"].startsWith("中证500ETF")
        ? "159922"
        : get_stock_code(line_dict["正股"]);
      all_data.push(line_dict);
    });
    if (res_data?.length < pz) {
      break;
    }
  }
  return all_data;
}
export async function get_http_data(持仓JSON, 正股代码List) {
  let all_data = [];
  const promiseList = [
    "m:10+c:510050",
    "m:10+c:510300",
    "m:10+c:510500",
    "m:10+c:588000",
    "m:12+c:159915",
    "m:12+c:159922",
  ]
    .filter((el) => 正股代码List.some((code) => el.includes(code)))
    .map((fs, idx) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(get_target_http_data(持仓JSON, fs));
        }, idx * 100);
      });
    });
  await Promise.all(promiseList)
    .then((list) => {
      list.forEach((el) => {
        all_data.push(...el);
      });
    })
    .catch((err) => {
      console.log(err);
    });
  const combo_list = 构建组合(all_data);
  return [all_data, combo_list];
}

// ↓ 颜色切割 start↓
function interpolateColor(color1, color2, factor) {
  var result = color1.slice();
  for (var i = 0; i < 3; i++) {
    result[i] = Math.round(result[i] + factor * (color2[i] - color1[i]));
  }
  return result;
}
let h2r = function (hex) {
  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : null;
};
let r2h = function (rgb) {
  return (
    "#" +
    ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1)
  );
};
export const getColorSplitHander = (startColor, endColor) => {
  return (value, min = 0, max = 100) => {
    let tempValue = value;
    if (value > max) tempValue = max;
    if (value < min) tempValue = min;
    const stepPercent = (tempValue - min) / (max - min);
    const scol = h2r(startColor);
    const ecol = h2r(endColor);
    if (!scol || !ecol) return startColor;
    var icol = interpolateColor(scol, ecol, stepPercent),
      hcol = r2h(icol);
    return hcol;
  };
};
// ↑ 颜色切割 end↑
export function useCopy(text) {
  function selectText(textbox, startIndex, stopIndex) {
    if (textbox.createTextRange) {
      const range = textbox.createTextRange();
      range.moveStart("character", startIndex);
      range.moveEnd("character", startIndex - stopIndex);
      range.select();
    } else {
      textbox.setSelectionRange(startIndex, stopIndex);
      textbox.focus();
    }
  }
  let textArea = document.createElement("textarea");
  textArea.style.position = "fixed";
  textArea.style.top = "-10000"; // 把生成的输入框移动到视线之外
  textArea.style.zIndex = "-1"; // 把生成的输入框移动到视线之外
  textArea.readOnly = "readOnly"; // 设置为只读，这样在移动端才不会弹出虚拟键盘
  textArea.value = text;
  document.body.appendChild(textArea);
  selectText(textArea, 0, text.length);
  try {
    if (document.execCommand("copy")) {
      document.execCommand("copy");
      ElMessage({ message: "复制成功", type: "success" });
    } else {
    }
  } catch (error) {
    ElMessage({ message: `${error}`, type: "error" });
  }
  textArea.blur(); //去掉选中，因为的移动端ios 上，会出现点了选择左上角出现点问题
  document.body.removeChild(textArea);
}
