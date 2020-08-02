const fs = require("fs");

let news = JSON.parse(fs.readFileSync("news.json", "utf-8"));
let timelines = JSON.parse(fs.readFileSync("timeline.json", "utf-8"));

let output = { news, timelines };
fs.writeFileSync("database.json", JSON.stringify(output), "utf-8");
