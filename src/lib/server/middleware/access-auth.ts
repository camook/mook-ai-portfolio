import { createMiddleware } from "hono/factory";
import { jwtVerify, createRemoteJWKSet } from "jose";
import type { AdminUser } from "../../../app.js";

// Cache the JWKS fetcher across requests (keyed by team name)
const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function getJWKS(team: string) {
  if (!jwksCache.has(team)) {
    const url = new URL(
      `https://${team}.cloudflareaccess.com/cdn-cgi/access/certs`,
    );
    jwksCache.set(team, createRemoteJWKSet(url));
  }
  return jwksCache.get(team)!;
}

function extractToken(req: Request): string | undefined {
  // Header takes precedence (service tokens / programmatic access)
  const header = req.headers.get("Cf-Access-Jwt-Assertion");
  if (header) return header;

  // Browser sessions: Cloudflare sets CF_Authorization as an httpOnly cookie
  return req.headers
    .get("cookie")
    ?.split(";")
    .find((s) => s.trim().startsWith("CF_Authorization="))
    ?.split("=")
    .slice(1)
    .join("=");
}

export const accessAuth = createMiddleware<{
  Bindings: { ACCESS_AUD: string; ACCESS_TEAM: string; ENVIRONMENT: string };
  Variables: { user: AdminUser };
}>(async (c, next) => {
  if (c.env.ENVIRONMENT === "development") {
    c.set("user", { sub: "dev", email: "dev@localhost" });
    return next();
  }

  const token = extractToken(c.req.raw);
  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const { payload } = await jwtVerify(token, getJWKS(c.env.ACCESS_TEAM), {
      audience: c.env.ACCESS_AUD,
    });

    c.set("user", {
      sub: payload.sub ?? "",
      email: typeof payload["email"] === "string" ? payload["email"] : "",
    });

    return next();
  } catch {
    return c.json({ error: "Unauthorized" }, 401);
  }
});
