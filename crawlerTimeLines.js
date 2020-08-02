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

const extractTimelineInPage = async (page) => {
  return await page.evaluate(async () => {
    // Define get content post
    let timelineInPage = [];

    const getTimeline = async (html) => ({
      time: await formatTime(html.querySelector(".timeline-head").innerText),
      content: html.querySelector(".timeline-content").innerText,
    });

    let wrapperTimeline = [
      ...document.querySelectorAll(
        "#portlet_101_INSTANCE_iEPhEhL1XSde > div > div > div > div:nth-child(4) > div > div > div > div ul"
      ),
    ];

    for (let i = 0; i < wrapperTimeline.length; i++) {
      timelineInPage.push(await getTimeline(wrapperTimeline[i]));
    }
    return timelineInPage;
  });
};

const getAllContent = async (page) => {
  await page.goto("https://ncov.moh.gov.vn/dong-thoi-gian", {
    waitUntil: "networkidle2",
  });
  await page.exposeFunction("formatTime", (date) => {
    return moment(date, "HH:mm DD/MM/YYYY").format("X");
  });
  let timelines;
  try {
    timelines = JSON.parse(fs.readFileSync("timeline.json", "utf-8"));
  } catch (error) {
    timelines = [];
  }

  let el = await page.$(
    "#portlet_101_INSTANCE_iEPhEhL1XSde > div > div > div > div.clearfix.lfr-pagination > ul > li:nth-child(2)"
  );
  let className = JSON.stringify(
    await (await el.getProperty("className")).jsonValue()
  );
  while (className.length === 2) {
    await page.waitForSelector("footer");
    let tempTimelines = await extractTimelineInPage(page);
    tempTimelines = tempTimelines.map((timeline) => ({
      ...timeline,
      id: uuidv4(),
    }));

    tempTimelines.map((timeline) => {
      let index = _.findIndex(timelines, { id: timeline.id });
      if (index === -1) {
        timelines.push(timeline);
      }
    });

    el = await page.$(
      "#portlet_101_INSTANCE_iEPhEhL1XSde > div > div > div > div.clearfix.lfr-pagination > ul > li:nth-child(2)"
    );
    className = JSON.stringify(
      await (await el.getProperty("className")).jsonValue()
    );
    await page.click(
      "#portlet_101_INSTANCE_iEPhEhL1XSde > div > div > div > div.clearfix.lfr-pagination > ul > li:nth-child(2) > a"
    );
  }

  fs.writeFileSync("timeline.json", JSON.stringify(timelines), "utf-8");
};

module.exports.crawlerTimeline = async () => {
  const { browser, page } = await init();
  await getAllContent(page);
  await page.close();
  await browser.close();
};
