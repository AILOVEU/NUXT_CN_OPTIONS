import csvtojson from "csvtojson";
import iconvLite from "iconv-lite";
import fs from "fs";
import { fields_dict } from "~/data";
import dayjs from "dayjs";

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

export async function get_持仓JSON() {
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

export async function get_http_data() {
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
      line_dict["到期天数"] =
        dayjs(line_dict["到期日"] + "", "YYYYMMDD").diff(dayjs(), "days") + 1;
      line_dict["最新价"] = get_最新价(line_dict);
      line_dict["持仓"] = get_持仓(持仓JSON, line_dict);
      line_dict["机会"] = is_机会(line_dict);
      line_dict["成本价"] =
        持仓JSON.find((item) => item["名称"] === line_dict["期权名称"])
          ?.开仓均价 || undefined;
      all_data.push(line_dict);
    });
  }
  console.log("接口请求成功");
  return all_data;
}
