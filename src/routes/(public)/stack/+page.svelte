<script lang="ts">
  import { onMount } from 'svelte';
  import { SectionHeader, TechPill, StatCard } from '$lib/components';
  import { reveal } from '$lib/actions/reveal';

  let { data } = $props();

  // ── Types ──────────────────────────────────────────────────────────────
  type TechItem = {
    id: string;
    name: string;
    category: 'pill' | 'runtime' | 'infrastructure';
    percentage: number | null;
    qualifier: string | null;
  };

  type Stat = {
    id: string;
    value: string;
    label: string;
    unit: string;
  };

  // ── Fallback data ──────────────────────────────────────────────────────
  const FALLBACK_PILLS: TechItem[] = [
    { id: '1', name: 'TypeScript', category: 'pill', percentage: null, qualifier: null },
    { id: '2', name: 'SvelteKit', category: 'pill', percentage: null, qualifier: null },
    { id: '3', name: 'Hono', category: 'pill', percentage: null, qualifier: null },
    { id: '4', name: 'Zod', category: 'pill', percentage: null, qualifier: null },
    { id: '5', name: 'Tailwind CSS', category: 'pill', percentage: null, qualifier: null },
    { id: '6', name: 'Vite', category: 'pill', percentage: null, qualifier: null },
    { id: '7', name: 'React', category: 'pill', percentage: null, qualifier: null },
    { id: '8', name: 'Drizzle ORM', category: 'pill', percentage: null, qualifier: null },
    { id: '9', name: 'jose', category: 'pill', percentage: null, qualifier: null },
    { id: '10', name: 'Vitest', category: 'pill', percentage: null, qualifier: null },
  ];

  const FALLBACK_RUNTIME: TechItem[] = [
    { id: 'r1', name: 'TypeScript', category: 'runtime', percentage: 88, qualifier: null },
    { id: 'r2', name: 'Cloudflare Workers', category: 'runtime', percentage: 75, qualifier: null },
    { id: 'r3', name: 'SvelteKit', category: 'runtime', percentage: 70, qualifier: null },
    { id: 'r4', name: 'Node.js', category: 'runtime', percentage: 55, qualifier: null },
    { id: 'r5', name: 'Python', category: 'runtime', percentage: 30, qualifier: null },
  ];

  const FALLBACK_INFRA: TechItem[] = [
    { id: 'i1', name: 'D1 (SQLite)', category: 'infrastructure', percentage: null, qualifier: 'Primary DB' },
    { id: 'i2', name: 'R2 Object Storage', category: 'infrastructure', percentage: null, qualifier: 'Media & Assets' },
    { id: 'i3', name: 'Durable Objects', category: 'infrastructure', percentage: null, qualifier: 'Stateful Edge' },
    { id: 'i4', name: 'Workers AI', category: 'infrastructure', percentage: null, qualifier: 'Inference' },
    { id: 'i5', name: 'KV', category: 'infrastructure', percentage: null, qualifier: 'Config & Cache' },
    { id: 'i6', name: 'Vectorize', category: 'infrastructure', percentage: null, qualifier: 'Embeddings' },
    { id: 'i7', name: 'Analytics Engine', category: 'infrastructure', percentage: null, qualifier: 'Telemetry' },
    { id: 'i8', name: 'Cloudflare Access', category: 'infrastructure', percentage: null, qualifier: 'Zero Trust' },
  ];

  const FALLBACK_STATS: Stat[] = [
    { id: 's1', value: '12k+', label: 'req/s peak throughput', unit: '' },
    { id: 's2', value: '99.98%', label: 'uptime SLA', unit: '' },
    { id: 's3', value: '<18ms', label: 'P95 edge latency', unit: '' },
    { id: 's4', value: '47', label: 'edge regions', unit: '' },
  ];

  const pills       = $derived(data.pills?.length           ? data.pills           : FALLBACK_PILLS);
  const runtime     = $derived(data.runtime?.length         ? data.runtime         : FALLBACK_RUNTIME);
  const infra       = $derived(data.infrastructure?.length  ? data.infrastructure  : FALLBACK_INFRA);
  const stats       = $derived(data.stats?.length           ? data.stats           : FALLBACK_STATS);
  const description = $derived(
    data.content?.stack_description ??
    'The full surface area of my engineering environment — languages, runtimes, and infrastructure I reach for when building AI systems and edge-native services.',
  );

  // ── Animated percentage bars ───────────────────────────────────────────
  let barsVisible = $state(false);

  onMount(() => {
    // Small delay so bars animate in after page load
    const t = setTimeout(() => { barsVisible = true; }, 200);
    return () => clearTimeout(t);
  });
