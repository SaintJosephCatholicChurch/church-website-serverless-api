import fetch from 'node-fetch';
import { format } from 'date-fns';

export const handler = async () => {
  const response = await fetch(
    `https://bible.usccb.org/podcasts/audio/daily-mass-reading-podcast-${format(
      new Date(),
      'MMMM-d-yyyy'
    ).toLowerCase()}`
  );
  if (!response.ok) {
    return {
      statusCode: 500,
      body: '',
      headers: {
        'access-control-allow-origin': 'https://www.stjosephchurchbluffton.org',
      },
    };
  }

  return {
    statusCode: 200,
    body: await response.text(),
    headers: {
      'access-control-allow-origin': 'https://www.stjosephchurchbluffton.org',
    },
  };
};
