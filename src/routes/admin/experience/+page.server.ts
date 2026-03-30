import type { PageServerLoad } from "./$types";

export type ExperienceEntry = {
  id: string;
  year: number;
  year_label: string | null;
  role_title: string;
  company: string;
  description: string;
  achievement_label: string | null;
  achievement_text: string | null;
  sort_order: number;
  status: "published" | "draft";
  created_at: string;
  updated_at: string;
};

export const load: PageServerLoad = async ({ platform }) => {
  const { results } = await platform!.env.DB.prepare(
    "SELECT * FROM experience ORDER BY sort_order ASC, year DESC",
  ).all<Record<string, unknown>>();

  return {
    entries: results.map(
      (r): ExperienceEntry => ({
        id: r.id as string,
        year: r.year as number,
        year_label: (r.year_label as string | null) ?? null,
        role_title: r.role_title as string,
        company: r.company as string,
        description: (r.description as string) || "",
        achievement_label: (r.achievement_label as string | null) ?? null,
        achievement_text: (r.achievement_text as string | null) ?? null,
        sort_order: r.sort_order as number,
        status: r.status as "published" | "draft",
        created_at: r.created_at as string,
        updated_at: r.updated_at as string,
      }),
    ),
  };
};
