import { Hono } from "hono";
import type { AppEnv } from "../../app-env.js";

// Images are content-addressed by R2 key — safe to cache for a long time
const CACHE_TTL = 31536000; // 1 year

const VALID_FIT     = ["scale-down", "contain", "cover", "crop", "pad"] as const;
const VALID_FORMAT  = ["webp", "avif", "jpeg", "png"] as const;

type ValidFit    = (typeof VALID_FIT)[number];
type ValidFormat = (typeof VALID_FORMAT)[number];

function parseDimension(v: string | undefined): number | undefined {
  if (!v) return undefined;
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 && n <= 4096 ? n : undefined;
}

export const imagesPublicRouter = new Hono<AppEnv>()

  // GET /api/images/* — proxy R2 object with optional Cloudflare Image Resizing
  // Accepts: ?w=N  ?h=N  ?fit=cover  ?format=webp|avif|jpeg|png  ?q=N
  // r2Key may contain slashes (e.g. projects/{projectId}/{imageId}.jpg)
  .get("/*", async (c) => {
    const r2Key = c.req.param("*");
    if (!r2Key) return c.json({ error: "Not found" }, 404);

    // Parse optional resize params
    const w   = parseDimension(c.req.query("w"));
    const h   = parseDimension(c.req.query("h"));
    const rawFit    = c.req.query("fit") as ValidFit | undefined;
    const fit: ValidFit | undefined = VALID_FIT.includes(rawFit as ValidFit) ? rawFit : undefined;
    const rawFormat = c.req.query("format") as ValidFormat | undefined;
    const format: ValidFormat | undefined = VALID_FORMAT.includes(rawFormat as ValidFormat) ? rawFormat : undefined;
    const rawQ = parseInt(c.req.query("q") ?? "", 10);
    const quality = Number.isFinite(rawQ) && rawQ >= 1 && rawQ <= 100 ? rawQ : undefined;

    const wantsResize = w != null || h != null || fit != null || format != null || quality != null;

    // Cache key includes resize params so variants are cached independently
    const cache    = (caches as unknown as { default: Cache }).default;
    const cacheKey = new Request(c.req.url);

    const cached = await cache.match(cacheKey);
    if (cached) return cached;

    const object = await c.env.BUCKET.get(r2Key);
    if (!object) return c.json({ error: "Not found" }, 404);

    const etag        = object.httpEtag;
    const ifNoneMatch = c.req.header("If-None-Match");
    if (ifNoneMatch && ifNoneMatch === etag) {
      return new Response(null, { status: 304, headers: { ETag: etag } });
    }

    const baseHeaders = new Headers();
    object.writeHttpMetadata(baseHeaders);
    baseHeaders.set("ETag", etag);
    baseHeaders.set("Cache-Control", `public, max-age=${CACHE_TTL}, immutable`);

    // If resize params were supplied, attempt Cloudflare Image Resizing via a
    // subrequest back through the Cloudflare network.  This requires the Image
    // Resizing feature to be enabled on the zone (all paid plans).
    // The subrequest uses the plain image URL (no resize params) to avoid loops.
    if (wantsResize) {
      try {
        const origin   = new URL(c.req.url).origin;
        const plainUrl = `${origin}/api/images/${r2Key}`;
        const resizedResp = await fetch(plainUrl, {
          cf: {
            image: {
              ...(w      != null ? { width:   w }      : {}),
              ...(h      != null ? { height:  h }      : {}),
              ...(fit    != null ? { fit }              : {}),
              ...(format != null ? { format }           : {}),
              ...(quality != null ? { quality }         : {}),
            },
          },
        });

        if (resizedResp.ok) {
          const resizedHeaders = new Headers(resizedResp.headers);
          resizedHeaders.set("Cache-Control", `public, max-age=${CACHE_TTL}, immutable`);
          const response = new Response(resizedResp.body, { headers: resizedHeaders });
          c.env.event.platform?.ctx.waitUntil(cache.put(cacheKey, response.clone()));
          return response;
        }
        // Fall through to serving original if resizing failed
      } catch {
        // Image Resizing not available on this zone — serve original
      }
    }

    const response = new Response(object.body, { headers: baseHeaders });
    c.env.event.platform?.ctx.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  });
