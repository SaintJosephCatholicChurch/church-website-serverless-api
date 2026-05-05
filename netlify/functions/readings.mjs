import { readFileSync } from 'node:fs';
import { generateResponse, logFunctionError } from './util/response.mjs';

export const handler = async (event) => {
  try {
    const storedData = JSON.parse(readFileSync(new URL('./data/readings.json', import.meta.url), 'utf8'));
    if (typeof storedData.body !== 'string' || storedData.body.trim() === '') {
      throw new Error('Stored readings feed is empty.');
    }

    return generateResponse(event, 200, storedData.body);
  } catch (error) {
    logFunctionError('readings', event, error);
    return generateResponse(event, 500, 'Failed to load readings');
  }
};
