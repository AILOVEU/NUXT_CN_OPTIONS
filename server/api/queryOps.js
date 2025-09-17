import { fields_dict, stock_sort_map } from "~/data";
import csvtojson from "csvtojson";
import iconvLite from "iconv-lite";
import dayjs from "dayjs";
import fs from "fs";
function is_机会({ 最新价, 隐波, 到期天数, 溢价率 }) {
  if (到期天数 < 15) return false;
  if (溢价率 > 10) return false;
  if (最新价 > 0.06) return false;
  if (隐波 > 25) return false;
  return true;
}
function handleData(dataList) {
  let all_data = [];
  let 正股价格_dict = {};
  dataList.forEach((item) => {
    // 期权名称含有沽
    if (item["期权名称"].includes("沽")) return;
    let call_item = item;
    let put_期权名称 = call_item["期权名称"].replace("购", "沽");
    let put_item = dataList.find((el) => el["期权名称"] === put_期权名称);
    let data = {};
    Object.keys(call_item).forEach((key) => {
      if (["期权名称"].includes(key)) return;
      data["C" + key] = call_item[key];
      data["P" + key] = put_item[key];
    });
    data["期权"] = call_item["期权名称"].replace("购", "@");

    data["正股"] = call_item["正股"];
    data["到期日"] = call_item["到期日"];
    data["到期天数"] =
      dayjs(call_item["到期日"] + '', "YYYYMMDD").diff(dayjs(), "days") + 1;
    data["行权价"] = call_item["行权价"];
    data["正股价格"] = call_item["正股价格"];
    data["C机会"] = is_机会({
      最新价: data["C最新价"],
      隐波: data["C隐波"],
      到期天数: data["到期天数"],
      溢价率: data["C溢价率"],
    });
    data["P机会"] = is_机会({
      最新价: data["P最新价"],
      隐波: data["P隐波"],
      到期天数: data["到期天数"],
      溢价率: data["P溢价率"],
    });
    正股价格_dict[data["正股"]] = data["正股价格"];
    all_data.push(data);
  });
  const 正股List = Array.from(new Set(all_data.map((el) => el.正股)));
  const 到期日List = Array.from(new Set(all_data.map((el) => el.到期日)));
  const 行权价List = Array.from(new Set(all_data.map((el) => el.行权价)));
  行权价List.sort();
  正股List.forEach((正股) => {
    到期日List.forEach((到期日) => {
      all_data.push({
        _current: true,
        正股,
        到期日,
        行权价: 正股价格_dict[正股],
      });
      all_data.push({
        _split: true,
        正股,
        到期日,
        行权价: 行权价List[行权价List.length - 1],
      });
    });
  });

  all_data.sort(function (a, b) {
    if (a["正股"] === b["正股"]) {
      if (a["到期日"] === b["到期日"]) {
        return a["行权价"] - b["行权价"];
      }
      return a["到期日"] - b["到期日"];
    }
    return stock_sort_map[b["正股"]] - stock_sort_map[a["正股"]];
  });
  return all_data;
}
function get_最新价(row) {
  let { 最新价, 卖一, 买一 } = row;
  if (!卖一 || !买一) return 最新价;
  if (!最新价 || 最新价 > 卖一 || 最新价 < 买一)
    return Math.round(((卖一 + 买一) / 2) * 10000) / 10000;
  return 最新价;
}
function get_持仓(持仓JSON, line_dict) {
  let target = 持仓JSON.find((item) => item["名称"] === line_dict["期权名称"]);
  if (!target) return 0;
  let 持仓 = +target["持仓"];
  return target["持仓类别"] === "义务仓" ? -持仓 : 持仓;
}
async function get_持仓JSON() {
  const converterStream = fs
    .createReadStream("public\\持仓.csv")
    .pipe(iconvLite.decodeStream("gbk"));
  return new Promise((resolve) => {
    csvtojson()
      .fromStream(converterStream)
      .then((res) => {
        resolve(res);
      });
  });
}
export default eventHandler(async (event) => {
  let 持仓JSON = await get_持仓JSON();
  let curr_page = 1;
  let all_data = [];
  while (curr_page < 50) {
    const res = await $fetch("https://push2.eastmoney.com/api/qt/clist/get", {
      method: "get",
      params: {
        fid: "f3",
        po: "1",
        pz: "200",
        pn: curr_page + "",
        np: "1",
        fltt: "2",
        invt: "2",
        ut: "fa5fd1943c7b386f172d6193dbfba10c",
        fields: Object.keys(fields_dict).join(","),
        wbp2u: "|0|1|0|web",
        _: "1739763465633",
        // fs: "m:10+c:510050",
        // fs: "m:10,m:12",
        fs: "m:10",
      },
    });
    if (!res["data"]) {
      break;
    }
    curr_page += 1;
    let res_data = res["data"]["diff"];
    res_data.forEach((_) => {
      let line_dict = {};
      Object.keys(fields_dict).forEach((key) => {
        line_dict[fields_dict[key]] = _[key];
      });
      line_dict["最新价"] = get_最新价(line_dict);
      line_dict["持仓"] = get_持仓(持仓JSON, line_dict);
      line_dict["成本价"] =
        持仓JSON.find((item) => item["名称"] === line_dict["期权名称"])
          ?.开仓均价 || undefined;
      all_data.push(line_dict);
    });
  }
  console.log("接口查询完成");
  return handleData(all_data);
});
