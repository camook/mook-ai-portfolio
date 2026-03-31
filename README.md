# Mook·AI Portfolio

Edge AI Infrastructure Engineer portfolio — SvelteKit on Cloudflare Workers, D1, and R2.

## Stack

| Layer | Technology |
|---|---|
| Framework | SvelteKit 2 (Svelte 5 runes) |
| Runtime | Cloudflare Workers |
| Database | Cloudflare D1 (SQLite at the edge) |
| Storage | Cloudflare R2 (project images) |
| Router | Hono (all HTTP traffic, including SSR passthrough) |
| Styling | Tailwind CSS v4 (CSS-first config) |
| Auth | Cloudflare Access (admin routes) |
| Build | Vite + `@sveltejs/adapter-cloudflare` |

## Local development

```bash
# Install dependencies
pnpm install

# Full Workers dev server (bindings + D1 + R2 — required for any DB/storage work)
pnpm dev

# Fast HMR — SvelteKit only, no Workers runtime (pure UI iteration)
pnpm dev:vite
```

`pnpm dev` starts at `http://localhost:5173`. The admin panel at `/admin` bypasses Cloudflare Access in the local `development` environment.

## Database

D1 migrations live in `migrations/`. Apply them locally before first use:

```bash
pnpm db:migrate:local    # apply to .wrangler/state (local dev)
pnpm db:migrate:remote   # apply to production D1
pnpm db:reset:local      # wipe local D1 and re-apply from scratch
```

Seed data can be applied directly with Wrangler:

```bash
npx wrangler d1 execute mook-ai-portfolio-db --local --file=migrations/seed.sql
```

## Build & deploy

```bash
# Type-check
pnpm check

# Lint
pnpm lint
pnpm lint:fix

# Production build → .svelte-kit/cloudflare/
pnpm build

# Deploy to Cloudflare Workers
pnpm deploy
```

### Pre-deploy checklist

1. Replace `<DATABASE_ID>` in `wrangler.jsonc` with the real D1 database ID.
2. Replace `<ACCESS_AUD>` and `<ACCESS_TEAM>` in `wrangler.jsonc` with your Cloudflare Access application values.
3. Run `pnpm db:migrate:remote` to apply migrations to production D1.
4. Add `static/og-image.png` (1200×630 PNG) for social sharing previews.
5. Enable Cloudflare Web Analytics in the Cloudflare dashboard and replace the token placeholder in `src/routes/(public)/+layout.svelte`.

## Project structure

```
src/
  app.css                     # Tailwind v4 CSS-first config + design tokens
  app.d.ts                    # Cloudflare env bindings types
  hooks.server.ts             # Mounts Hono router on every request
  lib/
    actions/reveal.ts         # Scroll-reveal IntersectionObserver action
    components/               # Public UI components (Button, Header, Footer, …)
      admin/                  # Admin-only components (Spinner, Toaster, ConfirmDialog)
    server/
      router.ts               # Root Hono router — all API + SSR passthrough
      api/
        public/               # Unauthenticated API routes
        admin/                # Cloudflare Access–protected API routes
          schemas.ts          # Centralised Zod request schemas
    stores/                   # Svelte 5 module-level $state stores
  routes/
    +layout.svelte            # Root layout (CSS import, view transitions)
    (public)/                 # Public site (header + footer layout)
      +layout.svelte
      +error.svelte           # 404 / 500 error page
      +page.svelte            # Home
      projects/               # /projects list + /projects/[slug] detail
      stack/                  # /stack
      experience/             # /experience
      connect/                # /connect (contact form)
    admin/                    # Admin panel (Cloudflare Access required)
    robots.txt/
    sitemap.xml/
migrations/                   # Numbered SQL migration files
static/                       # Static assets served from CDN
  favicon.svg
  site.webmanifest
  og-image.png                # Add this — 1200×630 PNG for social previews
```

## Architecture notes

### Request routing

Every request enters `src/hooks.server.ts` → Hono router in `src/lib/server/router.ts`:

- `/api/*` — handled directly by Hono; CORS + logger middleware applied
- `/admin` and `/admin/*` — `accessAuth` middleware verifies Cloudflare Access JWT before handing off to SvelteKit SSR
- `*` — falls through to SvelteKit SSR via `c.env.resolve(c.env.event)`

### Adding an API endpoint

1. Add a sub-router or route handler in the relevant file under `src/lib/server/api/`.
2. Mount it in `src/lib/server/router.ts`.
3. Cloudflare bindings (`DB`, `BUCKET`, `ASSETS`) are available as `c.env.*` in Hono handlers.

### Design system

All design tokens are CSS custom properties in `src/app.css` inside `@theme {}`. Never build dynamic Tailwind class strings in JavaScript — use `<style>` blocks or inline `style` attributes with CSS variables instead.

### Admin panel

Protected by Cloudflare Access. Access tokens are verified server-side on every request by the `accessAuth` middleware. Local development bypasses this check when `ENVIRONMENT=development`.

## Cloudflare cache rules (production)

Configure these in the Cloudflare dashboard under **Caching → Cache Rules**:

| URL pattern | Cache TTL | Notes |
|---|---|---|
| `*/api/images/*` | 1 year | Already `Cache-Control: immutable` from the worker |
| `*/api/*` | 60 s | Public API responses — worker sets `max-age=60` |
| `*.js`, `*.css`, `*.woff2` | 1 year | Hashed filenames from Vite build |
| `*.svg`, `*.png`, `*.ico` | 1 week | Static identity assets |

R2 images are served through `/api/images/*` with `Cache-Control: public, max-age=31536000, immutable` — the CDN will cache them after the first request to each edge node.
