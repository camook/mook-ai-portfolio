import { Hono } from "hono";
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

const CACHE_TTL = 60;

export const projectsPublicRouter = new Hono<AppEnv>()

  // GET /api/projects — published projects ordered by sort_order, each with images
  .get("/", async (c) => {
    const cache = (caches as unknown as { default: Cache }).default;
    const cacheKey = new Request(c.req.url);

    const cached = await cache.match(cacheKey);
    if (cached) return cached;

    const { results: projects } = await c.env.DB.prepare(
      "SELECT * FROM projects WHERE status = 'published' ORDER BY sort_order ASC, created_at ASC",
    ).all<D1Row>();

    const withImages = await Promise.all(
      projects.map(async (project) => {
        const { results: images } = await c.env.DB.prepare(
          "SELECT id, r2_key, alt_text, caption, sort_order FROM project_images WHERE project_id = ? ORDER BY sort_order ASC, created_at ASC",
        )
          .bind(project.id)
          .all<D1Row>();
        return { ...parseProject(project), images };
      }),
    );

    c.header("Cache-Control", `public, max-age=${CACHE_TTL}, s-maxage=${CACHE_TTL}`);
    const response = c.json(withImages);
    c.env.event.platform?.ctx.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  })

  // GET /api/projects/:slug — single published project with images
  .get("/:slug", async (c) => {
    const slug = c.req.param("slug");
    const cache = (caches as unknown as { default: Cache }).default;
    const cacheKey = new Request(c.req.url);

    const cached = await cache.match(cacheKey);
    if (cached) return cached;

    const project = await c.env.DB.prepare(
      "SELECT * FROM projects WHERE slug = ? AND status = 'published'",
    )
      .bind(slug)
      .first<D1Row>();
    if (!project) return c.json({ error: "Not found" }, 404);

    const { results: images } = await c.env.DB.prepare(
      "SELECT id, r2_key, alt_text, caption, sort_order FROM project_images WHERE project_id = ? ORDER BY sort_order ASC, created_at ASC",
    )
      .bind(project.id)
      .all<D1Row>();

    c.header("Cache-Control", `public, max-age=${CACHE_TTL}, s-maxage=${CACHE_TTL}`);
    const response = c.json({ ...parseProject(project), images });
    c.env.event.platform?.ctx.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  });
