import { generateResponse, logFunctionError } from './util/response.mjs';

export const handler = async (event) => {
  try {
    const storedData = require('./data/readings-podcast.json');
    if (typeof storedData.url !== 'string' || storedData.url.trim() === '') {
      throw new Error('Stored readings podcast URL is empty.');
    }

    return generateResponse(
      event,
      200,
      JSON.stringify({
        url: storedData.url,
      }),
    );
  } catch (error) {
    logFunctionError('readings-podcast', event, error);
    return generateResponse(event, 500, 'Failed to load readings podcast');
  }
};
