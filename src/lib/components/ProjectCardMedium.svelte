<script lang="ts">
  import Badge from './Badge.svelte';
  import TechPill from './TechPill.svelte';

  interface Metric {
    label: string;
    value: string;
  }

  interface Props {
    title: string;
    description: string;
    tags?: string[];
    metric?: Metric;
    href?: string;
    image?: string;
    imageAlt?: string;
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
    metric,
    href,
    image,
    imageAlt = '',
    index,
    year,
    status,
    statusLabel,
    class: extraClass = '',
  }: Props = $props();
</script>

<article
  class="group relative flex flex-col rounded-xl border border-border-subtle bg-bg-elevated
         overflow-hidden transition-all duration-300
         hover:-translate-y-1 hover:border-border-muted
         hover:shadow-[0_6px_32px_rgba(59,130,246,0.09)] {extraClass}"
>
  <!-- Visual area -->
  <div class="relative overflow-hidden aspect-video shrink-0">
    {#if image}
      <img
        src={image}
        alt={imageAlt}
        class="absolute inset-0 size-full object-cover transition-transform duration-700
               group-hover:scale-[1.04]"
      />
    {:else}
      <div class="absolute inset-0 bg-gradient-to-br from-bg-muted via-[#0e1525] to-bg-base"></div>
      <div
        class="absolute inset-0"
        style="background-image: linear-gradient(rgba(59,130,246,0.065) 1px, transparent 1px),
               linear-gradient(90deg, rgba(59,130,246,0.065) 1px, transparent 1px);
               background-size: 32px 32px;"
      ></div>
      <div class="absolute -bottom-10 -right-10 size-44 rounded-full blur-3xl
                  bg-blue-600/10 transition-[background-color,transform] duration-700
                  group-hover:bg-blue-600/20 group-hover:scale-110"></div>
      {#if index}
        <span
          class="absolute right-5 bottom-3 font-display text-[5.5rem] leading-none font-medium
                 text-white opacity-[0.035] select-none pointer-events-none tracking-tighter"
        >
          {index}
        </span>
      {/if}
    {/if}
    <div
      class="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none"
      style="background: linear-gradient(to top, var(--color-bg-elevated), transparent);"
    ></div>
  </div>

  <!-- Content -->
  <div class="flex flex-col flex-1 gap-4 px-5 pb-5 -mt-1">
    <!-- Meta row -->
    <div class="flex items-center justify-between gap-2">
      {#if index}
        <span class="text-label text-text-disabled tracking-widest">{index}</span>
      {/if}
      {#if status && statusLabel}
        <Badge variant={status} dot class="ml-auto">{statusLabel}</Badge>
      {/if}
    </div>

    <!-- Title -->
    <h3
      class="font-display text-[1.75rem] leading-[1.15] tracking-[-0.03em] font-normal
             text-text-primary transition-colors duration-200 group-hover:text-white"
    >
      {title}
    </h3>

    <!-- Description -->
    <p class="text-sm font-sans font-light text-text-muted leading-relaxed line-clamp-2 -mt-1">
      {description}
    </p>

    <!-- Key metric display -->
    {#if metric}
      <div class="flex items-baseline gap-2.5 border-t border-border-subtle pt-3 -mt-1">
        <span
          class="font-display text-[1.75rem] leading-none tracking-[-0.02em] text-text-primary"
        >{metric.value}</span>
        <span class="text-label">{metric.label}</span>
      </div>
    {/if}

    <!-- Tech pills -->
    {#if tags.length > 0}
      <div class="flex flex-wrap gap-1.5">
        {#each tags.slice(0, 4) as tag (tag)}
          <TechPill label={tag} />
        {/each}
        {#if tags.length > 4}
          <span class="text-label text-text-disabled self-center">+{tags.length - 4}</span>
        {/if}
      </div>
    {/if}

    <!-- Footer -->
    <div class="flex items-center justify-between mt-auto pt-1">
      {#if year}
        <span class="text-label text-text-disabled">{year}</span>
      {:else}
        <span></span>
      {/if}
      {#if href}
        <a
          {href}
          class="text-label-md text-text-muted hover:text-blue-400 transition-colors duration-150
                 inline-flex items-center gap-1.5 group/link"
        >
          View
          <span class="transition-transform duration-150 group-hover/link:translate-x-0.5">→</span>
        </a>
      {/if}
    </div>
  </div>
</article>
