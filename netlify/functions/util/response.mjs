export function generateAccessControlAllowOrigin(event) {
  const origin = event.headers['origin'] ?? '';
  if (/https:\/\/[a-z]+\.stjosephchurchbluffton\.org/i.test(origin)) {
    return origin;
  }

  return 'https://www.stjosephchurchbluffton.org';
}

export function generateResponse(event, statusCode, body, headers = {}) {
  return {
    statusCode,
    body,
    headers: {
      'access-control-allow-origin': generateAccessControlAllowOrigin(event),
      'access-control-allow-methods': 'GET, POST, OPTIONS',
      'access-control-allow-headers': 'Content-Type',
      ...headers,
    },
  };
}

export function generateJsonResponse(event, statusCode, body, headers = {}) {
  return generateResponse(event, statusCode, JSON.stringify(body), {
    'content-type': 'application/json; charset=utf-8',
    ...headers,
  });
}
