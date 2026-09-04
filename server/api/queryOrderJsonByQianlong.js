// 获取持仓json
import csvtojson from "csvtojson";
import iconvLite from "iconv-lite";
import { Readable } from "node:stream";
export async function getOrderJSON() {
  return new Promise(async (resolve) => {
    try {
      // 1. 获取原始二进制字节
      const storage = useStorage("assets:server");
      const rawUint8 = await storage.getItemRaw("2当日成交.dat");
      if (!rawUint8) return resolve([]);

      // 2. 关键：构建和 fs.createReadStream 完全相同的二进制可读流
      const fileBuffer = Buffer.from(rawUint8);
      const readStream = Readable.from(fileBuffer);

      // 3. 完全复刻你本地能跑通的管道代码
      const converterStream = readStream.pipe(iconvLite.decodeStream("gbk"));

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
              .map((el) => {
                // console.log('queryOrderJsonByQianlong', el)
                return {
                  期权名称: el[3],
                  成交时间: el[1],
                  持仓变化: 操作Map[el[4]] * +el[8], // 正值
                  成交价格: +el[7],
                  正股代码: el[15],
                }
              })
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
  const 持仓JSON = await getOrderJSON();
  // console.log("持仓JSON", 持仓JSON);
  if (!持仓JSON?.length) return [];
  return 持仓JSON;
});
