const puppeteer = require("puppeteer");
const moment = require("moment");
const fs = require("fs");
const TurndownService = require("turndown");
const turndownService = new TurndownService();

moment.locale("vi");

const init = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      "--lang=en-US",
      "--disk-cache-size=0",
      "--no-sandbox",
      "--disable-setuid-sandbox",
    ],
  });
  const page = await browser.newPage();
  return { browser, page };
};
const sleep = (time) => {
  new Promise((resolve) => {
    setTimeout(resolve, time);
  });
};
const extractPage = async (page) => {
  return await page.evaluate(async () => {
    // Define get content post
    let news = [];
    const getContent = async (html) => ({
      thumb: html.querySelector("img").src,
      title: html.querySelector("a").innerText,
      link_origin: html.querySelector("a").href,
      datetime: await format(
        getDatetime(html.querySelector("small").innerText)
      ),
    });
    //Get date
    const getDatetime = (stringDate) => {
      let arrayDate = stringDate.split(",");
      return `${arrayDate[1].trim()} ${arrayDate[2].trim()}:00`;
    };

    let wrapperPOST = [
      ...document.querySelectorAll(
        "#p_p_id_101_INSTANCE_bQiShy2NRK1f_ > div > div > div.col-md-12"
      ),
    ];
    let firstPost = await getContent(wrapperPOST[0]);
    news.push(firstPost);
    let parseNews = [...wrapperPOST[1].querySelectorAll(".row.mb-15")];
    for (let i = 0; i < parseNews.length; i++) {
      news.push(await getContent(parseNews[i]));
    }
    return news;
  });
};

const extractContent = async (page, url) => {
  await page.goto(url);
  await page.waitForSelector("#hrefFm");
  let content = await page.evaluate(() =>
    markdown(document.querySelector("div > div > section").innerHTML)
  );
  return content;
};
(async () => {
  let results = [];
  const { browser, page } = await init();
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    if (["image"].indexOf(request.resourceType()) != -1) {
      request.abort();
    }
    request.continue();
  });
  await page.goto("https://ncov.moh.gov.vn/web/guest/tin-tuc", {
    waitUntil: "networkidle2",
  });

  await page.exposeFunction("format", (date) => {
    return moment(date, "DD/MM/YYYY HH:mm:ss").format("X");
  });
  await page.exposeFunction("sleep", sleep);
  await page.exposeFunction("markdown", (html) =>
    turndownService.turndown(html)
  );

  let el;
  let className;
  while (true) {
    await page.waitForSelector(
      "#p_p_id_101_INSTANCE_bQiShy2NRK1f_ > div > div > div.clearfix.lfr-pagination > ul"
    );
    results = results.concat(await extractPage(page));
    el = await page.$(
      "#p_p_id_101_INSTANCE_bQiShy2NRK1f_ > div > div > div.clearfix.lfr-pagination > ul > li:nth-child(2)"
    );
    className = JSON.stringify(
      await (await el.getProperty("className")).jsonValue()
    );
    if (className.length !== 2) {
      break;
    }
    await page.click(
      "#p_p_id_101_INSTANCE_bQiShy2NRK1f_ > div > div > div.clearfix.lfr-pagination > ul > li:nth-child(2)"
    );
  }

  for (let i = 0; i < results.length; i++) {
    results[i]["id"] = i;
    results[i]["content"] = await extractContent(
      page,
      results[i]["link_origin"]
    );
  }

  fs.writeFileSync("data.json", JSON.stringify(results), "utf-8");
  process.exit(1);
})();
