import fetch from 'node-fetch';

export const handler = async () => {
  const response = await fetch('https://bible.usccb.org/readings.rss');
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
