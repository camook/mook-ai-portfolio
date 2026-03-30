<script lang="ts">
  import type { PageData } from "./$types";
  import type { TechStackEntry } from "./+page.server";
  import Spinner from "$lib/components/admin/Spinner.svelte";
  import { toast } from "$lib/stores/toast.svelte";
  import { confirm } from "$lib/stores/confirm.svelte";

  let { data }: { data: PageData } = $props();

  // ── State ─────────────────────────────────────────────────────────────────

  let entries = $state<TechStackEntry[]>([...data.entries]);

  let expandedId  = $state<string | null>(null);
  let isCreating  = $state(false);
  let submitting  = $state(false);
  let deletingId  = $state<string | null>(null);
  let formError   = $state<string | null>(null);

  // Draft fields
  let dName       = $state("");
  let dCategory   = $state<"pill" | "runtime" | "infrastructure">("pill");
  let dPercentage = $state<number | null>(null);
  let dQualifier  = $state("");
  let dStatus     = $state<"published" | "draft">("draft");

  // DnD
  let dragSrcIdx     = $state<number | null>(null);
  let dragOverIdx    = $state<number | null>(null);
  let dragFromHandle = false;
  let reordering     = $state(false);

  // ── Styles ────────────────────────────────────────────────────────────────

  const inp =
    "w-full rounded border border-[--color-border-default] bg-[--color-bg-base] " +
    "px-3 py-2 font-mono text-sm text-[--color-text-primary] outline-none " +
    "focus:border-[--color-blue-600] placeholder:text-[--color-text-disabled]";

  const lbl =
    "block font-mono text-[10px] uppercase tracking-widest text-[--color-text-disabled] mb-1";

  const STATUS_STYLES = {
    published: "bg-emerald-950 text-emerald-400 border-emerald-900",
    draft:     "bg-amber-950  text-amber-400  border-amber-900",
  };

  const CAT_STYLES = {
    pill:           "bg-[--color-blue-950] text-[--color-blue-400] border-[--color-blue-900]",
    runtime:        "bg-purple-950 text-purple-400 border-purple-900",
    infrastructure: "bg-orange-950 text-orange-400 border-orange-900",
  };

  const CATEGORIES: Array<"pill" | "runtime" | "infrastructure"> = [
    "pill",
    "runtime",
    "infrastructure",
  ];

  // ── Helpers ───────────────────────────────────────────────────────────────

  function fillDraft(e: TechStackEntry) {
    dName       = e.name;
    dCategory   = e.category;
    dPercentage = e.percentage;
    dQualifier  = e.qualifier ?? "";
    dStatus     = e.status;
    formError   = null;
  }

  function resetDraft() {
    dName       = "";
    dCategory   = "pill";
    dPercentage = null;
    dQualifier  = "";
    dStatus     = "draft";
    formError   = null;
  }

  function openEdit(entry: TechStackEntry) {
    isCreating = false;
    expandedId = entry.id;
    fillDraft(entry);
  }

  function openCreate() {
    expandedId = null;
    isCreating = true;
    resetDraft();
  }

  function collapse() {
    expandedId = null;
    isCreating = false;
    formError  = null;
  }

  function buildPayload() {
    return {
      name:       dName.trim(),
      category:   dCategory,
      percentage: dPercentage !== null && dPercentage !== undefined
        ? Number(dPercentage)
        : null,
      qualifier:  dQualifier.trim() || null,
      status:     dStatus,
    };
  }

  function validate(): string | null {
    if (!dName.trim()) return "Name is required.";
    if (
      dPercentage !== null &&
      dPercentage !== undefined &&
      (Number(dPercentage) < 0 || Number(dPercentage) > 100)
    )
      return "Percentage must be between 0 and 100.";
    return null;
  }

  // ── Create ────────────────────────────────────────────────────────────────

  async function createEntry() {
    const err = validate();
    if (err) { formError = err; return; }
    submitting = true;
    formError  = null;
    try {
      const res = await fetch("/api/admin/tech-stack", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(buildPayload()),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error((json as { error?: string }).error ?? `Error ${res.status}`);
        return;
      }
      entries = [...entries, json as TechStackEntry];
      collapse();
      toast.success("Item created.");
    } catch { toast.error("Network error."); }
    finally  { submitting = false; }
  }

  // ── Update ────────────────────────────────────────────────────────────────

  async function updateEntry(id: string) {
    const err = validate();
    if (err) { formError = err; return; }
    submitting = true;
    formError  = null;
    try {
      const res = await fetch(`/api/admin/tech-stack/${id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(buildPayload()),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error((json as { error?: string }).error ?? `Error ${res.status}`);
        return;
      }
      const updated = json as TechStackEntry;
      entries = entries.map((e) => (e.id === id ? updated : e));
      collapse();
      toast.success("Item saved.");
    } catch { toast.error("Network error."); }
    finally  { submitting = false; }
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async function handleDelete(entry: TechStackEntry) {
    const ok = await confirm({
      title: "Delete item?",
      message: `"${entry.name}" will be permanently removed.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;

    if (expandedId === entry.id) collapse();
    deletingId = entry.id;
    try {
      const res = await fetch(`/api/admin/tech-stack/${entry.id}`, { method: "DELETE" });
      if (res.ok) {
        entries = entries.filter((e) => e.id !== entry.id);
        toast.success("Item deleted.");
      } else {
        toast.error("Failed to delete item.");
      }
    } catch {
      toast.error("Network error.");
    } finally {
      deletingId = null;
    }
  }

  // ── DnD ───────────────────────────────────────────────────────────────────

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
    if (!(e.currentTarget as Element).contains(e.relatedTarget as Node | null)) {
      dragOverIdx = null;
    }
  }

  async function onDrop(e: DragEvent, dropIdx: number) {
    e.preventDefault();
    dragOverIdx = null;
    if (dragSrcIdx === null || dragSrcIdx === dropIdx) { dragSrcIdx = null; return; }

    const next = [...entries];
    const [moved] = next.splice(dragSrcIdx, 1);
    next.splice(dropIdx, 0, moved);
    dragSrcIdx = null;
    entries = next.map((entry, i) => ({ ...entry, sort_order: i }));

    reordering = true;
    try {
      const res = await fetch("/api/admin/tech-stack/reorder", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ items: entries.map((e, i) => ({ id: e.id, sort_order: i })) }),
      });
      if (!res.ok) toast.error("Failed to save order.");
    } catch {
      toast.error("Network error saving order.");
    } finally {
      reordering = false;
    }
  }

  function onDragEnd() {
    dragFromHandle = false;
    dragSrcIdx     = null;
    dragOverIdx    = null;
  }
