import chromium from '@sparticuz/chromium';
import { format } from 'date-fns';
import { mkdirSync, writeFileSync } from 'fs';
import { parse } from 'node-html-parser';
import 'dotenv/config';
import { join } from 'path';
import puppeteer from 'puppeteer-core';

const MAX_RETRIES = 3;
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36';
const READINGS_FEED_URL = 'https://bible.usccb.org/readings.rss';
const PODCAST_LIST_PAGE_COUNT = 3;

async function closeBrowser(browser) {
  if (!browser) {
    return;
  }

  const pages = await browser.pages();
  for (let i = 0; i < pages.length; i += 1) {
    await pages[i].close();
  }

  await Promise.race([browser.close(), browser.close(), browser.close()]);
}

async function launchBrowser() {
  return puppeteer.launch({
    args: [
      '--allow-running-insecure-content',
      '--autoplay-policy=user-gesture-required',
      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-breakpad',
      '--disable-client-side-phishing-detection',
      '--disable-component-update',
      '--disable-default-apps',
      '--disable-dev-shm-usage',
      '--disable-domain-reliability',
      '--disable-extensions',
      '--disable-features=AudioServiceOutOfProcess,IsolateOrigins,site-per-process',
      '--disable-gpu',
      '--disable-hang-monitor',
      '--disable-ipc-flooding-protection',
      '--disable-notifications',
      '--disable-popup-blocking',
      '--disable-print-preview',
      '--disable-prompt-on-repost',
      '--disable-renderer-backgrounding',
      '--disable-setuid-sandbox',
      '--disable-site-isolation-trials',
      '--disable-software-rasterize',
      '--disable-speech-api',
      '--disable-sync',
      '--disable-web-security',
      '--disk-cache-size=33554432',
      '--enable-features=SharedArrayBuffer',
      '--hide-scrollbars',
      '--ignore-gpu-blacklist',
      '--metrics-recording-only',
      '--mute-audio',
      '--no-default-browser-check',
      '--no-first-run',
      '--no-pings',
      '--no-sandbox',
      '--no-zygote',
      '--password-store=basic',
      '--single-process',
      '--use-gl=swiftshader',
      '--use-mock-keychain',
      `--user-agent=${USER_AGENT}`,
      '--window-size=1280,720',
    ],
    defaultViewport: {
      width: 1280,
      height: 720,
      deviceScaleFactor: 1,
      hasTouch: false,
      isLandscape: false,
      isMobile: false,
    },
    executablePath: process.env.CHROME_EXECUTABLE_PATH || (await chromium.executablePath()),
    headless: true,
    ignoreHTTPSErrors: true,
    timeout: 60000,
  });
}

async function preparePage(browser) {
  const page = await browser.newPage();

  await page.setRequestInterception(true);
  page.on('request', async (request) => {
    const requestType = request.resourceType();

    if (requestType === 'font' || requestType === 'image' || requestType === 'media') {
      return request.abort();
    }

    return request.continue();
  });

  await page.evaluateOnNewDocument((userAgent) => {
    Object.defineProperty(navigator, 'appCodeName', { get: () => 'Mozilla' });
    Object.defineProperty(navigator, 'appName', { get: () => 'Netscape' });
    Object.defineProperty(navigator, 'appVersion', { get: () => userAgent });
    Object.defineProperty(navigator, 'platform', { get: () => 'Win32' });
    Object.defineProperty(navigator, 'product', { get: () => 'Gecko' });
    Object.defineProperty(navigator, 'productSub', { get: () => '20030107' });
    Object.defineProperty(navigator, 'userAgent', { get: () => userAgent });
    Object.defineProperty(navigator, 'vendor', { get: () => 'Google Inc.' });
    Object.defineProperty(navigator, 'vendorSub', { get: () => '' });
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  }, USER_AGENT);

  await page.setUserAgent(USER_AGENT);
  return page;
}

async function warmUsccbSession(page) {
  await page.goto('https://bible.usccb.org/', {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });

  await page.waitForFunction(() => document.body && !document.body.innerText.includes('Checking connection'), {
    timeout: 60000,
  });
}

