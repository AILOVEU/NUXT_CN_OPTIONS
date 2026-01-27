import { OPTIONS_MAP } from "~/data";
import { get_http_data } from "./options";
import { get_fist_季度月份 } from "./options";
import dayjs from "dayjs";
function handleHoldData(dataList, 正股代码List) {
  const [month_list, month_index] = get_fist_季度月份(dataList);
  let all_data = [];
  let 正股价格_dict = {};
  dataList.forEach((item) => {
    let record = {};
    // 只处理左侧认购数据
    if (item["期权名称"].includes("沽")) return;
    // 只处理第一个季度数据
    if (item["到期日"] !== month_list[month_index]) return;
    // 添加沽购+月份+"期权名称" = 期权名称，如下：
    //   C1月期权名称: "50ETF购1月3000",
    //   P1月期权名称: "50ETF沽1月3000",
    //   C2月期权名称: "50ETF购2月3000",
    //   P2月期权名称: "50ETF沽2月3000",
    //   C3月期权名称: "50ETF购3月3000",
    //   P3月期权名称: "50ETF沽3月3000",
    //   C6月期权名称: "50ETF购6月3000",
    //   P6月期权名称: "50ETF沽6月3000",
    let 到期月份 = dayjs(item["到期日"], "YYYY-MM-DD").format("M月");
    month_list.forEach((month) => {
      let 实际月份 = dayjs(month, "YYYY-MM-DD").format("M月");
      let call_期权名称 = item["期权名称"].replace(到期月份, 实际月份);
      let put_期权名称 = item["期权名称"].replace(到期月份, 实际月份).replace("购", "沽");
      let call_item = dataList.find((el) => el["期权名称"] === call_期权名称);
      let put_item = dataList.find((el) => el["期权名称"] === put_期权名称);

      if (call_item?.["持仓"] || put_item?.["持仓"]) record["is行内有持仓"] = true;

      record["C" + 实际月份 + "期权名称"] = call_item?.["期权名称"];
      record["P" + 实际月份 + "期权名称"] = put_item?.["期权名称"];
      // [...Object.keys(item), "成本价", "单日损耗", "时间价值", "内在价值", "组合"].forEach((key) => {
      //   if (["期权名称"].includes(key)) return;
      //   data["C" + 实际月份 + key] = call_item?.[key];
      //   data["P" + 实际月份 + key] = put_item?.[key];
      // });
    });
    // 公共字段
    ["正股代码", "行权价", "正股价格", "千行权价", "is旧期权"].forEach((key) => {
      record[key] = item[key];
    });
    正股价格_dict[record["正股代码"]] = record["正股价格"];
    all_data.push(record);
  });
  if (正股代码List.length > 0) {
    const 正股代码List = Array.from(new Set(all_data.map((el) => el.正股代码)));
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
export async function queryGrid(正股代码List, useCatch) {
  const [all_data, comboList] = await get_http_data(正股代码List, useCatch);
  const tableData = handleHoldData(all_data, 正股代码List);
  return [tableData, comboList, all_data];
}
