# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Local dev — builds with Vite then runs via Wrangler (full Workers runtime)
pnpm dev

# Fast HMR dev — SvelteKit only, no Workers runtime (no D1/R2/bindings)
pnpm dev:vite

# Type-check Svelte files
pnpm check

# Lint / lint with autofix
pnpm lint
pnpm lint:fix

# Production build (output → .svelte-kit/cloudflare/)
pnpm build

# Deploy to Cloudflare Workers
pnpm deploy

# D1 migrations
pnpm db:migrate:local   # apply to local .wrangler/state
pnpm db:migrate:remote  # apply to production
pnpm db:reset:local     # wipe local D1 and re-apply from scratch
```

`pnpm dev` is the correct command for any work that touches Cloudflare bindings (DB, BUCKET, env vars). `pnpm dev:vite` is faster for pure UI work.

## Architecture

### Request flow

Every HTTP request enters through a single Hono router in `src/lib/server/router.ts`, mounted via SvelteKit's `handle` hook in `src/hooks.server.ts`. Hono owns all routing:

- `/api/*` — handled directly by Hono (CORS + logger middleware applied)
- `/admin` and `/admin/*` — protected by Cloudflare Access JWT (`accessAuth` middleware) at both the Hono layer and the SvelteKit SSR layer
- `*` — falls through to SvelteKit SSR via `c.env.resolve(c.env.event)`

To add an API endpoint, add it to the `api` sub-router in `router.ts`. Cloudflare bindings (`DB`, `BUCKET`, `ASSETS`) are available as `c.env.*` in Hono handlers.

### Cloudflare bindings

Bindings are declared in `wrangler.jsonc` and typed in `src/app.d.ts` (`interface Env`). In SvelteKit pages/layouts, access them via `event.platform.env.*`. The `<DATABASE_ID>` placeholder in `wrangler.jsonc` must be replaced with the real D1 database ID before deploying.

### Database

D1 (SQLite at the edge). Schema lives in `migrations/` — numbered SQL files applied in order. Tables:

- `projects` — portfolio cards; `card_size` (`large`/`medium`/`small`) controls which component renders; `tech_stack` and `category_tags` are JSON arrays stored as TEXT
- `project_images` — R2 keys for project gallery images; linked to `projects` via `project_id`
- `experience` — work history entries with optional `achievement_label`/`achievement_text`; `year_label` is a freeform era label (e.g. `"CURRENT"`, `"THE INCEPTION"`)
- `tech_stack` — named tech items with `category` (`pill`/`runtime`/`infrastructure`) and optional `percentage`/`qualifier`
- `site_content` — flat key/value CMS for copy (hero headline, etc.); upserted by key; keys used by public pages: `hero_headline`, `hero_subtitle`, `stack_description`
- `stats` — metric callouts; `section` is `hero` or `tech_stack`; `unit` is a display suffix (e.g. `"req/s"`)
- `contact_submissions` — stores submissions from `POST /api/contact`; fields: `id`, `name`, `email`, `message`, `created_at`, `read` (0/1 integer, default 0)

### API routes

#### Public (unauthenticated)

Live under `/api/*`. All return only `published` records. Responses are cached via the Cache API with `Cache-Control: public, max-age=60` (`caches.default` — Cloudflare Workers global, cast as `(caches as unknown as { default: Cache }).default`).

| Mount | File | Notes |
|---|---|---|
| `GET /api/projects` | `src/lib/server/api/public/projects.ts` | Ordered by `sort_order ASC`; each project includes its `images` array |
| `GET /api/projects/:slug` | `src/lib/server/api/public/projects.ts` | Single published project by slug with images |
| `GET /api/experience` | `src/lib/server/api/public/experience.ts` | Ordered by `sort_order ASC, year DESC` |
| `GET /api/tech-stack` | `src/lib/server/api/public/tech-stack.ts` | Grouped by `category` (`pill`/`runtime`/`infrastructure`) |
| `GET /api/content` | `src/lib/server/api/public/content.ts` | Flat `{ [key]: value }` map of all `site_content` rows |
| `GET /api/stats` | `src/lib/server/api/public/stats.ts` | Grouped by `section` (`hero`/`tech_stack`) |
| `GET /api/images/*` | `src/lib/server/api/public/images.ts` | R2 proxy; wildcard handles slash keys (`projects/{id}/{imgId}.jpg`); `Cache-Control: public, max-age=31536000, immutable`; ETag + 304 support; optional resize via `?w`, `?h`, `?fit`, `?format`, `?q` — uses Cloudflare Image Resizing when enabled on the zone, falls back to original |
| `POST /api/contact` | `src/lib/server/api/public/contact.ts` | Validates `{ name, email, message }` with Zod and inserts into `contact_submissions`; returns `{ ok: true }` on success |

#### Admin (Cloudflare Access JWT required)

All admin API routes live under `/api/admin/*`. Sub-routers:

| Mount | File | Verbs |
|---|---|---|
| `/api/admin/projects` | `src/lib/server/api/admin/projects.ts` | GET, POST, PUT `/:id`, DELETE `/:id`, PATCH `/reorder`, POST `/:id/images`, PATCH `/:id/images/reorder`, PATCH `/:id/images/:imageId`, GET `/:id/images/:imageId/blob`, DELETE `/:id/images/:imageId` |
| `/api/admin/experience` | `src/lib/server/api/admin/experience.ts` | GET, POST, PUT `/:id`, DELETE `/:id`, PATCH `/reorder` |
| `/api/admin/tech-stack` | `src/lib/server/api/admin/tech-stack.ts` | GET, POST, PUT `/:id`, DELETE `/:id`, PATCH `/reorder` |
| `/api/admin/site-content` | `src/lib/server/api/admin/site-content.ts` | GET, PUT `/:key` |
| `/api/admin/stats` | `src/lib/server/api/admin/stats.ts` | GET, POST, PUT `/:id`, DELETE `/:id`, PATCH `/reorder` |
| `/api/admin/contact` | `src/lib/server/api/admin/contact.ts` | GET, PATCH `/:id` (set `read`), DELETE `/:id` |

Zod schemas for all request bodies are centralised in `src/lib/server/api/admin/schemas.ts`. **Important:** In Hono, register static route segments (e.g. `/reorder`) before dynamic ones (e.g. `/:id`) — Hono matches in registration order for the same HTTP method.

R2 objects are private; use `GET /:id/images/:imageId/blob` to proxy them through the admin API. The public `GET /api/images/*` endpoint also proxies R2 objects for published project images.

### Design system

All tokens are CSS custom properties defined in `src/app.css` inside `@theme {}` (Tailwind v4 CSS-first config — no `tailwind.config.js`). Token naming conventions:

- `--color-bg-*` → background layers (base → subtle → muted → elevated → overlay)
- `--color-blue-*` → accent scale (950–300)
- `--color-border-*` → border intensities (subtle → default → muted → strong)
- `--color-text-*` → text hierarchy (primary → secondary → muted → disabled)
- `--font-display` / `--font-sans` / `--font-mono` → Cormorant Garamond / Inter / JetBrains Mono

**Tailwind scanning limitation:** Tailwind v4 only scans static source files for class names. Never build class strings dynamically in JS (e.g. `` `bg-${color}-500` ``). Use `<style>` blocks with CSS custom properties for dynamic styling instead.

### Component conventions

Public components live in `src/lib/components/`, exported from `index.ts`. All accept a `class` prop (aliased as `extraClass`) for extension. Svelte 5 runes throughout (`$props()`, `$state()`, `$effect()`, `$derived()`).

Admin-only components live in `src/lib/components/admin/`:
- `Spinner.svelte` — inline-block SVG spinner, accepts `class` prop
- `Toaster.svelte` — fixed toast stack (bottom-right); reads from `toast` store
- `ConfirmDialog.svelte` — modal confirm dialog; reads from `confirm` store

Page-level reactive state from SvelteKit uses `$app/state` (not `$app/stores`): `import { page, navigating } from '$app/state'`.

### Reactive stores

Svelte 5 module-level `$state` stores live in `src/lib/stores/` (`.svelte.ts` files):

- **`toast.svelte.ts`** — `toast.success(msg)`, `toast.error(msg)`, `toast.info(msg)`, `toast.dismiss(id)`. Errors auto-dismiss after 5s, others after 3s.
- **`confirm.svelte.ts`** — `await confirm({ title?, message, confirmLabel?, danger? })` returns `Promise<boolean>`. The `ConfirmDialog` component calls `answerConfirm(bool)` to resolve it.

### Animations

Two animation systems coexist:

1. **Page transitions** — View Transitions API hooked via `onNavigate` in `+layout.svelte`. CSS keyframes `vt-page-out` / `vt-page-in` in `app.css`. The `<header>` is pinned with `view-transition-name: site-header` so it doesn't re-animate between pages.

2. **Scroll-reveal** — `src/lib/actions/reveal.ts` is a Svelte action wrapping `IntersectionObserver`. Apply as `use:reveal={{ delay: 120 }}` + `class="reveal"` on any element. Elements start invisible; `is-revealed` is added on viewport entry. Immediately reveals for `prefers-reduced-motion` users.

### Responsive type scale

`app.css` defines `.text-display-{xl,lg,md,sm,xs}` utility classes with fixed pixel sizes. A `@media (max-width: 639px)` block in `app.css` scales all of them down for mobile. Do not rely on passing `hidden md:*` as a `class` prop into `Button` — the component's own `inline-flex` base class wins the cascade. Instead wrap with a `<div class="hidden md:block">`.

## Public pages

All routes live under `src/routes/(public)/`. Each page has a `+page.server.ts` that loads from D1; all pages include a static fallback array used when `platform?.env?.DB` is unavailable (e.g. `pnpm dev:vite`).

| Route | File | Data loaded |
|---|---|---|
| `/` | `+page.svelte` + `+page.server.ts` | `site_content` (hero copy), `stats WHERE section='hero'`, `projects` (featured, limit 3) |
| `/projects` | `(public)/projects/+page.svelte` | `projects WHERE status='published'` ordered by `sort_order` |
| `/projects/[slug]` | `(public)/projects/[slug]/+page.svelte` | Single project + its images + all published slugs for prev/next nav |
| `/stack` | `(public)/stack/+page.svelte` | `tech_stack` (grouped by category), `stats WHERE section='tech_stack'`, `site_content` (`stack_description`) |
| `/experience` | `(public)/experience/+page.svelte` | `experience WHERE status='published'` ordered by `sort_order` |
| `/connect` | `(public)/connect/+page.svelte` | Static — submits to `POST /api/contact` client-side |

**Project grid layout** (`/projects`): `groupProjects()` in the page script groups cards into `HeroGroup` (large card + sidebar) or `RowGroup` (medium/small). `card_size` on each project row drives which component renders (`ProjectCardLarge` / `ProjectCardMedium` / `ProjectCardSmall`).

**Experience timeline**: `year_label === 'CURRENT'` controls the blue glowing dot and badge. The large ghost year number is a decorative background element at `opacity-[0.1]`.

**Contact form** (`/connect`): three states — `idle` (form), `submitting` (spinner on button), `success` (confirmation card). On success the form fields are cleared and a "Send another →" reset link is shown. Error messages live in a persistent `role="alert"` / `aria-live="assertive"` paragraph (always in the DOM, text set on error) so screen readers announce them without a focus change.

### SEO & discoverability

- **Meta tags** — every public page sets `<title>`, `<meta name="description">`, `og:title`, `og:description`, `og:url`, and `canonical` via `<svelte:head>`. The public layout (`(public)/+layout.svelte`) provides site-wide defaults (`og:site_name`, `og:image`, `twitter:card`, `theme-color`); individual pages override as needed.
- **OG image** — defaults to `/og-image.png` (static file — must be added to `static/`; 1200×630 PNG); project detail pages use the first project image at `?w=1200&fit=cover&format=webp`.
- **JSON-LD** — home page injects a `Person` schema; project detail pages inject a `SoftwareApplication` schema. Both use `{@html '<script type="application/ld+json">' + JSON.stringify({...}) + '</' + 'script>'}` inside `<svelte:head>` (the closing tag is split to avoid ESLint parser confusion).
- **`robots.txt`** — `src/routes/robots.txt/+server.ts`; allows all, blocks `/admin/` and `/api/admin/`, points to sitemap.
- **`sitemap.xml`** — `src/routes/sitemap.xml/+server.ts`; queries D1 for published project slugs dynamically; cached 1 hour.

### Error pages

Two `+error.svelte` files handle 404/500 responses:

- **Root** (`src/routes/+error.svelte`) — standalone error page with Header + Footer (used when the error occurs outside the `(public)` layout group). Includes its own skip link and favicon meta.
- **Public** (`src/routes/(public)/+error.svelte`) — nested inside the `(public)` layout (inherits header/footer). Both share the same visual treatment: ghost status number backdrop, status pill, heading, description, and "Back to Home" / "View Projects" action buttons.

Both set `<meta name="robots" content="noindex" />` so error pages are never indexed.

### Static assets

Files in `static/` are served directly from the CDN:

- `favicon.svg` — geometric "M" mark (blue on dark background)
- `og-image.png` — 1200×630 PNG for Open Graph / social sharing previews
- `site.webmanifest` — PWA manifest (`standalone` display, dark theme)

The public layout (`(public)/+layout.svelte`) links the favicon, manifest, and has a commented-out Cloudflare Web Analytics snippet (replace the token placeholder to enable).

### Accessibility

- **Skip link** — `<a href="#main-content">Skip to content</a>` in the public layout, visible on focus; `<main id="main-content" tabindex="-1">` is the target.
- **ARIA landmarks** — `<header role="banner">`, `<main>`, `<footer>` (contentinfo), `<nav aria-label="...">` are all present.
- **Carousel dot indicators** — rendered as `<span aria-hidden="true">` inside an `aria-hidden` container; keyboard navigation is provided by the labelled Prev/Next buttons only (avoids focusable elements inside `aria-hidden`).
- **Images** — hero/LCP image uses `fetchpriority="high" decoding="async"`; thumbnails use `loading="lazy" decoding="async"`.

## Admin UI

Protected at `/admin/*` by Cloudflare Access. Layout: fixed 224px sidebar + flex main area.

### Pages

| Route | Description |
|---|---|
| `/admin` | Dashboard with links to each section |
| `/admin/projects` | Project list — DnD reorder, status badges, delete |
| `/admin/projects/new` | Create project form |
| `/admin/projects/[id]` | Edit project form + image gallery manager |
| `/admin/experience` | Expandable list — inline create/edit/delete, DnD reorder |
| `/admin/tech-stack` | Expandable list — inline create/edit/delete, DnD reorder |
| `/admin/site-content` | Key/value CMS — per-entry textarea with explicit Save |
| `/admin/stats` | Expandable list — inline create/edit/delete, DnD reorder |
| `/admin/contact` | Read-only inbox — expand to read, mark read/unread, delete, reply mailto |

### Admin page patterns

**Expandable list** (experience, tech-stack, stats): one row expands at a time (`expandedId`); a separate `isCreating` bool shows a create form above the list. Shared flat draft state (`dField`) is populated by `fillDraft(entry)` / `resetDraft()`.

**DnD reorder**: HTML5 drag-and-drop restricted to the ⠿ handle via a plain (non-reactive) `dragFromHandle = false` boolean. Set to `true` on `onpointerdown` of the handle; checked and reset in `ondragstart` of the row — calls `e.preventDefault()` if false. Drop fires a `PATCH /reorder` request.

**Loading states**: Submit buttons show `<Spinner />` while `submitting = true`; Delete buttons show `<Spinner />` while `deletingId === entry.id`.

**Destructive actions**: Always `await confirm({ title, message, confirmLabel: "Delete", danger: true })` before any DELETE fetch. Never use the browser's native `window.confirm`.

**API feedback**: Use `toast.error()` for all API/network failures. Use `toast.success()` on successful create, update, and delete. Keep inline `formError` only for local form validation (required fields, format checks) — it stays visible inside the form so the user knows what to fix.

**Grid overflow**: Admin list grids can be wider than the content area at narrow viewports. Wrap with `overflow-x-auto` and add `min-w-[Npx]` on the inner container to ensure horizontal scroll rather than clipping.

### Project-specific components (`src/routes/admin/projects/_components/`)

- **`TagInput.svelte`** — chip-style multi-value input; `$bindable<string[]>` prop; Enter/comma adds, Backspace removes last, × removes individual
- **`MarkdownEditor.svelte`** — tabbed Write/Preview; inline renderer (no external deps); prose styles in `<style>` block using `:global()` to avoid Tailwind scanning issues
- **`ProjectForm.svelte`** — shared create/edit form; auto-slug from title (`autoSlug` flag); `thumbnailKeyOverride` prop synced via `$effect` for gallery→form thumbnail selection
- **`ImageUploader.svelte`** — dual-purpose: gallery manager (DnD reorder, inline alt/caption editing, delete) + new upload drop zone with XHR progress bars; images proxied via `/blob` endpoint since R2 is private

## CI/CD

GitHub Actions workflows live in `.github/workflows/`:

| Workflow | Trigger | What it does |
|---|---|---|
| `ci.yml` | Push/PR to `main` | Parallel typecheck (`pnpm check`) + lint (`pnpm lint`) |
| `deploy.yml` | Push to `main` | Build → apply D1 migrations → `wrangler deploy` to production |
| `preview.yml` | PR to `main` | Build → deploy to a PR-specific Worker (`mook-ai-portfolio-pr-{N}`) → post preview URL as PR comment |

**Required GitHub secrets** (set in repo Settings → Secrets):
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_WORKERS_SUBDOMAIN` (used by preview workflow to construct the preview URL)
