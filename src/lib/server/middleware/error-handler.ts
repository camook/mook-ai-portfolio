import { HTTPException } from "hono/http-exception";
import type { Context } from "hono";
import type { AppEnv } from "../app-env.js";

/**
 * Global Hono error handler. Pass to `router.onError(onError)`.
 *
 * - HTTPException (thrown intentionally via `throw new HTTPException(...)`)
 *   → preserves status code and message.
 * - Everything else → 500 with a generic message; error is logged to console.
 */
export function onError(err: Error, c: Context<AppEnv>): Response {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }

  console.error(`[${c.req.method}] ${c.req.path}`, err);
  return c.json({ error: "Internal server error" }, 500);
}
