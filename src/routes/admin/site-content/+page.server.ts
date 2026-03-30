import type { PageServerLoad } from "./$types";

export type SiteContentEntry = {
  key: string;
  value: string;
  updated_at: string;
};

export const load: PageServerLoad = async ({ platform }) => {
  const { results } = await platform!.env.DB.prepare(
    "SELECT key, value, updated_at FROM site_content ORDER BY key ASC",
  ).all<{ key: string; value: string; updated_at: string }>();

  return {
    entries: results as SiteContentEntry[],
  };
};
