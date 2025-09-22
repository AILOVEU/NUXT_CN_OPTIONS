import { stock_sort_map } from "~/data";
import { get_http_data } from "./";
import dayjs from "dayjs";
function get_fist_季度月份(dataList) {
  const month_list = Array.from(new Set(dataList.map((el) => el["到期日"])));
  month_list.sort();
  let month_index = 0;
  for (let _index = 0; _index < month_list.length; _index++) {
    const day = dayjs(month_list[month_index], "YYYYMMDD").format("MM月");
    if (["03月", "06月", "09月", "12月"].includes(day)) {
      month_index = _index;
      break;
    }
  }
  return [month_list, month_index];
}
function handleData(dataList) {
  const [month_list, month_index] = get_fist_季度月份(dataList);
  let all_data = [];
  let 正股价格_dict = {};
  dataList.forEach((item) => {
    let data = {};
    // 期权名称含有沽
    if (item["期权名称"].includes("沽")) return;
    if (item["到期日"] !== month_list[month_index]) return;
    let 到期月份 = dayjs(item["到期日"], "YYYYMMDD").format("M月");
    month_list.forEach((month) => {
      let 实际月份 = dayjs(month, "YYYYMMDD").format("M月");
      let call_期权名称 = item["期权名称"].replace(到期月份, 实际月份);
      let put_期权名称 = item["期权名称"]
        .replace(到期月份, 实际月份)
        .replace("购", "沽");
      let call_item = dataList.find((el) => el["期权名称"] === call_期权名称);
      let put_item = dataList.find((el) => el["期权名称"] === put_期权名称);
      [...Object.keys(item), "成本价"].forEach((key) => {
        if (["期权名称"].includes(key)) return;
        data["C" + 实际月份 + key] = call_item?.[key];
        data["P" + 实际月份 + key] = put_item?.[key];
      });
    });
    // Center字段
    data["期权"] = item["期权名称"].replace("购", "@").replace(到期月份, "");
    data["月份"] = month_list;
    // 公共字段
    ["正股代码", "行权价", "正股价格"].forEach((key) => {
      data[key] = item[key];
    });
    正股价格_dict[data["正股代码"]] = data["正股价格"];
    all_data.push(data);
  });
  // const 正股List = Array.from(new Set(all_data.map((el) => el.正股)));
  // const 到期日List = Array.from(new Set(all_data.map((el) => el.到期日)));
  // const 行权价List = Array.from(new Set(all_data.map((el) => el.行权价)));
  // 行权价List.sort();
  // 正股List.forEach((正股) => {
  //   到期日List.forEach((到期日) => {
  //     all_data.push({
  //       _current: true,
  //       正股,
  //       到期日,
  //       行权价: 正股价格_dict[正股],
  //     });
  //     all_data.push({
  //       _split: true,
  //       正股,
  //       到期日,
  //       行权价: 行权价List[行权价List.length - 1],
  //     });
  //   });
  // });

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
export async function queryHold(持仓JSON, 正股代码) {
  const all_data = await get_http_data(持仓JSON, 正股代码);
  // const all_data = MOCK_DATA;
  return handleData(all_data);
}
