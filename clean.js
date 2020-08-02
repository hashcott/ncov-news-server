const fs = require("fs");

let news = JSON.parse(fs.readFileSync("news.json", "utf-8"));

let output = { news };
fs.writeFileSync("database.json", JSON.stringify(output), "utf-8");
