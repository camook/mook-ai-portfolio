import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type { RequestEvent, ResolveOptions } from "@sveltejs/kit";
import type { Env } from "../../app.js";

type SvelteKitBindings = {
  event: RequestEvent;
  resolve: (
    event: RequestEvent,
    opts?: ResolveOptions,
  ) => Promise<Response>;
};

export type AppEnv = {
  // Cloudflare bindings (DB, BUCKET, ASSETS) + SvelteKit resolve glue
  Bindings: Env & SvelteKitBindings;
};

// API sub-router — all paths are relative to the /api mount point
const api = new Hono<AppEnv>()
  .get("/status", (c) => c.json({ status: "ok" }))
  .get("/health", (c) => c.json({ healthy: true }));

// Root router — Hono is the single routing authority
export const router = new Hono<AppEnv>()
  .use("/api/*", logger())
  .use("/api/*", cors())
  .route("/api", api)
  // Catch-all: delegate to SvelteKit SSR
  .all("*", (c) => c.env.resolve(c.env.event));
