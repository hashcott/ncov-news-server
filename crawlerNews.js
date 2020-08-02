const puppeteer = require("puppeteer");
const moment = require("moment");
const fs = require("fs");
const TurndownService = require("turndown");
const turndownService = new TurndownService();
const _ = require("lodash");
const { v4: uuidv4 } = require("uuid");
const { format } = require("path");

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
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    if (["image", "font", "stylesheet"].indexOf(request.resourceType()) != -1) {
      return request.abort();
    }
    return request.continue();
  });
  return { browser, page };
};

const sleep = (time) => {
  new Promise((resolve) => {
    setTimeout(resolve, time);
  });
};

const extractLinkInPage = async (page) => {
  return await page.evaluate(async () => {
    // Define get content post
    let linksInPage = [];
    const getLink = async (html) => ({
      link_origin: html.querySelector("a").href,
    });

    let wrapperLinks = [
      ...document.querySelectorAll(
        "#p_p_id_101_INSTANCE_bQiShy2NRK1f_ > div > div > div.col-md-12"
      ),
    ];
    let firstLink = await getLink(wrapperLinks[0]);
    linksInPage.push(firstLink);
    let parseLinks = [...wrapperLinks[1].querySelectorAll(".row.mb-15")];
    for (let i = 0; i < parseLinks.length; i++) {
      linksInPage.push(await getLink(parseLinks[i]));
    }
    return linksInPage;
  });
};

const extractContent = async (page, url) => {
  await page.goto(url);
  await page.waitForSelector("#hrefFm");
  let content = await page.evaluate(async () => {
    let linkImage = [
      "https://i.imgur.com/FP6zVP5.jpg",
      "https://i.imgur.com/XXalWEq.jpg",
      "https://i.imgur.com/37HqjQk.jpg",
      "https://i.imgur.com/vW2pSoV.jpg",
      "https://i.imgur.com/lj3g6If.jpg",
      "https://i.imgur.com/TVYjfTk.jpg",
      "https://i.imgur.com/7ob1Ews.jpg",
    ];
    //Get date
    const getDatetime = (stringDate) => {
      let arrayDate = stringDate.split(",")[1].split(" ");
      return `${arrayDate[0].trim()} ${arrayDate[1].trim()}`;
    };
    const getContent = async (html) => ({
      thumb:
        html.getElementsByTagName("img").length > 0
          ? html.getElementsByTagName("img")[0].src
          : linkImage[Math.floor(Math.random() * 7)],
      title: html.querySelector(".header-title").innerText.trim(),
      datetime: await formatTime(
        getDatetime(html.querySelector("div > div > section > span").innerText)
      ),
      content: await markdown(html.querySelector("section").innerHTML),
    });
    let wrapperNews = document.querySelector(
      "#p_p_id_101_INSTANCE_Wgw6CgJiO3vb_ > div > div > div"
    );
    return await getContent(wrapperNews);
  });
  return content;
};

const getAllLink = async (page) => {
  // History link
  let links;
  try {
    links = JSON.parse(fs.readFileSync("link.json", "utf-8"));
  } catch (error) {
    links = [];
  }
  await page.goto("https://ncov.moh.gov.vn/web/guest/tin-tuc", {
    waitUntil: "networkidle2",
  });

  let el = await page.$(
    "#p_p_id_101_INSTANCE_bQiShy2NRK1f_ > div > div > div.clearfix.lfr-pagination > ul > li:nth-child(2)"
  );
  let className = JSON.stringify(
    await (await el.getProperty("className")).jsonValue()
  );
  while (className.length === 2) {
    await page.waitForSelector("footer");
    let tempLinks = await extractLinkInPage(page);
    tempLinks = tempLinks.map((link) => ({
      ...link,
      id: uuidv4(),
    }));

    tempLinks.map((link) => {
      let index = _.findIndex(links, { link_origin: link.link_origin });
      if (index === -1) {
        links.push({ ...link, isCrawl: false });
      }
    });

    el = await page.$(
      "#p_p_id_101_INSTANCE_bQiShy2NRK1f_ > div > div > div.clearfix.lfr-pagination > ul > li:nth-child(2)"
    );
    className = JSON.stringify(
      await (await el.getProperty("className")).jsonValue()
    );
    await page.click(
      "#p_p_id_101_INSTANCE_bQiShy2NRK1f_ > div > div > div.clearfix.lfr-pagination > ul > li:nth-child(2) > a"
    );
  }

  fs.writeFileSync("link.json", JSON.stringify(links), "utf-8");
};

const getDatas = async (page) => {
  let news;
  try {
    news = JSON.parse(fs.readFileSync("news.json", "utf-8"));
  } catch (error) {
    news = [];
  }
  // Function support in browser
  await page.exposeFunction("formatTime", (date) => {
    return moment(date, "DD/MM/YYYY HH:mm").format("X");
  });
  await page.exposeFunction("sleep", sleep);
  await page.exposeFunction("markdown", (html) =>
    turndownService.turndown(html)
  );
  let links = JSON.parse(fs.readFileSync("link.json", "utf-8"));
  for (let i = 0; i < links.length; i++) {
    if (links[i].isCrawl === false) {
      news.push({
        ...(await extractContent(page, links[i].link_origin)),
        id: links[i].id,
      });
      links[i].isCrawl = true;
    }
  }
  fs.writeFileSync("link.json", JSON.stringify(links), "utf-8");
  fs.writeFileSync("news.json", JSON.stringify(news), "utf-8");
};

module.exports.crawlerNews = async () => {
  const { browser, page } = await init();
  await getAllLink(page);
  await getDatas(page);
  await page.close();
  await browser.close();
};
