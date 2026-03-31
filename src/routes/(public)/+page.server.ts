import type { PageServerLoad } from './$types';

type StatRow = {
  id: string;
  section: string;
  label: string;
  value: string;
  unit: string;
  sort_order: number;
};

type ProjectRow = {
  id: string;
  title: string;
  slug: string;
  description: string;
  tech_stack: string;
  category_tags: string;
  card_size: string;
  thumbnail_key: string;
  key_metric_label: string | null;
  key_metric_value: string | null;
};

export const load: PageServerLoad = async ({ platform }) => {
  const db = platform?.env?.DB;
  if (!db) return { content: {} as Record<string, string>, heroStats: [] as StatRow[], projects: [] };

  const [contentRes, statsRes, projectsRes] = await Promise.all([
    db.prepare('SELECT key, value FROM site_content ORDER BY key ASC')
      .all<{ key: string; value: string }>(),
    db.prepare("SELECT * FROM stats WHERE section = 'hero' ORDER BY sort_order ASC")
      .all<StatRow>(),
    db.prepare(`
      SELECT id, title, slug, description, tech_stack, category_tags,
             card_size, thumbnail_key, key_metric_label, key_metric_value
      FROM projects WHERE status = 'published'
      ORDER BY featured DESC, sort_order ASC LIMIT 3
    `).all<ProjectRow>(),
  ]);

  const content = Object.fromEntries(contentRes.results.map((r) => [r.key, r.value]));
  const projects = projectsRes.results.map((p) => ({
    ...p,
    tech_stack: JSON.parse(p.tech_stack || '[]') as string[],
    category_tags: JSON.parse(p.category_tags || '[]') as string[],
  }));

  return { content, heroStats: statsRes.results, projects };
};
