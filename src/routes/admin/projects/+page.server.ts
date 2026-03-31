import type { PageServerLoad } from "./$types";

export type Project = {
  id: string;
  title: string;
  slug: string;
  card_size: "large" | "medium" | "small";
  sort_order: number;
  status: "published" | "draft";
  featured: boolean;
  updated_at: string;
};

export const load: PageServerLoad = async ({ platform }) => {
  const db = platform?.env?.DB;
  if (!db) throw new Error("Database binding unavailable");

  const { results } = await db
    .prepare(
      `SELECT id, title, slug, card_size, sort_order, status, featured, updated_at
       FROM projects ORDER BY sort_order ASC, created_at ASC`,
    )
    .all<Record<string, unknown>>();

  const projects: Project[] = results.map((r) => ({
    id: r.id as string,
    title: r.title as string,
    slug: r.slug as string,
    card_size: r.card_size as "large" | "medium" | "small",
    sort_order: r.sort_order as number,
    status: r.status as "published" | "draft",
    featured: r.featured === 1 || r.featured === true,
    updated_at: r.updated_at as string,
  }));

  return { projects };
};
