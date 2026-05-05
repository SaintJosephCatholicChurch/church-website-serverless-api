import fetch from 'node-fetch';
import { generateResponse, logFetchResponseError, logFunctionError } from './util/response.mjs';

export const handler = async (event) => {
  try {
    const response = await fetch('https://rss.flocknote.com/852042');
    if (!response.ok) {
      await logFetchResponseError('flocknotes', event, response, {
        upstreamRequestUrl: 'https://rss.flocknote.com/852042',
      });
      return generateResponse(event, 500, 'Failed to fetch flock notes');
    }

    return generateResponse(event, 200, await response.text());
  } catch (error) {
    logFunctionError('flocknotes', event, error);
    return generateResponse(event, 500, 'Failed to fetch flock notes');
  }
};
