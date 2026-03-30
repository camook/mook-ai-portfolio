import type { RequestEvent, ResolveOptions } from "@sveltejs/kit";
import type { Env, AdminUser } from "../../app.js";

type SvelteKitBindings = {
  event: RequestEvent;
  resolve: (event: RequestEvent, opts?: ResolveOptions) => Promise<Response>;
};

export type AppEnv = {
  Bindings: Env & SvelteKitBindings;
  Variables: {
    user: AdminUser;
  };
};
