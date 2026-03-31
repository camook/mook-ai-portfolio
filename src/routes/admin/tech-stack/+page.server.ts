import type { PageServerLoad } from "./$types";

export type TechStackEntry = {
  id: string;
  name: string;
  category: "pill" | "runtime" | "infrastructure";
  percentage: number | null;
  qualifier: string | null;
  sort_order: number;
  status: "published" | "draft";
};

export const load: PageServerLoad = async ({ platform }) => {
  const db = platform?.env?.DB;
  if (!db) throw new Error("Database binding unavailable");

  const { results } = await db.prepare(
    "SELECT * FROM tech_stack ORDER BY category ASC, sort_order ASC",
  ).all<Record<string, unknown>>();

  return {
    entries: results.map(
      (r): TechStackEntry => ({
        id: r.id as string,
        name: r.name as string,
        category: r.category as "pill" | "runtime" | "infrastructure",
        percentage: (r.percentage as number | null) ?? null,
        qualifier: (r.qualifier as string | null) ?? null,
        sort_order: r.sort_order as number,
        status: r.status as "published" | "draft",
      }),
    ),
  };
};
