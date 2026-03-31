import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

type ProjectRow = {
  id: string;
  title: string;
  slug: string;
  description: string;
  long_description: string;
  tech_stack: string;
  category_tags: string;
  card_size: string;
  thumbnail_key: string;
  key_metric_label: string | null;
  key_metric_value: string | null;
  github_url: string;
  live_url: string | null;
  status: string;
  created_at: string;
};

type ImageRow = {
  id: string;
  r2_key: string;
  alt_text: string;
  caption: string | null;
  sort_order: number;
};

type NavRow = { id: string; title: string; slug: string };

export const load: PageServerLoad = async ({ params, platform }) => {
  const db = platform?.env?.DB;
  if (!db) redirect(302, '/projects');

  const row = await db
    .prepare("SELECT * FROM projects WHERE slug = ? AND status = 'published'")
    .bind(params.slug)
    .first<ProjectRow>();

  if (!row) error(404, 'Project not found');

  const [imagesRes, allRes] = await Promise.all([
    db
      .prepare(
        `SELECT id, r2_key, alt_text, caption, sort_order
         FROM project_images WHERE project_id = ?
         ORDER BY sort_order ASC, created_at ASC`,
      )
      .bind(row.id)
      .all<ImageRow>(),
    db
      .prepare(
        `SELECT id, title, slug FROM projects WHERE status = 'published'
         ORDER BY sort_order ASC, created_at ASC`,
      )
      .all<NavRow>(),
  ]);

  const all = allRes.results;
  const idx = all.findIndex((p) => p.id === row.id);

  return {
    project: {
      ...row,
      tech_stack:    JSON.parse(row.tech_stack    || '[]') as string[],
      category_tags: JSON.parse(row.category_tags || '[]') as string[],
      year: row.created_at ? row.created_at.slice(0, 4) : '',
    },
    images:      imagesRes.results,
    prevProject: idx > 0              ? all[idx - 1] : null,
    nextProject: idx < all.length - 1 ? all[idx + 1] : null,
  };
};
