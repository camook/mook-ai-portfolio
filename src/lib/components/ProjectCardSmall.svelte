<script lang="ts">
  import Badge from './Badge.svelte';
  import TechPill from './TechPill.svelte';

  interface Props {
    title: string;
    description: string;
    tags?: string[];
    href?: string;
    index?: string;
    year?: string;
    status?: 'info' | 'success' | 'warning' | 'error' | 'neutral';
    statusLabel?: string;
    class?: string;
  }

  let {
    title,
    description,
    tags = [],
    href,
    index,
    year,
    status,
    statusLabel,
    class: extraClass = '',
  }: Props = $props();
</script>

<article
  class="group relative flex flex-col gap-4 rounded-xl border border-border-subtle bg-bg-elevated
         p-5 overflow-hidden transition-all duration-300
         hover:-translate-y-0.5 hover:border-border-muted hover:bg-bg-overlay
         hover:shadow-[0_4px_24px_rgba(59,130,246,0.07)]
         border-l-2 border-l-border-subtle hover:border-l-blue-600/50
         {extraClass}"
>
  <!-- Subtle top glow on hover -->
  <div
    class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-600/0
           to-transparent transition-all duration-500
           group-hover:via-blue-600/30 pointer-events-none"
  ></div>

  <!-- Meta row -->
  <div class="flex items-center justify-between gap-2">
    {#if index}
      <span class="text-label text-text-disabled tracking-widest">{index}</span>
    {/if}
    {#if status && statusLabel}
      <Badge variant={status} dot class="ml-auto text-[0.6rem]">{statusLabel}</Badge>
    {:else if year}
      <span class="text-label text-text-disabled ml-auto">{year}</span>
    {/if}
  </div>

  <!-- Title -->
  <h3
    class="font-display text-[1.375rem] leading-[1.2] tracking-[-0.025em] font-normal
           text-text-primary transition-colors duration-200 group-hover:text-white"
  >
    {title}
  </h3>

  <!-- Description -->
  <p class="text-sm font-sans font-light text-text-muted leading-relaxed line-clamp-2 -mt-1">
    {description}
  </p>

  <!-- Tech pills -->
  {#if tags.length > 0}
    <div class="flex flex-wrap gap-1.5">
      {#each tags.slice(0, 3) as tag}
        <TechPill label={tag} />
      {/each}
      {#if tags.length > 3}
        <span class="text-label text-text-disabled self-center">+{tags.length - 3}</span>
      {/if}
    </div>
  {/if}

  <!-- Footer link -->
  {#if href}
    <a
      {href}
      class="mt-auto pt-1 text-label text-text-disabled hover:text-blue-400
             transition-colors duration-150 inline-flex items-center gap-1.5 group/link
             border-t border-border-subtle w-full"
    >
      <span class="transition-transform duration-150 group-hover/link:translate-x-0.5">→</span>
      View project
    </a>
  {/if}
</article>
