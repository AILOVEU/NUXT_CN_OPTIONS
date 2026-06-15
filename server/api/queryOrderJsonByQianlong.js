// 获取持仓json
import csvtojson from "csvtojson";
import iconvLite from "iconv-lite";
import fs from "node:fs";
import path from "path";
const isDeno = process.env.NITRO_PRESET;
// const csvPath = isDeno ? "../public/持仓.txt" : "./public/持仓.txt";
export async function get_持仓JSON() {
  const csvPath = path.join(process.cwd(), "public", "当日成交.txt");
  return new Promise((resolve) => {
    try {
      const converterStream = fs.createReadStream(csvPath).pipe(iconvLite.decodeStream("gbk"));
      const 操作Map = {
        买入开仓: 1,
        卖出平仓: -1,
      };
      csvtojson({ output: "line" })
        .fromStream(converterStream)
        .then((res) => {
          resolve(
            res
              .map((el) => {
                let list = el.replaceAll(" ", "").split("\t");
                return list;
              })
              .map((el) => ({
                期权名称: el[3],
                成交时间: el[1],
                持仓变化: 操作Map[el[4]] * +el[8], // 正值
                成交价格: +el[7],
                正股代码: el[15],
              }))
              .filter((el) => el["期权名称"])
          );
        })
        .catch(() => {
          resolve([]);
        });
    } catch (e) {
      console.warn("持仓解析错误");
      resolve([]);
    }
  });
}
export default eventHandler(async (event) => {
  const 持仓JSON = await get_持仓JSON();
  // console.log("持仓JSON", 持仓JSON);
  if (!持仓JSON?.length) return [];
  return 持仓JSON;
});
