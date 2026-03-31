import type { PageServerLoad } from './$types';

type ExperienceRow = {
  id: string;
  year: number;
  year_label: string | null;
  role_title: string;
  company: string;
  description: string;
  achievement_label: string | null;
  achievement_text: string | null;
  sort_order: number;
};

export const load: PageServerLoad = async ({ platform }) => {
  const db = platform?.env?.DB;
  if (!db) return { roles: [] };

  const { results } = await db
    .prepare(
      `SELECT id, year, year_label, role_title, company, description,
              achievement_label, achievement_text, sort_order
       FROM experience WHERE status = 'published'
       ORDER BY sort_order ASC`,
    )
    .all<ExperienceRow>();

  return { roles: results };
};
