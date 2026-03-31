<script lang="ts">
  import type { PageData } from "./$types";
  import type { ContactSubmission } from "./+page.server";
  import Spinner from "$lib/components/admin/Spinner.svelte";
  import { toast } from "$lib/stores/toast.svelte";
  import { confirm } from "$lib/stores/confirm.svelte";

  let { data }: { data: PageData } = $props();

  // ── State ─────────────────────────────────────────────────────────────────

  let submissions = $state<ContactSubmission[]>([...data.submissions]);
  let expandedId  = $state<string | null>(null);
  let togglingId  = $state<string | null>(null);
  let deletingId  = $state<string | null>(null);

  // ── Derived ───────────────────────────────────────────────────────────────

  let unreadCount = $derived(submissions.filter((s) => !s.read).length);

  // ── Helpers ───────────────────────────────────────────────────────────────

  function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day:   "numeric",
      year:  "numeric",
    }) + " · " + d.toLocaleTimeString("en-US", {
      hour:   "2-digit",
      minute: "2-digit",
    });
  }

  function toggle(id: string) {
    expandedId = expandedId === id ? null : id;
  }

  // ── Mark read / unread ────────────────────────────────────────────────────

  async function setRead(submission: ContactSubmission, read: boolean) {
    togglingId = submission.id;
    try {
      const res = await fetch(`/api/admin/contact/${submission.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ read }),
      });
      if (!res.ok) {
        toast.error("Failed to update status.");
        return;
      }
      submissions = submissions.map((s) =>
        s.id === submission.id ? { ...s, read: read ? 1 : 0 } : s,
      );
    } catch {
      toast.error("Network error.");
    } finally {
      togglingId = null;
    }
  }

  // Auto-mark as read when expanding an unread message
  async function expand(submission: ContactSubmission) {
    toggle(submission.id);
    if (!submission.read && expandedId === submission.id) {
      await setRead(submission, true);
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async function handleDelete(submission: ContactSubmission) {
    const ok = await confirm({
      title:        "Delete submission?",
      message:      `Message from ${submission.name} will be permanently removed.`,
      confirmLabel: "Delete",
      danger:       true,
    });
    if (!ok) return;

    if (expandedId === submission.id) expandedId = null;
    deletingId = submission.id;
    try {
      const res = await fetch(`/api/admin/contact/${submission.id}`, { method: "DELETE" });
      if (res.ok) {
        submissions = submissions.filter((s) => s.id !== submission.id);
        toast.success("Submission deleted.");
      } else {
        toast.error("Failed to delete submission.");
      }
    } catch {
      toast.error("Network error.");
    } finally {
      deletingId = null;
    }
  }

  // ── Styles ────────────────────────────────────────────────────────────────

  const lbl =
    "block font-mono text-[10px] uppercase tracking-widest text-[--color-text-disabled] mb-1";
</script>

<!-- ── Page header ─────────────────────────────────────────────────────────── -->
<div class="flex items-center justify-between">
  <div>
    <h1 class="font-display text-3xl text-[--color-text-primary]">Contact</h1>
    <p class="mt-1 font-mono text-xs text-[--color-text-disabled]">
      {submissions.length} {submissions.length === 1 ? "submission" : "submissions"}
      {#if unreadCount > 0}
        · <span class="text-[--color-blue-400]">{unreadCount} unread</span>
      {/if}
    </p>
  </div>
</div>

<!-- ── List container ─────────────────────────────────────────────────────── -->
<div class="mt-6 overflow-hidden rounded border border-[--color-border-subtle]">

  <!-- Empty state -->
  {#if submissions.length === 0}
    <div class="px-6 py-12 text-center font-mono text-sm text-[--color-text-disabled]">
      No submissions yet.
    </div>

  {:else}
    <!-- Column header -->
    <div class="grid grid-cols-[2rem_1fr_1fr_10rem_7rem] items-center gap-x-3 border-b border-[--color-border-subtle] bg-[--color-bg-muted] px-3 py-1.5 min-w-[560px]">
      <span></span>
      <span class="font-mono text-[10px] uppercase tracking-widest text-[--color-text-disabled]">Name</span>
      <span class="font-mono text-[10px] uppercase tracking-widest text-[--color-text-disabled]">Email</span>
      <span class="font-mono text-[10px] uppercase tracking-widest text-[--color-text-disabled]">Date</span>
      <span></span>
    </div>

    <div class="overflow-x-auto">
      {#each submissions as submission (submission.id)}
        {@const isExpanded = expandedId === submission.id}
        {@const isUnread   = !submission.read}

        <div class="border-b border-[--color-border-subtle] last:border-b-0">
          <!-- Collapsed row -->
          <div
            class="grid grid-cols-[2rem_1fr_1fr_10rem_7rem] items-center gap-x-3 px-3 py-3 min-w-[560px] transition-colors
              {isExpanded ? 'bg-[--color-bg-elevated]' : isUnread ? 'bg-[--color-bg-subtle] hover:bg-[--color-bg-muted]' : 'hover:bg-[--color-bg-subtle]'}"
          >
            <!-- Unread indicator -->
            <span class="flex items-center justify-center">
              {#if isUnread}
                <span class="h-2 w-2 rounded-full bg-[--color-blue-500]" title="Unread"></span>
              {/if}
            </span>

            <!-- Name -->
            <p
              class="truncate font-mono text-sm cursor-pointer
                {isUnread ? 'font-semibold text-[--color-text-primary]' : 'text-[--color-text-secondary]'}"
              onclick={() => expand(submission)}
              role="button"
              tabindex="0"
              onkeydown={(e) => e.key === "Enter" && expand(submission)}
            >
              {submission.name}
            </p>

            <!-- Email -->
            <p class="truncate font-mono text-sm text-[--color-text-muted]">{submission.email}</p>

            <!-- Date -->
            <p class="font-mono text-xs text-[--color-text-disabled] whitespace-nowrap">{formatDate(submission.created_at)}</p>

            <!-- Actions -->
            <div class="flex items-center justify-end gap-2">
              <button
                type="button"
                onclick={() => (isExpanded ? (expandedId = null) : expand(submission))}
                class="font-mono text-xs transition-colors {isExpanded ? 'text-[--color-blue-500]' : 'text-[--color-text-muted] hover:text-[--color-text-secondary]'}"
              >
                {isExpanded ? "Close" : "View"}
              </button>
              <button
                type="button"
                onclick={() => handleDelete(submission)}
                disabled={deletingId === submission.id}
                class="inline-flex items-center gap-1 font-mono text-xs text-[--color-text-disabled] transition-colors hover:text-red-400 disabled:opacity-40"
              >
                {#if deletingId === submission.id}<Spinner />{:else}Delete{/if}
              </button>
            </div>
          </div>

          <!-- Expanded detail -->
          {#if isExpanded}
            <div class="border-t border-[--color-border-subtle] bg-[--color-bg-elevated] px-4 py-4 min-w-[560px]">
              <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p class={lbl}>From</p>
                  <p class="font-mono text-sm text-[--color-text-primary]">{submission.name}</p>
                </div>
                <div>
                  <p class={lbl}>Email</p>
                  <a
                    href="mailto:{submission.email}"
                    class="font-mono text-sm text-[--color-blue-400] underline-offset-2 hover:underline"
                  >{submission.email}</a>
                </div>
                <div class="col-span-2">
                  <p class={lbl}>Received</p>
                  <p class="font-mono text-xs text-[--color-text-muted]">{formatDate(submission.created_at)}</p>
                </div>
              </div>

              <div>
                <p class={lbl}>Message</p>
                <p class="whitespace-pre-wrap font-sans text-sm text-[--color-text-primary] leading-relaxed">{submission.message}</p>
              </div>

              <div class="mt-4 flex items-center gap-3">
                {#if submission.read}
                  <button
                    type="button"
                    onclick={() => setRead(submission, false)}
                    disabled={togglingId === submission.id}
                    class="inline-flex items-center gap-2 rounded border border-[--color-border-default] bg-[--color-bg-base] px-3 py-1.5 font-mono text-xs text-[--color-text-muted] transition-colors hover:border-[--color-border-muted] hover:text-[--color-text-secondary] disabled:opacity-40"
                  >
                    {#if togglingId === submission.id}<Spinner />{/if}
                    Mark as unread
                  </button>
                {:else}
                  <button
                    type="button"
                    onclick={() => setRead(submission, true)}
                    disabled={togglingId === submission.id}
                    class="inline-flex items-center gap-2 rounded border border-[--color-border-default] bg-[--color-bg-base] px-3 py-1.5 font-mono text-xs text-[--color-text-muted] transition-colors hover:border-[--color-border-muted] hover:text-[--color-text-secondary] disabled:opacity-40"
                  >
                    {#if togglingId === submission.id}<Spinner />{/if}
                    Mark as read
                  </button>
                {/if}

                <a
                  href="mailto:{submission.email}?subject=Re: Your message"
                  class="inline-flex items-center gap-2 rounded border border-[--color-blue-700] bg-[--color-blue-900] px-3 py-1.5 font-mono text-xs text-[--color-blue-300] transition-colors hover:bg-[--color-blue-800]"
                >
                  Reply via email →
                </a>
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>
