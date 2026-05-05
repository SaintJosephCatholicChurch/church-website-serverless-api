const MAX_LOGGED_BODY_LENGTH = 500;

function getHeaderValue(headers, key) {
  if (!headers || typeof headers !== 'object') {
    return '';
  }

  const directValue = headers[key];
  if (typeof directValue === 'string') {
    return directValue;
  }

  const lowerCaseKey = key.toLowerCase();
  for (const [headerKey, headerValue] of Object.entries(headers)) {
    if (headerKey.toLowerCase() === lowerCaseKey && typeof headerValue === 'string') {
      return headerValue;
    }
  }

  return '';
}

function createRequestLogContext(event) {
  return {
    method: event?.httpMethod ?? '',
    path: event?.path ?? event?.rawUrl ?? '',
    requestId: getHeaderValue(event?.headers, 'x-nf-request-id') || event?.requestContext?.requestId || '',
    userAgent: getHeaderValue(event?.headers, 'user-agent'),
  };
}

function normalizeBodyForLog(body) {
  if (typeof body !== 'string') {
    return body;
  }

  return body.length > MAX_LOGGED_BODY_LENGTH ? `${body.slice(0, MAX_LOGGED_BODY_LENGTH)}...` : body;
}

function getHeadersForLog(headers) {
  if (!headers || typeof headers.entries !== 'function') {
    return {};
  }

  return Object.fromEntries(headers.entries());
}

export function generateAccessControlAllowOrigin(event) {
  const origin = getHeaderValue(event?.headers, 'origin');
  if (/https:\/\/[a-z]+\.stjosephchurchbluffton\.org/i.test(origin)) {
    return origin;
  }

  return 'https://www.stjosephchurchbluffton.org';
}

export function generateResponse(event, statusCode, body, headers = {}) {
  if (statusCode < 200 || statusCode >= 300) {
    const log = statusCode >= 500 ? console.error : console.warn;
    log('API response returned non-success status.', {
      ...createRequestLogContext(event),
      statusCode,
      responseBody: normalizeBodyForLog(body),
    });
  }

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

export function logFunctionError(functionName, event, error, details = {}) {
  console.error(`${functionName} failed.`, {
    ...createRequestLogContext(event),
    ...details,
    errorMessage: error instanceof Error ? error.message : String(error),
    errorStack: error instanceof Error ? error.stack : undefined,
  });
}

export async function logFetchResponseError(functionName, event, response, details = {}) {
  let responseBody = '';

  try {
    responseBody = normalizeBodyForLog(await response.text());
  } catch (error) {
    responseBody = `Unable to read upstream response body: ${error instanceof Error ? error.message : String(error)}`;
  }

  console.error(`${functionName} upstream fetch returned non-ok response.`, {
    ...createRequestLogContext(event),
    ...details,
    upstreamStatus: response.status,
    upstreamStatusText: response.statusText,
    upstreamUrl: response.url,
    upstreamHeaders: getHeadersForLog(response.headers),
    upstreamBody: responseBody,
  });
}
