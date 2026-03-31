import { Hono } from "hono";
import type { AppEnv } from "../../app-env.js";

export const contactAdminRouter = new Hono<AppEnv>()

  // GET /api/admin/contact — list all submissions newest first
  .get("/", async (c) => {
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM contact_submissions ORDER BY created_at DESC",
    ).all();
    return c.json(results);
  })

  // PATCH /api/admin/contact/:id — set read status { read: 0 | 1 }
  .patch("/:id", async (c) => {
    const id = c.req.param("id");
    const existing = await c.env.DB.prepare(
      "SELECT id FROM contact_submissions WHERE id = ?",
    )
      .bind(id)
      .first();
    if (!existing) return c.json({ error: "Not found" }, 404);

    const body = await c.req.json().catch(() => null);
    if (body === null || typeof (body as Record<string, unknown>).read === "undefined")
      return c.json({ error: "Missing field: read" }, 400);

    const read = (body as Record<string, unknown>).read ? 1 : 0;
    await c.env.DB.prepare(
      "UPDATE contact_submissions SET read = ? WHERE id = ?",
    )
      .bind(read, id)
      .run();

    const updated = await c.env.DB.prepare(
      "SELECT * FROM contact_submissions WHERE id = ?",
    )
      .bind(id)
      .first();
    return c.json(updated);
  })

  // DELETE /api/admin/contact/:id
  .delete("/:id", async (c) => {
    const id = c.req.param("id");
    const existing = await c.env.DB.prepare(
      "SELECT id FROM contact_submissions WHERE id = ?",
    )
      .bind(id)
      .first();
    if (!existing) return c.json({ error: "Not found" }, 404);

    await c.env.DB.prepare("DELETE FROM contact_submissions WHERE id = ?")
      .bind(id)
      .run();
    return new Response(null, { status: 204 });
  });
