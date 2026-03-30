import { Hono } from "hono";
import { ulid, parseJsonBody } from "../../utils.js";
import {
  TechStackCreateSchema,
  TechStackUpdateSchema,
  ReorderSchema,
} from "./schemas.js";
import type { AppEnv } from "../../app-env.js";

export const techStackAdminRouter = new Hono<AppEnv>()

  // GET /api/admin/tech-stack
  .get("/", async (c) => {
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM tech_stack ORDER BY category ASC, sort_order ASC",
    ).all();
    return c.json(results);
  })

  // POST /api/admin/tech-stack
  .post("/", async (c) => {
    const body = await parseJsonBody(c.req.raw);
    if (body === null) return c.json({ error: "Invalid JSON body" }, 400);

    const parsed = TechStackCreateSchema.safeParse(body);
    if (!parsed.success)
      return c.json(
        { error: "Validation failed", issues: parsed.error.issues },
        422,
      );

    const d = parsed.data;
    const id = ulid();

    await c.env.DB.prepare(
      `INSERT INTO tech_stack (id, name, category, percentage, qualifier, sort_order, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(id, d.name, d.category, d.percentage, d.qualifier, d.sort_order, d.status)
      .run();

    const item = await c.env.DB.prepare(
      "SELECT * FROM tech_stack WHERE id = ?",
    )
      .bind(id)
      .first();
    return c.json(item, 201);
  })

  // PATCH /api/admin/tech-stack/reorder — before /:id
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
        "UPDATE tech_stack SET sort_order = ? WHERE id = ?",
      ).bind(sort_order, id),
    );
    await c.env.DB.batch(statements);
    return c.json({ updated: items.length });
  })

  // PUT /api/admin/tech-stack/:id
  .put("/:id", async (c) => {
    const id = c.req.param("id");
    const existing = await c.env.DB.prepare(
      "SELECT id FROM tech_stack WHERE id = ?",
    )
      .bind(id)
      .first();
    if (!existing) return c.json({ error: "Not found" }, 404);

    const body = await parseJsonBody(c.req.raw);
    if (body === null) return c.json({ error: "Invalid JSON body" }, 400);

    const parsed = TechStackUpdateSchema.safeParse(body);
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

    await c.env.DB.prepare(
      `UPDATE tech_stack SET ${setClauses} WHERE id = ?`,
    )
      .bind(...values)
      .run();

    const updated = await c.env.DB.prepare(
      "SELECT * FROM tech_stack WHERE id = ?",
    )
      .bind(id)
      .first();
    return c.json(updated);
  })

  // DELETE /api/admin/tech-stack/:id
  .delete("/:id", async (c) => {
    const id = c.req.param("id");
    const existing = await c.env.DB.prepare(
      "SELECT id FROM tech_stack WHERE id = ?",
    )
      .bind(id)
      .first();
    if (!existing) return c.json({ error: "Not found" }, 404);

    await c.env.DB.prepare("DELETE FROM tech_stack WHERE id = ?")
      .bind(id)
      .run();
    return new Response(null, { status: 204 });
  });
