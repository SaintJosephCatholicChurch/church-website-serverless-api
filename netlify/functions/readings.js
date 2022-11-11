export const handler = async () => {
  const response = await fetch("https://bible.usccb.org/readings.rss");
  if (!response.ok) {
    return {
      statusCode: 500,
      body: "",
    };
  }

  return {
    statusCode: 200,
    body: await response.text(),
  };
};
