import { Hono } from "hono";
import { z } from "zod";
import { ulid } from "../../utils.js";
import type { AppEnv } from "../../app-env.js";

const ContactSchema = z.object({
  name:    z.string().min(1, "Name is required").max(200),
  email:   z.string().email("Invalid email address").max(300),
  message: z.string().min(10, "Message must be at least 10 characters").max(5000),
});

export const contactPublicRouter = new Hono<AppEnv>()

  // POST /api/contact — store a contact submission
  .post("/", async (c) => {
    const body = await c.req.json().catch(() => null);
    if (!body) return c.json({ error: "Invalid JSON" }, 400);

    const parsed = ContactSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => i.message);
      return c.json({ error: errors[0] }, 422);
    }

    const { name, email, message } = parsed.data;
    const id = ulid();

    await c.env.DB.prepare(
      `INSERT INTO contact_submissions (id, name, email, message) VALUES (?, ?, ?, ?)`,
    )
      .bind(id, name, email, message)
      .run();

    return c.json({ ok: true }, 201);
  });
