import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { writeFileSync } from "fs";
import "dotenv/config";
import { join } from "path";

const MAX_RETRIES = 3;

async function closeBrowser(browser) {
  const pages = await browser.pages();
  for (let i = 0; i < pages.length; i++) {
    await pages[i].close();
  }

  await Promise.race([browser.close(), browser.close(), browser.close()]);
}

export const handler = async () => {
  let attempt = 0;
  let success = false;

  let browser;

  while (!success && attempt < MAX_RETRIES) {
    attempt += 1;

    try {
      const completeStart = Date.now();

      let isStreaming = false;
      let url = "";

      let start = Date.now();
      browser = await puppeteer.launch({
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
          "--disable-software-rasterize",
          "--disk-cache-size=33554432",
          "--enable-features=SharedArrayBuffer",
          "--hide-scrollbars",
          "--mute-audio",
          "--no-default-browser-check",
          "--no-pings",
          "--no-sandbox",
          "--no-zygote",
          "--window-size=1280,720",
          "--single-process",
          "--disable-gpu",
          "--disable-dev-shm-usage",
          "--no-first-run",
          "--disable-background-networking",
          "--disable-background-timer-throttling",
          "--disable-backgrounding-occluded-windows",
          "--disable-breakpad",
          "--disable-client-side-phishing-detection",
          "--disable-default-apps",
          "--disable-extensions",
          "--disable-hang-monitor",
          "--disable-ipc-flooding-protection",
          "--disable-notifications",
          "--disable-offer-store-unmasked-wallet-cards",
          "--disable-popup-blocking",
          "--disable-prompt-on-repost",
          "--disable-renderer-backgrounding",
          "--disable-sync",
          "--ignore-gpu-blacklist",
          "--metrics-recording-only",
          "--password-store=basic",
          "--use-gl=swiftshader",
          "--use-mock-keychain",
          "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36",
        ],
        defaultViewport: {
          width: 1280,
          height: 720,
          deviceScaleFactor: 1,
          isMobile: false,
          isLandscape: false,
          hasTouch: false,
        },
        executablePath: process.env.PUPPETEER_EXEC_PATH, // set by docker container
        executablePath: process.env.CHROME_EXECUTABLE_PATH || (await chromium.executablePath()),
        headless: true,
        timeout: 60000,
        ignoreHTTPSErrors: true,
      });

      let end = Date.now();
      console.log(`[attempt ${attempt}][puppeteer.launch] Execution time: ${end - start} ms`);
      start = Date.now();

      const page = await browser.newPage();

      end = Date.now();
      console.log(`[attempt ${attempt}][newPage] Execution time: ${end - start} ms`);
      start = Date.now();

      await page.setRequestInterception(true);

      end = Date.now();
      console.log(`[attempt ${attempt}][setRequestInterception] Execution time: ${end - start} ms`);
      start = Date.now();

      page.on("request", async (request) => {
        const requestType = request.resourceType();

        if (requestType === "image" || requestType === "media") {
          return request.abort();
        }

        return request.continue();
      });

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

      end = Date.now();
      console.log(`[attempt ${attempt}][evaluateOnNewDocument] Execution time: ${end - start} ms`);
      start = Date.now();

      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36"
      );

      end = Date.now();
      console.log(`[attempt ${attempt}][setUserAgent] Execution time: ${end - start} ms`);
      start = Date.now();

      await page.goto(`https://www.facebook.com/stjosephchurchbluffton/videos`, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });

      end = Date.now();
      console.log(`[attempt ${attempt}][page.goto] Execution time: ${end - start} ms`);
      start = Date.now();

      await page.waitForFunction('document.querySelector("body").innerText.includes("Videos")');

      end = Date.now();
      console.log(`[attempt ${attempt}][page.waitForFunction] Execution time: ${end - start} ms`);
      start = Date.now();

      const result = await page.evaluate(async () => {
        let links = document.querySelectorAll("a");
        for (let link of links) {
          const match = new RegExp(
            `https:\/\/www\.facebook\.com\/stjosephchurchbluffton\/videos\/[a-zA-Z0-9_-]+\/([0-9]+)\/`
          ).exec(link.href);

          if (match && match.length >= 2) {
            return {
              rawUrl: match[0],
              url: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(match[0])}&show_text=false`,
            };
          }
        }
      });

      url = result?.url ?? "";

      const f = await page.$(`a[href='${result?.rawUrl ?? ""}']`);
      const text = await (await f?.getProperty("textContent"))?.jsonValue();
      isStreaming = text?.includes("LIVE") ?? false;

      end = Date.now();
      console.log(`[attempt ${attempt}][compute] Execution time: ${end - start} ms`);
      start = Date.now();

      await closeBrowser(browser);

      end = Date.now();
      console.log(`[attempt ${attempt}][closeBrowser] Execution time: ${end - start} ms`);
      start = Date.now();

      if (url && url !== "") {
        console.log("[attempt ${attempt}][writing data]", { isStreaming, url });
        writeFileSync(
          join(process.env.GITHUB_WORKSPACE, "netlify/functions/data/live.json"),
          JSON.stringify({ isStreaming, url }, null, 2)
        );

        end = Date.now();
        console.log(`[attempt ${attempt}][writeFileSync] Execution time: ${end - start} ms`);
        start = Date.now();
      } else {
        console.log("skipping writing data, url not set");
      }

      const completeEnd = Date.now();
      console.log(`[attempt ${attempt}][END] Execution time: ${completeEnd - completeStart} ms`);

      success = true;
    } catch (e) {
      console.log("Error while processing...", e);
      await closeBrowser(browser);
      browser = null;
    }
  }

  if (!success) {
    throw new Error('Failed to retrieve live stream url.')
  }
};

handler();
