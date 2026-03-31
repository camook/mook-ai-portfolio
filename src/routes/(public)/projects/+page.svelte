<script lang="ts">
  import {
    SectionHeader,
    ProjectCardLarge,
    ProjectCardMedium,
    ProjectCardSmall,
  } from '$lib/components';
  import { page } from '$app/state';
  import { reveal } from '$lib/actions/reveal';

  let { data } = $props();

  // ── Types ──────────────────────────────────────────────────────────────
  type Project = {
    id: string;
    title: string;
    slug: string;
    description: string;
    tech_stack: string[];
    category_tags: string[];
    card_size: 'large' | 'medium' | 'small';
    thumbnail_key: string;
    key_metric_label: string | null;
    key_metric_value: string | null;
    year: string;
  };

  // ── Fallback data when DB is empty ──────────────────────────────────────
  const FALLBACK: Project[] = [
    {
      id: '1', title: 'Edge AI Inference Gateway', slug: 'inference-gateway',
      description: 'A globally distributed inference gateway running on Cloudflare Workers, routing requests to the nearest Workers AI node. Supports streaming, model fallbacks, and per-route rate limiting with sub-20ms overhead at the 95th percentile.',
      tech_stack: ['TypeScript', 'Cloudflare Workers', 'Workers AI', 'Hono', 'Durable Objects'],
      category_tags: ['AI INFERENCE', 'EDGE COMPUTE', 'INFRASTRUCTURE'],
      card_size: 'large', thumbnail_key: '',
      key_metric_label: 'P95 LATENCY', key_metric_value: '< 18ms', year: '2024',
    },
    {
      id: '2', title: 'Realtime Collab Engine', slug: 'collab-engine',
      description: 'WebSocket-based collaborative editor backed by Durable Objects. Conflict-free sync with operational transforms and persistent session state across edge nodes.',
      tech_stack: ['Durable Objects', 'WebSockets', 'SvelteKit', 'TypeScript'],
      category_tags: ['REALTIME', 'COLLABORATION'],
      card_size: 'medium', thumbnail_key: '',
      key_metric_label: 'SYNC LATENCY', key_metric_value: '< 40ms', year: '2024',
    },
    {
      id: '3', title: 'AI Portfolio CMS', slug: 'portfolio-cms',
      description: 'Headless CMS built on D1 and R2, with a Hono API layer and SvelteKit frontend. Generates static previews at the edge via Browser Rendering.',
      tech_stack: ['D1', 'R2', 'Hono', 'SvelteKit', 'Browser Rendering'],
      category_tags: ['CMS', 'DEVELOPER TOOLS'],
      card_size: 'medium', thumbnail_key: '',
      key_metric_label: 'BUILD TIME', key_metric_value: '< 2s', year: '2025',
    },
    {
      id: '4', title: 'Wrangler Dev Companion', slug: 'wrangler-companion',
      description: 'VS Code extension adding inline KV browsing, D1 query runner, and Workers log tail directly in the editor sidebar.',
      tech_stack: ['TypeScript', 'VS Code API', 'Wrangler'],
      category_tags: ['TOOLING', 'DX'],
      card_size: 'small', thumbnail_key: '',
      key_metric_label: null, key_metric_value: null, year: '2024',
    },
    {
      id: '5', title: 'Vector Search API', slug: 'vector-search',
      description: 'Semantic search over product catalogs using Vectorize and Workers AI embeddings. Handles hybrid keyword + vector ranking.',
      tech_stack: ['Vectorize', 'Workers AI', 'TypeScript'],
      category_tags: ['AI', 'SEARCH'],
      card_size: 'small', thumbnail_key: '',
      key_metric_label: null, key_metric_value: null, year: '2025',
    },
    {
      id: '6', title: 'Queue-Driven Mailer', slug: 'queue-mailer',
      description: 'Transactional email pipeline using Cloudflare Queues and Email Workers. Batch sends with per-user rate limiting and bounce tracking.',
      tech_stack: ['Queues', 'Email Workers', 'D1'],
      category_tags: ['MESSAGING', 'INFRASTRUCTURE'],
      card_size: 'small', thumbnail_key: '',
      key_metric_label: null, key_metric_value: null, year: '2024',
    },
    {
      id: '7', title: 'Analytics Ingestion Pipeline', slug: 'analytics-pipeline',
      description: 'High-throughput event ingestion to Analytics Engine with schema-on-write validation and fan-out to R2 cold storage.',
      tech_stack: ['Analytics Engine', 'R2', 'Hono'],
      category_tags: ['DATA', 'INFRASTRUCTURE'],
      card_size: 'small', thumbnail_key: '',
      key_metric_label: null, key_metric_value: null, year: '2025',
    },
  ];

  const projects: Project[] = data.projects?.length ? data.projects : FALLBACK;

  // ── Grid grouping ───────────────────────────────────────────────────────
  // Groups consecutive projects into layout rows:
  //   'hero'  — one large card (8/12) + sidebar of 1–2 non-large cards (4/12)
  //   'row'   — 2–3 medium cards or 2–4 small cards across the full width
  type HeroGroup  = { type: 'hero';  main: Project; sidebar: Project[] };
  type RowGroup   = { type: 'row';   cards: Project[] };
  type LayoutGroup = HeroGroup | RowGroup;

  function groupProjects(ps: Project[]): LayoutGroup[] {
    const groups: LayoutGroup[] = [];
    let i = 0;

    while (i < ps.length) {
      const p = ps[i];

      if (p.card_size === 'large') {
        // Pair with next 1–2 non-large cards as sidebar
        const sidebar: Project[] = [];
        let j = i + 1;
        while (j < ps.length && sidebar.length < 2 && ps[j].card_size !== 'large') {
          sidebar.push(ps[j]);
          j++;
        }
        groups.push({ type: 'hero', main: p, sidebar });
        i = j;
      } else {
        // Collect a run of medium or small cards (stop at large)
        const row: Project[] = [p];
        const maxPerRow = p.card_size === 'medium' ? 3 : 4;
        let j = i + 1;
        while (j < ps.length && row.length < maxPerRow && ps[j].card_size !== 'large') {
          row.push(ps[j]);
          j++;
        }
        groups.push({ type: 'row', cards: row });
        i = j;
      }
    }

    return groups;
  }

  const groups = groupProjects(projects);

  // Column span class for a row card based on count + size
  function rowColSpan(card: Project, total: number): string {
    if (card.card_size === 'medium') {
      if (total === 1) return 'col-span-12 lg:col-span-8';
      if (total === 2) return 'col-span-12 sm:col-span-6';
      return 'col-span-12 sm:col-span-6 lg:col-span-4';
    }
    // small
    if (total <= 2) return 'col-span-12 sm:col-span-6';
    return 'col-span-12 sm:col-span-6 lg:col-span-3';
  }

  // Pad the padded index string
  function idx(n: number) { return String(n).padStart(2, '0'); }