</script>

<div class="min-h-screen bg-bg-base px-6 pt-12 pb-24 max-w-7xl mx-auto">

  <!-- Section header -->
  <div use:reveal class="reveal mb-6">
    <SectionHeader
      label="THE ENGINE ROOM"
      heading="Mook-AI Stack"
      size="md"
    />
  </div>

  <!-- Description -->
  <div use:reveal={{ delay: 80 }} class="reveal mb-16 max-w-2xl">
    <p class="font-sans font-light text-text-muted leading-relaxed text-base">
      {description}
    </p>
  </div>

  <!-- ── Tech pill cloud ──────────────────────────────────────────────── -->
  {#if pills.length > 0}
    <div use:reveal={{ delay: 120 }} class="reveal mb-16">
      <div class="flex items-center gap-3 mb-6">
        <span class="block h-px w-8 bg-blue-600/60 shrink-0"></span>
        <span class="text-label text-blue-500 tracking-widest">LIBRARIES & FRAMEWORKS</span>
      </div>
      <div class="flex flex-wrap gap-2">
        {#each pills as pill, i}
          <div use:reveal={{ delay: 120 + i * 25 }} class="reveal">
            <TechPill label={pill.name} />
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- ── Two-column table ─────────────────────────────────────────────── -->
  <div use:reveal={{ delay: 160 }} class="reveal mb-16">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">

      <!-- Core Runtime — percentage bars -->
      <div class="rounded-xl border border-border-subtle bg-bg-elevated overflow-hidden">
        <div class="px-6 pt-5 pb-4 border-b border-border-subtle">
          <div class="flex items-center gap-3 mb-1">
            <span class="block h-px w-6 bg-blue-600/60 shrink-0"></span>
            <span class="text-label text-blue-500 tracking-widest">CORE RUNTIME</span>
          </div>
          <p class="text-xs font-sans font-light text-text-disabled mt-1">Primary languages and runtimes by usage</p>
        </div>

        <div class="divide-y divide-border-subtle">
          {#each runtime as item, i}
            <div class="flex items-center gap-4 px-6 py-4">
              <span class="font-sans text-sm text-text-primary w-44 shrink-0">{item.name}</span>
              <div class="flex-1 flex items-center gap-3">
                <div class="flex-1 h-1 rounded-full bg-bg-overlay overflow-hidden">
                  <div
                    class="h-full rounded-full bg-blue-500/70 transition-[width] duration-700 ease-out"
                    style="width: {barsVisible && item.percentage != null ? item.percentage : 0}%; transition-delay: {i * 60}ms"
                  ></div>
                </div>
                {#if item.percentage != null}
                  <span class="text-label text-text-disabled w-8 text-right shrink-0">{item.percentage}%</span>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Infrastructure — qualifier badges -->
      <div class="rounded-xl border border-border-subtle bg-bg-elevated overflow-hidden">
        <div class="px-6 pt-5 pb-4 border-b border-border-subtle">
          <div class="flex items-center gap-3 mb-1">
            <span class="block h-px w-6 bg-blue-600/60 shrink-0"></span>
            <span class="text-label text-blue-500 tracking-widest">INFRASTRUCTURE</span>
          </div>
          <p class="text-xs font-sans font-light text-text-disabled mt-1">Cloudflare primitives and platform services</p>
        </div>

        <div class="divide-y divide-border-subtle">
          {#each infra as item}
            <div class="flex items-center justify-between gap-4 px-6 py-4">
              <span class="font-sans text-sm text-text-primary">{item.name}</span>
              {#if item.qualifier}
                <span class="text-label text-text-disabled bg-bg-overlay border border-border-subtle
                             rounded px-2 py-0.5 shrink-0 whitespace-nowrap">
                  {item.qualifier}
                </span>
              {/if}
            </div>
          {/each}
        </div>
      </div>

    </div>
  </div>

  <!-- ── Stats cards row ─────────────────────────────────────────────── -->
  {#if stats.length > 0}
    <div use:reveal={{ delay: 200 }} class="reveal">
      <div class="flex items-center gap-3 mb-6">
        <span class="block h-px w-8 bg-blue-600/60 shrink-0"></span>
        <span class="text-label text-blue-500 tracking-widest">SYSTEM METRICS</span>
      </div>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {#each stats as stat, i}
          <div use:reveal={{ delay: 200 + i * 60 }} class="reveal">
            <StatCard
              value={stat.value}
              label={stat.label}
              class="h-full"
            />
          </div>
        {/each}
      </div>
    </div>
  {/if}

</div>
