/// <reference types="@sveltejs/kit" />
/// <reference types="@cloudflare/workers-types" />

// User identity extracted from a validated Cloudflare Access JWT
interface AdminUser {
  /** Cloudflare identity UUID */
  sub: string;
  /** User's email address */
  email: string;
}

declare global {
  namespace App {
    interface Locals {
      /** Set by accessAuth middleware for /admin routes; null on public pages */
      user: AdminUser | null;
    }
    interface Platform {
      env: Env;
      ctx: ExecutionContext;
      cf?: CfProperties;
      caches: CacheStorage;
    }
  }
}

// Cloudflare Workers bindings — mirrors wrangler.jsonc
interface Env {
  // D1
  DB: D1Database;
  // R2
  BUCKET: R2Bucket;
  // Static assets
  ASSETS: Fetcher;
  // Cloudflare Access
  ACCESS_AUD: string;
  ACCESS_TEAM: string;
  // Runtime environment
  ENVIRONMENT: string;
}

export type { Env, AdminUser };
