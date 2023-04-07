import fetch from "node-fetch";
import { parse } from "node-html-parser";
import { XMLParser } from 'fast-xml-parser';

export const handler = async (event) => {
  const channel = event.path.replace('/.netlify/functions/live/', '');

  let isStreaming = false;
  let url = "";
  try {
    const response = await fetch(
      `https://youtube.com/channel/${channel}/live`
    );
    const text = await response.text();
    const html = parse(text);
    const canonicalURLTag = html.querySelector("link[rel=canonical]");
    const canonicalURL = canonicalURLTag.getAttribute("href");
    isStreaming = canonicalURL.includes("/watch?v=");

    if (isStreaming) {
      url = canonicalURL;
    } else {
      const response2 = await fetch(
        `https://www.youtube.com/feeds/videos.xml?channel_id=${channel}&orderby=published`
      );
      const parser = new XMLParser();
      let jObj = parser.parse(await response2.text());
      url = `https://www.youtube.com/watch?v=${jObj.feed.entry[0]["yt:videoId"]}`;
    }
  } catch (e) {
    console.error(e);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ isStreaming, url, channel }),
    headers: {
      "access-control-allow-origin": "https://www.stjosephchurchbluffton.org",
    },
  };
};
