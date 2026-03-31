import type { PageServerLoad } from './$types';

type ProjectRow = {
  id: string;
  title: string;
  slug: string;
  description: string;
  tech_stack: string;
  category_tags: string;
  card_size: 'large' | 'medium' | 'small';
  thumbnail_key: string;
  key_metric_label: string | null;
  key_metric_value: string | null;
  created_at: string;
};

export const load: PageServerLoad = async ({ platform }) => {
  const db = platform?.env?.DB;
  if (!db) return { projects: [] };

  const { results } = await db
    .prepare(
      `SELECT id, title, slug, description, tech_stack, category_tags,
              card_size, thumbnail_key, key_metric_label, key_metric_value, created_at
       FROM projects WHERE status = 'published'
       ORDER BY sort_order ASC, created_at ASC`,
    )
    .all<ProjectRow>();

  const projects = results.map((p) => ({
    ...p,
    tech_stack: JSON.parse(p.tech_stack || '[]') as string[],
    category_tags: JSON.parse(p.category_tags || '[]') as string[],
    year: p.created_at ? p.created_at.slice(0, 4) : '',
  }));

  return { projects };
};
