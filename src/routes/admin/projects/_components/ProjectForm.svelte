<script lang="ts">
  import { goto } from '$app/navigation';
  import TagInput from './TagInput.svelte';
  import MarkdownEditor from './MarkdownEditor.svelte';

  type FullProject = {
    id: string;
    title: string;
    slug: string;
    category_tags: string[];
    description: string;
    long_description: string;
    tech_stack: string[];
    github_url: string;
    live_url: string | null;
    thumbnail_key: string;
    key_metric_label: string | null;
    key_metric_value: string | null;
    card_size: 'large' | 'medium' | 'small';
    sort_order: number;
    status: 'published' | 'draft';
    featured: boolean;
  };

  interface Props {
    project?: FullProject | null;
    /** When the gallery uploader sets a thumbnail, this overrides the form field. */
    thumbnailKeyOverride?: string;
  }
  let { project = null, thumbnailKeyOverride }: Props = $props();

  const isEdit = !!project;

  // ── Form state ──────────────────────────────────────────────────────────────
  let title          = $state(project?.title ?? '');
  let slug           = $state(project?.slug ?? '');
  let categoryTags   = $state<string[]>(project?.category_tags ?? []);
  let description    = $state(project?.description ?? '');
  let longDesc       = $state(project?.long_description ?? '');
  let techStack      = $state<string[]>(project?.tech_stack ?? []);
  let githubUrl      = $state(project?.github_url ?? '');
  let liveUrl        = $state(project?.live_url ?? '');
  let thumbnailKey   = $state(project?.thumbnail_key ?? '');

  // Sync when the image uploader sets a new thumbnail from the gallery
  $effect(() => {
    if (thumbnailKeyOverride !== undefined) thumbnailKey = thumbnailKeyOverride;
  });
  let metricLabel    = $state(project?.key_metric_label ?? '');
  let metricValue    = $state(project?.key_metric_value ?? '');
  let cardSize       = $state<'large' | 'medium' | 'small'>(project?.card_size ?? 'medium');
  let status         = $state<'published' | 'draft'>(project?.status ?? 'draft');
  let featured       = $state(project?.featured ?? false);
  let sortOrder      = $state(project?.sort_order ?? 0);

  // ── Slug auto-generation ────────────────────────────────────────────────────
  let autoSlug = $state(!isEdit);

  function slugify(s: string) {
    return s.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  $effect(() => {
    if (autoSlug) slug = slugify(title);
  });

  // ── Submission ──────────────────────────────────────────────────────────────
  let submitting = $state(false);
  let error      = $state<string | null>(null);
  let savedAt    = $state<Date | null>(null);
  let saveTimer: ReturnType<typeof setTimeout>;

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (submitting) return;

    // Basic client-side validation
    if (!title.trim())     { error = 'Title is required.'; return; }
    if (!slug.trim())      { error = 'Slug is required.'; return; }
    if (!/^[a-z0-9-]+$/.test(slug)) { error = 'Slug must be lowercase alphanumeric with hyphens.'; return; }
    if (!description.trim()) { error = 'Description is required.'; return; }
    if (!githubUrl.trim()) { error = 'GitHub URL is required.'; return; }
    if (!thumbnailKey.trim()) { error = 'Thumbnail key is required.'; return; }

    submitting = true;
    error = null;

    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      category_tags: categoryTags,
      description: description.trim(),
      long_description: longDesc,
      tech_stack: techStack,
      github_url: githubUrl.trim(),
      live_url: liveUrl.trim() || null,
      thumbnail_key: thumbnailKey.trim(),
      key_metric_label: metricLabel.trim() || null,
      key_metric_value: metricValue.trim() || null,
      card_size: cardSize,
      sort_order: sortOrder,
      status,
      featured,
    };

    try {
      const url = isEdit ? `/api/admin/projects/${project!.id}` : '/api/admin/projects';
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        error = (data as { error?: string }).error ?? `Save failed (${res.status}).`;
        return;
      }

      if (isEdit) {
        clearTimeout(saveTimer);
        savedAt = new Date();
        saveTimer = setTimeout(() => (savedAt = null), 3000);
      } else {
        await goto('/admin/projects');
      }
    } catch {
      error = 'Network error. Please try again.';
    } finally {
      submitting = false;
    }
  }

  // ── Shared input class ───────────────────────────────────────────────────────
  const inp =
    'w-full rounded border border-[--color-border-default] bg-[--color-bg-base] ' +
    'px-3 py-2 font-mono text-sm text-[--color-text-primary] outline-none ' +
    'focus:border-[--color-blue-600] placeholder:text-[--color-text-disabled]';

  const sideSection = 'rounded border border-[--color-border-subtle] bg-[--color-bg-subtle] p-4 space-y-3';
  const sideLabel   = 'block font-mono text-[10px] uppercase tracking-widest text-[--color-text-disabled]';
