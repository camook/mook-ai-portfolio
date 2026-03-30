import { Hono } from "hono";
import type { AppEnv } from "../../app-env.js";

// Images are content-addressed by R2 key — safe to cache for a long time
const CACHE_TTL = 31536000; // 1 year

export const imagesPublicRouter = new Hono<AppEnv>()

  // GET /api/images/* — proxy R2 object with caching headers
  // r2Key may contain slashes (e.g. projects/{projectId}/{imageId}.jpg)
  .get("/*", async (c) => {
    const r2Key = c.req.param("*");
    if (!r2Key) return c.json({ error: "Not found" }, 404);

    const cache = (caches as unknown as { default: Cache }).default;
    const cacheKey = new Request(c.req.url);

    const cached = await cache.match(cacheKey);
    if (cached) return cached;

    const object = await c.env.BUCKET.get(r2Key);
    if (!object) return c.json({ error: "Not found" }, 404);

    const etag = object.httpEtag;
    const ifNoneMatch = c.req.header("If-None-Match");
    if (ifNoneMatch && ifNoneMatch === etag) {
      return new Response(null, {
        status: 304,
        headers: { ETag: etag },
      });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("ETag", etag);
    headers.set("Cache-Control", `public, max-age=${CACHE_TTL}, immutable`);

    const response = new Response(object.body, { headers });
    c.env.event.platform?.ctx.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  });
