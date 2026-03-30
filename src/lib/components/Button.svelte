<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    variant?: 'primary' | 'ghost' | 'text';
    size?: 'sm' | 'md' | 'lg';
    href?: string;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    class?: string;
    onclick?: (e: MouseEvent) => void;
    children: Snippet;
  }

  let {
    variant = 'primary',
    size = 'md',
    href,
    disabled = false,
    type = 'button',
    class: extraClass = '',
    onclick,
    children,
  }: Props = $props();

  const base =
    'inline-flex items-center justify-center gap-2 rounded font-sans font-medium leading-none ' +
    'transition-[color,background-color,border-color,box-shadow,transform] duration-150 ' +
    'focus-visible:outline-none select-none cursor-pointer ' +
    'active:scale-[0.96]';

  const sizes: Record<string, string> = {
    sm: 'px-3.5 py-2 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-base',
  };

  const variants: Record<string, string> = {
    primary:
      'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 ' +
      'focus-visible:ring-2 focus-visible:ring-blue-500/40',
    ghost:
      'border border-border-muted text-text-secondary hover:border-border-strong ' +
      'hover:text-text-primary hover:bg-bg-elevated active:bg-bg-muted ' +
      'focus-visible:ring-2 focus-visible:ring-border-strong/60',
    text:
      'text-text-secondary hover:text-text-primary underline-offset-4 hover:underline ' +
      'active:opacity-60 focus-visible:underline',
  };

  const disabledClass = 'opacity-40 cursor-not-allowed pointer-events-none';

  const cls = [base, sizes[size], variants[variant], disabled ? disabledClass : '', extraClass]
    .filter(Boolean)
    .join(' ');
</script>

{#if href}
  <a {href} class={cls} aria-disabled={disabled}>
    {@render children()}
  </a>
{:else}
  <button {type} {disabled} class={cls} {onclick}>
    {@render children()}
  </button>
{/if}