</script>

<!-- ── Page header ─────────────────────────────────────────────────────────── -->
<div class="flex items-center justify-between">
  <div>
    <h1 class="font-display text-3xl text-[--color-text-primary]">Tech Stack</h1>
    <p class="mt-1 font-mono text-xs text-[--color-text-disabled]">
      {entries.length} {entries.length === 1 ? "item" : "items"}
      {#if reordering}· <span class="text-[--color-text-disabled]">saving order…</span>{/if}
    </p>
  </div>
  <button
    type="button"
    onclick={openCreate}
    disabled={isCreating}
    class="rounded border border-[--color-border-muted] bg-[--color-bg-elevated] px-4 py-2 font-mono text-xs text-[--color-text-secondary] transition-colors hover:border-[--color-border-strong] hover:text-[--color-text-primary] disabled:opacity-40"
  >+ New item</button>
</div>

<!-- ── List container ─────────────────────────────────────────────────────── -->
<div class="mt-6 overflow-hidden rounded border border-[--color-border-subtle]">

  <!-- New item form -->
  {#if isCreating}
    <div class="border-b border-[--color-border-subtle] bg-[--color-bg-elevated] px-4 py-4">
      <p class="mb-4 font-mono text-[10px] uppercase tracking-widest text-[--color-blue-500]">New item</p>

      {#if formError}
        <p class="mb-3 rounded border border-red-900 bg-red-950 px-3 py-2 font-mono text-xs text-red-400">{formError}</p>
      {/if}

      <div class="grid grid-cols-2 gap-4">
        <!-- Name -->
        <div class="col-span-2 space-y-1">
          <label class={lbl}>Name <span class="text-red-600">*</span></label>
          <input type="text" bind:value={dName} placeholder="TypeScript" class={inp} />
        </div>

        <!-- Category -->
        <div class="col-span-2 space-y-1">
          <label class={lbl}>Category</label>
          <div class="flex gap-1">
            {#each CATEGORIES as cat}
              <button
                type="button"
                onclick={() => (dCategory = cat)}
                class="rounded border px-3 py-1.5 font-mono text-xs capitalize transition-colors
                  {dCategory === cat
                    ? 'border-[--color-blue-700] bg-[--color-blue-900] text-[--color-blue-300]'
                    : 'border-[--color-border-default] bg-[--color-bg-base] text-[--color-text-muted] hover:border-[--color-border-muted] hover:text-[--color-text-secondary]'}"
              >{cat}</button>
            {/each}
          </div>
        </div>

        <!-- Percentage + Qualifier -->
        <div class="space-y-1">
          <label class={lbl}>Percentage <span class="text-[--color-text-disabled] normal-case">(0–100, optional)</span></label>
          <input type="number" min="0" max="100" bind:value={dPercentage} placeholder="—" class={inp} />
        </div>
        <div class="space-y-1">
          <label class={lbl}>Qualifier <span class="text-[--color-text-disabled] normal-case">(e.g. PRD)</span></label>
          <input type="text" bind:value={dQualifier} placeholder="PRD" class={inp} />
        </div>

        <!-- Status + actions -->
        <div class="col-span-2 flex items-center justify-between border-t border-[--color-border-subtle] pt-3">
          <div class="flex items-center gap-3">
            <span class="font-mono text-xs text-[--color-text-muted]">{dStatus === "published" ? "Published" : "Draft"}</span>
            <button
              type="button"
              role="switch"
              aria-checked={dStatus === "published"}
              onclick={() => (dStatus = dStatus === "published" ? "draft" : "published")}
              class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors {dStatus === 'published' ? 'bg-emerald-600' : 'bg-[--color-border-strong]'}"
            ><span class="pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform {dStatus === 'published' ? 'translate-x-4' : 'translate-x-0'}"></span></button>
          </div>
          <div class="flex gap-3">
            <button type="button" onclick={collapse} class="font-mono text-xs text-[--color-text-disabled] underline-offset-2 hover:underline">Cancel</button>
            <button
              type="button"
              onclick={createEntry}
              disabled={submitting}
              class="inline-flex items-center gap-2 rounded border border-[--color-blue-700] bg-[--color-blue-900] px-4 py-1.5 font-mono text-xs text-[--color-blue-300] transition-colors hover:bg-[--color-blue-800] disabled:opacity-40"
            >{#if submitting}<Spinner />{/if}{submitting ? "Saving…" : "Create item"}</button>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Empty state -->
  {#if entries.length === 0 && !isCreating}
    <div class="px-6 py-12 text-center font-mono text-sm text-[--color-text-disabled]">
      No items yet. <button type="button" onclick={openCreate} class="underline underline-offset-2">Add one →</button>
    </div>

  {:else if entries.length > 0}
    <!-- Column header -->
    <div class="grid grid-cols-[1.5rem_5.5rem_1fr_4rem_5.5rem_7.5rem] items-center gap-x-3 border-b border-[--color-border-subtle] bg-[--color-bg-muted] px-3 py-1.5">
      <span></span>
      <span class="font-mono text-[10px] uppercase tracking-widest text-[--color-text-disabled]">Category</span>
      <span class="font-mono text-[10px] uppercase tracking-widest text-[--color-text-disabled]">Name</span>
      <span class="font-mono text-[10px] uppercase tracking-widest text-[--color-text-disabled]">Pct</span>
      <span class="font-mono text-[10px] uppercase tracking-widest text-[--color-text-disabled]">Status</span>
      <span></span>
    </div>

    {#each entries as entry, idx (entry.id)}
      {@const isSrc      = dragSrcIdx === idx}
      {@const isTarget   = dragOverIdx === idx && dragSrcIdx !== idx}
      {@const isExpanded = expandedId === entry.id}

      <div
        draggable="true"
        ondragstart={(e) => {
          const fromHandle = dragFromHandle;
          dragFromHandle = false;
          if (!fromHandle) { e.preventDefault(); return; }
          onDragStart(e, idx);
        }}
        ondragover={(e) => onDragOver(e, idx)}
        ondragleave={onDragLeave}
        ondrop={(e) => onDrop(e, idx)}
        ondragend={onDragEnd}
        class="border-b border-[--color-border-subtle] last:border-b-0
          {isSrc ? 'opacity-40' : ''}
          {isTarget ? 'border-t-2 border-t-[--color-blue-600]' : ''}"
      >
        <!-- Collapsed row -->
        <div
          class="grid grid-cols-[1.5rem_5.5rem_1fr_4rem_5.5rem_7.5rem] items-center gap-x-3 px-3 py-3 transition-colors
            {isExpanded ? 'bg-[--color-bg-elevated]' : 'bg-[--color-bg-subtle] hover:bg-[--color-bg-muted]'}"
        >
          <!-- Drag handle -->
          <span
            onpointerdown={() => (dragFromHandle = true)}
            class="cursor-grab select-none text-center font-mono text-sm text-[--color-text-disabled] active:cursor-grabbing"
          >⠿</span>

          <!-- Category badge -->
          <span class="inline-flex w-fit items-center rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide {CAT_STYLES[entry.category]}">
            {entry.category === "infrastructure" ? "infra" : entry.category}
          </span>

          <!-- Name + qualifier -->
          <div class="min-w-0">
            <p class="truncate font-mono text-sm text-[--color-text-primary]">{entry.name}</p>
            {#if entry.qualifier}
              <p class="font-mono text-[10px] uppercase tracking-wider text-[--color-text-disabled]">{entry.qualifier}</p>
            {/if}
          </div>

          <!-- Percentage -->
          <span class="font-mono text-sm tabular-nums text-[--color-text-muted]">
            {entry.percentage !== null ? `${entry.percentage}%` : "—"}
          </span>

          <!-- Status badge -->
          <span class="inline-flex w-fit items-center rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider {STATUS_STYLES[entry.status]}">
            {entry.status}
          </span>

          <!-- Actions -->
          <div class="flex items-center justify-end gap-2">
            <button type="button"
              onclick={() => { if (isExpanded) { collapse(); } else { openEdit(entry); } }}
              class="font-mono text-xs transition-colors {isExpanded ? 'text-[--color-blue-500]' : 'text-[--color-text-muted] hover:text-[--color-text-secondary]'}">
              {isExpanded ? "Close" : "Edit"}
            </button>
            <button
              type="button"
              onclick={() => handleDelete(entry)}
              disabled={deletingId === entry.id}
              class="inline-flex items-center gap-1 font-mono text-xs text-[--color-text-disabled] transition-colors hover:text-red-400 disabled:opacity-40"
            >
              {#if deletingId === entry.id}<Spinner />{:else}Delete{/if}
            </button>
          </div>
        </div>

        <!-- Expanded edit form -->
        {#if isExpanded}
          <div class="border-t border-[--color-border-subtle] bg-[--color-bg-elevated] px-4 py-4">
            {#if formError}
              <p class="mb-3 rounded border border-red-900 bg-red-950 px-3 py-2 font-mono text-xs text-red-400">{formError}</p>
            {/if}

            <div class="grid grid-cols-2 gap-4">
              <!-- Name -->
              <div class="col-span-2 space-y-1">
                <label class={lbl}>Name <span class="text-red-600">*</span></label>
                <input type="text" bind:value={dName} placeholder="TypeScript" class={inp} />
              </div>

              <!-- Category -->
              <div class="col-span-2 space-y-1">
                <label class={lbl}>Category</label>
                <div class="flex gap-1">
                  {#each CATEGORIES as cat}
                    <button
                      type="button"
                      onclick={() => (dCategory = cat)}
                      class="rounded border px-3 py-1.5 font-mono text-xs capitalize transition-colors
                        {dCategory === cat
                          ? 'border-[--color-blue-700] bg-[--color-blue-900] text-[--color-blue-300]'
                          : 'border-[--color-border-default] bg-[--color-bg-base] text-[--color-text-muted] hover:border-[--color-border-muted] hover:text-[--color-text-secondary]'}"
                    >{cat}</button>
                  {/each}
                </div>
              </div>

              <!-- Percentage + Qualifier -->
              <div class="space-y-1">
                <label class={lbl}>Percentage <span class="text-[--color-text-disabled] normal-case">(0–100, optional)</span></label>
                <input type="number" min="0" max="100" bind:value={dPercentage} placeholder="—" class={inp} />
              </div>
              <div class="space-y-1">
                <label class={lbl}>Qualifier <span class="text-[--color-text-disabled] normal-case">(e.g. PRD)</span></label>
                <input type="text" bind:value={dQualifier} placeholder="PRD" class={inp} />
              </div>

              <!-- Status + actions -->
              <div class="col-span-2 flex items-center justify-between border-t border-[--color-border-subtle] pt-3">
                <div class="flex items-center gap-3">
                  <span class="font-mono text-xs text-[--color-text-muted]">{dStatus === "published" ? "Published" : "Draft"}</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={dStatus === "published"}
                    onclick={() => (dStatus = dStatus === "published" ? "draft" : "published")}
                    class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors {dStatus === 'published' ? 'bg-emerald-600' : 'bg-[--color-border-strong]'}"
                  ><span class="pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform {dStatus === 'published' ? 'translate-x-4' : 'translate-x-0'}"></span></button>
                </div>
                <div class="flex gap-3">
                  <button type="button" onclick={collapse}
                    class="font-mono text-xs text-[--color-text-disabled] underline-offset-2 hover:underline">Cancel</button>
                  <button
                    type="button"
                    onclick={() => updateEntry(entry.id)}
                    disabled={submitting}
                    class="inline-flex items-center gap-2 rounded border border-[--color-blue-700] bg-[--color-blue-900] px-4 py-1.5 font-mono text-xs text-[--color-blue-300] transition-colors hover:bg-[--color-blue-800] disabled:opacity-40"
                  >{#if submitting}<Spinner />{/if}{submitting ? "Saving…" : "Save changes"}</button>
                </div>
              </div>
            </div>
          </div>
        {/if}
      </div>
    {/each}
  {/if}
</div>
