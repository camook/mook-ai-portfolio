<script lang="ts">
  import { page } from '$app/state';
  import { afterNavigate } from '$app/navigation';
  import { fly, fade } from 'svelte/transition';
  import Button from './Button.svelte';

  const navLinks = [
    { href: '/projects',   label: 'Projects',   index: '01' },
    { href: '/stack',      label: 'Stack',      index: '02' },
    { href: '/experience', label: 'Experience', index: '03' },
  ] as const;

  let scrolled = $state(false);
  let mobileOpen = $state(false);

  $effect(() => {
    function onScroll() {
      scrolled = window.scrollY > 24;
    }
    // Initialise on mount in case page is already scrolled
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  });

  afterNavigate(() => {
    mobileOpen = false;
  });

  function isActive(href: string) {
    return page.url.pathname === href || page.url.pathname.startsWith(href + '/');
  }

  function toggleMobile() {
    mobileOpen = !mobileOpen;
  }
</script>

<header
  class="fixed inset-x-0 top-0 z-50 transition-all duration-300
         {scrolled
           ? 'bg-bg-base/80 backdrop-blur-md border-b border-border-subtle shadow-[0_1px_24px_rgba(0,0,0,0.3)]'
           : 'bg-transparent border-b border-transparent'}"
>
  <!-- ── Main bar ─────────────────────────────────────────── -->
  <div class="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between gap-8">

    <!-- Logotype -->
    <a
      href="/"
      class="font-display text-[1.375rem] leading-none tracking-[-0.03em] text-text-primary
             hover:text-white transition-colors duration-150 shrink-0"
      aria-label="Home"
    >
      Mook<span class="font-mono text-[0.75rem] text-blue-500 tracking-widest">-AI</span>
    </a>

    <!-- Desktop nav — centred -->
    <nav class="hidden md:flex items-center gap-1" aria-label="Primary navigation">
      {#each navLinks as { href, label, index }}
        {@const active = isActive(href)}
        <a
          {href}
          class="relative px-3.5 py-2 text-sm font-sans font-light tracking-[-0.01em]
                 transition-colors duration-150 rounded
                 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-muted
                 {active ? 'text-text-primary' : 'text-text-disabled hover:text-text-secondary'}"
          aria-current={active ? 'page' : undefined}
        >
          <!-- Mono index prefix, visible on hover + active -->
          <span
            class="font-mono text-[0.6rem] tracking-widest mr-1.5 transition-opacity duration-150
                   {active ? 'text-blue-500 opacity-100' : 'opacity-0 text-text-disabled'}"
            aria-hidden="true"
          >{index}</span>

          {label}

          <!-- Active underline pill -->
          {#if active}
            <span
              class="absolute inset-x-3.5 -bottom-px h-px rounded-full bg-blue-600"
              aria-hidden="true"
            ></span>
          {/if}
        </a>
      {/each}
    </nav>

    <!-- Right side -->
    <div class="flex items-center gap-3 shrink-0">
      <div class="hidden md:block">
        <Button variant="ghost" size="sm" href="/connect">Connect</Button>
      </div>

      <!-- Mobile hamburger -->
      <button
        onclick={toggleMobile}
        class="md:hidden flex flex-col justify-center gap-[5px] p-2 rounded
               text-text-muted hover:text-text-secondary transition-colors duration-150
               focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-muted"
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={mobileOpen}
        aria-controls="mobile-menu"
      >
        <span
          class="block h-px w-5 bg-current origin-center transition-all duration-200
                 {mobileOpen ? 'rotate-45 translate-y-[7px]' : ''}"
        ></span>
        <span
          class="block h-px w-5 bg-current transition-all duration-150
                 {mobileOpen ? 'opacity-0 scale-x-0' : ''}"
        ></span>
        <span
          class="block h-px w-5 bg-current origin-center transition-all duration-200
                 {mobileOpen ? '-rotate-45 -translate-y-[7px]' : ''}"
        ></span>
      </button>
    </div>
  </div>

  <!-- ── Mobile menu ───────────────────────────────────────── -->
  {#if mobileOpen}
    <div
      id="mobile-menu"
      transition:fly={{ y: -6, duration: 180, opacity: 0 }}
      class="md:hidden absolute inset-x-0 top-full bg-bg-base/95 backdrop-blur-xl
             border-b border-border-subtle shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
    >
      <nav class="mx-auto max-w-7xl px-6 py-6 flex flex-col" aria-label="Mobile navigation">
        {#each navLinks as { href, label, index }, i}
          {@const active = isActive(href)}
          <a
            {href}
            class="group flex items-baseline gap-5 py-4 border-t border-border-subtle
                   first:border-t-0 transition-colors duration-150
                   {active ? 'text-text-primary' : 'text-text-disabled hover:text-text-secondary'}"
            aria-current={active ? 'page' : undefined}
          >
            <span class="font-mono text-[0.6rem] tracking-widest w-5 shrink-0
                         {active ? 'text-blue-500' : 'text-text-disabled'}">
              {index}
            </span>
            <span
              class="font-display text-[2rem] leading-none tracking-[-0.03em] transition-colors duration-150
                     {active ? 'text-text-primary' : 'group-hover:text-text-primary'}"
            >
              {label}
            </span>
            {#if active}
              <span class="ml-auto text-label text-blue-500">current</span>
            {/if}
          </a>
        {/each}

        <div class="pt-6 mt-2 border-t border-border-subtle">
          <Button variant="primary" size="md" href="/connect" class="w-full justify-center">
            Connect →
          </Button>
        </div>
      </nav>
    </div>
  {/if}
</header>

<!-- Spacer so page content starts below the fixed header -->
<div class="h-16" aria-hidden="true"></div>
