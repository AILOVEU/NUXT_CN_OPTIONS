import fields_dict from "~/data";
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
    data['期权'] = call_item["期权名称"].replace("购", "@");
    all_data.push(data);
  });
  return all_data;
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
        fs: "m:10,m:12",
      },
    });
    if (!res["data"]) {
      console.log(res["data"]);
      break;
    }
    curr_page += 1;
    let res_data = res["data"]["diff"];
    res_data.forEach((_) => {
      let line_dict = {};
      Object.keys(fields_dict).forEach((key) => {
        line_dict[fields_dict[key]] = _[key];
      });
      all_data.push(line_dict);
    });
  }
  return handleData(all_data);
});
