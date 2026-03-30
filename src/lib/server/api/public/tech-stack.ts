import { Hono } from "hono";
import type { AppEnv } from "../../app-env.js";

type TechStackRow = {
  id: string;
  name: string;
  category: "pill" | "runtime" | "infrastructure";
  percentage: number | null;
  qualifier: string | null;
  sort_order: number;
  status: string;
};

const CACHE_TTL = 60;

export const techStackPublicRouter = new Hono<AppEnv>()

  // GET /api/tech-stack — published items grouped by category
  .get("/", async (c) => {
    const cache = (caches as unknown as { default: Cache }).default;
    const cacheKey = new Request(c.req.url);

    const cached = await cache.match(cacheKey);
    if (cached) return cached;

    const { results } = await c.env.DB.prepare(
      "SELECT * FROM tech_stack WHERE status = 'published' ORDER BY category ASC, sort_order ASC",
    ).all<TechStackRow>();

    const grouped: Record<string, TechStackRow[]> = {};
    for (const item of results) {
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category].push(item);
    }

    c.header("Cache-Control", `public, max-age=${CACHE_TTL}, s-maxage=${CACHE_TTL}`);
    const response = c.json(grouped);
    c.env.event.platform?.ctx.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  });
