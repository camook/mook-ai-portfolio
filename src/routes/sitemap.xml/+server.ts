import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform, url }) => {
	const db = platform?.env?.DB;
	const base = url.origin;

	let slugs: string[] = [];
	if (db) {
		const { results } = await db
			.prepare("SELECT slug FROM projects WHERE status = 'published' ORDER BY sort_order ASC")
			.all<{ slug: string }>();
		slugs = results.map((r) => r.slug);
	}

	const now = new Date().toISOString().split('T')[0];

	const staticPages: Array<{ path: string; priority: string; changefreq: string }> = [
		{ path: '',            priority: '1.0', changefreq: 'weekly'  },
		{ path: '/projects',   priority: '0.9', changefreq: 'weekly'  },
		{ path: '/experience', priority: '0.8', changefreq: 'monthly' },
		{ path: '/stack',      priority: '0.8', changefreq: 'monthly' },
		{ path: '/connect',    priority: '0.6', changefreq: 'yearly'  },
	];

	const urlEntries = [
		...staticPages.map(
			({ path, priority, changefreq }) =>
				`  <url>
    <loc>${base}${path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`,
		),
		...slugs.map(
			(slug) =>
				`  <url>
    <loc>${base}/projects/${slug}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`,
		),
	];

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries.join('\n')}
</urlset>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600',
		},
	});
};
