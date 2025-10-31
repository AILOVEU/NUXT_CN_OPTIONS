import fs from "node:fs";
export default eventHandler(async (event) => {
  const body = await readBody(event);
  const jsonObj = body.data;
  // 字符串化JSON对象
  var jsonContent = "export const MOCK_ALL_DATA = " + JSON.stringify(jsonObj);

  fs.writeFile("app/utils/mock.js", jsonContent, "utf8", function (err) {
    if (err) {
      console.log("An error occured while writing JSON Object to File.");
      return console.log(err);
    }

    console.log("JSON file has been saved.");
  });
  return {};
});
