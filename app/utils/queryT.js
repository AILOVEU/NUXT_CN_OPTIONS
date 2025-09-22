import { stock_sort_map } from "~/data";
import { get_http_data } from "./utils.js";

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
      data["C" + key] = call_item?.[key];
      data["P" + key] = put_item?.[key];
    });
    // Center字段
    data["期权"] = call_item["期权名称"].replace("购", "@");
    // 公共字段
    ["正股代码", "到期日", "到期天数", "行权价", "正股价格"].forEach((key) => {
      data[key] = call_item[key];
    });
    正股价格_dict[data["正股代码"]] = data["正股价格"];
    all_data.push(data);
  });
  const 正股代码List = Array.from(new Set(all_data.map((el) => el.正股代码)));
  const 到期日List = Array.from(new Set(all_data.map((el) => el.到期日)));
  const 行权价List = Array.from(new Set(all_data.map((el) => el.行权价)));
  行权价List.sort();
  正股代码List.forEach((正股代码) => {
    到期日List.forEach((到期日) => {
      all_data.push({
        _current: true,
        正股代码,
        到期日,
        行权价: 正股价格_dict[正股代码],
      });
      all_data.push({
        _split: true,
        正股代码,
        到期日,
        行权价: 行权价List[行权价List.length - 1],
      });
    });
  });
  all_data.sort(function (a, b) {
    if (a["正股代码"] === b["正股代码"]) {
      if (a["到期日"] === b["到期日"]) {
        return a["行权价"] - b["行权价"];
      }
      return a["到期日"] - b["到期日"];
    }
    return stock_sort_map[b["正股代码"]] - stock_sort_map[a["正股代码"]];
  });
  return all_data;
}
export async function queryT(持仓JSON) {
  const all_data = await get_http_data(持仓JSON);
  // const all_data = MOCK_DATA;
  return handleData(all_data);
}
