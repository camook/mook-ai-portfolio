import { Hono } from "hono";
import { ulid, parseJsonBody } from "../../utils.js";
import { StatsCreateSchema, StatsUpdateSchema, ReorderSchema } from "./schemas.js";
import type { AppEnv } from "../../app-env.js";

export const statsAdminRouter = new Hono<AppEnv>()

  // GET /api/admin/stats
  .get("/", async (c) => {
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM stats ORDER BY section ASC, sort_order ASC",
    ).all();
    return c.json(results);
  })

  // POST /api/admin/stats
  .post("/", async (c) => {
    const body = await parseJsonBody(c.req.raw);
    if (body === null) return c.json({ error: "Invalid JSON body" }, 400);

    const parsed = StatsCreateSchema.safeParse(body);
    if (!parsed.success)
      return c.json(
        { error: "Validation failed", issues: parsed.error.issues },
        422,
      );

    const d = parsed.data;
    const id = ulid();

    await c.env.DB.prepare(
      `INSERT INTO stats (id, section, label, value, unit, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
      .bind(id, d.section, d.label, d.value, d.unit, d.sort_order)
      .run();

    const stat = await c.env.DB.prepare("SELECT * FROM stats WHERE id = ?")
      .bind(id)
      .first();
    return c.json(stat, 201);
  })

  // PATCH /api/admin/stats/reorder — before /:id
  .patch("/reorder", async (c) => {
    const body = await parseJsonBody(c.req.raw);
    if (body === null) return c.json({ error: "Invalid JSON body" }, 400);

    const parsed = ReorderSchema.safeParse(body);
    if (!parsed.success)
      return c.json(
        { error: "Validation failed", issues: parsed.error.issues },
        422,
      );

    const { items } = parsed.data;
    const statements = items.map(({ id, sort_order }) =>
      c.env.DB.prepare(
        "UPDATE stats SET sort_order = ? WHERE id = ?",
      ).bind(sort_order, id),
    );
    await c.env.DB.batch(statements);
    return c.json({ updated: items.length });
  })

  // PUT /api/admin/stats/:id
  .put("/:id", async (c) => {
    const id = c.req.param("id");
    const existing = await c.env.DB.prepare(
      "SELECT id FROM stats WHERE id = ?",
    )
      .bind(id)
      .first();
    if (!existing) return c.json({ error: "Not found" }, 404);

    const body = await parseJsonBody(c.req.raw);
    if (body === null) return c.json({ error: "Invalid JSON body" }, 400);

    const parsed = StatsUpdateSchema.safeParse(body);
    if (!parsed.success)
      return c.json(
        { error: "Validation failed", issues: parsed.error.issues },
        422,
      );

    const data = parsed.data;
    if (Object.keys(data).length === 0)
      return c.json({ error: "No fields to update" }, 422);

    const setClauses = Object.keys(data)
      .map((k) => `${k} = ?`)
      .join(", ");
    const values = [...Object.values(data), id];

    await c.env.DB.prepare(`UPDATE stats SET ${setClauses} WHERE id = ?`)
      .bind(...values)
      .run();

    const updated = await c.env.DB.prepare("SELECT * FROM stats WHERE id = ?")
      .bind(id)
      .first();
    return c.json(updated);
  })

  // DELETE /api/admin/stats/:id
  .delete("/:id", async (c) => {
    const id = c.req.param("id");
    const existing = await c.env.DB.prepare(
      "SELECT id FROM stats WHERE id = ?",
    )
      .bind(id)
      .first();
    if (!existing) return c.json({ error: "Not found" }, 404);

    await c.env.DB.prepare("DELETE FROM stats WHERE id = ?").bind(id).run();
    return new Response(null, { status: 204 });
  });
