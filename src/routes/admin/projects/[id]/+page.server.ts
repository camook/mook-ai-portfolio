import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform, params }) => {
  const row = await platform!.env.DB.prepare('SELECT * FROM projects WHERE id = ?')
    .bind(params.id)
    .first<Record<string, unknown>>();

  if (!row) error(404, 'Project not found');

  return {
    project: {
      id: row.id as string,
      title: row.title as string,
      slug: row.slug as string,
      category_tags: JSON.parse((row.category_tags as string) || '[]') as string[],
      description: row.description as string,
      long_description: (row.long_description as string) || '',
      tech_stack: JSON.parse((row.tech_stack as string) || '[]') as string[],
      github_url: (row.github_url as string) || '',
      live_url: (row.live_url as string | null) ?? null,
      thumbnail_key: (row.thumbnail_key as string) || '',
      key_metric_label: (row.key_metric_label as string | null) ?? null,
      key_metric_value: (row.key_metric_value as string | null) ?? null,
      card_size: (row.card_size as 'large' | 'medium' | 'small') || 'medium',
      sort_order: (row.sort_order as number) || 0,
      status: (row.status as 'published' | 'draft') || 'draft',
      featured: row.featured === 1 || row.featured === true,
      updated_at: (row.updated_at as string) || '',
    },
  };
};
