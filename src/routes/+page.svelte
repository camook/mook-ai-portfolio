<script lang="ts">
  import {
    SectionHeader,
    ProjectCardLarge,
    ProjectCardMedium,
    ProjectCardSmall,
  } from '$lib/components';
  import { reveal } from '$lib/actions/reveal';
</script>

<div class="min-h-screen bg-bg-base px-6 pt-12 pb-20 max-w-7xl mx-auto">

  <!-- Section header fades in first -->
  <div use:reveal class="reveal mb-14">
    <SectionHeader
      label="02 — SELECTED WORK"
      heading="Things I've shipped"
      subtext="A selection of projects spanning AI inference, edge infrastructure, and developer tooling."
      size="md"
    />
  </div>

  <!--
    Asymmetric grid — Row 1
    Large (8/12) + two stacked Medium (4/12)
    Large leads; right column follows 120ms later.
  -->
  <div class="grid grid-cols-12 gap-5 mb-5">

    <div use:reveal={{ delay: 80 }} class="reveal col-span-12 lg:col-span-8">
      <ProjectCardLarge
        index="01"
        title="Edge AI Inference Gateway"
        description="A globally distributed inference gateway running on Cloudflare Workers, routing requests to the nearest Workers AI node. Supports streaming, model fallbacks, and per-route rate limiting with sub-20ms overhead at the 95th percentile."
        tags={['TypeScript', 'Cloudflare Workers', 'Workers AI', 'Hono', 'Durable Objects']}
        year="2024"
        href="/projects/inference-gateway"
        status="success"
        statusLabel="Live"
        stats={[
          { value: '< 18ms', label: 'P95 LATENCY' },
          { value: '99.97%', label: 'UPTIME' },
          { value: '3.2M', label: 'REQ / DAY' },
        ]}
        class="h-full"
      />
    </div>

    <!-- Right column reveals as one unit so the two cards enter together -->
    <div use:reveal={{ delay: 200 }} class="reveal col-span-12 lg:col-span-4 flex flex-col gap-5">
      <ProjectCardMedium
        index="02"
        title="Realtime Collab Engine"
        description="WebSocket-based collaborative editor backed by Durable Objects. Conflict-free sync with operational transforms and persistent session state across edge nodes."
        tags={['Durable Objects', 'WebSockets', 'SvelteKit', 'TypeScript']}
        year="2024"
        href="/projects/collab-engine"
        status="success"
        statusLabel="Live"
        class="flex-1"
      />
      <ProjectCardMedium
        index="03"
        title="AI Portfolio CMS"
        description="Headless CMS built on D1 and R2, with a Hono API layer and SvelteKit frontend. Generates static previews at the edge via Browser Rendering."
        tags={['D1', 'R2', 'Hono', 'SvelteKit', 'Browser Rendering']}
        year="2025"
        href="/projects/portfolio-cms"
        status="info"
        statusLabel="Beta"
        class="flex-1"
      />
    </div>
  </div>

  <!--
    Asymmetric grid — Row 2
    Four small cards stagger in at 80ms intervals as the row scrolls into view.
  -->
  <div class="grid grid-cols-12 gap-5">
    <div use:reveal={{ delay: 0 }} class="reveal col-span-12 sm:col-span-6 lg:col-span-3">
      <ProjectCardSmall
        index="04"
        title="Wrangler Dev Companion"
        description="VS Code extension adding inline KV browsing, D1 query runner, and Workers log tail directly in the editor sidebar."
        tags={['TypeScript', 'VS Code API', 'Wrangler']}
        year="2024"
        href="/projects/wrangler-companion"
        status="success"
        statusLabel="Published"
      />
    </div>
    <div use:reveal={{ delay: 80 }} class="reveal col-span-12 sm:col-span-6 lg:col-span-3">
      <ProjectCardSmall
        index="05"
        title="Vector Search API"
        description="Semantic search over product catalogs using Vectorize and Workers AI embeddings. Handles hybrid keyword + vector ranking."
        tags={['Vectorize', 'Workers AI', 'TypeScript']}
        year="2025"
        href="/projects/vector-search"
        status="warning"
        statusLabel="WIP"
      />
    </div>
    <div use:reveal={{ delay: 160 }} class="reveal col-span-12 sm:col-span-6 lg:col-span-3">
      <ProjectCardSmall
        index="06"
        title="Queue-Driven Mailer"
        description="Transactional email pipeline using Cloudflare Queues and Email Workers. Batch sends with per-user rate limiting and bounce tracking."
        tags={['Queues', 'Email Workers', 'D1']}
        year="2024"
        href="/projects/queue-mailer"
      />
    </div>
    <div use:reveal={{ delay: 240 }} class="reveal col-span-12 sm:col-span-6 lg:col-span-3">
      <ProjectCardSmall
        index="07"
        title="Analytics Ingestion Pipeline"
        description="High-throughput event ingestion to Analytics Engine with schema-on-write validation and fan-out to R2 cold storage."
        tags={['Analytics Engine', 'R2', 'Hono']}
        year="2025"
        href="/projects/analytics-pipeline"
        status="info"
        statusLabel="Beta"
      />
    </div>
  </div>

</div>
