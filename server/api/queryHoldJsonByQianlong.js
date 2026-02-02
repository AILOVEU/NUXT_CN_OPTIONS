// 获取持仓json
import csvtojson from "csvtojson";
import iconvLite from "iconv-lite";
import fs from "node:fs";
import path from "path";
const isDeno = process.env.NITRO_PRESET;
// const csvPath = isDeno ? "../public/持仓.txt" : "./public/持仓.txt";
export async function get_持仓JSON() {
  const csvPath = path.join(process.cwd(), "public", "持仓.txt");
  return new Promise((resolve) => {
    try {
      const converterStream = fs.createReadStream(csvPath).pipe(iconvLite.decodeStream("gbk"));
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
                名称: el[2],
                持仓: +el[7], // 正值
                持仓类别: el[4] === "权利" ? "权利仓" : "义务仓", // 义务仓、权利仓
                开仓均价: +el[8],
              }))
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
  console.log("持仓JSON", 持仓JSON);
  if (!持仓JSON?.length) return [];
  return 持仓JSON;
});
