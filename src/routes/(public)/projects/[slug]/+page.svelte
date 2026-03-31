<script lang="ts">
  import { page } from '$app/state';
  import { Button, Badge, TechPill } from '$lib/components';
  import { reveal } from '$lib/actions/reveal';

  let { data } = $props();
  const { project, images, prevProject, nextProject } = data;

  // ── SEO ──────────────────────────────────────────────────────────────────
  const metaTitle       = `${project.title} — Mook·AI`;
  const metaDescription = project.description.slice(0, 155);
  const canonicalUrl    = `${page.url.origin}/projects/${project.slug}`;
  // Use first project image for OG if available, fall back to site default
  const ogImage = images.length > 0
    ? `${page.url.origin}/api/images/${images[0].r2_key}?w=1200&fit=cover&format=webp`
    : `${page.url.origin}/og-image.png`;

  // Helper to build a resized image URL (omit format so browsers use Accept header)
  function imgUrl(key: string, w: number) {
    return `/api/images/${key}?w=${w}`;
  }

  // ── Image carousel state ─────────────────────────────────────────────
  let activeIdx = $state(0);

  function prevImg() { activeIdx = (activeIdx - 1 + images.length) % images.length; }
  function nextImg() { activeIdx = (activeIdx + 1) % images.length; }

  // ── Markdown renderer (subset of CommonMark — same as admin preview) ──
  function esc(s: string) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function inline(s: string): string {
    return esc(s)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noreferrer">$1</a>',
      );
  }

  function renderMd(src: string): string {
    const lines = src.split('\n');
    const out: string[] = [];
    let inCode = false;
    let codeBuf: string[] = [];
    let inList = false;
    let listTag = 'ul';

    for (const line of lines) {
      if (line.startsWith('```')) {
        if (inCode) {
          if (inList) { out.push(`</${listTag}>`); inList = false; }
          out.push(`<pre><code>${esc(codeBuf.join('\n'))}</code></pre>`);
          codeBuf = []; inCode = false;
        } else { inCode = true; }
        continue;
      }
      if (inCode) { codeBuf.push(line); continue; }

      if (line.startsWith('### ')) {
        if (inList) { out.push(`</${listTag}>`); inList = false; }
        out.push(`<h3>${inline(line.slice(4))}</h3>`);
      } else if (line.startsWith('## ')) {
        if (inList) { out.push(`</${listTag}>`); inList = false; }
        out.push(`<h2>${inline(line.slice(3))}</h2>`);
      } else if (line.startsWith('# ')) {
        if (inList) { out.push(`</${listTag}>`); inList = false; }
        out.push(`<h1>${inline(line.slice(2))}</h1>`);
      } else if (/^[-*] /.test(line)) {
        if (!inList || listTag !== 'ul') {
          if (inList) out.push(`</${listTag}>`);
          out.push('<ul>'); inList = true; listTag = 'ul';
        }
        out.push(`<li>${inline(line.slice(2))}</li>`);
      } else if (/^\d+\. /.test(line)) {
        if (!inList || listTag !== 'ol') {
          if (inList) out.push(`</${listTag}>`);
          out.push('<ol>'); inList = true; listTag = 'ol';
        }
        out.push(`<li>${inline(line.replace(/^\d+\. /, ''))}</li>`);
      } else if (line.trim() === '') {
        if (inList) { out.push(`</${listTag}>`); inList = false; }
        out.push('');
      } else {
        if (inList) { out.push(`</${listTag}>`); inList = false; }
        out.push(`<p>${inline(line)}</p>`);
      }
    }
    if (inList) out.push(`</${listTag}>`);
    return out.join('\n');
  }

  const renderedMd = $derived(renderMd(project.long_description || ''));
  const hasContent  = project.long_description?.trim().length > 0;
</script>

<svelte:head>
  <title>{metaTitle}</title>
  <meta name="description" content={metaDescription} />
  <link rel="canonical" href={canonicalUrl} />
  <meta property="og:title" content={metaTitle} />
  <meta property="og:description" content={metaDescription} />
  <meta property="og:url" content={canonicalUrl} />
  <meta property="og:type" content="article" />
  <meta property="og:image" content={ogImage} />
  <meta property="og:image:alt" content={project.title} />
  <meta name="twitter:image" content={ogImage} />
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html '<script type="application/ld+json">' + JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: project.title,
    description: project.description,
    url: canonicalUrl,
    ...(project.live_url?.trim() ? { installUrl: project.live_url } : {}),
    ...(project.github_url?.trim() ? { codeRepository: project.github_url } : {}),
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    programmingLanguage: project.tech_stack,
    datePublished: project.created_at?.slice(0, 10),
    creator: {
      '@type': 'Person',
      name: 'Mook',
      url: page.url.origin,
    },
  }) + '</' + 'script>'}
