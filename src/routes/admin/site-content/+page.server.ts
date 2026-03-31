import type { PageServerLoad } from "./$types";

export type SiteContentEntry = {
  key: string;
  value: string;
  updated_at: string;
};

export const load: PageServerLoad = async ({ platform }) => {
  const db = platform?.env?.DB;
  if (!db) throw new Error("Database binding unavailable");

  const { results } = await db.prepare(
    "SELECT key, value, updated_at FROM site_content ORDER BY key ASC",
  ).all<{ key: string; value: string; updated_at: string }>();

  return {
    entries: results as SiteContentEntry[],
  };
};
