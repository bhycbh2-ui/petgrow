import newsHandler from "./news.js";

export default async function handler(req, res) {
  // Keep scheduled collection off the public /api/news CDN cache path.
  // The public endpoint may be cached for readers, but the cron endpoint must
  // always execute the collector so recent page traffic cannot suppress a run.
  const setHeader = res.setHeader.bind(res);
  res.setHeader = (name, value) => {
    if (String(name).toLowerCase() === "cache-control") {
      return setHeader("Cache-Control", "no-store, max-age=0");
    }
    return setHeader(name, value);
  };
  setHeader("Cache-Control", "no-store, max-age=0");
  return newsHandler(req, res);
}