</svelte:head>

<div class="min-h-screen bg-bg-base">
  <div class="max-w-7xl mx-auto px-6 pt-12 pb-24">

    <!-- ── Top navigation bar ──────────────────────────────────────────── -->
    <div use:reveal class="reveal flex items-center justify-between gap-4 mb-14">
      <a
        href="/projects"
        class="inline-flex items-center gap-2 text-xs font-sans font-light text-text-disabled
               hover:text-text-secondary transition-colors duration-150 group"
      >
        <span class="transition-transform duration-150 group-hover:-translate-x-0.5">←</span>
        Back to Projects
      </a>

      {#if nextProject}
        <a
          href="/projects/{nextProject.slug}"
          class="hidden sm:inline-flex items-center gap-2 text-xs font-sans font-light
                 text-text-disabled hover:text-text-secondary transition-colors duration-150 group"
        >
          <span class="line-clamp-1 max-w-[200px]">{nextProject.title}</span>
          <span class="transition-transform duration-150 group-hover:translate-x-0.5 shrink-0">→</span>
        </a>
      {/if}
    </div>

    <!-- ── Hero header ──────────────────────────────────────────────────── -->
    <div class="max-w-4xl mb-14">

      <!-- Category tags -->
      {#if project.category_tags.length > 0}
        <div use:reveal class="reveal flex flex-wrap gap-2 mb-6">
          {#each project.category_tags as tag}
            <Badge variant="neutral">{tag}</Badge>
          {/each}
        </div>
      {/if}

      <!-- Title -->
      <div use:reveal={{ delay: 60 }} class="reveal mb-5">
        <h1 class="text-display-md text-text-primary">{project.title}</h1>
      </div>

      <!-- Short description -->
      <div use:reveal={{ delay: 120 }} class="reveal mb-8">
        <p class="text-lead max-w-3xl">{project.description}</p>
      </div>

      <!-- Key metric + action buttons -->
      <div use:reveal={{ delay: 180 }} class="reveal flex flex-wrap items-center gap-x-8 gap-y-4">

        {#if project.key_metric_label && project.key_metric_value}
          <div class="flex items-baseline gap-2.5">
            <span
              class="font-display text-[2.75rem] leading-none tracking-[-0.03em] text-text-primary"
            >{project.key_metric_value}</span>
            <span class="text-label">{project.key_metric_label}</span>
          </div>
          <div class="h-8 w-px bg-border-subtle shrink-0 hidden sm:block" aria-hidden="true"></div>
        {/if}

        <div class="flex flex-wrap gap-3">
          {#if project.github_url?.trim()}
            <Button variant="ghost" size="md" href={project.github_url}>
              GitHub ↗
            </Button>
          {/if}
          {#if project.live_url?.trim()}
            <Button variant="primary" size="md" href={project.live_url}>
              Live Demo ↗
            </Button>
          {/if}
        </div>

      </div>
    </div>

    <!-- ── Image gallery / carousel ────────────────────────────────────── -->
    {#if images.length > 0}
      <div use:reveal class="reveal mb-16">

        <!-- Main image -->
        <div class="relative rounded-xl overflow-hidden bg-bg-elevated" style="aspect-ratio: 16/10;">
          <img
            src={imgUrl(images[activeIdx].r2_key, 1440)}
            alt={images[activeIdx].alt_text || project.title}
            fetchpriority="high"
            decoding="async"
            class="absolute inset-0 size-full object-cover transition-opacity duration-300"
          />

          <!-- Arrow buttons (only when multiple images) -->
          {#if images.length > 1}
            <button
              onclick={prevImg}
              aria-label="Previous image"
              class="absolute left-4 top-1/2 -translate-y-1/2 size-10 rounded-full
                     bg-bg-overlay/80 backdrop-blur-sm border border-border-subtle
                     flex items-center justify-center text-text-secondary
                     hover:text-white hover:border-border-muted transition-colors duration-150"
            ><span aria-hidden="true">←</span></button>
            <button
              onclick={nextImg}
              aria-label="Next image"
              class="absolute right-4 top-1/2 -translate-y-1/2 size-10 rounded-full
                     bg-bg-overlay/80 backdrop-blur-sm border border-border-subtle
                     flex items-center justify-center text-text-secondary
                     hover:text-white hover:border-border-muted transition-colors duration-150"
            ><span aria-hidden="true">→</span></button>

            <!-- Dot indicators — aria-hidden since prev/next buttons already provide keyboard control -->
            <div class="absolute bottom-4 inset-x-0 flex justify-center gap-1.5" aria-hidden="true">
              {#each images as _, i}
                <span
                  class="size-1.5 rounded-full transition-colors duration-150
                         {activeIdx === i ? 'bg-blue-400' : 'bg-white/30'}"
                ></span>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Caption -->
        {#if images[activeIdx].caption}
          <p class="text-label text-text-disabled mt-3 text-center">
            {images[activeIdx].caption}
          </p>
        {/if}

        <!-- Thumbnail strip -->
        {#if images.length > 1}
          <div class="flex gap-2 mt-4 overflow-x-auto pb-1">
            {#each images as img, i}
              <button
                onclick={() => (activeIdx = i)}
                aria-label="View image {i + 1}"
                class="shrink-0 size-16 rounded-lg overflow-hidden border-2 transition-colors duration-150
                       {activeIdx === i
                         ? 'border-blue-500 opacity-100'
                         : 'border-border-subtle opacity-60 hover:opacity-90 hover:border-border-muted'}"
              >
                <img
                  src={imgUrl(img.r2_key, 128)}
                  alt={img.alt_text || ''}
                  loading="lazy"
                  decoding="async"
                  class="size-full object-cover"
                />
              </button>
            {/each}
          </div>
        {/if}

      </div>

    {:else}
      <!-- Blueprint placeholder when no images -->
      <div use:reveal class="reveal mb-16 rounded-xl overflow-hidden border border-border-subtle"
           style="aspect-ratio: 16/10;">
        <div class="relative size-full bg-gradient-to-br from-bg-subtle via-[#0f1628] to-bg-base">
          <div
            class="absolute inset-0"
            style="background-image: linear-gradient(rgba(59,130,246,0.07) 1px, transparent 1px),
                   linear-gradient(90deg, rgba(59,130,246,0.07) 1px, transparent 1px);
                   background-size: 44px 44px;"
          ></div>
          <div class="absolute -bottom-16 -right-16 size-96 rounded-full blur-3xl bg-blue-600/8"></div>
          <div class="absolute inset-0 flex items-center justify-center">
            <span
              class="font-display text-[12rem] leading-none font-medium text-white opacity-[0.025]
                     select-none pointer-events-none tracking-tighter"
            >01</span>
          </div>
        </div>
      </div>
    {/if}

    <!-- ── Content + sidebar ───────────────────────────────────────────── -->
    <div class="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-12 mb-20">

      <!-- Left: Markdown prose -->
      <div use:reveal class="reveal">
        {#if hasContent}
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          <div class="project-prose">{@html renderedMd}</div>
        {:else}
          <p class="text-lead text-text-muted">{project.description}</p>
        {/if}
      </div>

      <!-- Right: sidebar metadata -->
      <aside use:reveal={{ delay: 80 }} class="reveal space-y-8">

        <!-- Tech stack -->
        {#if project.tech_stack.length > 0}
          <div>
            <div class="flex items-center gap-3 mb-4">
              <span class="block h-px w-5 bg-blue-600/60 shrink-0"></span>
              <span class="text-label text-blue-500">TECH STACK</span>
            </div>
            <div class="flex flex-wrap gap-2">
              {#each project.tech_stack as tech}
                <TechPill label={tech} />
              {/each}
            </div>
          </div>
        {/if}

        <!-- Project details -->
        <div>
          <div class="flex items-center gap-3 mb-4">
            <span class="block h-px w-5 bg-blue-600/60 shrink-0"></span>
            <span class="text-label text-blue-500">DETAILS</span>
          </div>
          <dl class="space-y-3">
            {#if project.year}
              <div class="flex items-baseline justify-between gap-3">
                <dt class="text-label text-text-disabled">YEAR</dt>
                <dd class="text-sm font-sans font-light text-text-secondary">{project.year}</dd>
              </div>
            {/if}
            {#if project.card_size}
              <div class="flex items-baseline justify-between gap-3">
                <dt class="text-label text-text-disabled">TYPE</dt>
                <dd class="text-sm font-sans font-light text-text-secondary capitalize">
                  {project.card_size} project
                </dd>
              </div>
            {/if}
            {#if project.key_metric_label && project.key_metric_value}
              <div class="flex items-baseline justify-between gap-3">
                <dt class="text-label text-text-disabled">{project.key_metric_label}</dt>
                <dd class="text-sm font-sans font-medium text-text-primary">
                  {project.key_metric_value}
                </dd>
              </div>
            {/if}
          </dl>
        </div>

        <!-- Links -->
        <div class="flex flex-col gap-2.5">
          {#if project.github_url?.trim()}
            <Button variant="ghost" size="sm" href={project.github_url} class="w-full justify-center">
              View on GitHub ↗
            </Button>
          {/if}
          {#if project.live_url?.trim()}
            <Button variant="primary" size="sm" href={project.live_url} class="w-full justify-center">
              Live Demo ↗
            </Button>
          {/if}
        </div>

      </aside>
    </div>

    <!-- ── Prev / Next navigation ─────────────────────────────────────── -->
    <div use:reveal class="reveal border-t border-border-subtle pt-10">
      <div class="grid grid-cols-2 gap-6">

        <!-- Prev -->
        <div>
          {#if prevProject}
            <a
              href="/projects/{prevProject.slug}"
              class="group flex flex-col gap-2 p-5 rounded-xl border border-border-subtle
                     bg-bg-elevated hover:border-border-muted hover:bg-bg-overlay
                     transition-all duration-200"
            >
              <span class="text-label text-text-disabled flex items-center gap-1.5">
                <span class="transition-transform duration-150 group-hover:-translate-x-0.5">←</span>
                Previous
              </span>
              <span
                class="font-display text-[1.375rem] leading-tight tracking-[-0.025em]
                       text-text-secondary group-hover:text-text-primary transition-colors duration-150
                       line-clamp-2"
              >{prevProject.title}</span>
            </a>
          {/if}
        </div>

        <!-- Next -->
        <div>
          {#if nextProject}
            <a
              href="/projects/{nextProject.slug}"
              class="group flex flex-col gap-2 p-5 rounded-xl border border-border-subtle
                     bg-bg-elevated hover:border-border-muted hover:bg-bg-overlay
                     transition-all duration-200 text-right"
            >
              <span class="text-label text-text-disabled flex items-center justify-end gap-1.5">
                Next
                <span class="transition-transform duration-150 group-hover:translate-x-0.5">→</span>
              </span>
              <span
                class="font-display text-[1.375rem] leading-tight tracking-[-0.025em]
                       text-text-secondary group-hover:text-text-primary transition-colors duration-150
                       line-clamp-2"
              >{nextProject.title}</span>
            </a>
          {/if}
        </div>

      </div>
    </div>

  </div>
</div>

<style>
  /* Prose styles for rendered Markdown — :global() because content is {@html} */
  .project-prose {
    color: var(--color-text-secondary);
    font-size: 1rem;
    line-height: 1.75;
  }
  .project-prose :global(h1) {
    font-family: var(--font-display);
    font-size: 2rem;
    font-weight: 400;
    color: var(--color-text-primary);
    letter-spacing: -0.03em;
    margin: 2rem 0 0.5rem;
    line-height: 1.2;
  }
  .project-prose :global(h2) {
    font-family: var(--font-display);
    font-size: 1.5rem;
    font-weight: 400;
    color: var(--color-text-primary);
    letter-spacing: -0.025em;
    margin: 1.75rem 0 0.375rem;
    line-height: 1.25;
  }
  .project-prose :global(h3) {
    font-family: var(--font-display);
    font-size: 1.2rem;
    font-weight: 500;
    color: var(--color-text-primary);
    letter-spacing: -0.02em;
    margin: 1.5rem 0 0.25rem;
  }
  .project-prose :global(p) {
    margin: 0.75rem 0;
    font-weight: 300;
    letter-spacing: -0.01em;
  }
  .project-prose :global(strong) {
    color: var(--color-text-primary);
    font-weight: 600;
  }
  .project-prose :global(em) { font-style: italic; }
  .project-prose :global(code) {
    font-family: var(--font-mono);
    font-size: 0.8em;
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border-subtle);
    padding: 0.1em 0.4em;
    border-radius: 4px;
    color: var(--color-blue-400);
  }
  .project-prose :global(pre) {
    background: var(--color-bg-muted);
    border: 1px solid var(--color-border-subtle);
    border-radius: 8px;
    padding: 1rem 1.25rem;
    margin: 1rem 0;
    overflow-x: auto;
  }
  .project-prose :global(pre code) {
    background: none;
    border: none;
    padding: 0;
    font-size: 0.85rem;
    color: var(--color-text-secondary);
  }
  .project-prose :global(ul) {
    padding-left: 1.5rem;
    list-style-type: disc;
    margin: 0.75rem 0;
  }
  .project-prose :global(ol) {
    padding-left: 1.5rem;
    list-style-type: decimal;
    margin: 0.75rem 0;
  }
  .project-prose :global(li) {
    margin: 0.25rem 0;
    font-weight: 300;
  }
  .project-prose :global(a) {
    color: var(--color-blue-500);
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .project-prose :global(a:hover) { color: var(--color-blue-400); }
</style>