</script>

<svelte:head>
  <title>Projects — Mook·AI</title>
  <meta name="description" content="A collection of edge AI infrastructure projects — inference gateways, collaborative runtimes, developer tooling, and distributed systems built on Cloudflare Workers." />
  <link rel="canonical" href="{page.url.origin}/projects" />
  <meta property="og:title" content="Projects — Mook·AI" />
  <meta property="og:description" content="A collection of edge AI infrastructure projects — inference gateways, collaborative runtimes, developer tooling, and distributed systems built on Cloudflare Workers." />
  <meta property="og:url" content="{page.url.origin}/projects" />
</svelte:head>

<div class="min-h-screen bg-bg-base px-6 pt-12 pb-24 max-w-7xl mx-auto">

  <!-- Section header -->
  <div use:reveal class="reveal mb-14">
    <SectionHeader
      label="SELECTED WORKS"
      heading="Engineering Artifacts"
      subtext="A curated collection of projects spanning AI inference, edge infrastructure, real-time systems, and developer tooling."
      size="md"
    />
  </div>

  <!-- Dynamic project grid -->
  <div class="space-y-5">
    {#each groups as group, gi}

      {#if group.type === 'hero'}
        <!-- ── Hero row: large (8/12) + sidebar (4/12) ── -->
        <div class="grid grid-cols-12 gap-5">

          <div use:reveal={{ delay: 80 }} class="reveal col-span-12 lg:col-span-8">
            <ProjectCardLarge
              index={idx(gi + 1)}
              title={group.main.title}
              description={group.main.description}
              tags={group.main.tech_stack}
              categoryTags={group.main.category_tags}
              year={group.main.year}
              href="/projects/{group.main.slug}"
              image={group.main.thumbnail_key ? '/api/images/' + group.main.thumbnail_key : undefined}
              stats={group.main.key_metric_label
                ? [{ value: group.main.key_metric_value ?? '', label: group.main.key_metric_label }]
                : undefined}
              class="h-full"
            />
          </div>

          {#if group.sidebar.length > 0}
            <div use:reveal={{ delay: 200 }} class="reveal col-span-12 lg:col-span-4 flex flex-col gap-5">
              {#each group.sidebar as card, ci}
                {#if card.card_size === 'small'}
                  <ProjectCardSmall
                    index={idx(gi + ci + 2)}
                    title={card.title}
                    description={card.description}
                    tags={card.tech_stack}
                    year={card.year}
                    href="/projects/{card.slug}"
                    image={card.thumbnail_key ? '/api/images/' + card.thumbnail_key : undefined}
                    class="flex-1"
                  />
                {:else}
                  <ProjectCardMedium
                    index={idx(gi + ci + 2)}
                    title={card.title}
                    description={card.description}
                    tags={card.tech_stack}
                    year={card.year}
                    href="/projects/{card.slug}"
                    image={card.thumbnail_key ? '/api/images/' + card.thumbnail_key : undefined}
                    metric={card.key_metric_label
                      ? { label: card.key_metric_label, value: card.key_metric_value ?? '' }
                      : undefined}
                    class="flex-1"
                  />
                {/if}
              {/each}
            </div>
          {/if}

        </div>

      {:else}
        <!-- ── Row of medium / small cards ── -->
        <div class="grid grid-cols-12 gap-5">
          {#each group.cards as card, ci}
            <div
              use:reveal={{ delay: ci * 80 }}
              class="reveal {rowColSpan(card, group.cards.length)}"
            >
              {#if card.card_size === 'medium'}
                <ProjectCardMedium
                  index={idx(gi + ci + 1)}
                  title={card.title}
                  description={card.description}
                  tags={card.tech_stack}
                  year={card.year}
                  href="/projects/{card.slug}"
                  image={card.thumbnail_key ? '/api/images/' + card.thumbnail_key : undefined}
                  metric={card.key_metric_label
                    ? { label: card.key_metric_label, value: card.key_metric_value ?? '' }
                    : undefined}
                  class="h-full"
                />
              {:else}
                <ProjectCardSmall
                  index={idx(gi + ci + 1)}
                  title={card.title}
                  description={card.description}
                  tags={card.tech_stack}
                  year={card.year}
                  href="/projects/{card.slug}"
                  image={card.thumbnail_key ? '/api/images/' + card.thumbnail_key : undefined}
                  class="h-full"
                />
              {/if}
            </div>
          {/each}
        </div>

      {/if}

    {/each}
  </div>

</div>
