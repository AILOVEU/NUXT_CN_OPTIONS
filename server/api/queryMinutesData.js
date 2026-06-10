// 获取期权数据json
import csvtojson from "csvtojson";
import fs from "node:fs";
const isDeno = process.env.NITRO_PRESET;

export async function get_dataJSON(fundCode) {
  function getPath(fundCode) {
    return isDeno ? `../public/minutes_${fundCode}.csv` : `./public/minutes_${fundCode}.csv`;
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
      console.warn("持仓解析错误");
      resolve([]);
    }
  });
}

export default eventHandler(async (event) => {
  const dataJSON = await get_dataJSON(getQuery(event).fundCode);
  if (!dataJSON?.length) return [];
  return dataJSON;
});
