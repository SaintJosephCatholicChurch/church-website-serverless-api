import type { HandlerEvent } from '@netlify/functions';

export function generateAccessControlAllowOrigin(event: HandlerEvent) {
  const origin = event.headers['origin'] ?? '';
  if (/https:\/\/[a-z]+\.stjosephchurchbluffton\.org/i.test(origin)) {
    return origin;
  }

  return 'https://www.stjosephchurchbluffton.org';
}

export function generateResponse(event: HandlerEvent, statusCode: number, body: any) {
  return {
    statusCode,
    body,
    headers: {
      'access-control-allow-origin': generateAccessControlAllowOrigin(event),
    },
  };
}
