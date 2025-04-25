import { generateResponse } from './util/response.mjs';

export const handler = async (event) => {
  const { url, isStreaming } = require(`./data/live.json`);

  return generateResponse(event, 200, JSON.stringify({ isStreaming: isStreaming ?? false, url: url ?? '' }));
};
