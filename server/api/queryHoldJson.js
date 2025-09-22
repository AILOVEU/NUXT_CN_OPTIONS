import csvtojson from "csvtojson";
import iconvLite from "iconv-lite";
import fs from "fs";
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
  const 持仓JSON = await get_持仓JSON();
  // const all_data = MOCK_DATA;
  return 持仓JSON;
});
