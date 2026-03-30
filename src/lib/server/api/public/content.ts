import { Hono } from "hono";
import type { AppEnv } from "../../app-env.js";

const CACHE_TTL = 60;

export const contentPublicRouter = new Hono<AppEnv>()

  // GET /api/content — all site content as a key/value map
  .get("/", async (c) => {
    const cache = (caches as unknown as { default: Cache }).default;
    const cacheKey = new Request(c.req.url);

    const cached = await cache.match(cacheKey);
    if (cached) return cached;

    const { results } = await c.env.DB.prepare(
      "SELECT key, value FROM site_content ORDER BY key ASC",
    ).all<{ key: string; value: string }>();

    const data = Object.fromEntries(results.map((r) => [r.key, r.value]));

    c.header("Cache-Control", `public, max-age=${CACHE_TTL}, s-maxage=${CACHE_TTL}`);
    const response = c.json(data);
    c.env.event.platform?.ctx.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  });
