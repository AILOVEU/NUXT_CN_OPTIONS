// 获取期权数据json
import csvtojson from "csvtojson";
import fs from "node:fs";
const isDeno = process.env.NITRO_PRESET;
let csvPath = isDeno ? "../public/data.csv" : "./public/data.csv";
csvPath = './data.csv'
export async function get_dataJSON() {
  return new Promise((resolve) => {
    try {
      const converterStream = fs.createReadStream(csvPath);
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
  const dataJSON = await get_dataJSON();
  if (!dataJSON?.length) return [];
  return dataJSON;
});
