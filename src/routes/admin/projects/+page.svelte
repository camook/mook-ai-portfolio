<script lang="ts">
  import type { PageData } from "./$types";
  import type { Project } from "./+page.server";
  import Spinner from "$lib/components/admin/Spinner.svelte";
  import { toast } from "$lib/stores/toast.svelte";
  import { confirm } from "$lib/stores/confirm.svelte";

  let { data }: { data: PageData } = $props();

  let projects = $state<Project[]>([...data.projects]);
  let dragSrcIdx = $state<number | null>(null);
  let dragOverIdx = $state<number | null>(null);
  let reordering = $state(false);
  let deletingId = $state<string | null>(null);

  function onDragStart(e: DragEvent, idx: number) {
    dragSrcIdx = idx;
    e.dataTransfer!.effectAllowed = "move";
  }

  function onDragOver(e: DragEvent, idx: number) {
    e.preventDefault();
    e.dataTransfer!.dropEffect = "move";
    dragOverIdx = idx;
  }

  function onDragLeave(e: DragEvent) {
    // Only clear if leaving the row entirely (not entering a child)
    const rel = e.relatedTarget as Node | null;
    if (!(e.currentTarget as Element).contains(rel)) {
      dragOverIdx = null;
    }
  }

  async function onDrop(e: DragEvent, dropIdx: number) {
    e.preventDefault();
    dragOverIdx = null;
    if (dragSrcIdx === null || dragSrcIdx === dropIdx) {
      dragSrcIdx = null;
      return;
    }

    const next = [...projects];
    const [moved] = next.splice(dragSrcIdx, 1);
    next.splice(dropIdx, 0, moved);
    dragSrcIdx = null;
    projects = next.map((p, i) => ({ ...p, sort_order: i }));

    reordering = true;
    try {
      const res = await fetch("/api/admin/projects/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: projects.map((p, i) => ({ id: p.id, sort_order: i })),
        }),
      });
      if (!res.ok) toast.error("Failed to save order.");
    } catch {
      toast.error("Network error saving order.");
    } finally {
      reordering = false;
    }
  }

  function onDragEnd() {
    dragSrcIdx = null;
    dragOverIdx = null;
  }

  async function deleteProject(id: string, title: string) {
    const ok = await confirm({
      title: "Delete project?",
      message: `"${title}" and all its images will be permanently removed from R2. This cannot be undone.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;

    deletingId = id;
    try {
      const res = await fetch(`/api/admin/projects/${id}`, { method: "DELETE" });
      if (res.ok) {
        projects = projects.filter((p) => p.id !== id);
        toast.success(`"${title}" deleted.`);
      } else {
        toast.error("Failed to delete project.");
      }
    } catch {
      toast.error("Network error.");
    } finally {
      deletingId = null;
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  const STATUS_STYLES = {
    published: "bg-emerald-950 text-emerald-400 border-emerald-900",
    draft: "bg-amber-950 text-amber-400 border-amber-900",
  };

  const SIZE_STYLES = {
    large: "text-[--color-blue-500]",
    medium: "text-[--color-text-muted]",
    small: "text-[--color-text-disabled]",
  };
</script>

<div class="flex items-center justify-between">
  <div>
    <h1 class="font-display text-3xl text-[--color-text-primary]">Projects</h1>
    <p class="mt-1 font-mono text-xs text-[--color-text-disabled]">
      {projects.length} total · drag rows to reorder
      {#if reordering}· <span class="text-[--color-text-disabled]">saving order…</span>{/if}
    </p>
  </div>
  <a
    href="/admin/projects/new"
    class="rounded border border-[--color-border-muted] bg-[--color-bg-elevated] px-4 py-2 font-mono text-xs text-[--color-text-secondary] transition-colors hover:border-[--color-border-strong] hover:text-[--color-text-primary]"
  >
    + New project
  </a>
</div>

<div class="mt-6 overflow-x-auto rounded border border-[--color-border-subtle]">
  <div class="min-w-[640px]">
  {#if projects.length === 0}
    <div class="px-6 py-12 text-center font-mono text-sm text-[--color-text-disabled]">
      No projects yet. <a href="/admin/projects/new" class="underline underline-offset-2">Create one →</a>
    </div>
  {:else}
    <!-- Header row -->
    <div
      class="grid grid-cols-[2rem_1fr_6rem_5rem_2rem_6rem_6rem] items-center gap-x-4 border-b border-[--color-border-subtle] bg-[--color-bg-muted] px-4 py-2"
    >
      <span></span>
      <span class="font-mono text-[10px] tracking-widest text-[--color-text-disabled] uppercase">Title</span>
      <span class="font-mono text-[10px] tracking-widest text-[--color-text-disabled] uppercase">Status</span>
      <span class="font-mono text-[10px] tracking-widest text-[--color-text-disabled] uppercase">Size</span>
      <span class="font-mono text-[10px] tracking-widest text-[--color-text-disabled] uppercase" title="Featured">★</span>
      <span class="font-mono text-[10px] tracking-widest text-[--color-text-disabled] uppercase">Updated</span>
      <span></span>
    </div>

    <!-- Project rows -->
    {#each projects as project, idx (project.id)}
      {@const isDragSrc = dragSrcIdx === idx}
      {@const isDragTarget = dragOverIdx === idx && dragSrcIdx !== idx}
      <div
        role="row"
        draggable="true"
        ondragstart={(e) => onDragStart(e, idx)}
        ondragover={(e) => onDragOver(e, idx)}
        ondragleave={onDragLeave}
        ondrop={(e) => onDrop(e, idx)}
        ondragend={onDragEnd}
        class="group grid grid-cols-[2rem_1fr_6rem_5rem_2rem_6rem_6rem] items-center gap-x-4 border-b border-[--color-border-subtle] bg-[--color-bg-subtle] px-4 py-3 transition-colors last:border-b-0 hover:bg-[--color-bg-muted]"
        class:opacity-40={isDragSrc}
        class:border-t-2={isDragTarget}
        class:border-t-[--color-blue-600]={isDragTarget}
      >
        <!-- Drag handle -->
        <span
          class="cursor-grab select-none text-center font-mono text-sm text-[--color-text-disabled] active:cursor-grabbing"
          title="Drag to reorder"
        >⠿</span>

        <!-- Title + slug -->
        <div class="min-w-0">
          <p class="truncate font-mono text-sm text-[--color-text-primary]">{project.title}</p>
          <p class="truncate font-mono text-xs text-[--color-text-disabled]">{project.slug}</p>
        </div>

        <!-- Status -->
        <span
          class="inline-flex w-fit items-center rounded border px-2 py-0.5 font-mono text-[10px] tracking-wider uppercase {STATUS_STYLES[project.status]}"
        >
          {project.status}
        </span>

        <!-- Card size -->
        <span class="font-mono text-xs {SIZE_STYLES[project.card_size]}">
          {project.card_size}
        </span>

        <!-- Featured -->
        <span
          class="text-center font-mono text-sm {project.featured ? 'text-amber-400' : 'text-[--color-border-muted]'}"
          title={project.featured ? "Featured" : "Not featured"}
        >★</span>

        <!-- Updated at -->
        <span class="font-mono text-xs text-[--color-text-disabled]">
          {formatDate(project.updated_at)}
        </span>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-3">
          <a
            href="/admin/projects/{project.id}"
            class="font-mono text-xs text-[--color-text-muted] underline-offset-2 hover:text-[--color-text-secondary] hover:underline"
          >
            Edit
          </a>
          <button
            onclick={() => deleteProject(project.id, project.title)}
            disabled={deletingId === project.id}
            class="inline-flex items-center gap-1.5 font-mono text-xs text-red-700 underline-offset-2 hover:text-red-500 hover:underline disabled:opacity-40"
          >
            {#if deletingId === project.id}
              <Spinner />
            {:else}
              Delete
            {/if}
          </button>
        </div>
      </div>
    {/each}
  {/if}
  </div>
</div>
