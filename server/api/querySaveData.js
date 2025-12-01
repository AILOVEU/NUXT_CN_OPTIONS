import fs from "node:fs";
import { Parser } from "json2csv";
const isDeno = process.env.NITRO_PRESET;
let csvPath = isDeno ? "../public/data.csv" : "./public/data.csv";
export default eventHandler(async (event) => {
  const body = await readBody(event);
  const jsonObj = body.data;
  const parse = new Parser();
  let content = parse.parse(jsonObj);
  fs.writeFile(csvPath, content, "utf8", function (err) {
    if (err) {
      console.log("An error occured while writing JSON Object to File.");
      return console.log(err);
    }
    console.log("JSON file has been saved.");
  });
  return {};
});
