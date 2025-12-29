import { OPTIONS_MAP } from "~/data";
import { get_http_data } from "./options";
import { get_fist_季度月份 } from "./options";
import dayjs from "dayjs";
function handleHoldData(dataList, 正股代码List) {
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
      let put_期权名称 = item["期权名称"].replace(到期月份, 实际月份).replace("购", "沽");
      let call_item = dataList.find((el) => el["期权名称"] === call_期权名称);
      let put_item = dataList.find((el) => el["期权名称"] === put_期权名称);
      if (call_item?.["持仓"] || put_item?.["持仓"]) {
        data["_持仓"] = true;
      }
      [...Object.keys(item), "成本价", "单日损耗", "时间价值", "内在价值", "组合"].forEach((key) => {
        if (["期权名称"].includes(key)) return;
        data["C" + 实际月份 + key] = call_item?.[key];
        data["P" + 实际月份 + key] = put_item?.[key];
      });
    });

    // Center字段
    data["期权"] = item["期权名称"].replace("购", "@").replace(到期月份, "");
    data["月份"] = month_list;
    // 公共字段
    ["正股代码", "行权价", "正股价格", "沽购", "千行权价"].forEach((key) => {
      data[key] = item[key];
    });
    正股价格_dict[data["正股代码"]] = data["正股价格"];
    all_data.push(data);
  });
  if (正股代码List.length > 0) {
    const 正股代码List = Array.from(new Set(all_data.map((el) => el.正股代码)));
    // const 到期日List = Array.from(new Set(all_data.map((el) => el.到期日)));
    const 行权价List = Array.from(new Set(all_data.map((el) => el.行权价)));
    行权价List.sort();
    正股代码List.forEach((正股代码) => {
      all_data.push({
        _current: true,
        正股代码,
        行权价: 正股价格_dict[正股代码],
      });
      all_data.push({
        _split: true,
        正股代码,
        行权价: 行权价List[行权价List.length - 1],
      });
    });
  }

  all_data.sort(function (a, b) {
    if (a["正股代码"] === b["正股代码"]) {
      return a["行权价"] - b["行权价"];
    }
    const aSort = OPTIONS_MAP.findIndex((el) => el.code === a["正股代码"]);
    const bSort = OPTIONS_MAP.findIndex((el) => el.code === b["正股代码"]);
    return aSort - bSort;
  });
  return all_data;
}
export async function queryHold(正股代码List, useCatch) {
  const [all_data, combo_list] = await get_http_data(正股代码List, useCatch);
  return handleHoldData(all_data, 正股代码List);
}
