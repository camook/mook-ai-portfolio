import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { accessAuth } from "./middleware/access-auth.js";
import { onError } from "./middleware/error-handler.js";
import { projectsAdminRouter } from "./api/admin/projects.js";
import { experienceAdminRouter } from "./api/admin/experience.js";
import { techStackAdminRouter } from "./api/admin/tech-stack.js";
import { siteContentAdminRouter } from "./api/admin/site-content.js";
import { statsAdminRouter } from "./api/admin/stats.js";
import { contactAdminRouter } from "./api/admin/contact.js";
import { projectsPublicRouter } from "./api/public/projects.js";
import { experiencePublicRouter } from "./api/public/experience.js";
import { techStackPublicRouter } from "./api/public/tech-stack.js";
import { contentPublicRouter } from "./api/public/content.js";
import { statsPublicRouter } from "./api/public/stats.js";
import { imagesPublicRouter } from "./api/public/images.js";
import { contactPublicRouter } from "./api/public/contact.js";
import type { AppEnv } from "./app-env.js";

export type { AppEnv };

// Admin API sub-router — all paths are relative to the /api/admin mount point
const apiAdmin = new Hono<AppEnv>()
  .route("/projects", projectsAdminRouter)
  .route("/experience", experienceAdminRouter)
  .route("/tech-stack", techStackAdminRouter)
  .route("/site-content", siteContentAdminRouter)
  .route("/stats", statsAdminRouter)
  .route("/contact", contactAdminRouter);

// API sub-router — all paths are relative to the /api mount point
const api = new Hono<AppEnv>()
  .get("/status", (c) => c.json({ status: "ok" }))
  .get("/health", (c) => c.json({ healthy: true }))
  // Public read-only endpoints
  .route("/projects", projectsPublicRouter)
  .route("/experience", experiencePublicRouter)
  .route("/tech-stack", techStackPublicRouter)
  .route("/content", contentPublicRouter)
  .route("/stats", statsPublicRouter)
  .route("/images", imagesPublicRouter)
  .route("/contact", contactPublicRouter)
  // /api/admin and /api/admin/* — protected by Cloudflare Access JWT
  .use("/admin", accessAuth)
  .use("/admin/*", accessAuth)
  .route("/admin", apiAdmin);

// Root router — Hono is the single routing authority
export const router = new Hono<AppEnv>().onError(onError)
  .use("/api/*", logger())
  .use("/api/*", cors())
  .route("/api", api)
  // /admin and /admin/* — protected by Cloudflare Access JWT (SvelteKit SSR pages)
  .use("/admin", accessAuth)
  .use("/admin/*", accessAuth)
  // Catch-all: delegate to SvelteKit SSR, forwarding user identity to locals
  .all("*", (c) => {
    c.env.event.locals.user = c.var.user ?? null;
    return c.env.resolve(c.env.event);
  });
