export const handler = async (event) => {
  const { url, isStreaming } = require(`./data/live.json`);

  return {
    statusCode: 200,
    body: JSON.stringify({ isStreaming: isStreaming ?? false, url: url ?? '' }),
    headers: {
      'access-control-allow-origin': 'https://www.stjosephchurchbluffton.org',
    },
  };
};
