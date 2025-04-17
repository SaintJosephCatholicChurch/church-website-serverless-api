import fetch from 'node-fetch';
import { format } from 'date-fns';

export const handler = async () => {
  const podcastsResponse = await fetch(`https://bible.usccb.org/podcasts/audio`);
  if (!podcastsResponse.ok) {
    return {
      statusCode: 500,
      body: 'Failed to fetch podcasts list page',
      headers: {
        'access-control-allow-origin': 'https://www.stjosephchurchbluffton.org',
      },
    };
  }

  const podcastPageText = await podcastsResponse.text();
  const podcastPageMatch = new RegExp(
    `<a href="(\/podcasts\/audio\/daily-mass-reading-podcast-${format(
      new Date(),
      'MMMM-d-yyyy'
    ).toLowerCase()}[a-zA-Z0-9_-]+)">`
  ).exec(podcastPageText);
  if (!podcastPageMatch || podcastPageMatch.length !== 2) {
    return {
      statusCode: 500,
      body: 'Failed to extract podcast page url',
      headers: {
        'access-control-allow-origin': 'https://www.stjosephchurchbluffton.org',
      },
    };
  }

  const response = await fetch(`https://bible.usccb.org${podcastPageMatch[1]}`);
  if (!response.ok) {
    return {
      statusCode: 500,
      body: 'Failed to fetch podcast page',
      headers: {
        'access-control-allow-origin': 'https://www.stjosephchurchbluffton.org',
      },
    };
  }

  const text = await response.text();
  const match =
    /<iframe (?:[^>]+) (?:src=")(?:[^>]+url=)(https%3A\/\/api\.soundcloud\.com\/tracks[^&]+)(?:[^>]+)>/.exec(text);
  if (!match || match.length !== 2) {
    return {
      statusCode: 500,
      body: 'Failed to extract podcast soundcloud url',
      headers: {
        'access-control-allow-origin': 'https://www.stjosephchurchbluffton.org',
      },
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      url: match[1],
    }),
    headers: {
      'access-control-allow-origin': 'https://www.stjosephchurchbluffton.org',
    },
  };
};
