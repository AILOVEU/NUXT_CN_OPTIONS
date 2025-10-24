import csvtojson from "csvtojson/v2";
import iconvLite from "iconv-lite";
import fs from "node:fs";
const isDeno = process.env.NITRO_PRESET;
const csvPath = isDeno ? "./持仓.csv" : "./持仓.csv";
export async function get_持仓JSON() {
  return new Promise((resolve) => {
    try {
      const converterStream = fs
        .createReadStream(csvPath)
        .pipe(iconvLite.decodeStream("gbk"));
      csvtojson()
        .fromStream(converterStream)
        .then((res) => {
          resolve(res);
        });
    } catch (e) {
      console.log("持仓解析错误");
      resolve([]);
    }
  });
}
export default eventHandler(async (event) => {
  const 持仓JSON = await get_持仓JSON();
  if (!持仓JSON?.length) return [];
  return 持仓JSON;
});
