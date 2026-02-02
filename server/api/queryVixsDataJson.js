// 获取期权数据json
import csvtojson from "csvtojson";
import fs from "node:fs";
import dayjs from "dayjs";
import { formatDecimal } from "~/utils/utils";
const isDeno = process.env.NITRO_PRESET;
export async function get_fundDataJSON() {
  function getPath() {
    return isDeno ? `../public/vixs.csv` : `./public/vixs.csv`;
  }
  return new Promise((resolve) => {
    try {
      const converterStream = fs.createReadStream(getPath());
      csvtojson()
        .fromStream(converterStream)
        .then((res) => {
          resolve(res);
        })
        .catch(() => {
          resolve([]);
        });
    } catch (e) {
      console.warn("持仓解析错误");
      resolve([]);
    }
  });
}
export default eventHandler(async (event) => {
  const body = await readBody(event);
  const codeList = body.codeList || [];
  const dataJSON = await get_fundDataJSON();
  if (!dataJSON?.length) return [];
  let res = [];
  codeList.forEach((code) => {
    const validList = dataJSON
      .filter((el) => el[code + "_high"])
      .map((el) => {
        let close = el[code + "_close"];
        let low = el[code + "_low"];
        let open = el[code + "_open"];
        let high = el[code + "_high"];
        if (close > 90) close = 100;
        if (low > 90) low = 90;
        if (open > 90) open = 100;
        if (high > 90) high = 100;
        if (!close || isNaN(close) || close === "0") close = low;
        return {
          date: dayjs(el["date"], "YYYY/M/D").format("YYYY-MM-DD"),
          code: code,
          open: formatDecimal(open, 2),
          high: formatDecimal(high, 2),
          low: formatDecimal(low, 2),
          close: formatDecimal(close, 2),
        };
      });
    res.push(...validList);
  });
  return res;
});
