import { Hono } from "hono";
import type { AppEnv } from "../../app-env.js";

const CACHE_TTL = 60;

export const experiencePublicRouter = new Hono<AppEnv>()

  // GET /api/experience — published entries ordered by sort_order
  .get("/", async (c) => {
    const cache = (caches as unknown as { default: Cache }).default;
    const cacheKey = new Request(c.req.url);

    const cached = await cache.match(cacheKey);
    if (cached) return cached;

    const { results } = await c.env.DB.prepare(
      "SELECT * FROM experience WHERE status = 'published' ORDER BY sort_order ASC, year DESC",
    ).all();

    c.header("Cache-Control", `public, max-age=${CACHE_TTL}, s-maxage=${CACHE_TTL}`);
    const response = c.json(results);
    c.env.event.platform?.ctx.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  });
