import { Hono } from "hono";
import type { AppEnv } from "../../app-env.js";

type StatRow = {
  id: string;
  section: "hero" | "tech_stack";
  label: string;
  value: string;
  unit: string;
  sort_order: number;
};

const CACHE_TTL = 60;

export const statsPublicRouter = new Hono<AppEnv>()

  // GET /api/stats — all stats grouped by section
  .get("/", async (c) => {
    const cache = (caches as unknown as { default: Cache }).default;
    const cacheKey = new Request(c.req.url);

    const cached = await cache.match(cacheKey);
    if (cached) return cached;

    const { results } = await c.env.DB.prepare(
      "SELECT * FROM stats ORDER BY section ASC, sort_order ASC",
    ).all<StatRow>();

    const grouped: Record<string, StatRow[]> = {};
    for (const stat of results) {
      if (!grouped[stat.section]) grouped[stat.section] = [];
      grouped[stat.section].push(stat);
    }

    c.header("Cache-Control", `public, max-age=${CACHE_TTL}, s-maxage=${CACHE_TTL}`);
    const response = c.json(grouped);
    c.env.event.platform?.ctx.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  });
