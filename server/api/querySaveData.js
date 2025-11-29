import fs from "node:fs";
import { Parser } from "json2csv";
const isDeno = process.env.NITRO_PRESET;
const csvPath = isDeno ? "../public/data.csv" : "public/data.csv";

export default eventHandler(async (event) => {
  const body = await readBody(event);
  const jsonObj = body.data;
  const parse = new Parser();
  // let content = parse.parse(jsonObj);
  let content = `"f2","f14","f18","f31","f32","f108","f161","f163","f249","f250","f301","f303","f325","f326","f328","f333","f334"
  0.1705,"50ETF购12月2950",0.1673,0.1685,0.1718,8749,2.95,690,14.65,0.24,20251224,17.05,0.9341,1.1196,-0.1348,"上证50ETF",3.113
  0.2988,"50ETF购3月2850",0.2988,0.2882,0.2968,827,2.85,0,16.48,1.15,20260325,9.3,0.8927,0.7715,-0.1007,"上证50ETF",3.113`
  fs.writeFile(csvPath, content, "utf8", function (err) {
    if (err) {
      console.log("An error occured while writing JSON Object to File.");
      return console.log(err);
    }
    console.log("JSON file has been saved.");
  });
  return {};
});
