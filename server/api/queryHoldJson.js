import csvtojson from "csvtojson/v2";
import iconvLite from "iconv-lite";
import fs from "node:fs";
import { MOCK_HOLD } from "./holdJson";
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
  // return MOCK_HOLD;
  const 持仓JSON = await get_持仓JSON();
  if (!持仓JSON?.length) return MOCK_HOLD;
  // const all_data = MOCK_DATA;
  return 持仓JSON;
});
