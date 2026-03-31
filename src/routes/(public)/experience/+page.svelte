<script lang="ts">
  import { Badge } from '$lib/components';
  import { reveal } from '$lib/actions/reveal';

  let { data } = $props();

  type Role = {
    id: string;
    year: number;
    year_label: string | null;
    role_title: string;
    company: string;
    description: string;
    achievement_label: string | null;
    achievement_text: string | null;
  };

  const FALLBACK: Role[] = [
    {
      id: '1',
      year: 2023,
      year_label: 'CURRENT',
      role_title: 'Senior Software Engineer — Workers Platform',
      company: 'Cloudflare',
      description:
        'Designing and shipping primitives for the Workers runtime: AI inference APIs, Durable Object scheduling, and the Queues delivery guarantee layer.',
      achievement_label: 'IMPACT',
      achievement_text:
        'Led the Workers AI inference routing layer — sub-20ms P95 globally across 300+ PoPs. Shipped Durable Object hibernation reducing idle billing by ~70%.',
    },
    {
      id: '2',
      year: 2021,
      year_label: 'THE EXPANSION',
      role_title: 'Software Engineer — Edge Network',
      company: 'Vercel',
      description:
        'Built edge middleware infrastructure and the ISR revalidation pipeline, enabling sub-100ms cache invalidation globally.',
      achievement_label: 'HIGHLIGHT',
      achievement_text:
        'Redesigned ISR revalidation to be push-based, cutting mean staleness from 30s to < 2s. Shipped Edge Config — low-latency feature flag store across 200k+ deployments.',
    },
    {
      id: '3',
      year: 2020,
      year_label: 'THE FOUNDATION',
      role_title: 'Full-Stack Engineer',
      company: 'Linear',
      description:
        'Early-stage engineer on the product and infrastructure team. Built the real-time sync engine, mobile clients, and the public API.',
      achievement_label: 'SHIPPED',
      achievement_text:
        'Implemented offline-first sync using CRDTs — zero data loss across 50k+ teams. Shipped the public GraphQL API v1, now serving 10M+ requests per day.',
    },
    {
      id: '4',
      year: 2018,
      year_label: 'THE INCEPTION',
      role_title: 'Software Engineer — Payments Infrastructure',
      company: 'Stripe',
      description:
        "Core payments infrastructure team — idempotency, retry logic, and the distributed ledger underpinning Stripe's balance system.",
      achievement_label: 'RESULT',
      achievement_text:
        'Rebuilt the idempotency layer using distributed locks, eliminating double-charges under network partitions. Shipped Connect balance ledger rewrite from Ruby to Go — 3× throughput.',
    },
  ];

  const roles: Role[] = data.roles?.length ? data.roles : FALLBACK;
</script>

<svelte:head>
  <title>Experience — Mook·AI</title>
  <meta name="description" content="Engineering career timeline — senior and staff-level roles building edge AI infrastructure, developer tooling, and distributed systems at global scale." />
  <meta property="og:title" content="Experience — Mook·AI" />
  <meta property="og:description" content="Engineering career timeline — senior and staff-level roles building edge AI infrastructure, developer tooling, and distributed systems at global scale." />
</svelte:head>

<div class="min-h-screen bg-bg-base px-6 pt-12 pb-24 max-w-7xl mx-auto">

  <!-- Page label -->
  <div use:reveal class="reveal mb-20">
    <div class="flex items-center gap-3 mb-3">
      <span class="block h-px w-8 bg-blue-600/60 shrink-0"></span>
      <span class="text-label text-blue-500 tracking-widest">PROFESSIONAL VECTOR</span>
    </div>
    <h1 class="font-display text-[3.5rem] sm:text-[4.5rem] leading-[0.95] tracking-[-0.03em] font-normal text-text-primary">
      Experience
    </h1>
  </div>

  <!-- Timeline -->
  <div class="relative">

    <!-- Vertical rule — runs full height on lg+ -->
    <div
      class="hidden lg:block absolute left-[13rem] top-0 bottom-0 w-px bg-border-subtle"
      aria-hidden="true"
    ></div>

    <div class="space-y-0">
      {#each roles as role, i (role.id)}
        <div
          use:reveal={{ delay: i * 60 }}
          class="reveal relative grid grid-cols-1 lg:grid-cols-[13rem_1fr] gap-0 lg:gap-0
                 {i < roles.length - 1 ? 'pb-20 lg:pb-24' : ''}"
        >

          <!-- Left: large year + label -->
          <div class="lg:pr-10 pb-6 lg:pb-0 lg:text-right shrink-0">
            <div
              class="font-display leading-none tracking-[-0.04em] font-normal select-none
                     text-[5rem] lg:text-[6rem] text-text-primary/10"
            >
              {role.year}
            </div>
            {#if role.year_label}
              <div class="mt-2 text-label tracking-widest
                          {role.year_label === 'CURRENT' ? 'text-blue-400' : 'text-text-disabled'}">
                {role.year_label}
              </div>
            {/if}
          </div>

          <!-- Timeline dot (lg only) -->
          <div
            class="hidden lg:block absolute left-[13rem] top-3 size-2.5 rounded-full
                   -translate-x-1/2 border border-border-muted z-10
                   {role.year_label === 'CURRENT' ? 'bg-blue-500 shadow-[0_0_8px_2px_rgba(59,130,246,0.35)]' : 'bg-bg-base'}"
            aria-hidden="true"
          ></div>

          <!-- Right: role content -->
          <div class="lg:pl-12">

            <!-- Company + badge -->
            <div class="flex items-center gap-3 mb-2">
              <span class="font-mono text-[0.8125rem] text-blue-400 tracking-wide">{role.company}</span>
              {#if role.year_label === 'CURRENT'}
                <Badge variant="info" dot>Current</Badge>
              {/if}
            </div>

            <!-- Role title -->
            <h2 class="font-display text-[1.75rem] sm:text-[2rem] leading-[1.15] tracking-[-0.025em]
                       font-normal text-text-primary mb-5">
              {role.role_title}
            </h2>

            <!-- Description -->
            <p class="font-sans font-light text-text-secondary leading-relaxed text-base mb-6 max-w-2xl">
              {role.description}
            </p>

            <!-- Achievement callout -->
            {#if role.achievement_label && role.achievement_text}
              <div class="flex justify-end max-w-2xl">
                <div
                  class="border border-border-subtle border-l-2 border-l-blue-600/60
                         bg-bg-elevated rounded-r-lg px-5 py-4 w-full sm:w-[85%]"
                >
                  <span class="text-label text-blue-500 tracking-widest block mb-2">
                    {role.achievement_label}
                  </span>
                  <p class="font-sans font-light text-sm text-text-muted leading-relaxed">
                    {role.achievement_text}
                  </p>
                </div>
              </div>
            {/if}

          </div>
        </div>

        {#if i < roles.length - 1}
          <!-- Mobile divider -->
          <div class="lg:hidden h-px bg-border-subtle mb-20"></div>
        {/if}
      {/each}
    </div>

  </div>

</div>
