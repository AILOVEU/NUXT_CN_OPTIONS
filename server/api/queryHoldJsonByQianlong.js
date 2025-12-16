// 获取持仓json
import csvtojson from "csvtojson";
import iconvLite from "iconv-lite";
import fs from "node:fs";
import path from 'path'
const isDeno = process.env.NITRO_PRESET;
// const csvPath = isDeno ? "../public/持仓.txt" : "./public/持仓.txt";
export async function get_持仓JSON() {
  const csvPath = path.join(process.cwd(), "public", "持仓.txt");
  return new Promise((resolve) => {
    try {
      const converterStream = fs.createReadStream(csvPath).pipe(iconvLite.decodeStream("gbk"));
      csvtojson()
        .fromStream(converterStream)
        .then((res) => {
          resolve([{ res }]);
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
  const 持仓JSON = await get_持仓JSON();
  if (!持仓JSON?.length) return [];
  return 持仓JSON;
});
