import csvtojson from "csvtojson";
import iconvLite from "iconv-lite";
import { Readable } from "node:stream";

// 重命名函数，规避中文标识符编译报错
export async function getHoldJSON() {
  return new Promise(async (resolve) => {
    try {
      // 1. 获取原始二进制字节
      const storage = useStorage("assets:server");
      const rawUint8 = await storage.getItemRaw("hold.dat");
      if (!rawUint8) return resolve([]);

      // 2. 关键：构建和 fs.createReadStream 完全相同的二进制可读流
      const fileBuffer = Buffer.from(rawUint8);
      const readStream = Readable.from(fileBuffer);

      // 3. 完全复刻你本地能跑通的管道代码
      const converterStream = readStream.pipe(iconvLite.decodeStream("gbk"));

      csvtojson({ output: "line" })
        .fromStream(converterStream)
        .then((res) => {
          console.log(res);
          const list = res
            .map((el) => el.replaceAll(" ", "").split("\t"))
            .map((el) => ({
              名称: el[2],
              持仓: +el[7],
              持仓类别: el[4] === "权利" ? "权利仓" : "义务仓",
              开仓均价: +el[8],
              正股代码: el[32]?.split(el[32].includes("C") ? "C" : "P")[0] || "",
            }));
          resolve(list);
        })
        .catch(() => resolve([]));
    } catch (e) {
      console.warn("持仓解析错误", e);
      resolve([]);
    }
  });
}

export default eventHandler(async () => {
  const data = await getHoldJSON();
  return data;
});
