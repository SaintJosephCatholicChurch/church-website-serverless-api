import fetch from "node-fetch";

export const handler = async () => {
  let isStreaming = false;
  try {
    const response = await fetch(
      `https://youtube.com/channel/UCEbcH06ZOVz8GhA8fbRYusg/live`
    );
    const text = await response.text();
    const html = parse(text);
    const canonicalURLTag = html.querySelector("link[rel=canonical]");
    const canonicalURL = canonicalURLTag.getAttribute("href");
    isStreaming = canonicalURL.includes("/watch?v=");
  } catch (e) {
    console.error(e);
  }

  return {
    statusCode: 200,
    body: { isStreaming },
    headers: {
      "access-control-allow-origin": "https://www.stjosephchurchbluffton.org",
    },
  };
};