async function fetchTextThroughBrowser(page, url) {
  const result = await page.evaluate(async (targetUrl) => {
    const response = await fetch(targetUrl, { credentials: 'include' });
    return {
      body: await response.text(),
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      url: response.url,
    };
  }, url);

  if (!result.ok) {
    throw new Error(`Failed to fetch ${url} (${result.status} ${result.statusText})`);
  }

  return result.body;
}

function extractPodcastPath(listPageHtml, dateSlug) {
  const root = parse(listPageHtml);
  const basePath = `/podcasts/audio/daily-mass-reading-podcast-${dateSlug}`;
  const candidatePaths = root
    .querySelectorAll('a')
    .map((element) => element.getAttribute('href') ?? '')
    .filter(Boolean)
    .map((href) => new URL(href, 'https://bible.usccb.org').pathname);

  const exactMatch = candidatePaths.find((path) => path === basePath);
  if (exactMatch) {
    return exactMatch;
  }

  return candidatePaths.find((path) => path.startsWith(basePath)) ?? null;
}

function extractSoundcloudUrl(podcastPageHtml) {
  const match =
    /<iframe (?:[^>]+) (?:src=")(?:[^>]+url=)(https%3A\/\/api\.soundcloud\.com\/tracks[^&"]+)(?:[^>]+)>/.exec(
      podcastPageHtml,
    );

  return match?.[1] ?? '';
}

async function fetchPodcastData(page) {
  const dateSlug = format(new Date(), 'MMMM-d-yyyy').toLowerCase();

  for (let pageIndex = 0; pageIndex < PODCAST_LIST_PAGE_COUNT; pageIndex += 1) {
    const listPageHtml = await fetchTextThroughBrowser(
      page,
      `https://bible.usccb.org/podcasts/audio?_wrapper_format=html&page=${pageIndex}`,
    );
    const podcastPath = extractPodcastPath(listPageHtml, dateSlug);

    if (!podcastPath) {
      continue;
    }

    const podcastPageUrl = `https://bible.usccb.org${podcastPath}`;
    const podcastPageHtml = await fetchTextThroughBrowser(page, podcastPageUrl);
    const soundcloudUrl = extractSoundcloudUrl(podcastPageHtml);

    if (!soundcloudUrl) {
      throw new Error(`Failed to extract SoundCloud URL from ${podcastPageUrl}.`);
    }

    return {
      podcastPath,
      sourceUrl: podcastPageUrl,
      url: soundcloudUrl,
    };
  }

  throw new Error(`Failed to find podcast page for ${dateSlug}.`);
}

function writeDataFile(relativePath, value) {
  const workspacePath = process.env.GITHUB_WORKSPACE || process.cwd();
  const outputPath = join(workspacePath, relativePath);

  mkdirSync(join(workspacePath, 'netlify/functions/data'), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(value, null, 2)}\n`);
}

export const handler = async () => {
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    let browser;

    attempt += 1;

    try {
      console.log(`[attempt ${attempt}] Launching browser`);
      browser = await launchBrowser();
      const page = await preparePage(browser);

      console.log(`[attempt ${attempt}] Warming USCCB session`);
      await warmUsccbSession(page);

      console.log(`[attempt ${attempt}] Fetching readings feed`);
      const readingsBody = await fetchTextThroughBrowser(page, READINGS_FEED_URL);

      console.log(`[attempt ${attempt}] Fetching podcast data`);
      const podcastData = await fetchPodcastData(page);
      const fetchedAt = new Date().toISOString();

      writeDataFile('netlify/functions/data/readings.json', {
        body: readingsBody,
        fetchedAt,
        sourceUrl: READINGS_FEED_URL,
      });
      writeDataFile('netlify/functions/data/readings-podcast.json', {
        fetchedAt,
        podcastPath: podcastData.podcastPath,
        sourceUrl: podcastData.sourceUrl,
        url: podcastData.url,
      });

      await closeBrowser(browser);
      console.log(`[attempt ${attempt}] Wrote readings data successfully`);
      return;
    } catch (error) {
      console.error(`[attempt ${attempt}] Failed to refresh readings data`, error);
      await closeBrowser(browser);
    }
  }

  throw new Error('Failed to refresh readings data.');
};

handler();
