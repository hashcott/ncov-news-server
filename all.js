const { crawlerNews } = require("./crawlerNews");
const { crawlerTimeline } = require("./crawlerTimeLines");

(async () => {
  await crawlerNews();
  await crawlerTimeline();
})();
