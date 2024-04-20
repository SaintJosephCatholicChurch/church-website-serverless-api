import chromium from "@sparticuz/chromium";
import { XMLParser } from "fast-xml-parser";
import fetch from "node-fetch";
import { parse } from "node-html-parser";
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
      console.log("Starting browser...");
      const browser = await puppeteer.launch({
        args: [
          "--allow-running-insecure-content",
          "--autoplay-policy=user-gesture-required",
          "--disable-component-update",
          "--disable-domain-reliability",
          "--disable-features=AudioServiceOutOfProcess,IsolateOrigins,site-per-process",
          "--disable-print-preview",
          "--disable-setuid-sandbox",
          "--disable-site-isolation-trials",
          "--disable-speech-api",
          "--disable-web-security",
          "--disk-cache-size=33554432",
          "--enable-features=SharedArrayBuffer",
          "--hide-scrollbars",
          "--mute-audio",
          "--no-default-browser-check",
          "--no-pings",
          "--no-sandbox",
          "--no-zygote",
          "--use-gl=swiftshader",
          "--window-size=1920,1080",
          "--single-process",
          "--disable-gpu",
          "--disable-dev-shm-usage",
          "--no-first-run",
          "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36",
        ],
        defaultViewport: chromium.defaultViewport,
        executablePath: process.env.CHROME_EXECUTABLE_PATH || (await chromium.executablePath()),
        headless: true,
      });
      console.log("Broswer loaded.");
      const page = await browser.newPage();
      console.log("New page loaded.");

      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, "appCodeName", { get: () => "Mozilla" });
        Object.defineProperty(navigator, "appName", { get: () => "Netscape" });
        Object.defineProperty(navigator, "appVersion", {
          get: () =>
            "5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36",
        });
        Object.defineProperty(navigator, "platform", { get: () => "Win32" });
        Object.defineProperty(navigator, "product", { get: () => "Gecko" });
        Object.defineProperty(navigator, "productSub", { get: () => "20030107" });
        Object.defineProperty(navigator, "vendor", { get: () => "" });
        Object.defineProperty(navigator, "oscpu", { get: () => "Windows NT 10.0; Win64; x64" });
        Object.defineProperty(navigator, "userAgent", {
          get: () =>
            "5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36",
        });
        Object.defineProperty(navigator, "vendor", { get: () => "Google Inc." });
        Object.defineProperty(navigator, "vendorSub", { get: () => "" });
      });
      console.log("evaluateOnNewDocument complete.");

      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36"
      );
      console.log("setUserAgent complete.");

      await page.goto(`https://www.facebook.com/${pageOrChannel}/videos`, { waitUntil: "domcontentloaded" });
      console.log("goto complete.");

      await page.waitForFunction('document.querySelector("body").innerText.includes("Videos")');
      console.log("waitForFunction complete.");

      const data = await page.evaluate(() => document.querySelector("*").outerHTML);
      console.log("evaluate complete.");

      const match = new RegExp(
        `https:\/\/www\.facebook\.com\/${pageOrChannel}\/videos\/[a-zA-Z0-9_-]+\/([0-9]+)\/`
      ).exec(data);

      let rawUrl;
      if (match && match.length >= 2) {
        rawUrl = match[0];
        url = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(match[0])}&show_text=false`;
      }

      const f = await page.$(`a[href='${rawUrl}']`);
      const text = await (await f?.getProperty("textContent"))?.jsonValue();
      isStreaming = text?.includes("LIVE") ?? false;

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
