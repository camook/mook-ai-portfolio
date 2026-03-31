<script lang="ts">
  import { onDestroy } from 'svelte';

  interface Props {
    projectId: string;
    onThumbnailSelect?: (r2Key: string) => void;
  }
  let { projectId, onThumbnailSelect }: Props = $props();

  type GalleryImage = {
    id: string;
    r2_key: string;
    alt_text: string;
    caption: string | null;
    sort_order: number;
    created_at: string;
  };

  type PendingUpload = {
    localId: string;
    file: File;
    previewUrl: string;
    progress: number;
    status: 'uploading' | 'error';
    error?: string;
  };

  let images      = $state<GalleryImage[]>([]);
  let pending     = $state<PendingUpload[]>([]);
  let loading     = $state(true);
  let fetchError  = $state<string | null>(null);
  let isDragOver  = $state(false);
  let reordering  = $state(false);

  // Per-image states (tracked by ID in plain arrays — full reassign for reactivity)
  let savingIds   = $state<string[]>([]);
  let savedIds    = $state<string[]>([]);
  let thumbSet    = $state<string | null>(null);
  let thumbTimer: ReturnType<typeof setTimeout>;

  // Inline delete confirmation
  let confirmDeleteId = $state<string | null>(null);

  // Gallery DnD
  let dragSrcIdx     = $state<number | null>(null);
  let dragOverIdx    = $state<number | null>(null);
  let dragFromHandle = false; // plain flag — not reactive

  let fileInput: HTMLInputElement;

  // ── Data loading ─────────────────────────────────────────────────────────

  async function fetchImages() {
    loading = true;
    fetchError = null;
    try {
      const res = await fetch(`/api/admin/projects/${projectId}`);
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json() as { images?: GalleryImage[] };
      images = (data.images ?? []).slice().sort((a, b) => a.sort_order - b.sort_order);
    } catch {
      fetchError = 'Could not load images.';
    } finally {
      loading = false;
    }
  }
  fetchImages();

  // ── Gallery DnD reorder ───────────────────────────────────────────────────

  function onImgDragStart(e: DragEvent, idx: number) {
    dragSrcIdx = idx;
    e.dataTransfer!.effectAllowed = 'move';
  }

  function onImgDragOver(e: DragEvent, idx: number) {
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'move';
    dragOverIdx = idx;
  }

  function onImgDragLeave(e: DragEvent) {
    if (!(e.currentTarget as Element).contains(e.relatedTarget as Node | null)) {
      dragOverIdx = null;
    }
  }

  async function onImgDrop(e: DragEvent, dropIdx: number) {
    e.preventDefault();
    dragOverIdx = null;
    if (dragSrcIdx === null || dragSrcIdx === dropIdx) { dragSrcIdx = null; return; }

    const next = [...images];
    const [moved] = next.splice(dragSrcIdx, 1);
    next.splice(dropIdx, 0, moved);
    dragSrcIdx = null;
    images = next.map((img, i) => ({ ...img, sort_order: i }));

    reordering = true;
    await fetch(`/api/admin/projects/${projectId}/images/reorder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: images.map((img, i) => ({ id: img.id, sort_order: i })) }),
    });
    reordering = false;
  }

  function onImgDragEnd() {
    dragFromHandle = false;
    dragSrcIdx = null;
    dragOverIdx = null;
  }

  // ── Metadata editing ─────────────────────────────────────────────────────

  async function saveImageMeta(imageId: string, alt_text: string, caption: string | null) {
    savingIds = [...savingIds, imageId];
    try {
      const res = await fetch(`/api/admin/projects/${projectId}/images/${imageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alt_text, caption }),
      });
      if (res.ok) {
        savedIds = [...savedIds, imageId];
        setTimeout(() => {
          savedIds = savedIds.filter((id) => id !== imageId);
        }, 2000);
      }
    } finally {
      savingIds = savingIds.filter((id) => id !== imageId);
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async function confirmDelete(imageId: string) {
    confirmDeleteId = null;
    const res = await fetch(`/api/admin/projects/${projectId}/images/${imageId}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      images = images.filter((img) => img.id !== imageId);
    }
  }

  // ── Set as thumbnail ──────────────────────────────────────────────────────

  async function setAsThumbnail(image: GalleryImage) {
    const res = await fetch(`/api/admin/projects/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ thumbnail_key: image.r2_key }),
    });
    if (res.ok) {
      onThumbnailSelect?.(image.r2_key);
      clearTimeout(thumbTimer);
      thumbSet = image.id;
      thumbTimer = setTimeout(() => (thumbSet = null), 2500);
    }
  }

  // ── Upload ────────────────────────────────────────────────────────────────

  function handleFiles(files: FileList | File[] | null) {
    if (!files) return;
    const arr = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!arr.length) return;
    const baseOrder = images.length + pending.length;
    arr.forEach((file, i) => {
      const localId = crypto.randomUUID();
      pending = [
        ...pending,
        { localId, file, previewUrl: URL.createObjectURL(file), progress: 0, status: 'uploading' },
      ];
      startUpload(localId, file, baseOrder + i);
    });
  }

  function startUpload(localId: string, file: File, sortOrder: number) {
    const xhr = new XMLHttpRequest();
    const fd = new FormData();
    fd.append('file', file);
    fd.append('alt_text', file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '));
    fd.append('sort_order', String(sortOrder));

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        pending = pending.map((p) => (p.localId === localId ? { ...p, progress: pct } : p));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const img = JSON.parse(xhr.responseText) as GalleryImage;
        const item = pending.find((p) => p.localId === localId);
        if (item) URL.revokeObjectURL(item.previewUrl);
        pending = pending.filter((p) => p.localId !== localId);
        images = [...images, img];
      } else {
        pending = pending.map((p) =>
          p.localId === localId ? { ...p, status: 'error', error: `Failed (${xhr.status})` } : p,
        );
      }
    });

    xhr.addEventListener('error', () => {
      pending = pending.map((p) =>
        p.localId === localId ? { ...p, status: 'error', error: 'Network error' } : p,
      );
    });

    xhr.open('POST', `/api/admin/projects/${projectId}/images`);
    xhr.send(fd);
  }

  function retryUpload(localId: string) {
    const item = pending.find((p) => p.localId === localId);
    if (!item) return;
    pending = pending.map((p) =>
      p.localId === localId ? { ...p, status: 'uploading', progress: 0, error: undefined } : p,
    );
    startUpload(localId, item.file, images.length + pending.length);
  }

  function dismissPending(localId: string) {
    const item = pending.find((p) => p.localId === localId);
    if (item) URL.revokeObjectURL(item.previewUrl);
    pending = pending.filter((p) => p.localId !== localId);
  }

  // ── Drop zone ─────────────────────────────────────────────────────────────

  function onZoneDragOver(e: DragEvent) { e.preventDefault(); isDragOver = true; }
  function onZoneDragLeave(e: DragEvent) {
    if (!(e.currentTarget as Element).contains(e.relatedTarget as Node | null)) isDragOver = false;
  }
  function onZoneDrop(e: DragEvent) {
    e.preventDefault(); isDragOver = false;
    handleFiles(e.dataTransfer?.files ?? null);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  function imgSrc(imageId: string) {
    return `/api/admin/projects/${projectId}/images/${imageId}/blob`;
  }

  function fileSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  onDestroy(() => {
    pending.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    clearTimeout(thumbTimer);
  });
</script>

<!-- ── Header ──────────────────────────────────────────────────────────────── -->
<div class="flex items-center justify-between">
  <h2 class="font-mono text-[10px] uppercase tracking-widest text-[--color-text-disabled]">
    Gallery images{images.length > 0 ? ` (${images.length})` : ''}
  </h2>
  {#if reordering}
    <span class="font-mono text-[10px] text-[--color-text-disabled]">Saving order…</span>
  {/if}
</div>

{#if fetchError}
  <p class="mt-2 font-mono text-xs text-red-400">{fetchError}</p>
{/if}

<!-- ── Gallery list ─────────────────────────────────────────────────────────── -->
{#if loading}
  <div class="mt-3 space-y-px overflow-hidden rounded border border-[--color-border-subtle]">
    {#each [1, 2] as n (n)}
      <div class="flex items-center gap-3 bg-[--color-bg-subtle] px-3 py-2.5">
        <div class="h-4 w-4 animate-pulse rounded bg-[--color-bg-elevated]"></div>
        <div class="h-10 w-14 animate-pulse rounded bg-[--color-bg-elevated]"></div>
        <div class="h-7 flex-1 animate-pulse rounded bg-[--color-bg-elevated]"></div>
        <div class="h-7 flex-1 animate-pulse rounded bg-[--color-bg-elevated]"></div>
      </div>
    {/each}
  </div>

{:else if images.length > 0}
  <div class="mt-3 overflow-hidden rounded border border-[--color-border-subtle]">

    <!-- Column header -->
    <div class="grid grid-cols-[1.5rem_3.5rem_1fr_1fr_2rem_7rem] items-center gap-3 border-b border-[--color-border-subtle] bg-[--color-bg-muted] px-3 py-1.5">
      <span></span>
      <span class="font-mono text-[10px] uppercase tracking-widest text-[--color-text-disabled]">Img</span>
      <span class="font-mono text-[10px] uppercase tracking-widest text-[--color-text-disabled]">Alt text</span>
      <span class="font-mono text-[10px] uppercase tracking-widest text-[--color-text-disabled]">Caption</span>
      <span></span>
      <span></span>
    </div>

    {#each images as image, idx (image.id)}
      {@const isSrc    = dragSrcIdx === idx}
      {@const isTarget = dragOverIdx === idx && dragSrcIdx !== idx}
      {@const isSaving = savingIds.includes(image.id)}
      {@const isSaved  = savedIds.includes(image.id)}
      {@const isThumb  = thumbSet === image.id}

      <div
        draggable="true"
        ondragstart={(e) => {
          const fromHandle = dragFromHandle;
          dragFromHandle = false;
          if (!fromHandle) { e.preventDefault(); return; }
          onImgDragStart(e, idx);
        }}
        ondragover={(e) => onImgDragOver(e, idx)}
        ondragleave={onImgDragLeave}
        ondrop={(e) => onImgDrop(e, idx)}
        ondragend={onImgDragEnd}
        class="grid grid-cols-[1.5rem_3.5rem_1fr_1fr_2rem_7rem] items-center gap-3 border-b border-[--color-border-subtle] bg-[--color-bg-subtle] px-3 py-2.5 transition-colors last:border-b-0 hover:bg-[--color-bg-muted]
          {isSrc ? 'opacity-40' : ''}
          {isTarget ? 'border-t-2 border-t-[--color-blue-600]' : ''}"
      >
        <!-- Drag handle -->
        <span
          onpointerdown={() => (dragFromHandle = true)}
          class="cursor-grab select-none text-center font-mono text-sm text-[--color-text-disabled] active:cursor-grabbing"
          title="Drag to reorder"
        >⠿</span>

        <!-- Thumbnail -->
        <img
          src={imgSrc(image.id)}
          alt={image.alt_text || 'Gallery image'}
          class="h-10 w-14 rounded object-cover"
        />

        <!-- Alt text -->
        <input
          type="text"
          bind:value={image.alt_text}
          placeholder="Alt text…"
          onblur={() => saveImageMeta(image.id, image.alt_text, image.caption)}
          class="w-full rounded border border-[--color-border-default] bg-[--color-bg-base] px-2 py-1.5 font-mono text-xs text-[--color-text-primary] outline-none placeholder:text-[--color-text-disabled] focus:border-[--color-blue-600]"
        />

        <!-- Caption -->
        <input
          type="text"
          value={image.caption ?? ''}
          placeholder="Caption…"
          oninput={(e) => { image.caption = (e.currentTarget as HTMLInputElement).value || null; }}
          onblur={(e) => saveImageMeta(image.id, image.alt_text, (e.currentTarget as HTMLInputElement).value || null)}
          class="w-full rounded border border-[--color-border-default] bg-[--color-bg-base] px-2 py-1.5 font-mono text-xs text-[--color-text-primary] outline-none placeholder:text-[--color-text-disabled] focus:border-[--color-blue-600]"
        />

        <!-- Save indicator -->
        <span class="text-center font-mono text-xs leading-none">
          {#if isSaving}
            <span class="text-[--color-text-disabled]">…</span>
          {:else if isSaved}
            <span class="text-emerald-400">✓</span>
          {/if}
        </span>

        <!-- Actions: thumbnail + delete -->
        <div class="flex items-center justify-end gap-1">
          <!-- Set as thumbnail -->
          <button
            type="button"
            onclick={() => setAsThumbnail(image)}
            title={isThumb ? 'Thumbnail set!' : 'Set as thumbnail'}
            class="rounded px-1.5 py-1 font-mono text-[10px] transition-colors {isThumb ? 'text-amber-400' : 'text-[--color-text-disabled] hover:text-[--color-text-muted]'}"
          >{isThumb ? '★' : '☆'}</button>

          <!-- Delete / confirm -->
          {#if confirmDeleteId === image.id}
            <span class="font-mono text-[10px] text-[--color-text-muted]">Sure?</span>
            <button
              type="button"
              onclick={() => confirmDelete(image.id)}
              class="rounded bg-red-900 px-1.5 py-1 font-mono text-[10px] text-red-300 hover:bg-red-800"
            >Yes</button>
            <button
              type="button"
              onclick={() => (confirmDeleteId = null)}
              class="rounded px-1.5 py-1 font-mono text-[10px] text-[--color-text-disabled] hover:text-[--color-text-muted]"
            >No</button>
          {:else}
            <button
              type="button"
              onclick={() => { confirmDeleteId = image.id; }}
              class="rounded px-1.5 py-1 font-mono text-[10px] text-[--color-text-disabled] transition-colors hover:text-red-400"
            >Delete</button>
          {/if}
        </div>
      </div>
    {/each}
  </div>

{:else}
  <p class="mt-3 py-3 text-center font-mono text-xs text-[--color-text-disabled]">
    No gallery images yet.
  </p>
{/if}

<!-- ── Drop zone ─────────────────────────────────────────────────────────────── -->
<div
  role="region"
  aria-label="Image upload drop zone"
  ondragover={onZoneDragOver}
  ondragleave={onZoneDragLeave}
  ondrop={onZoneDrop}
  onclick={() => fileInput.click()}
  onkeydown={(e) => e.key === 'Enter' && fileInput.click()}
  tabindex="0"
  class="mt-3 flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded border-2 border-dashed py-7 text-center outline-none transition-colors
    {isDragOver
      ? 'border-[--color-blue-500] bg-[--color-blue-900]/20'
      : 'border-[--color-border-default] hover:border-[--color-border-muted] focus-visible:border-[--color-blue-600]'}"
>
  <span class="text-xl text-[--color-text-disabled]" aria-hidden="true">↑</span>
  <p class="font-mono text-xs text-[--color-text-secondary]">
    Drop images here or <span class="underline underline-offset-2">click to browse</span>
  </p>
  <p class="font-mono text-[10px] text-[--color-text-disabled]">PNG · JPEG · WebP · GIF</p>
  <input
    bind:this={fileInput}
    type="file"
    accept="image/*"
    multiple
    onchange={(e) => handleFiles((e.currentTarget as HTMLInputElement).files)}
    class="sr-only"
  />
</div>

<!-- ── Pending uploads ────────────────────────────────────────────────────────── -->
{#if pending.length > 0}
  <ul class="mt-3 space-y-2">
    {#each pending as item (item.localId)}
      <li class="flex items-center gap-3 rounded border border-[--color-border-subtle] bg-[--color-bg-subtle] p-2.5">
        <img src={item.previewUrl} alt="" class="h-12 w-16 shrink-0 rounded object-cover" />
        <div class="min-w-0 flex-1 space-y-1.5">
          <div class="flex items-baseline justify-between gap-2">
            <p class="truncate font-mono text-xs text-[--color-text-secondary]">{item.file.name}</p>
            <span class="shrink-0 font-mono text-[10px] text-[--color-text-disabled]">{fileSize(item.file.size)}</span>
          </div>
          {#if item.status === 'uploading'}
            <div class="h-1 w-full overflow-hidden rounded-full bg-[--color-bg-elevated]">
              <div
                class="h-full rounded-full bg-[--color-blue-600] transition-[width] duration-150"
                style="width: {item.progress}%"
              ></div>
            </div>
            <p class="font-mono text-[10px] text-[--color-text-disabled]">
              {item.progress < 100 ? `${item.progress}%` : 'Processing…'}
            </p>
          {:else}
            <p class="font-mono text-xs text-red-400">{item.error}</p>
            <div class="flex gap-3">
              <button type="button" onclick={() => retryUpload(item.localId)}
                class="font-mono text-[10px] text-[--color-text-muted] underline-offset-2 hover:underline">Retry</button>
              <button type="button" onclick={() => dismissPending(item.localId)}
                class="font-mono text-[10px] text-[--color-text-disabled] underline-offset-2 hover:underline">Dismiss</button>
            </div>
          {/if}
        </div>
      </li>
    {/each}
  </ul>
{/if}
