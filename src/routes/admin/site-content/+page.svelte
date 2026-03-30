<script lang="ts">
  import type { PageData } from "./$types";
  import type { SiteContentEntry } from "./+page.server";
  import Spinner from "$lib/components/admin/Spinner.svelte";
  import { toast } from "$lib/stores/toast.svelte";

  let { data }: { data: PageData } = $props();

  // ── Local state per entry ──────────────────────────────────────────────────

  type Item = SiteContentEntry & {
    draft:   string;
    saving:  boolean;
    saved:   boolean;   // flash indicator
    error:   string | null;
  };

  let items = $state<Item[]>(
    data.entries.map((e) => ({
      ...e,
      draft:  e.value,
      saving: false,
      saved:  false,
      error:  null,
    })),
  );

  // ── Save handler ──────────────────────────────────────────────────────────

  async function save(item: Item) {
    if (item.draft === item.value) return; // no change
    item.saving = true;
    item.error  = null;
    try {
      const res = await fetch(`/api/admin/site-content/${encodeURIComponent(item.key)}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ value: item.draft }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = (json as { error?: string }).error ?? `Error ${res.status}`;
        item.error = msg;
        toast.error(msg);
        return;
      }
      item.value      = item.draft;
      item.updated_at = (json as { updated_at?: string }).updated_at ?? item.updated_at;
      item.error      = null;
      item.saved      = true;
      toast.success(`"${item.key}" saved.`);
      setTimeout(() => { item.saved = false; }, 2500);
    } catch {
      item.error = "Network error.";
      toast.error("Network error.");
    } finally {
      item.saving = false;
    }
  }

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleString(undefined, {
        month: "short", day: "numeric", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch { return iso; }
  }
</script>

<!-- ── Page header ─────────────────────────────────────────────────────────── -->
<div>
  <h1 class="font-display text-3xl text-[--color-text-primary]">Site Content</h1>
  <p class="mt-1 font-mono text-xs text-[--color-text-disabled]">
    {items.length} {items.length === 1 ? "key" : "keys"} · edits save immediately
  </p>
</div>

<!-- ── Key/value list ──────────────────────────────────────────────────────── -->
{#if items.length === 0}
  <div class="mt-6 rounded border border-[--color-border-subtle] px-6 py-12 text-center font-mono text-sm text-[--color-text-disabled]">
    No site content keys found. Seed the <code class="rounded bg-[--color-bg-elevated] px-1">site_content</code> table to get started.
  </div>
{:else}
  <div class="mt-6 space-y-3">
    {#each items as item (item.key)}
      <div class="rounded border border-[--color-border-subtle] bg-[--color-bg-subtle]">
        <!-- Key header row -->
        <div class="flex items-center justify-between border-b border-[--color-border-subtle] px-4 py-2">
          <code class="font-mono text-xs text-[--color-text-secondary]">{item.key}</code>
          <div class="flex items-center gap-3">
            {#if item.error}
              <span class="font-mono text-[10px] text-red-400">{item.error}</span>
            {:else if item.saved}
              <span class="font-mono text-[10px] text-emerald-400">✓ Saved</span>
            {:else if item.draft !== item.value}
              <span class="font-mono text-[10px] text-[--color-text-disabled]">unsaved</span>
            {/if}
            <span class="font-mono text-[10px] text-[--color-text-disabled]">
              updated {formatDate(item.updated_at)}
            </span>
          </div>
        </div>

        <!-- Value editor -->
        <div class="px-4 py-3">
          <textarea
            bind:value={item.draft}
            rows="4"
            class="w-full resize-y rounded border border-[--color-border-default] bg-[--color-bg-base] px-3 py-2 font-mono text-sm text-[--color-text-primary] outline-none focus:border-[--color-blue-600] placeholder:text-[--color-text-disabled]"
            placeholder="Enter value…"
          ></textarea>
          <div class="mt-2 flex items-center justify-between">
            <button
              type="button"
              onclick={() => { item.draft = item.value; item.error = null; }}
              disabled={item.draft === item.value || item.saving}
              class="font-mono text-[10px] text-[--color-text-disabled] underline-offset-2 hover:text-[--color-text-muted] hover:underline disabled:pointer-events-none disabled:opacity-40"
            >Revert</button>
            <button
              type="button"
              onclick={() => save(item)}
              disabled={item.draft === item.value || item.saving}
              class="inline-flex items-center gap-2 rounded border border-[--color-blue-700] bg-[--color-blue-900] px-4 py-1.5 font-mono text-xs text-[--color-blue-300] transition-colors hover:bg-[--color-blue-800] disabled:opacity-40"
            >{#if item.saving}<Spinner />{/if}{item.saving ? "Saving…" : "Save"}</button>
          </div>
        </div>
      </div>
    {/each}
  </div>
{/if}
