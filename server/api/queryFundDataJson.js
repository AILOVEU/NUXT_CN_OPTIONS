// 获取期权数据json
import csvtojson from "csvtojson";
import fs from "node:fs";
const isDeno = process.env.NITRO_PRESET;
export async function get_fundDataJSON(fundCode) {
  function getPath(fundCode) {
    return isDeno ? `../public/${fundCode}.csv` : `./public/${fundCode}.csv`;
  }
  return new Promise((resolve) => {
    try {
      const converterStream = fs.createReadStream(getPath(fundCode));
      csvtojson()
        .fromStream(converterStream)
        .then((res) => {
          resolve(res);
        })
        .catch(() => {
          resolve([]);
        });
    } catch (e) {
      console.log("持仓解析错误");
      resolve([]);
    }
  });
}
export default eventHandler(async (event) => {
  const dataJSON = await get_fundDataJSON(getQuery(event).fundCode);
  if (!dataJSON?.length) return [];
  return dataJSON.map((el) => ({
    fund_code: el.fund_code,
    date: el.trade_date,
    open: +el.open,
    high: +el.high,
    low: +el.low,
    close: +el.close,
    volumn: +el.volumn,
  }));
});
