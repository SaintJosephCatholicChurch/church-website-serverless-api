import { generateResponse, logFunctionError } from './util/response.mjs';

export const handler = async (event) => {
  try {
    const { url, isStreaming } = require(`./data/live.json`);

    return generateResponse(event, 200, JSON.stringify({ isStreaming: isStreaming ?? false, url: url ?? '' }));
  } catch (error) {
    logFunctionError('live', event, error);
    return generateResponse(event, 500, JSON.stringify({ message: 'Failed to load live stream configuration.' }));
  }
};
