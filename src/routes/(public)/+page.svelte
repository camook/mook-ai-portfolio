<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { Button, ProjectCardLarge, ProjectCardMedium, ProjectCardSmall } from '$lib/components';
  import { reveal } from '$lib/actions/reveal';

  let { data } = $props();

  // ── CMS content with fallbacks ──────────────────────────────────────────
  const headline  = data.content?.hero_headline  ?? 'Structural Sophistication.';
  const subtitle  = data.content?.hero_subtitle  ??
    "Precision-engineered AI systems on Cloudflare's global edge — inference gateways, collaborative runtimes, and developer infrastructure built to perform at any scale.";

  // ── Hero stats ───────────────────────────────────────────────────────────
  type Stat = { label: string; value: string; unit: string };

  const FALLBACK_STATS: Stat[] = [
    { label: 'UPTIME',       value: '99.97', unit: '%'  },
    { label: 'P95 LATENCY',  value: '< 18',  unit: 'ms' },
    { label: 'REQ / DAY',    value: '3.2M',  unit: ''   },
    { label: 'EDGE NODES',   value: '300+',  unit: ''   },
  ];

  const heroStats: Stat[] = data.heroStats?.length
    ? data.heroStats.map((s: Stat) => ({ label: s.label, value: s.value, unit: s.unit ?? '' }))
    : FALLBACK_STATS;

  const primary   = heroStats[0] ?? FALLBACK_STATS[0];
  const secondary = heroStats.slice(1, 5);

  // ── Animated ring ────────────────────────────────────────────────────────
  const RING_R        = 68;
  const CIRCUMFERENCE = 2 * Math.PI * RING_R; // ≈ 427.3

  // Parse numeric portion from value strings like "99.97", "< 18", "3.2M"
  const rawNumeric  = parseFloat(primary.value.replace(/[^0-9.]/g, '')) || 99.97;
  const isPercent   = primary.unit === '%';
  const ringFull    = isPercent ? 100 : rawNumeric;       // what "full ring" represents
  const targetFill  = Math.min(rawNumeric / ringFull, 1); // 0–1
  const isAnimatable = /^[<>]?\s*[0-9.]+/.test(primary.value); // skip purely text values

  // Display string — keep prefix chars like "<"
  const prefixMatch = primary.value.match(/^([^0-9]*)([0-9.]+)(.*)$/);
  const prefix  = prefixMatch?.[1]?.trim() ?? '';
  const suffix  = primary.unit ? ` ${primary.unit}` : (prefixMatch?.[3]?.trim() ?? '');

  let displayNum  = $state(0);
  let ringOffset  = $state(CIRCUMFERENCE);
  let cardVisible = $state(false);

  onMount(() => {
    // Slight delay so the element has rendered
    setTimeout(() => {
      cardVisible = true;
      if (!isAnimatable) { displayNum = rawNumeric; ringOffset = CIRCUMFERENCE * (1 - targetFill); return; }

      const duration = 1800;
      const start = performance.now();

      function tick(now: number) {
        const t     = Math.min((now - start) / duration, 1);
        const eased = 1 - (1 - t) ** 4; // ease-out-quart
        displayNum = Math.round(eased * rawNumeric * 100) / 100;
        ringOffset = CIRCUMFERENCE * (1 - eased * targetFill);
        if (t < 1) requestAnimationFrame(tick);
        else { displayNum = rawNumeric; ringOffset = CIRCUMFERENCE * (1 - targetFill); }
      }
      requestAnimationFrame(tick);
    }, 300);
  });

  // Format the live number for display
  const liveDisplay = $derived(
    prefix + (rawNumeric % 1 === 0 ? displayNum.toFixed(0) : displayNum.toFixed(2)) + suffix
  );

  // ── Featured projects ────────────────────────────────────────────────────
  type FeaturedProject = {
    id: string; title: string; slug: string; description: string;
    tech_stack: string[]; card_size: string;
    key_metric_label?: string | null; key_metric_value?: string | null;
  };

  const FALLBACK_FEATURED: FeaturedProject[] = [
    {
      id: 'f1', title: 'Edge AI Inference Gateway', slug: 'inference-gateway',
      description: 'A globally distributed inference gateway running on Cloudflare Workers, routing requests to the nearest Workers AI node with sub-20ms P95 overhead.',
      tech_stack: ['TypeScript', 'Workers AI', 'Hono', 'Durable Objects'],
      card_size: 'large', key_metric_label: 'P95 LATENCY', key_metric_value: '< 18ms',
    },
    {
      id: 'f2', title: 'Realtime Collab Engine', slug: 'collab-engine',
      description: 'WebSocket-based collaborative editor backed by Durable Objects. Conflict-free sync with operational transforms across edge nodes.',
      tech_stack: ['Durable Objects', 'WebSockets', 'SvelteKit', 'TypeScript'],
      card_size: 'medium', key_metric_label: null, key_metric_value: null,
    },
    {
      id: 'f3', title: 'AI Portfolio CMS', slug: 'portfolio-cms',
      description: 'Headless CMS on D1 and R2 with a Hono API layer and SvelteKit frontend. Generates static previews at the edge via Browser Rendering.',
      tech_stack: ['D1', 'R2', 'Hono', 'SvelteKit'],
      card_size: 'small', key_metric_label: null, key_metric_value: null,
    },
  ];

  const featured: FeaturedProject[] = data.projects?.length ? data.projects : FALLBACK_FEATURED;

  // ── SEO ──────────────────────────────────────────────────────────────────
  const metaTitle       = 'Mook·AI — Edge AI Infrastructure Engineer';
  const metaDescription = subtitle.slice(0, 155);

  // Map to card-size buckets
  const largeCard  = featured.find((p) => p.card_size === 'large')  ?? featured[0];
  const mediumCards = featured.filter((p) => p !== largeCard && p.card_size !== 'small').slice(0, 2);
  const smallCards  = featured.filter((p) => p !== largeCard && !mediumCards.includes(p));
