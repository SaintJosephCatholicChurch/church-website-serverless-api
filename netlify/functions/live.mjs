import fetch from "node-fetch";
import { parse } from "node-html-parser";
import { XMLParser } from "fast-xml-parser";
import chromium from "chrome-aws-lambda";
import puppeteer from "puppeteer-core";

export const handler = async (event) => {
  const pathParams = event.path.replace("/.netlify/functions/live/", "").split("/");
  if (pathParams.length < 2) {
    console.error("Bad input", pathParams);
    return {
      statusCode: 400,
      headers: {
        "access-control-allow-origin": "https://www.stjosephchurchbluffton.org",
      },
    };
  }
  const [provider, pageOrChannel] = pathParams;

  let isStreaming = false;
  let url = "";

  if (provider === "youtube") {
    try {
      const response = await fetch(`https://youtube.com/channel/${pageOrChannel}/live`);
      const text = await response.text();
      const html = parse(text);
      const canonicalURLTag = html.querySelector("link[rel=canonical]");
      if (canonicalURLTag) {
        const canonicalURL = canonicalURLTag.getAttribute("href");
        isStreaming = canonicalURL.includes("/watch?v=");
      }

      if (isStreaming) {
        url = canonicalURL.replace("/watch?v=", "/embed/");
      } else {
        const response2 = await fetch(
          `https://www.youtube.com/feeds/videos.xml?channel_id=${pageOrChannel}&orderby=published`
        );
        const parser = new XMLParser();
        let jObj = parser.parse(await response2.text());
        if (jObj.feed) {
          url = `https://www.youtube.com/embed/${jObj.feed.entry[0]["yt:videoId"]}`;
        }
      }
    } catch (e) {
      console.error(e);
      return {
        statusCode: 500,
        headers: {
          "access-control-allow-origin": "https://www.stjosephchurchbluffton.org",
        },
      };
    }
  }

  if (provider === "facebook") {
    try {
      const browser = await puppeteer.launch({
        args: chromium.args,
        executablePath: process.env.CHROME_EXECUTABLE_PATH || (await chromium.executablePath),
        headless: true,
      });
      const page = await browser.newPage();

      await page.goto(`https://www.facebook.com/${pageOrChannel}/videos`);

      // Set screen size
      await page.setViewport({ width: 1080, height: 1024 });

      const data = await page.evaluate(() => document.querySelector("*").outerHTML);

      const match = new RegExp(
        `https:\/\/www\.facebook\.com\/${pageOrChannel}\/videos\/[a-zA-Z0-9_-]+\/([0-9]+)\/`
      ).exec(data);
      if (match && match.length >= 2) {
        url = match[0];
      }

      const f = await page.$(`a[href='${url}']`);
      const text = await (await f?.getProperty("textContent"))?.jsonValue();
      isStreaming = text.includes("LIVE");

      await browser.close();
    } catch (e) {
      console.error(e);
      return {
        statusCode: 500,
        headers: {
          "access-control-allow-origin": "https://www.stjosephchurchbluffton.org",
        },
      };
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ isStreaming, url }),
    headers: {
      "access-control-allow-origin": "https://www.stjosephchurchbluffton.org",
    },
  };
};
