/// <reference types="@sveltejs/kit" />
/// <reference types="@cloudflare/workers-types" />

declare global {
  namespace App {
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
}

export type { Env };
