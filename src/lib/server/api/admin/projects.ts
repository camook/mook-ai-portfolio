import { Hono } from "hono";
import { ulid, parseJsonBody } from "../../utils.js";
import {
  ProjectCreateSchema,
  ProjectUpdateSchema,
  ImageUploadMetaSchema,
  ImageUpdateSchema,
  ReorderSchema,
} from "./schemas.js";
import type { AppEnv } from "../../app-env.js";

type D1Row = Record<string, unknown>;

function parseProject(row: D1Row): D1Row {
  return {
    ...row,
    category_tags: JSON.parse((row.category_tags as string) || "[]"),
    tech_stack: JSON.parse((row.tech_stack as string) || "[]"),
    featured: row.featured === 1 || row.featured === true,
  };
}

export const projectsAdminRouter = new Hono<AppEnv>()

  // GET /api/admin/projects — list all projects including drafts
  .get("/", async (c) => {
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM projects ORDER BY sort_order ASC, created_at ASC",
    ).all<D1Row>();
    return c.json(results.map(parseProject));
  })

  // POST /api/admin/projects — create project
  .post("/", async (c) => {
    const body = await parseJsonBody(c.req.raw);
    if (body === null) return c.json({ error: "Invalid JSON body" }, 400);

    const parsed = ProjectCreateSchema.safeParse(body);
    if (!parsed.success)
      return c.json(
        { error: "Validation failed", issues: parsed.error.issues },
        422,
      );

    const d = parsed.data;
    const id = ulid();
    const now = new Date().toISOString();

    try {
      await c.env.DB.prepare(
        `INSERT INTO projects
          (id, title, slug, category_tags, description, long_description,
           tech_stack, github_url, live_url, thumbnail_key, key_metric_label,
           key_metric_value, card_size, sort_order, status, featured,
           created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
        .bind(
          id,
          d.title,
          d.slug,
          JSON.stringify(d.category_tags),
          d.description,
          d.long_description,
          JSON.stringify(d.tech_stack),
          d.github_url,
          d.live_url,
          d.thumbnail_key,
          d.key_metric_label,
          d.key_metric_value,
          d.card_size,
          d.sort_order,
          d.status,
          d.featured ? 1 : 0,
          now,
          now,
        )
        .run();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("UNIQUE constraint failed: projects.slug"))
        return c.json({ error: "Slug already exists" }, 409);
      throw err;
    }

    const project = await c.env.DB.prepare(
      "SELECT * FROM projects WHERE id = ?",
    )
      .bind(id)
      .first<D1Row>();
    return c.json(parseProject(project!), 201);
  })

  // PATCH /api/admin/projects/reorder — registered before /:id
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
        "UPDATE projects SET sort_order = ?, updated_at = ? WHERE id = ?",
      ).bind(sort_order, now, id),
    );
    await c.env.DB.batch(statements);
    return c.json({ updated: items.length });
  })

  // GET /api/admin/projects/:id — single project with images
  .get("/:id", async (c) => {
    const id = c.req.param("id");
    const project = await c.env.DB.prepare(
      "SELECT * FROM projects WHERE id = ?",
    )
      .bind(id)
      .first<D1Row>();
    if (!project) return c.json({ error: "Not found" }, 404);

    const { results: images } = await c.env.DB.prepare(
      "SELECT * FROM project_images WHERE project_id = ? ORDER BY sort_order ASC, created_at ASC",
    )
      .bind(id)
      .all<D1Row>();

    return c.json({ ...parseProject(project), images });
  })

  // PUT /api/admin/projects/:id — update project fields
  .put("/:id", async (c) => {
    const id = c.req.param("id");
    const existing = await c.env.DB.prepare(
      "SELECT id FROM projects WHERE id = ?",
    )
      .bind(id)
      .first();
    if (!existing) return c.json({ error: "Not found" }, 404);

    const body = await parseJsonBody(c.req.raw);
    if (body === null) return c.json({ error: "Invalid JSON body" }, 400);

    const parsed = ProjectUpdateSchema.safeParse(body);
    if (!parsed.success)
      return c.json(
        { error: "Validation failed", issues: parsed.error.issues },
        422,
      );

    const data = parsed.data;
    if (Object.keys(data).length === 0)
      return c.json({ error: "No fields to update" }, 422);

    const serialized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (key === "category_tags" || key === "tech_stack") {
        serialized[key] = JSON.stringify(value);
      } else if (key === "featured") {
        serialized[key] = value ? 1 : 0;
      } else {
        serialized[key] = value;
      }
    }

    const setClauses = Object.keys(serialized)
      .map((k) => `${k} = ?`)
      .concat("updated_at = ?")
      .join(", ");
    const values = [...Object.values(serialized), new Date().toISOString(), id];

    try {
      await c.env.DB.prepare(
        `UPDATE projects SET ${setClauses} WHERE id = ?`,
      )
        .bind(...values)
        .run();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("UNIQUE constraint failed: projects.slug"))
        return c.json({ error: "Slug already exists" }, 409);
      throw err;
    }

    const updated = await c.env.DB.prepare(
      "SELECT * FROM projects WHERE id = ?",
    )
      .bind(id)
      .first<D1Row>();
    return c.json(parseProject(updated!));
  })

  // DELETE /api/admin/projects/:id — delete project + R2 images
  .delete("/:id", async (c) => {
    const id = c.req.param("id");
    const project = await c.env.DB.prepare(
      "SELECT thumbnail_key FROM projects WHERE id = ?",
    )
      .bind(id)
      .first<D1Row>();
    if (!project) return c.json({ error: "Not found" }, 404);

    const { results: images } = await c.env.DB.prepare(
      "SELECT r2_key FROM project_images WHERE project_id = ?",
    )
      .bind(id)
      .all<{ r2_key: string }>();

    const r2Keys = [
      ...images.map((img) => img.r2_key),
      project.thumbnail_key as string,
    ].filter(Boolean);

    await Promise.all(r2Keys.map((key) => c.env.BUCKET.delete(key)));
    await c.env.DB.prepare("DELETE FROM projects WHERE id = ?").bind(id).run();
    return new Response(null, { status: 204 });
  })

  // POST /api/admin/projects/:id/images — upload image to R2 + create record
  .post("/:id/images", async (c) => {
    const projectId = c.req.param("id");
    const project = await c.env.DB.prepare(
      "SELECT id FROM projects WHERE id = ?",
    )
      .bind(projectId)
      .first();
    if (!project) return c.json({ error: "Not found" }, 404);

    let formData: FormData;
    try {
      formData = await c.req.formData();
    } catch {
      return c.json({ error: "Expected multipart/form-data" }, 400);
    }

    const file = formData.get("file");
    if (!(file instanceof File))
      return c.json({ error: "Missing or invalid file field" }, 422);

    const sortOrderRaw = formData.get("sort_order");
    const meta = ImageUploadMetaSchema.safeParse({
      alt_text: formData.get("alt_text") ?? "",
      caption: formData.get("caption"),
      sort_order: sortOrderRaw !== null ? Number(sortOrderRaw) : 0,
    });
    if (!meta.success)
      return c.json(
        { error: "Validation failed", issues: meta.error.issues },
        422,
      );

    const imageId = ulid();
    const ext = (file.name.split(".").pop() ?? "bin").toLowerCase();
    const r2Key = `projects/${projectId}/${imageId}.${ext}`;

    await c.env.BUCKET.put(r2Key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type || "application/octet-stream" },
    });

    const now = new Date().toISOString();
    await c.env.DB.prepare(
      `INSERT INTO project_images (id, project_id, r2_key, alt_text, caption, sort_order, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        imageId,
        projectId,
        r2Key,
        meta.data.alt_text,
        meta.data.caption,
        meta.data.sort_order,
        now,
      )
      .run();

    const image = await c.env.DB.prepare(
      "SELECT * FROM project_images WHERE id = ?",
    )
      .bind(imageId)
      .first<D1Row>();
    return c.json(image, 201);
  })

  // PATCH /api/admin/projects/:id/images/reorder
  .patch("/:id/images/reorder", async (c) => {
    const projectId = c.req.param("id");
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
        "UPDATE project_images SET sort_order = ? WHERE id = ? AND project_id = ?",
      ).bind(sort_order, id, projectId),
    );
    await c.env.DB.batch(statements);
    return c.json({ updated: items.length });
  })

  // PATCH /api/admin/projects/:id/images/:imageId — update alt_text / caption
  .patch("/:id/images/:imageId", async (c) => {
    const projectId = c.req.param("id");
    const imageId = c.req.param("imageId");

    const existing = await c.env.DB.prepare(
      "SELECT id FROM project_images WHERE id = ? AND project_id = ?",
    )
      .bind(imageId, projectId)
      .first();
    if (!existing) return c.json({ error: "Not found" }, 404);

    const body = await parseJsonBody(c.req.raw);
    if (body === null) return c.json({ error: "Invalid JSON body" }, 400);

    const parsed = ImageUpdateSchema.safeParse(body);
    if (!parsed.success)
      return c.json(
        { error: "Validation failed", issues: parsed.error.issues },
        422,
      );

    const { alt_text, caption } = parsed.data;
    await c.env.DB.prepare(
      "UPDATE project_images SET alt_text = ?, caption = ? WHERE id = ?",
    )
      .bind(alt_text, caption, imageId)
      .run();

    const updated = await c.env.DB.prepare(
      "SELECT * FROM project_images WHERE id = ?",
    )
      .bind(imageId)
      .first();
    return c.json(updated);
  })

  // GET /api/admin/projects/:id/images/:imageId/blob — proxy R2 object to browser
  .get("/:id/images/:imageId/blob", async (c) => {
    const projectId = c.req.param("id");
    const imageId = c.req.param("imageId");

    const image = await c.env.DB.prepare(
      "SELECT r2_key FROM project_images WHERE id = ? AND project_id = ?",
    )
      .bind(imageId, projectId)
      .first<{ r2_key: string }>();
    if (!image) return c.json({ error: "Not found" }, 404);

    const object = await c.env.BUCKET.get(image.r2_key);
    if (!object) return c.json({ error: "Not in storage" }, 404);

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("Cache-Control", "private, max-age=3600");

    return new Response(object.body, { headers });
  })

  // DELETE /api/admin/projects/:id/images/:imageId
  .delete("/:id/images/:imageId", async (c) => {
    const projectId = c.req.param("id");
    const imageId = c.req.param("imageId");

    const image = await c.env.DB.prepare(
      "SELECT r2_key FROM project_images WHERE id = ? AND project_id = ?",
    )
      .bind(imageId, projectId)
      .first<{ r2_key: string }>();
    if (!image) return c.json({ error: "Not found" }, 404);

    await c.env.BUCKET.delete(image.r2_key);
    await c.env.DB.prepare("DELETE FROM project_images WHERE id = ?")
      .bind(imageId)
      .run();
    return new Response(null, { status: 204 });
  });
