<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    label: string;
    icon?: Snippet;
    class?: string;
  }

  let { label, icon, class: extraClass = '' }: Props = $props();
</script>

<span
  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border-subtle
         bg-bg-subtle text-text-muted font-mono text-[0.75rem] leading-none tracking-wide
         transition-colors duration-150 hover:border-border-muted hover:text-text-secondary
         hover:bg-bg-elevated {extraClass}"
>
  {#if icon}
    <span class="size-3.5 shrink-0">{@render icon()}</span>
  {/if}
  {label}
</span>
