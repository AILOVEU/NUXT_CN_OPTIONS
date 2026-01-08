// 获取期权数据json
import csvtojson from "csvtojson";
import fs from "node:fs";
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
      console.log("持仓解析错误");
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
      .map((el) => ({
        date: el["date"],
        code: code,
        open: el[code + "_open"],
        high: el[code + "_high"],
        low: el[code + "_low"],
        close: el[code + "_close"],
      }));
    res.push(...validList);
  });
  return res;
});
