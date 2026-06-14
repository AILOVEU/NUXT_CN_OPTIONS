import { get_fist_季度月份 } from "./options";
import dayjs from "dayjs";
import { get_http_data_stock_index } from "~/utils/stockIndexOptions";
import { STOCK_INDEX_OPTIONS_MAP } from "~/data";

function handleHoldData(dataList, 正股代码List) {
  // const [month_list, month_index] = get_fist_季度月份(dataList);

  const month_list = ["2606", "2607", "2608", "2609", "2612", "2703"];
  const month_index = 0;
  let tableData = [];
  let 正股价格_dict = {};
  dataList.forEach((item) => {
    let record = {
      行内期权名称List: [],
    };
    // 只处理左侧认购数据
    if (item["期权名称"].includes("沽")) return;
    // 只处理第一个季度数据
    if (item["到期年月"] !== month_list[month_index]) return;
    // 添加沽购+月份+"期权名称" = 期权名称，如下：
    //   C1月期权名称: "50ETF购1月3000",
    //   P1月期权名称: "50ETF沽1月3000",
    //   C2月期权名称: "50ETF购2月3000",
    //   P2月期权名称: "50ETF沽2月3000",
    //   C3月期权名称: "50ETF购3月3000",
    //   P3月期权名称: "50ETF沽3月3000",
    //   C6月期权名称: "50ETF购6月3000",
    //   P6月期权名称: "50ETF沽6月3000",
    let 到期年月 = dayjs(item["到期年月"], "YYMM").format("YY年M月");
    month_list.forEach((yearmonth) => {
      let 实际年月 = dayjs(yearmonth, "YYMM").format("YY年M月");
      console.log("实际年月", 实际年月);
      let call_期权名称 = item["期权名称"].replace(到期年月, 实际年月);
      let put_期权名称 = item["期权名称"].replace(到期年月, 实际年月).replace("购", "沽");
      let call_item = dataList.find((el) => el["期权名称"] === call_期权名称);
      let put_item = dataList.find((el) => el["期权名称"] === put_期权名称);

      if (call_item?.["持仓"] || put_item?.["持仓"]) record["is保留行"] = true;

      record["C" + 实际年月 + "期权名称"] = call_item?.["期权名称"];
      record["P" + 实际年月 + "期权名称"] = put_item?.["期权名称"];
      record["行内期权名称List"].push(call_期权名称);
      record["行内期权名称List"].push(put_期权名称);
      // [...Object.keys(item), "成本价", "单日损耗", "时间价值", "内在价值", "组合"].forEach((key) => {
      //   if (["期权名称"].includes(key)) return;
      //   data["C" + 实际月份 + key] = call_item?.[key];
      //   data["P" + 实际月份 + key] = put_item?.[key];
      // });
    });
    // 公共字段
    ["正股代码", "行权价", "正股价格", "千行权价", "is旧期权", "展示正股名称"].forEach((key) => {
      record[key] = item[key];
    });
    正股价格_dict[record["正股代码"]] = record["正股价格"];
    tableData.push(record);
  });
  if (正股代码List.length > 0) {
    const 正股代码List = Array.from(new Set(tableData.map((el) => el.正股代码)));
    // const 行权价List = Array.from(new Set(tableData.map((el) => el.行权价)));
    // 行权价List.sort();
    正股代码List.forEach((正股代码, index) => {
      tableData.push({
        _current: true,
        正股代码,
        行权价: 正股价格_dict[正股代码],
      });
      // if (index !== 正股代码List.length - 1) {
      tableData.push({
        _split: true,
        正股代码,
        行权价: 20000,
      });
      // }
    });
  }

  tableData.sort(function (a, b) {
    if (a["正股代码"] === b["正股代码"]) {
      // a["正股代码"] === "510500" && a["_split"] && console.log(a["行权价"], b["行权价"]);
      return a["行权价"] - b["行权价"];
    }

    const aSort = STOCK_INDEX_OPTIONS_MAP.findIndex((el) => el.code === a["正股代码"]);
    const bSort = STOCK_INDEX_OPTIONS_MAP.findIndex((el) => el.code === b["正股代码"]);
    return aSort - bSort;
  });
  return tableData;
}
export async function queryStockIndexGrid(正股代码List, useCatch) {
  const [tiledData] = await get_http_data_stock_index(正股代码List, useCatch);
  const tableData = handleHoldData(tiledData, 正股代码List);
  console.log("tableData - tiledData", tableData, tiledData);
  return [tableData, tiledData];
}
