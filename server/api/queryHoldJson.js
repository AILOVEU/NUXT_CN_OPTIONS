import csvtojson from "csvtojson/v2";
import iconvLite from "iconv-lite";
import fs from "fs";
export async function get_持仓JSON() {
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
      resolve([]);
    }
  });
}
export default eventHandler(async (event) => {
  const 持仓JSON = await get_持仓JSON();
  if (!持仓JSON?.length) return MOCK_HOLD;
  return 持仓JSON;
});
