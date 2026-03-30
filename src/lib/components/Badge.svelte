<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    variant?: 'info' | 'success' | 'warning' | 'error' | 'neutral';
    dot?: boolean;
    class?: string;
    children: Snippet;
  }

  let { variant = 'neutral', dot = false, class: extraClass = '', children }: Props = $props();

  const base =
    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-label border leading-none';

  const variants: Record<string, string> = {
    info:    'bg-blue-950/60 text-blue-400 border-blue-900/60',
    success: 'bg-green-950/60 text-green-400 border-green-900/60',
    warning: 'bg-amber-950/60 text-amber-400 border-amber-900/60',
    error:   'bg-red-950/60 text-red-400 border-red-900/60',
    neutral: 'bg-bg-elevated text-text-muted border-border-default',
  };

  const dotColors: Record<string, string> = {
    info:    'bg-blue-400',
    success: 'bg-green-400',
    warning: 'bg-amber-400',
    error:   'bg-red-400',
    neutral: 'bg-text-disabled',
  };

  const cls = [base, variants[variant], extraClass].filter(Boolean).join(' ');
</script>

<span class={cls}>
  {#if dot}
    <span class="size-1.5 rounded-full shrink-0 {dotColors[variant]}"></span>
  {/if}
  {@render children()}
</span>
