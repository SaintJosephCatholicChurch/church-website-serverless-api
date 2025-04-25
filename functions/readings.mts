import type { Handler } from '@netlify/functions';
import fetch from 'node-fetch';
import { generateResponse } from './util/response.mjs';

export const handler: Handler = async (event) => {
  const response = await fetch('https://bible.usccb.org/readings.rss');
  if (!response.ok) {
    return generateResponse(event, 500, 'Failed to fetch readings');
  }

  return generateResponse(event, 200, await response.text());
};
