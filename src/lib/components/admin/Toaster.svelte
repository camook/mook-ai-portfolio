<script lang="ts">
  import { toast } from "$lib/stores/toast.svelte";
  import { fly } from "svelte/transition";

  const ICON: Record<string, string> = {
    success: "✓",
    error: "✕",
    info: "i",
  };

  const WRAPPER: Record<string, string> = {
    success: "border-emerald-800 bg-emerald-950 text-emerald-300",
    error: "border-red-800 bg-red-950 text-red-300",
    info: "border-[--color-blue-800] bg-[--color-blue-950] text-[--color-blue-300]",
  };

  const ICON_COLOR: Record<string, string> = {
    success: "text-emerald-400",
    error: "text-red-400",
    info: "text-[--color-blue-400]",
  };
</script>

<div
  aria-live="polite"
  aria-atomic="false"
  class="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2"
>
  {#each toast.items as item (item.id)}
    <div
      role="alert"
      transition:fly={{ x: 20, duration: 200 }}
      class="pointer-events-auto flex w-full max-w-xs items-start gap-3 rounded border px-4 py-3 shadow-xl {WRAPPER[item.type]}"
    >
      <!-- Icon -->
      <span class="mt-px shrink-0 font-mono text-xs font-bold {ICON_COLOR[item.type]}">
        {ICON[item.type]}
      </span>

      <!-- Message -->
      <p class="flex-1 font-mono text-xs leading-relaxed">{item.message}</p>

      <!-- Dismiss -->
      <button
        type="button"
        onclick={() => toast.dismiss(item.id)}
        aria-label="Dismiss"
        class="shrink-0 opacity-50 transition-opacity hover:opacity-100"
      >×</button>
    </div>
  {/each}
</div>
