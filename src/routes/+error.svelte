<script lang="ts">
  import { page } from '$app/state';
  import { Header, Footer, Button } from '$lib/components';

  const status  = $derived(page.status);
  const message = $derived(
    status === 404
      ? "The page you're looking for doesn't exist or has been moved."
      : 'Something went wrong on our end. Please try again in a moment.'
  );
  const label = $derived(status === 404 ? 'Page not found' : 'Server error');
</script>

<svelte:head>
  <title>{status} — {label} · Mook·AI</title>
  <meta name="robots" content="noindex" />
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
</svelte:head>

<a
  href="#main-content"
  class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100]
         focus:px-4 focus:py-2 focus:rounded-lg focus:bg-blue-600 focus:text-white
         focus:text-sm focus:font-sans focus:font-medium focus:shadow-lg
         focus:outline-none focus:ring-2 focus:ring-white/50"
>
  Skip to content
</a>

<Header />

<main id="main-content" tabindex="-1">
  <section class="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden px-6 py-24 text-center">

    <!-- Ghost number backdrop -->
    <span
      aria-hidden="true"
      class="pointer-events-none absolute select-none font-display font-light leading-none text-[clamp(10rem,35vw,22rem)] tracking-tighter opacity-[0.05]"
      style="color: var(--color-text-primary)"
    >{status}</span>

    <!-- Content -->
    <div class="relative z-10 flex flex-col items-center gap-6">

      <span class="font-mono text-xs tracking-[0.12em] uppercase"
        style="color: var(--color-blue-500)"
      >
        {status} · {label}
      </span>

      <h1
        class="font-display text-display-sm font-light leading-[1.05] tracking-tight sm:text-display-md"
        style="color: var(--color-text-primary)"
      >
        {status === 404 ? 'Lost in the Edge.' : 'Something Went Wrong.'}
      </h1>

      <p
        class="max-w-md font-sans text-base leading-relaxed"
        style="color: var(--color-text-muted)"
      >
        {message}
      </p>

      <div class="mt-4 flex flex-wrap items-center justify-center gap-3">
        <Button href="/" variant="primary">Back to Home</Button>
        <Button href="/projects" variant="ghost">View Projects</Button>
      </div>

    </div>

    <!-- Subtle grid overlay -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 opacity-[0.03]"
      style="background-image: linear-gradient(var(--color-border-default) 1px, transparent 1px),
                                linear-gradient(90deg, var(--color-border-default) 1px, transparent 1px);
             background-size: 48px 48px;"
    ></div>

  </section>
</main>

<Footer />
