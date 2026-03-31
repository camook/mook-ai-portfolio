<script lang="ts">
  import type { PageData } from "./$types";
  import type { StatEntry } from "./+page.server";
  import Spinner from "$lib/components/admin/Spinner.svelte";
  import { toast } from "$lib/stores/toast.svelte";
  import { confirm } from "$lib/stores/confirm.svelte";

  let { data }: { data: PageData } = $props();

  // ── State ─────────────────────────────────────────────────────────────────

  let entries = $state<StatEntry[]>([...data.entries]);

  let expandedId  = $state<string | null>(null);
  let isCreating  = $state(false);
  let submitting  = $state(false);
  let deletingId  = $state<string | null>(null);
  let formError   = $state<string | null>(null);

  // Draft fields
  let dSection = $state<"tech_stack" | "hero">("hero");
  let dLabel   = $state("");
  let dValue   = $state("");
  let dUnit    = $state("");

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

  const SECTION_STYLES = {
    hero:       "bg-purple-950 text-purple-400 border-purple-900",
    tech_stack: "bg-teal-950  text-teal-400  border-teal-900",
  };

  const SECTIONS: Array<"hero" | "tech_stack"> = ["hero", "tech_stack"];

  // ── Helpers ───────────────────────────────────────────────────────────────

  function fillDraft(e: StatEntry) {
    dSection = e.section;
    dLabel   = e.label;
    dValue   = e.value;
    dUnit    = e.unit;
    formError = null;
  }

  function resetDraft() {
    dSection  = "hero";
    dLabel    = "";
    dValue    = "";
    dUnit     = "";
    formError = null;
  }

  function openEdit(entry: StatEntry) {
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
      section: dSection,
      label:   dLabel.trim(),
      value:   dValue.trim(),
      unit:    dUnit.trim(),
    };
  }

  function validate(): string | null {
    if (!dLabel.trim()) return "Label is required.";
    if (!dValue.trim()) return "Value is required.";
    return null;
  }

  // ── Create ────────────────────────────────────────────────────────────────

  async function createEntry() {
    const err = validate();
    if (err) { formError = err; return; }
    submitting = true;
    formError  = null;
    try {
      const res = await fetch("/api/admin/stats", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(buildPayload()),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error((json as { error?: string }).error ?? `Error ${res.status}`);
        return;
      }
      entries = [...entries, json as StatEntry];
      collapse();
      toast.success("Stat created.");
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
      const res = await fetch(`/api/admin/stats/${id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(buildPayload()),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error((json as { error?: string }).error ?? `Error ${res.status}`);
        return;
      }
      const updated = json as StatEntry;
      entries = entries.map((e) => (e.id === id ? updated : e));
      collapse();
      toast.success("Stat saved.");
    } catch { toast.error("Network error."); }
    finally  { submitting = false; }
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async function handleDelete(entry: StatEntry) {
    const ok = await confirm({
      title: "Delete stat?",
      message: `"${entry.label}" will be permanently removed.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;

    if (expandedId === entry.id) collapse();
    deletingId = entry.id;
    try {
      const res = await fetch(`/api/admin/stats/${entry.id}`, { method: "DELETE" });
      if (res.ok) {
        entries = entries.filter((e) => e.id !== entry.id);
        toast.success("Stat deleted.");
      } else {
        toast.error("Failed to delete stat.");
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
      const res = await fetch("/api/admin/stats/reorder", {
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
    <h1 class="font-display text-3xl text-[--color-text-primary]">Stats</h1>
    <p class="mt-1 font-mono text-xs text-[--color-text-disabled]">
      {entries.length} {entries.length === 1 ? "stat" : "stats"}
      {#if reordering}· <span class="text-[--color-text-disabled]">saving order…</span>{/if}
    </p>
  </div>
  <button
    type="button"
    onclick={openCreate}
    disabled={isCreating}
    class="rounded border border-[--color-border-muted] bg-[--color-bg-elevated] px-4 py-2 font-mono text-xs text-[--color-text-secondary] transition-colors hover:border-[--color-border-strong] hover:text-[--color-text-primary] disabled:opacity-40"
  >+ New stat</button>
</div>

<!-- ── List container ─────────────────────────────────────────────────────── -->
<div class="mt-6 overflow-hidden rounded border border-[--color-border-subtle]">

  <!-- New stat form -->
  {#if isCreating}
    <div class="border-b border-[--color-border-subtle] bg-[--color-bg-elevated] px-4 py-4">
      <p class="mb-4 font-mono text-[10px] uppercase tracking-widest text-[--color-blue-500]">New stat</p>

      {#if formError}
        <p class="mb-3 rounded border border-red-900 bg-red-950 px-3 py-2 font-mono text-xs text-red-400">{formError}</p>
      {/if}

      <div class="grid grid-cols-2 gap-4">
        <!-- Section -->
        <div class="col-span-2 space-y-1">
          <label class={lbl}>Section</label>
          <div class="flex gap-1">
            {#each SECTIONS as sec (sec)}
              <button
                type="button"
                onclick={() => (dSection = sec)}
                class="rounded border px-3 py-1.5 font-mono text-xs transition-colors
                  {dSection === sec
                    ? 'border-[--color-blue-700] bg-[--color-blue-900] text-[--color-blue-300]'
                    : 'border-[--color-border-default] bg-[--color-bg-base] text-[--color-text-muted] hover:border-[--color-border-muted] hover:text-[--color-text-secondary]'}"
              >{sec === "tech_stack" ? "tech stack" : sec}</button>
            {/each}
          </div>
        </div>

        <!-- Label + Value -->
        <div class="space-y-1">
          <label class={lbl}>Label <span class="text-red-600">*</span></label>
          <input type="text" bind:value={dLabel} placeholder="Reference Rate" class={inp} />
        </div>
        <div class="space-y-1">
          <label class={lbl}>Value <span class="text-red-600">*</span></label>
          <input type="text" bind:value={dValue} placeholder="12k" class={inp} />
        </div>

        <!-- Unit -->
        <div class="space-y-1">
          <label class={lbl}>Unit <span class="text-[--color-text-disabled] normal-case">(optional)</span></label>
          <input type="text" bind:value={dUnit} placeholder="req/s" class={inp} />
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-3 self-end pb-0.5">
          <button type="button" onclick={collapse} class="font-mono text-xs text-[--color-text-disabled] underline-offset-2 hover:underline">Cancel</button>
          <button
            type="button"
            onclick={createEntry}
            disabled={submitting}
            class="inline-flex items-center gap-2 rounded border border-[--color-blue-700] bg-[--color-blue-900] px-4 py-1.5 font-mono text-xs text-[--color-blue-300] transition-colors hover:bg-[--color-blue-800] disabled:opacity-40"
          >{#if submitting}<Spinner />{/if}{submitting ? "Saving…" : "Create stat"}</button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Empty state -->
  {#if entries.length === 0 && !isCreating}
    <div class="px-6 py-12 text-center font-mono text-sm text-[--color-text-disabled]">
      No stats yet. <button type="button" onclick={openCreate} class="underline underline-offset-2">Add one →</button>
    </div>

  {:else if entries.length > 0}
    <!-- Column header -->
    <div class="grid grid-cols-[1.5rem_5.5rem_1fr_1fr_7.5rem] items-center gap-x-3 border-b border-[--color-border-subtle] bg-[--color-bg-muted] px-3 py-1.5">
      <span></span>
      <span class="font-mono text-[10px] uppercase tracking-widest text-[--color-text-disabled]">Section</span>
      <span class="font-mono text-[10px] uppercase tracking-widest text-[--color-text-disabled]">Label</span>
      <span class="font-mono text-[10px] uppercase tracking-widest text-[--color-text-disabled]">Value</span>
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
          class="grid grid-cols-[1.5rem_5.5rem_1fr_1fr_7.5rem] items-center gap-x-3 px-3 py-3 transition-colors
            {isExpanded ? 'bg-[--color-bg-elevated]' : 'bg-[--color-bg-subtle] hover:bg-[--color-bg-muted]'}"
        >
          <!-- Drag handle -->
          <span
            onpointerdown={() => (dragFromHandle = true)}
            class="cursor-grab select-none text-center font-mono text-sm text-[--color-text-disabled] active:cursor-grabbing"
          >⠿</span>

          <!-- Section badge -->
          <span class="inline-flex w-fit items-center rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide {SECTION_STYLES[entry.section]}">
            {entry.section === "tech_stack" ? "tech" : entry.section}
          </span>

          <!-- Label -->
          <p class="truncate font-mono text-sm text-[--color-text-primary]">{entry.label}</p>

          <!-- Value + unit -->
          <p class="truncate font-mono text-sm text-[--color-text-muted]">
            {entry.value}{entry.unit ? ` ${entry.unit}` : ""}
          </p>

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
              <!-- Section -->
              <div class="col-span-2 space-y-1">
                <label class={lbl}>Section</label>
                <div class="flex gap-1">
                  {#each SECTIONS as sec (sec)}
                    <button
                      type="button"
                      onclick={() => (dSection = sec)}
                      class="rounded border px-3 py-1.5 font-mono text-xs transition-colors
                        {dSection === sec
                          ? 'border-[--color-blue-700] bg-[--color-blue-900] text-[--color-blue-300]'
                          : 'border-[--color-border-default] bg-[--color-bg-base] text-[--color-text-muted] hover:border-[--color-border-muted] hover:text-[--color-text-secondary]'}"
                    >{sec === "tech_stack" ? "tech stack" : sec}</button>
                  {/each}
                </div>
              </div>

              <!-- Label + Value -->
              <div class="space-y-1">
                <label class={lbl}>Label <span class="text-red-600">*</span></label>
                <input type="text" bind:value={dLabel} placeholder="Reference Rate" class={inp} />
              </div>
              <div class="space-y-1">
                <label class={lbl}>Value <span class="text-red-600">*</span></label>
                <input type="text" bind:value={dValue} placeholder="12k" class={inp} />
              </div>

              <!-- Unit + actions -->
              <div class="space-y-1">
                <label class={lbl}>Unit <span class="text-[--color-text-disabled] normal-case">(optional)</span></label>
                <input type="text" bind:value={dUnit} placeholder="req/s" class={inp} />
              </div>

              <div class="flex items-end justify-end gap-3 pb-0.5">
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
        {/if}
      </div>
    {/each}
  {/if}
</div>
