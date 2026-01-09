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
        date: dayjs(el["date"], "YYYY/M/D").format("YYYY-MM-DD"),
        code: code,
        open: formatDecimal(el[code + "_open"], 2),
        high: formatDecimal(el[code + "_high"], 2),
        low: formatDecimal(el[code + "_low"], 2),
        close: formatDecimal(el[code + "_close"], 2),
      }));
    res.push(...validList);
  });
  return res;
});