</script>

<form onsubmit={handleSubmit}>
  {#if error}
    <div class="mb-5 rounded border border-red-900 bg-red-950 px-4 py-3 font-mono text-xs text-red-400">
      {error}
    </div>
  {/if}

  <div class="grid gap-6 lg:grid-cols-3">
    <!-- ── Main column ─────────────────────────────────────────────────────── -->
    <div class="space-y-5 lg:col-span-2">

      <!-- Title -->
      <div class="space-y-1.5">
        <label for="title" class={sideLabel}>Title <span class="text-red-600">*</span></label>
        <input
          id="title"
          type="text"
          bind:value={title}
          placeholder="Edge AI Inference Gateway"
          class={inp}
          required
        />
      </div>

      <!-- Slug -->
      <div class="space-y-1.5">
        <label for="slug" class={sideLabel}>
          Slug <span class="text-red-600">*</span>
          {#if autoSlug}
            <span class="ml-2 text-[--color-text-disabled]">· auto</span>
          {/if}
        </label>
        <input
          id="slug"
          type="text"
          bind:value={slug}
          oninput={() => (autoSlug = false)}
          placeholder="edge-ai-gateway"
          pattern="[a-z0-9-]+"
          class={inp}
          required
        />
      </div>

      <!-- Description -->
      <div class="space-y-1.5">
        <label for="desc" class={sideLabel}>Short description <span class="text-red-600">*</span></label>
        <textarea
          id="desc"
          bind:value={description}
          rows="3"
          placeholder="One or two sentences shown on the portfolio card."
          class="{inp} resize-none"
          required
        ></textarea>
      </div>

      <!-- Long description (Markdown) -->
      <div class="space-y-1.5">
        <label class={sideLabel}>Long description</label>
        <MarkdownEditor bind:value={longDesc} rows={14} />
      </div>

      <!-- Tech stack -->
      <div class="space-y-1.5">
        <label for="tech" class={sideLabel}>Tech stack</label>
        <TagInput id="tech" bind:value={techStack} placeholder="TypeScript, Hono…" />
        <p class="font-mono text-[10px] text-[--color-text-disabled]">Enter or comma to add · Backspace to remove last</p>
      </div>
    </div>

    <!-- ── Sidebar ─────────────────────────────────────────────────────────── -->
    <div class="space-y-4">

      <!-- Status + Featured -->
      <div class={sideSection}>
        <p class={sideLabel}>Publish</p>

        <!-- Status toggle -->
        <div class="flex items-center justify-between">
          <span class="font-mono text-xs text-[--color-text-secondary]">
            {status === 'published' ? 'Published' : 'Draft'}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={status === 'published'}
            onclick={() => (status = status === 'published' ? 'draft' : 'published')}
            class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors {status === 'published' ? 'bg-emerald-600' : 'bg-[--color-border-strong]'}"
          >
            <span
              class="pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform {status === 'published' ? 'translate-x-4' : 'translate-x-0'}"
            ></span>
          </button>
        </div>

        <!-- Featured toggle -->
        <div class="flex items-center justify-between">
          <span class="font-mono text-xs text-[--color-text-secondary]">Featured ★</span>
          <button
            type="button"
            role="switch"
            aria-checked={featured}
            onclick={() => (featured = !featured)}
            class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors {featured ? 'bg-amber-600' : 'bg-[--color-border-strong]'}"
          >
            <span
              class="pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform {featured ? 'translate-x-4' : 'translate-x-0'}"
            ></span>
          </button>
        </div>
      </div>

      <!-- Card size -->
      <div class={sideSection}>
        <p class={sideLabel}>Card size</p>
        <div class="grid grid-cols-3 gap-1">
          {#each (['large', 'medium', 'small'] as const) as size}
            <button
              type="button"
              onclick={() => (cardSize = size)}
              class="rounded border py-2 font-mono text-xs transition-colors {cardSize === size
                ? 'border-[--color-blue-700] bg-[--color-blue-900] text-[--color-blue-300]'
                : 'border-[--color-border-subtle] bg-[--color-bg-base] text-[--color-text-muted] hover:border-[--color-border-default]'}"
            >{size}</button>
          {/each}
        </div>
      </div>

      <!-- Category tags -->
      <div class={sideSection}>
        <label for="cats" class={sideLabel}>Category tags</label>
        <TagInput id="cats" bind:value={categoryTags} placeholder="AI, Infra…" />
      </div>

      <!-- Links -->
      <div class={sideSection}>
        <p class={sideLabel}>Links</p>
        <div class="space-y-2">
          <div class="space-y-1">
            <label for="github" class="font-mono text-[10px] text-[--color-text-disabled]">GitHub URL <span class="text-red-600">*</span></label>
            <input id="github" type="url" bind:value={githubUrl} placeholder="https://github.com/…" class={inp} required />
          </div>
          <div class="space-y-1">
            <label for="live" class="font-mono text-[10px] text-[--color-text-disabled]">Live URL</label>
            <input id="live" type="url" bind:value={liveUrl} placeholder="https://…" class={inp} />
          </div>
        </div>
      </div>

      <!-- Key metric -->
      <div class={sideSection}>
        <p class={sideLabel}>Key metric</p>
        <div class="space-y-2">
          <div class="space-y-1">
            <label for="metric-label" class="font-mono text-[10px] text-[--color-text-disabled]">Label</label>
            <input id="metric-label" type="text" bind:value={metricLabel} placeholder="P95 latency" class={inp} />
          </div>
          <div class="space-y-1">
            <label for="metric-value" class="font-mono text-[10px] text-[--color-text-disabled]">Value</label>
            <input id="metric-value" type="text" bind:value={metricValue} placeholder="< 18ms" class={inp} />
          </div>
        </div>
      </div>

      <!-- Thumbnail -->
      <div class={sideSection}>
        <div class="space-y-1">
          <label for="thumb" class={sideLabel}>Thumbnail R2 key <span class="text-red-600">*</span></label>
          <input id="thumb" type="text" bind:value={thumbnailKey} placeholder="projects/my-project/thumb.jpg" class={inp} required />
          <p class="font-mono text-[10px] text-[--color-text-disabled]">R2 object key for the cover image</p>
        </div>
      </div>
    </div>
  </div>

  <!-- ── Form actions ──────────────────────────────────────────────────────── -->
  <div class="mt-8 flex items-center justify-between border-t border-[--color-border-subtle] pt-6">
    <a
      href="/admin/projects"
      class="font-mono text-xs text-[--color-text-muted] underline-offset-2 hover:underline"
    >← Back to projects</a>

    <div class="flex items-center gap-4">
      {#if savedAt}
        <span class="font-mono text-xs text-emerald-400">Saved ✓</span>
      {/if}
      <button
        type="submit"
        disabled={submitting}
        class="rounded border border-[--color-blue-700] bg-[--color-blue-900] px-5 py-2 font-mono text-xs text-[--color-blue-300] transition-colors hover:bg-[--color-blue-800] disabled:opacity-40"
      >
        {submitting ? 'Saving…' : isEdit ? 'Update project' : 'Create project'}
      </button>
    </div>
  </div>
</form>
