import type { PageServerLoad } from './$types';

type TechRow = {
  id: string;
  name: string;
  category: 'pill' | 'runtime' | 'infrastructure';
  percentage: number | null;
  qualifier: string | null;
  sort_order: number;
};

type StatRow = {
  id: string;
  value: string;
  label: string;
  unit: string;
};

type ContentRow = { key: string; value: string };

export const load: PageServerLoad = async ({ platform }) => {
  const db = platform?.env?.DB;
  if (!db) return { content: {}, pills: [], runtime: [], infrastructure: [], stats: [] };

  const [techRes, statsRes, contentRes] = await Promise.all([
    db
      .prepare(
        `SELECT id, name, category, percentage, qualifier, sort_order
         FROM tech_stack ORDER BY sort_order ASC`,
      )
      .all<TechRow>(),
    db
      .prepare(
        `SELECT id, value, label, unit
         FROM stats WHERE section = 'tech_stack' ORDER BY sort_order ASC`,
      )
      .all<StatRow>(),
    db
      .prepare(`SELECT key, value FROM site_content WHERE key LIKE 'stack_%'`)
      .all<ContentRow>(),
  ]);

  const content = Object.fromEntries(contentRes.results.map((r) => [r.key, r.value]));
  const pills = techRes.results.filter((t) => t.category === 'pill');
  const runtime = techRes.results.filter((t) => t.category === 'runtime');
  const infrastructure = techRes.results.filter((t) => t.category === 'infrastructure');

  return {
    content,
    pills,
    runtime,
    infrastructure,
    stats: statsRes.results,
  };
};
