import { Hono } from "hono";
import { ulid, parseJsonBody } from "../../utils.js";
import {
  ExperienceCreateSchema,
  ExperienceUpdateSchema,
  ReorderSchema,
} from "./schemas.js";
import type { AppEnv } from "../../app-env.js";

export const experienceAdminRouter = new Hono<AppEnv>()

  // GET /api/admin/experience — list all entries including drafts
  .get("/", async (c) => {
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM experience ORDER BY sort_order ASC, year DESC",
    ).all();
    return c.json(results);
  })

  // POST /api/admin/experience — create entry
  .post("/", async (c) => {
    const body = await parseJsonBody(c.req.raw);
    if (body === null) return c.json({ error: "Invalid JSON body" }, 400);

    const parsed = ExperienceCreateSchema.safeParse(body);
    if (!parsed.success)
      return c.json(
        { error: "Validation failed", issues: parsed.error.issues },
        422,
      );

    const d = parsed.data;
    const id = ulid();
    const now = new Date().toISOString();

    await c.env.DB.prepare(
      `INSERT INTO experience
        (id, year, year_label, role_title, company, description,
         achievement_label, achievement_text, sort_order, status,
         created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        id,
        d.year,
        d.year_label,
        d.role_title,
        d.company,
        d.description,
        d.achievement_label,
        d.achievement_text,
        d.sort_order,
        d.status,
        now,
        now,
      )
      .run();

    const entry = await c.env.DB.prepare(
      "SELECT * FROM experience WHERE id = ?",
    )
      .bind(id)
      .first();
    return c.json(entry, 201);
  })

  // PATCH /api/admin/experience/reorder — registered before /:id
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
    const now = new Date().toISOString();
    const statements = items.map(({ id, sort_order }) =>
      c.env.DB.prepare(
        "UPDATE experience SET sort_order = ?, updated_at = ? WHERE id = ?",
      ).bind(sort_order, now, id),
    );
    await c.env.DB.batch(statements);
    return c.json({ updated: items.length });
  })

  // PUT /api/admin/experience/:id — update entry
  .put("/:id", async (c) => {
    const id = c.req.param("id");
    const existing = await c.env.DB.prepare(
      "SELECT id FROM experience WHERE id = ?",
    )
      .bind(id)
      .first();
    if (!existing) return c.json({ error: "Not found" }, 404);

    const body = await parseJsonBody(c.req.raw);
    if (body === null) return c.json({ error: "Invalid JSON body" }, 400);

    const parsed = ExperienceUpdateSchema.safeParse(body);
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
      .concat("updated_at = ?")
      .join(", ");
    const values = [...Object.values(data), new Date().toISOString(), id];

    await c.env.DB.prepare(
      `UPDATE experience SET ${setClauses} WHERE id = ?`,
    )
      .bind(...values)
      .run();

    const updated = await c.env.DB.prepare(
      "SELECT * FROM experience WHERE id = ?",
    )
      .bind(id)
      .first();
    return c.json(updated);
  })

  // DELETE /api/admin/experience/:id — delete entry
  .delete("/:id", async (c) => {
    const id = c.req.param("id");
    const existing = await c.env.DB.prepare(
      "SELECT id FROM experience WHERE id = ?",
    )
      .bind(id)
      .first();
    if (!existing) return c.json({ error: "Not found" }, 404);

    await c.env.DB.prepare("DELETE FROM experience WHERE id = ?")
      .bind(id)
      .run();
    return new Response(null, { status: 204 });
  });
