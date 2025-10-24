import csvtojson from "csvtojson/v2";
import iconvLite from "iconv-lite";
import fs from "fs";
import path from "path";
export async function get_持仓JSON() {
  // console.log(
  //   'path.join(__dirname, "持仓.csv")',
  //   path.join(__dirname, "持仓.csv")
  // );
  return new Promise((resolve) => {
    try {
      const converterStream = fs
        .createReadStream("持仓.csv")
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
