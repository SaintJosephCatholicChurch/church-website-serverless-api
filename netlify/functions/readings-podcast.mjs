import fetch from 'node-fetch';
import { format } from 'date-fns';
import { generateResponse } from './util/response.mjs';

function getLectionaryYear(date = new Date()) {
  const liturgicalYear = getLiturgicalYear(date);
  const cycle = liturgicalYear % 3;

  if (cycle === 1) {
    return 'year-a';
  }

  if (cycle === 2) {
    return 'year-b';
  }

  return 'year-c';
}

// Helper: Get Liturgical Year
function getLiturgicalYear(date = new Date()) {
  const year = date.getFullYear();
  const christmas = new Date(year, 11, 25);
  const adventSunday = getFirstAdventSunday(christmas);
  return date >= adventSunday ? year : year - 1;
}

// Helper: Find First Sunday of Advent
function getFirstAdventSunday(christmas) {
  const fourthSunday = new Date(christmas);
  fourthSunday.setDate(christmas.getDate() - 28);
  const dayOfWeek = fourthSunday.getDay();
  fourthSunday.setDate(fourthSunday.getDate() - dayOfWeek); // Back to Sunday
  return fourthSunday;
}

async function getPodcastUrlFromPage(event, date, page) {
  const podcastsResponse = await fetch(`https://bible.usccb.org/podcasts/audio?page=${page}`);
  if (!podcastsResponse.ok) {
    return generateResponse(event, 500, 'Failed to fetch podcasts list page');
  }

  const podcastPageText = await podcastsResponse.text();
  const podcastPageMatchWithYear = new RegExp(
    `<a href="(\/podcasts\/audio\/daily-mass-reading-podcast-${date}-${getLectionaryYear()}[a-zA-Z0-9_-]*)">`
  ).exec(podcastPageText);
  if (podcastPageMatchWithYear && podcastPageMatchWithYear.length === 2) {
    return podcastPageMatchWithYear[1];
  }

  const podcastPageMatch = new RegExp(
    `<a href="(\/podcasts\/audio\/daily-mass-reading-podcast-${date}[a-zA-Z0-9_-]*)">`
  ).exec(podcastPageText);
  if (!podcastPageMatch || podcastPageMatch.length !== 2) {
    return null;
  }

  return podcastPageMatch[1];
}

async function getPodcastUrl(event) {
  const date = format(new Date(), 'MMMM-d-yyyy').toLowerCase();
  const pagesToCheck = [0, 1, 2];

  for (const page of pagesToCheck) {
    const response = await getPodcastUrlFromPage(event, date, page);
    if (response) {
      return response;
    }
  }

  return generateResponse(event, 500, 'Failed to extract podcast page url');
}

export const handler = async (event) => {
  const podcastUrl = await getPodcastUrl(event);
  if (typeof podcastUrl !== 'string') {
    return podcastUrl;
  }

  const response = await fetch(`https://bible.usccb.org${podcastUrl}`);
  if (!response.ok) {
    return generateResponse(event, 500, 'Failed to fetch podcast page');
  }

  const text = await response.text();
  const match =
    /<iframe (?:[^>]+) (?:src=")(?:[^>]+url=)(https%3A\/\/api\.soundcloud\.com\/tracks[^&]+)(?:[^>]+)>/.exec(text);
  if (!match || match.length !== 2) {
    return generateResponse(event, 500, 'Failed to extract podcast soundcloud url');
  }

  return generateResponse(
    event,
    200,
    JSON.stringify({
      url: match[1],
    })
  );
};
