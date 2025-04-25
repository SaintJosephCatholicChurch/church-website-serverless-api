export function generateAccessControlAllowOrigin(event) {
  const origin = event.request.headers.get('origin');
  if (/https:\/\/[a-z]+\.stjosephchurchbluffton\.org/i.test(origin)) {
    return origin;
  }

  return 'https://www.stjosephchurchbluffton.org';
}

export function generateResponse(event, statusCode, body) {
  return {
    statusCode,
    body,
    headers: {
      'access-control-allow-origin': generateAccessControlAllowOrigin(event),
    },
  };
}
