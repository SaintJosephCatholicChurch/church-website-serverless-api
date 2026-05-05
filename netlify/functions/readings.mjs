import fetch from 'node-fetch';
import { generateResponse, logFunctionError } from './util/response.mjs';

export const handler = async (event) => {
  try {
    const response = await fetch('https://bible.usccb.org/readings.rss');
    if (!response.ok) {
      return generateResponse(event, 500, 'Failed to fetch readings');
    }

    return generateResponse(event, 200, await response.text());
  } catch (error) {
    logFunctionError('readings', event, error);
    return generateResponse(event, 500, 'Failed to fetch readings');
  }
};
