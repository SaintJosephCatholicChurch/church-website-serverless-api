import fetch from 'node-fetch';
import { generateResponse, logFetchResponseError, logFunctionError } from './util/response.mjs';

export const handler = async (event) => {
  try {
    const response = await fetch('https://bible.usccb.org/readings.rss');
    if (!response.ok) {
      await logFetchResponseError('readings', event, response, {
        upstreamRequestUrl: 'https://bible.usccb.org/readings.rss',
      });
      return generateResponse(event, 500, 'Failed to fetch readings');
    }

    return generateResponse(event, 200, await response.text());
  } catch (error) {
    logFunctionError('readings', event, error);
    return generateResponse(event, 500, 'Failed to fetch readings');
  }
};
