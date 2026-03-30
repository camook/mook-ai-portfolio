<script lang="ts">
  import Badge from './Badge.svelte';
  import TechPill from './TechPill.svelte';
  import Button from './Button.svelte';

  interface Stat {
    value: string;
    label: string;
  }

  interface Props {
    title: string;
    description: string;
    tags?: string[];
    href?: string;
    image?: string;
    imageAlt?: string;
    index?: string;
    year?: string;
    status?: 'info' | 'success' | 'warning' | 'error' | 'neutral';
    statusLabel?: string;
    stats?: Stat[];
    class?: string;
  }

  let {
    title,
    description,
    tags = [],
    href,
    image,
    imageAlt = '',
    index,
    year,
    status,
    statusLabel,
    stats,
    class: extraClass = '',
  }: Props = $props();
</script>

<article
  class="group relative flex flex-col rounded-xl border border-border-subtle bg-bg-elevated
         overflow-hidden transition-all duration-300
         hover:-translate-y-1.5 hover:border-border-muted
         hover:shadow-[0_8px_48px_rgba(59,130,246,0.10)] {extraClass}"
>
  <!-- Visual area -->
  <div class="relative overflow-hidden aspect-[16/10] shrink-0">
    {#if image}
      <img
        src={image}
        alt={imageAlt}
        class="absolute inset-0 size-full object-cover transition-transform duration-700
               group-hover:scale-[1.04]"
      />
    {:else}
      <!-- Blueprint placeholder -->
      <div class="absolute inset-0 bg-gradient-to-br from-bg-subtle via-[#0f1628] to-bg-base"></div>
      <div
        class="absolute inset-0"
        style="background-image: linear-gradient(rgba(59,130,246,0.07) 1px, transparent 1px),
               linear-gradient(90deg, rgba(59,130,246,0.07) 1px, transparent 1px);
               background-size: 44px 44px;"
      ></div>
      <!-- Glows — brighten on card hover via group -->
      <div class="absolute -bottom-16 -right-16 size-64 rounded-full blur-3xl
                  bg-blue-600/10 transition-[background-color,transform] duration-700
                  group-hover:bg-blue-600/20 group-hover:scale-110"></div>
      <div class="absolute -top-20 -left-10 size-56 rounded-full blur-3xl
                  bg-blue-950/50 transition-[background-color] duration-700
                  group-hover:bg-blue-900/40"></div>
      <!-- Ghosted index -->
      {#if index}
        <span
          class="absolute right-7 bottom-5 font-display text-[9rem] leading-none font-medium
                 text-white opacity-[0.035] select-none pointer-events-none tracking-tighter"
        >
          {index}
        </span>
      {/if}
    {/if}
    <!-- Gradient bleed into card body -->
    <div
      class="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none"
      style="background: linear-gradient(to top, var(--color-bg-elevated), transparent);"
    ></div>
  </div>

  <!-- Content -->
  <div class="flex flex-col flex-1 gap-5 px-7 pb-7 -mt-2">
    <!-- Meta row -->
    <div class="flex items-center justify-between gap-3">
      {#if index}
        <span class="text-label text-text-disabled tracking-widest">{index}</span>
      {/if}
      {#if status && statusLabel}
        <Badge variant={status} dot class="ml-auto">{statusLabel}</Badge>
      {/if}
    </div>

    <!-- Title -->
    <h3
      class="font-display text-[2.25rem] leading-[1.1] tracking-[-0.03em] font-normal
             text-text-primary transition-colors duration-200 group-hover:text-white"
    >
      {title}
    </h3>

    <!-- Description -->
    <p class="text-sm font-sans font-light text-text-muted leading-relaxed line-clamp-3 -mt-1">
      {description}
    </p>

    <!-- Stats row -->
    {#if stats && stats.length > 0}
      <div class="flex items-stretch gap-0 border-y border-border-subtle py-4">
        {#each stats as stat, i}
          {#if i > 0}
            <div class="w-px bg-border-subtle mx-6 shrink-0"></div>
          {/if}
          <div class="flex flex-col gap-2 min-w-0">
            <span class="font-display text-[1.625rem] leading-none text-text-primary font-medium tracking-[-0.02em]">
              {stat.value}
            </span>
            <span class="text-label">{stat.label}</span>
          </div>
        {/each}
      </div>
    {/if}

    <!-- Tech pills -->
    {#if tags.length > 0}
      <div class="flex flex-wrap gap-1.5">
        {#each tags as tag}
          <TechPill label={tag} />
        {/each}
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
        <Button variant="ghost" size="sm" {href}>View project &nbsp;→</Button>
      {/if}
    </div>
  </div>
</article>
