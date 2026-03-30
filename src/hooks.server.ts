import type { Handle } from "@sveltejs/kit";
import { router } from "$lib/server/router";

// Thin glue: feed every request into the Hono router.
// Hono owns all routing decisions — /api/* is handled directly;
// everything else falls through to SvelteKit SSR via resolve().
export const handle: Handle = ({ event, resolve }) =>
  router.fetch(event.request, { event, resolve });
