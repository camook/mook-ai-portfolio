<script lang="ts">
  import type { PageData } from "./$types";
  import type { ExperienceEntry } from "./+page.server";
  import Spinner from "$lib/components/admin/Spinner.svelte";
  import { toast } from "$lib/stores/toast.svelte";
  import { confirm } from "$lib/stores/confirm.svelte";

  let { data }: { data: PageData } = $props();

  // ── State ─────────────────────────────────────────────────────────────────

  let entries = $state<ExperienceEntry[]>([...data.entries]);

  // Expanded edit
  let expandedId   = $state<string | null>(null);
  let isCreating   = $state(false);
  let submitting   = $state(false);
  let deletingId   = $state<string | null>(null);
  let formError    = $state<string | null>(null);

  // Draft fields (shared between create + edit)
  let dYear             = $state(new Date().getFullYear());
  let dYearLabel        = $state("");
  let dRole             = $state("");
  let dCompany          = $state("");
  let dDescription      = $state("");
  let dAchievementLabel = $state("");
  let dAchievementText  = $state("");
  let dStatus           = $state<"published" | "draft">("draft");
  let showAchievement   = $state(false);

  // DnD reorder
  let dragSrcIdx     = $state<number | null>(null);
  let dragOverIdx    = $state<number | null>(null);
  let dragFromHandle = false;
  let reordering     = $state(false);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const inp =
    "w-full rounded border border-[--color-border-default] bg-[--color-bg-base] " +
    "px-3 py-2 font-mono text-sm text-[--color-text-primary] outline-none " +
    "focus:border-[--color-blue-600] placeholder:text-[--color-text-disabled]";

  const lbl = "block font-mono text-[10px] uppercase tracking-widest text-[--color-text-disabled] mb-1";

  function fillDraft(e: ExperienceEntry) {
    dYear             = e.year;
    dYearLabel        = e.year_label ?? "";
    dRole             = e.role_title;
    dCompany          = e.company;
    dDescription      = e.description;
    dAchievementLabel = e.achievement_label ?? "";
    dAchievementText  = e.achievement_text ?? "";
    dStatus           = e.status;
    showAchievement   = !!(e.achievement_label || e.achievement_text);
    formError         = null;
  }

  function resetDraft() {
    dYear             = new Date().getFullYear();
    dYearLabel        = "";
    dRole             = "";
    dCompany          = "";
    dDescription      = "";
    dAchievementLabel = "";
    dAchievementText  = "";
    dStatus           = "draft";
    showAchievement   = false;
    formError         = null;
  }

  function openEdit(entry: ExperienceEntry) {
    isCreating  = false;
    expandedId  = entry.id;
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
      year:              dYear,
      year_label:        dYearLabel.trim() || null,
      role_title:        dRole.trim(),
      company:           dCompany.trim(),
      description:       dDescription,
      achievement_label: showAchievement ? (dAchievementLabel.trim() || null) : null,
      achievement_text:  showAchievement ? (dAchievementText.trim() || null) : null,
      status:            dStatus,
    };
  }

  function validate(): string | null {
    if (!dRole.trim())    return "Role title is required.";
    if (!dCompany.trim()) return "Company is required.";
    if (!dYear || dYear < 1900 || dYear > 2100) return "Enter a valid year.";
    return null;
  }

  // ── Create ────────────────────────────────────────────────────────────────

  async function createEntry() {
    const err = validate();
    if (err) { formError = err; return; }
    submitting = true;
    formError = null;
    try {
      const res = await fetch("/api/admin/experience", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error((json as { error?: string }).error ?? `Error ${res.status}`);
        return;
      }
      entries = [json as ExperienceEntry, ...entries];
      collapse();
      toast.success("Entry created.");
    } catch {
      toast.error("Network error.");
    } finally {
      submitting = false;
    }
  }

  // ── Update ────────────────────────────────────────────────────────────────

  async function updateEntry(id: string) {
    const err = validate();
    if (err) { formError = err; return; }
    submitting = true;
    formError = null;
    try {
      const res = await fetch(`/api/admin/experience/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error((json as { error?: string }).error ?? `Error ${res.status}`);
        return;
      }
      const updated = json as ExperienceEntry;
      entries = entries.map((e) => (e.id === id ? updated : e));
      collapse();
      toast.success("Entry saved.");
    } catch {
      toast.error("Network error.");
    } finally {
      submitting = false;
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async function handleDelete(entry: ExperienceEntry) {
    const ok = await confirm({
      title: "Delete entry?",
      message: `"${entry.role_title} @ ${entry.company}" will be permanently removed.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;

    if (expandedId === entry.id) collapse();
    deletingId = entry.id;
    try {
      const res = await fetch(`/api/admin/experience/${entry.id}`, { method: "DELETE" });
      if (res.ok) {
        entries = entries.filter((e) => e.id !== entry.id);
        toast.success("Entry deleted.");
      } else {
        toast.error("Failed to delete entry.");
      }
    } catch {
      toast.error("Network error.");
    } finally {
      deletingId = null;
    }
  }

  // ── DnD reorder ───────────────────────────────────────────────────────────

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
      const res = await fetch("/api/admin/experience/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: entries.map((e, i) => ({ id: e.id, sort_order: i })) }),
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
    dragSrcIdx = null;
    dragOverIdx = null;
  }

  const STATUS_STYLES = {
    published: "bg-emerald-950 text-emerald-400 border-emerald-900",
    draft:     "bg-amber-950  text-amber-400  border-amber-900",
  };
</script>

<!-- ── Page header ─────────────────────────────────────────────────────────── -->
<div class="flex items-center justify-between">
  <div>
    <h1 class="font-display text-3xl text-[--color-text-primary]">Experience</h1>
    <p class="mt-1 font-mono text-xs text-[--color-text-disabled]">
      {entries.length} {entries.length === 1 ? "entry" : "entries"}
      {#if reordering}· <span class="text-[--color-text-disabled]">saving order…</span>{/if}
    </p>
  </div>
  <button
    type="button"
    onclick={openCreate}
    disabled={isCreating}
    class="rounded border border-[--color-border-muted] bg-[--color-bg-elevated] px-4 py-2 font-mono text-xs text-[--color-text-secondary] transition-colors hover:border-[--color-border-strong] hover:text-[--color-text-primary] disabled:opacity-40"
  >+ New entry</button>
</div>

<!-- ── List container ─────────────────────────────────────────────────────── -->
<div class="mt-6 overflow-hidden rounded border border-[--color-border-subtle]">

  <!-- New entry form -->
  {#if isCreating}
    <div class="border-b border-[--color-border-subtle] bg-[--color-bg-elevated] px-4 py-4">
      <p class="mb-4 font-mono text-[10px] uppercase tracking-widest text-[--color-blue-500]">New entry</p>

      {#if formError}
        <p class="mb-3 rounded border border-red-900 bg-red-950 px-3 py-2 font-mono text-xs text-red-400">{formError}</p>
      {/if}

      <div class="grid grid-cols-2 gap-4">
        <!-- Year + label -->
        <div class="space-y-1">
          <label class={lbl}>Year <span class="text-red-600">*</span></label>
          <input type="number" bind:value={dYear} min="1900" max="2100" class={inp} />
        </div>
        <div class="space-y-1">
          <label class={lbl}>Year label <span class="text-[--color-text-disabled] normal-case">(e.g. CURRENT)</span></label>
          <input type="text" bind:value={dYearLabel} placeholder="CURRENT" class={inp} />
        </div>

        <!-- Role + Company -->
        <div class="space-y-1">
          <label class={lbl}>Role title <span class="text-red-600">*</span></label>
          <input type="text" bind:value={dRole} placeholder="Senior Engineer" class={inp} />
        </div>
        <div class="space-y-1">
          <label class={lbl}>Company <span class="text-red-600">*</span></label>
          <input type="text" bind:value={dCompany} placeholder="Acme Corp" class={inp} />
        </div>

        <!-- Description -->
        <div class="col-span-2 space-y-1">
          <label class={lbl}>Description</label>
          <textarea bind:value={dDescription} rows="3" placeholder="Key responsibilities and context…" class="{inp} resize-none"></textarea>
        </div>

        <!-- Achievement toggle -->
        <div class="col-span-2">
          <button
            type="button"
            onclick={() => (showAchievement = !showAchievement)}
            class="font-mono text-[10px] text-[--color-text-disabled] underline-offset-2 hover:text-[--color-text-muted] hover:underline"
          >{showAchievement ? "− Remove achievement" : "+ Add achievement"}</button>
        </div>

        {#if showAchievement}
          <div class="space-y-1">
            <label class={lbl}>Achievement label <span class="text-[--color-text-disabled] normal-case">(e.g. HIGHLIGHT)</span></label>
            <input type="text" bind:value={dAchievementLabel} placeholder="HIGHLIGHT" class={inp} />
          </div>
          <div class="space-y-1">
            <label class={lbl}>Achievement text</label>
            <textarea bind:value={dAchievementText} rows="2" placeholder="Shipped X, resulting in Y…" class="{inp} resize-none"></textarea>
          </div>
        {/if}

        <!-- Status + actions -->
        <div class="col-span-2 flex items-center justify-between border-t border-[--color-border-subtle] pt-3">
          <!-- Status toggle -->
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
            >
              {#if submitting}<Spinner />{/if}
              {submitting ? "Saving…" : "Create entry"}
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Empty state -->
  {#if entries.length === 0 && !isCreating}
    <div class="px-6 py-12 text-center font-mono text-sm text-[--color-text-disabled]">
      No entries yet. <button type="button" onclick={openCreate} class="underline underline-offset-2">Create one →</button>
    </div>

  {:else if entries.length > 0}
    <!-- Column header -->
    <div class="grid grid-cols-[1.5rem_5rem_1fr_5.5rem_7rem] items-center gap-x-3 border-b border-[--color-border-subtle] bg-[--color-bg-muted] px-3 py-1.5">
      <span></span>
      <span class="font-mono text-[10px] uppercase tracking-widest text-[--color-text-disabled]">Year</span>
      <span class="font-mono text-[10px] uppercase tracking-widest text-[--color-text-disabled]">Role · Company</span>
      <span class="font-mono text-[10px] uppercase tracking-widest text-[--color-text-disabled]">Status</span>
      <span></span>
    </div>

    {#each entries as entry, idx (entry.id)}
      {@const isSrc    = dragSrcIdx === idx}
      {@const isTarget = dragOverIdx === idx && dragSrcIdx !== idx}
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
        <!-- ── Collapsed row ────────────────────────────────────────────── -->
        <div
          class="grid grid-cols-[1.5rem_5rem_1fr_5.5rem_7rem] items-center gap-x-3 px-3 py-3 transition-colors
            {isExpanded ? 'bg-[--color-bg-elevated]' : 'bg-[--color-bg-subtle] hover:bg-[--color-bg-muted]'}"
        >
          <!-- Drag handle -->
          <span
            onpointerdown={() => (dragFromHandle = true)}
            class="cursor-grab select-none text-center font-mono text-sm text-[--color-text-disabled] active:cursor-grabbing"
          >⠿</span>

          <!-- Year -->
          <div>
            <p class="font-mono text-sm tabular-nums text-[--color-text-primary]">{entry.year}</p>
            {#if entry.year_label}
              <p class="font-mono text-[10px] uppercase tracking-wider text-[--color-text-disabled]">{entry.year_label}</p>
            {/if}
          </div>

          <!-- Role @ Company -->
          <div class="min-w-0">
            <p class="truncate font-mono text-sm text-[--color-text-primary]">{entry.role_title}</p>
            <p class="truncate font-mono text-xs text-[--color-text-muted]">{entry.company}</p>
          </div>

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

        <!-- ── Expanded edit form ─────────────────────────────────────── -->
        {#if isExpanded}
          <div class="border-t border-[--color-border-subtle] bg-[--color-bg-elevated] px-4 py-4">

            {#if formError}
              <p class="mb-3 rounded border border-red-900 bg-red-950 px-3 py-2 font-mono text-xs text-red-400">{formError}</p>
            {/if}

            <div class="grid grid-cols-2 gap-4">
              <!-- Year + label -->
              <div class="space-y-1">
                <label class={lbl}>Year <span class="text-red-600">*</span></label>
                <input type="number" bind:value={dYear} min="1900" max="2100" class={inp} />
              </div>
              <div class="space-y-1">
                <label class={lbl}>Year label</label>
                <input type="text" bind:value={dYearLabel} placeholder="CURRENT" class={inp} />
              </div>

              <!-- Role + Company -->
              <div class="space-y-1">
                <label class={lbl}>Role title <span class="text-red-600">*</span></label>
                <input type="text" bind:value={dRole} placeholder="Senior Engineer" class={inp} />
              </div>
              <div class="space-y-1">
                <label class={lbl}>Company <span class="text-red-600">*</span></label>
                <input type="text" bind:value={dCompany} placeholder="Acme Corp" class={inp} />
              </div>

              <!-- Description -->
              <div class="col-span-2 space-y-1">
                <label class={lbl}>Description</label>
                <textarea bind:value={dDescription} rows="3" placeholder="Key responsibilities and context…" class="{inp} resize-none"></textarea>
              </div>

              <!-- Achievement toggle -->
              <div class="col-span-2">
                <button
                  type="button"
                  onclick={() => (showAchievement = !showAchievement)}
                  class="font-mono text-[10px] text-[--color-text-disabled] underline-offset-2 hover:text-[--color-text-muted] hover:underline"
                >{showAchievement ? "− Remove achievement" : "+ Add achievement"}</button>
              </div>

              {#if showAchievement}
                <div class="space-y-1">
                  <label class={lbl}>Achievement label</label>
                  <input type="text" bind:value={dAchievementLabel} placeholder="HIGHLIGHT" class={inp} />
                </div>
                <div class="space-y-1">
                  <label class={lbl}>Achievement text</label>
                  <textarea bind:value={dAchievementText} rows="2" placeholder="Shipped X, resulting in Y…" class="{inp} resize-none"></textarea>
                </div>
              {/if}

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
                  >
                    {#if submitting}<Spinner />{/if}
                    {submitting ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        {/if}
      </div>
    {/each}
  {/if}
</div>
