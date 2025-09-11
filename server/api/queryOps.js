import { fields_dict } from "~/data";
function handleData(dataList) {
  let all_data = [];
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
    data["行权价"] = call_item["行权价"];

    all_data.push(data);
  });
  all_data.sort(function (a, b) {
    // 默认根据年龄排序，相同则按照id排序
    if (a["正股"] === b["正股"]) {
      if (a["到期日"] === b["到期日"]) {
        return a["行权价"] - b["行权价"];
      }
      return a["到期日"] - b["到期日"];
    }
    return b["正股"] - a["正股"];
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
export default eventHandler(async (event) => {
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
        ut: "fa5fd1943c7b386f172d6893dbfba10c",
        fields: Object.keys(fields_dict).join(","),
        wbp2u: "|0|1|0|web",
        _: "1739763465333",
        fs: "m:10+c:510050",
        // fs: "m:10,m:12",
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
      all_data.push(line_dict);
    });
  }
  return handleData(all_data);
});
