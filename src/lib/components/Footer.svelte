<script lang="ts">
  const year = new Date().getFullYear();

  const navLinks = [
    { href: '/projects',   label: 'Projects' },
    { href: '/stack',      label: 'Stack' },
    { href: '/experience', label: 'Experience' },
    { href: '/connect',    label: 'Connect' },
  ];
</script>

<footer class="border-t border-border-subtle mt-24">
  <div class="mx-auto max-w-7xl px-6 py-12">
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">

      <!-- Brand -->
      <a
        href="/"
        class="font-display text-[1.375rem] leading-none tracking-[-0.03em] text-text-primary
               hover:text-white transition-colors duration-150 shrink-0"
        aria-label="Home"
      >
        Mook<span class="font-mono text-[0.75rem] text-blue-500 tracking-widest">-AI</span>
      </a>

      <!-- Nav links -->
      <nav class="flex flex-wrap items-center gap-x-6 gap-y-2" aria-label="Footer navigation">
        {#each navLinks as { href, label } (href)}
          <a
            {href}
            class="text-xs font-sans font-light text-text-disabled tracking-[-0.01em]
                   hover:text-text-secondary transition-colors duration-150"
          >
            {label}
          </a>
        {/each}
      </nav>

      <!-- Copyright -->
      <p class="text-label text-text-disabled shrink-0">
        © {year} Mook-AI
      </p>

    </div>
  </div>
</footer>
