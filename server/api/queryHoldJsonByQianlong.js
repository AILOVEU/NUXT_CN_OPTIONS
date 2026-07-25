// 获取持仓json
import csvtojson from "csvtojson";
import iconvLite from "iconv-lite";
import fs from "node:fs";
import path from "node:path";
const isDeploy = !!process.env.VERCEL;

export async function get_持仓JSON() {
  let csvPath;
  if (isDeploy) {
    // Vercel 打包后绝对路径：.output/public/持仓.txt
    csvPath = path.join(process.cwd(), ".output", "public", "持仓.txt");
  } else {
    // 本地开发 / 本地node启动打包产物
    csvPath = path.join(process.cwd(), "public", "持仓.txt");
  }
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
                正股代码: el[32]?.split(el[32].includes("C") ? "C" : "P")[0],
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
  // console.log("持仓JSON", 持仓JSON);
  if (!持仓JSON?.length) return [];
  return 持仓JSON;
});
