const fs = require("fs");

let data = JSON.parse(fs.readFileSync("data.json", "utf-8"));
for (let i = 0; i < data.length; i++) {
  data[i]["id"] = i + 1;
  delete data[i]["link_origin"];
}
let output = { news: data };
fs.writeFileSync("clean.json", JSON.stringify(output), "utf-8");
