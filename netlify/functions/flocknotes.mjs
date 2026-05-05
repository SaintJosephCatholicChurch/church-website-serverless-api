import fetch from 'node-fetch';
import { generateResponse, logFunctionError } from './util/response.mjs';

export const handler = async (event) => {
  try {
    const response = await fetch('https://rss.flocknote.com/852042');
    if (!response.ok) {
      return generateResponse(event, 500, 'Failed to fetch flock notes');
    }

    return generateResponse(event, 200, await response.text());
  } catch (error) {
    logFunctionError('flocknotes', event, error);
    return generateResponse(event, 500, 'Failed to fetch flock notes');
  }
};
