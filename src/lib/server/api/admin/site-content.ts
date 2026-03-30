import { Hono } from "hono";
import { parseJsonBody } from "../../utils.js";
import { SiteContentUpsertSchema } from "./schemas.js";
import type { AppEnv } from "../../app-env.js";

export const siteContentAdminRouter = new Hono<AppEnv>()

  // GET /api/admin/site-content — all key/value pairs
  .get("/", async (c) => {
    const { results } = await c.env.DB.prepare(
      "SELECT key, value, updated_at FROM site_content ORDER BY key ASC",
    ).all<{ key: string; value: string; updated_at: string }>();

    const data = Object.fromEntries(results.map((r) => [r.key, r.value]));
    return c.json({ data, entries: results });
  })

  // PUT /api/admin/site-content/:key — upsert a single key/value
  .put("/:key", async (c) => {
    const key = c.req.param("key");

    const body = await parseJsonBody(c.req.raw);
    if (body === null) return c.json({ error: "Invalid JSON body" }, 400);

    const parsed = SiteContentUpsertSchema.safeParse(body);
    if (!parsed.success)
      return c.json(
        { error: "Validation failed", issues: parsed.error.issues },
        422,
      );

    const now = new Date().toISOString();
    await c.env.DB.prepare(
      `INSERT INTO site_content (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    )
      .bind(key, parsed.data.value, now)
      .run();

    return c.json({ key, value: parsed.data.value, updated_at: now });
  });
