import { generateResponse, logFunctionError } from './util/response.mjs';

export const handler = async (event) => {
  try {
    const storedData = require('./data/readings.json');
    if (typeof storedData.body !== 'string' || storedData.body.trim() === '') {
      throw new Error('Stored readings feed is empty.');
    }

    return generateResponse(event, 200, storedData.body);
  } catch (error) {
    logFunctionError('readings', event, error);
    return generateResponse(event, 500, 'Failed to load readings');
  }
};
