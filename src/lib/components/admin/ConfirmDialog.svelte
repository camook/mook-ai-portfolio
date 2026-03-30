<script lang="ts">
  import { confirmState, answerConfirm } from "$lib/stores/confirm.svelte";
  import { fade, scale } from "svelte/transition";

  function onKeydown(e: KeyboardEvent) {
    if (confirmState.open && e.key === "Escape") {
      e.preventDefault();
      answerConfirm(false);
    }
  }
</script>

<svelte:window onkeydown={onKeydown} />

{#if confirmState.open}
  <!-- Backdrop -->
  <div
    role="presentation"
    transition:fade={{ duration: 150 }}
    class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
    onclick={() => answerConfirm(false)}
  ></div>

  <!-- Dialog -->
  <div
    role="dialog"
    aria-modal="true"
    aria-labelledby={confirmState.title ? "confirm-title" : undefined}
    aria-describedby="confirm-body"
    transition:scale={{ start: 0.95, duration: 180 }}
    class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
  >
    <div class="pointer-events-auto w-full max-w-sm rounded border border-[--color-border-muted] bg-[--color-bg-elevated] p-6 shadow-2xl">
      {#if confirmState.title}
        <h2
          id="confirm-title"
          class="mb-2 font-mono text-sm font-medium text-[--color-text-primary]"
        >{confirmState.title}</h2>
      {/if}

      <p
        id="confirm-body"
        class="font-mono text-sm leading-relaxed text-[--color-text-muted]"
      >{confirmState.message}</p>

      <div class="mt-5 flex justify-end gap-3">
        <button
          type="button"
          onclick={() => answerConfirm(false)}
          class="rounded border border-[--color-border-default] bg-[--color-bg-base] px-4 py-2 font-mono text-xs text-[--color-text-secondary] transition-colors hover:border-[--color-border-muted] hover:text-[--color-text-primary]"
        >Cancel</button>

        <button
          type="button"
          onclick={() => answerConfirm(true)}
          class="rounded border px-4 py-2 font-mono text-xs transition-colors
            {confirmState.danger
              ? 'border-red-800 bg-red-950 text-red-300 hover:bg-red-900 hover:border-red-700'
              : 'border-[--color-blue-700] bg-[--color-blue-900] text-[--color-blue-300] hover:bg-[--color-blue-800]'}"
        >{confirmState.confirmLabel}</button>
      </div>
    </div>
  </div>
{/if}
