import csvtojson from "csvtojson/v2";
import iconvLite from "iconv-lite";
import fs from "node:fs";
import { MOCK_HOLD } from "./holdJson";
export async function get_持仓JSON() {
  const converterStream = fs
    .createReadStream("public\\持仓.csv")
    .pipe(iconvLite.decodeStream("gbk"));
  return new Promise((resolve) => {
    csvtojson()
      .fromStream(converterStream)
      .then((res) => {
        resolve(res);
      });
  });
}
export default eventHandler(async (event) => {
  // return MOCK_HOLD;
  const 持仓JSON = await get_持仓JSON();
  // const all_data = MOCK_DATA;
  return 持仓JSON;
});
