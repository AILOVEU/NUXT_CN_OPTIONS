import fs from "node:fs";
import { Parser } from "json2csv";

export default eventHandler(async (event) => {
  const body = await readBody(event);
  const jsonObj = body.data;
  const parse = new Parser();
  fs.writeFile("public/data.csv", parse.parse(jsonObj), "utf8", function (err) {
    if (err) {
      console.log("An error occured while writing JSON Object to File.");
      return console.log(err);
    }
    console.log("JSON file has been saved.");
  });
  return {};
});