</script>

<svelte:head>
  <title>{metaTitle}</title>
  <meta name="description" content={metaDescription} />
  <link rel="canonical" href="{page.url.origin}/" />
  <meta property="og:title" content={metaTitle} />
  <meta property="og:description" content={metaDescription} />
  <meta property="og:url" content="{page.url.origin}/" />
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html '<script type="application/ld+json">' + JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Mook',
    url: page.url.origin,
    jobTitle: 'Edge AI Infrastructure Engineer',
    description: metaDescription,
    email: 'hello@mook.ai',
    knowsAbout: [
      'Cloudflare Workers', 'Edge Computing', 'TypeScript', 'AI Inference',
      'Durable Objects', 'SvelteKit', 'Distributed Systems', 'WebSockets',
    ],
    mainEntityOfPage: {
      '@type': 'WebSite',
      '@id': page.url.origin,
      name: 'Mook·AI',
      url: page.url.origin,
    },
  }) + '</' + 'script>'}
</svelte:head>

<!-- ════════════════════════════════════════════════════════════════════════
     HERO
     ════════════════════════════════════════════════════════════════════════ -->
<section class="max-w-7xl mx-auto px-6 pt-16 pb-24">
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">

    <!-- ── Left column ─────────────────────────────────────────────────── -->
    <div>

      <!-- Status badge -->
      <div use:reveal class="reveal inline-flex items-center gap-2.5 px-3.5 py-2 rounded-full
                              border border-green-900/60 bg-green-950/30 mb-8">
        <span class="size-1.5 rounded-full bg-green-400 animate-pulse shrink-0"></span>
        <span class="text-label text-green-400">System Status: Optimized</span>
      </div>

      <!-- Headline -->
      <div use:reveal={{ delay: 80 }} class="reveal mb-6">
        <h1 class="text-display-lg text-text-primary">{headline}</h1>
      </div>

      <!-- Subtitle -->
      <div use:reveal={{ delay: 160 }} class="reveal mb-10">
        <p class="text-lead max-w-xl">{subtitle}</p>
      </div>

      <!-- CTAs -->
      <div use:reveal={{ delay: 240 }} class="reveal flex flex-wrap items-center gap-4">
        <Button variant="primary" size="lg" href="/projects">View Architecture</Button>
        <Button variant="ghost"   size="lg" href="/stack">Technical Stack →</Button>
      </div>

    </div>

    <!-- ── Right column — animated metric card ─────────────────────────── -->
    <div use:reveal={{ delay: 120 }} class="reveal">
      <div
        class="relative rounded-2xl border border-border-subtle bg-bg-elevated overflow-hidden
               transition-shadow duration-500
               {cardVisible ? 'shadow-[0_0_60px_rgba(59,130,246,0.08)]' : ''}"
      >
        <!-- Subtle gradient wash -->
        <div
          class="absolute inset-0 bg-gradient-to-br from-blue-950/25 via-transparent to-transparent
                 pointer-events-none"
          aria-hidden="true"
        ></div>

        <div class="relative p-8">

          <!-- Card header -->
          <div class="flex items-center justify-between mb-8">
            <span class="text-label text-blue-500">SYSTEM METRICS</span>
            <div class="flex items-center gap-1.5">
              <span class="size-1.5 rounded-full bg-green-400 animate-pulse"></span>
              <span class="text-label text-green-400">LIVE</span>
            </div>
          </div>

          <!-- Primary metric — animated ring + value -->
          <div class="flex items-center justify-center mb-8">
            <div class="relative" style="width: 176px; height: 176px;">

              <svg
                width="176" height="176"
                viewBox="0 0 176 176"
                fill="none"
                aria-hidden="true"
              >
                <!-- Track -->
                <circle
                  cx="88" cy="88" r={RING_R}
                  stroke="var(--color-border-subtle)"
                  stroke-width="5"
                />
                <!-- Glow layer (thicker, more transparent) -->
                <circle
                  cx="88" cy="88" r={RING_R}
                  stroke="#3b82f6"
                  stroke-width="10"
                  stroke-linecap="round"
                  stroke-dasharray={CIRCUMFERENCE}
                  stroke-dashoffset={ringOffset}
                  transform="rotate(-90 88 88)"
                  opacity="0.25"
                  style="transition: stroke-dashoffset 0.05s linear;"
                />
                <!-- Main progress arc -->
                <circle
                  cx="88" cy="88" r={RING_R}
                  stroke="#3b82f6"
                  stroke-width="5"
                  stroke-linecap="round"
                  stroke-dasharray={CIRCUMFERENCE}
                  stroke-dashoffset={ringOffset}
                  transform="rotate(-90 88 88)"
                  style="transition: stroke-dashoffset 0.05s linear;"
                />
              </svg>

              <!-- Centre value -->
              <div class="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
                <span
                  class="font-display text-[2rem] leading-none tracking-tight text-text-primary
                         tabular-nums transition-none"
                >
                  {isAnimatable ? liveDisplay : primary.value + suffix}
                </span>
                <span class="text-label">{primary.label}</span>
              </div>

            </div>
          </div>

          <!-- Secondary stats grid -->
          {#if secondary.length}
            <div class="grid grid-cols-3 gap-3">
              {#each secondary.slice(0, 3) as stat (stat.label)}
                <div class="flex flex-col gap-1.5 p-3 rounded-lg bg-bg-muted border border-border-subtle">
                  <span class="font-display text-[1.25rem] leading-none text-text-primary tabular-nums">
                    {stat.value}{stat.unit ? stat.unit : ''}
                  </span>
                  <span class="text-label leading-tight">{stat.label}</span>
                </div>
              {/each}
            </div>
          {/if}

        </div>
      </div>
    </div>

  </div>
</section>

<!-- ════════════════════════════════════════════════════════════════════════
     FEATURED PROJECTS
     ════════════════════════════════════════════════════════════════════════ -->
<div class="max-w-7xl mx-auto px-6">
  <div class="h-px bg-border-subtle"></div>
</div>

<section class="max-w-7xl mx-auto px-6 pt-20 pb-24">

  <!-- Section label + "View all" link -->
  <div use:reveal class="reveal flex items-center justify-between mb-12">
    <div class="flex items-center gap-3">
      <span class="block h-px w-8 bg-blue-600/60 shrink-0"></span>
      <span class="text-label text-blue-500">SELECTED WORK</span>
    </div>
    <a
      href="/projects"
      class="text-xs font-sans font-light text-text-disabled hover:text-text-secondary
             transition-colors duration-150 flex items-center gap-1.5"
    >
      View All Projects
      <span aria-hidden="true" class="text-blue-600">→</span>
    </a>
  </div>

  <!-- Cards grid — large (8/12) left + medium stack (4/12) right -->
  <div class="grid grid-cols-12 gap-5">

    <!-- Large card -->
    {#if largeCard}
      <div use:reveal={{ delay: 80 }} class="reveal col-span-12 lg:col-span-8">
        <ProjectCardLarge
          index="01"
          title={largeCard.title}
          description={largeCard.description}
          tags={largeCard.tech_stack}
          year="2024"
          href="/projects/{largeCard.slug}"
          status="success"
          statusLabel="Live"
          stats={largeCard.key_metric_label
            ? [{ value: largeCard.key_metric_value ?? '', label: largeCard.key_metric_label }]
            : [
                { value: '< 18ms', label: 'P95 LATENCY' },
                { value: '99.97%', label: 'UPTIME'      },
                { value: '3.2M',   label: 'REQ / DAY'   },
              ]}
          class="h-full"
        />
      </div>
    {/if}

    <!-- Medium / small cards stacked -->
    <div use:reveal={{ delay: 200 }} class="reveal col-span-12 lg:col-span-4 flex flex-col gap-5">
      {#each mediumCards as card, i (card.slug)}
        <ProjectCardMedium
          index="0{i + 2}"
          title={card.title}
          description={card.description}
          tags={card.tech_stack}
          year="2024"
          href="/projects/{card.slug}"
          status="success"
          statusLabel="Live"
          class="flex-1"
        />
      {/each}
      {#each smallCards.slice(0, 1) as card, i (card.slug)}
        <ProjectCardSmall
          index="0{mediumCards.length + i + 2}"
          title={card.title}
          description={card.description}
          tags={card.tech_stack}
          year="2025"
          href="/projects/{card.slug}"
          status="info"
          statusLabel="Beta"
        />
      {/each}
    </div>

  </div>
</section>
