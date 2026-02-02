import { OPTIONS_MAP } from "~/data";
import { get_http_data } from "./options";
import dayjs from "dayjs";
function handleTData(dataList) {
  let tiledData = [];
  let 正股价格_dict = {};
  dataList.forEach((item) => {
    // 只处理左侧认购数据
    if (item["期权名称"].includes("沽")) return;
    let call_item = item;
    let put_期权名称 = call_item["期权名称"].replace("购", "沽");
    let put_item = dataList.find((el) => el["期权名称"] === put_期权名称);

    let record = {};

    if (call_item?.["持仓"] || put_item?.["持仓"]) record["is行内有持仓"] = true;

    record["C" + "期权名称"] = call_item?.["期权名称"];
    record["P" + "期权名称"] = put_item?.["期权名称"];
    // 公共字段
    ["正股代码", "行权价", "正股价格", "千行权价", "is旧期权", "到期日"].forEach((key) => {
      record[key] = call_item[key];
    });
    正股价格_dict[record["正股代码"]] = record["正股价格"];
    tiledData.push(record);
  });
  const 正股代码List = Array.from(new Set(tiledData.map((el) => el.正股代码)));
  const 到期日List = Array.from(new Set(tiledData.map((el) => el.到期日)));
  const 行权价List = Array.from(new Set(tiledData.map((el) => el.行权价)));
  行权价List.sort();
  正股代码List.forEach((正股代码) => {
    到期日List.forEach((到期日) => {
      tiledData.push({
        _current: true,
        正股代码,
        到期日,
        行权价: 正股价格_dict[正股代码],
      });
      tiledData.push({
        _split: true,
        正股代码,
        到期日,
        行权价: 行权价List[行权价List.length - 1],
      });
    });
  });
  tiledData.sort(function (a, b) {
    if (a["正股代码"] === b["正股代码"]) {
      if (a["到期日"] === b["到期日"]) {
        return a["行权价"] - b["行权价"];
      }
      return dayjs(a["到期日"], "YYYY-MM-DD").isBefore(dayjs(b["到期日"], "YYYY-MM-DD")) ? 1 : -1;
    }
    const aSort = OPTIONS_MAP.findIndex((el) => el.code === a["正股代码"]);
    const bSort = OPTIONS_MAP.findIndex((el) => el.code === b["正股代码"]);
    return aSort - bSort;
  });
  return tiledData;
}
export async function queryRow(正股代码, useCatch) {
  const [tiledData, comboList] = await get_http_data(正股代码, useCatch);
  const tableData = handleTData(tiledData);
  return [tableData, comboList, tiledData];
}
