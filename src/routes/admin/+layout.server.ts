import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = ({ locals }) => {
  if (!locals.user) {
    // In production, Cloudflare Access intercepts unauthenticated requests at
    // the edge and redirects to its login page before reaching the Worker, so
    // this branch is a defence-in-depth fallback (e.g. local dev misconfiguration).
    redirect(302, "/");
  }

  // Expose user to all admin child pages via `data.user`
  return { user: locals.user };
};
