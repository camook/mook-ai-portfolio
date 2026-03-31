<script lang="ts">
  import { Header, NavigationProgress, Footer } from '$lib/components';
  import { page } from '$app/state';

  let { children } = $props();
</script>

<svelte:head>
  <!-- Fallback title — individual pages override this -->
  <title>Mook·AI — Edge AI Infrastructure Engineer</title>
  <meta name="description" content="Precision-engineered AI systems on Cloudflare's global edge — inference gateways, collaborative runtimes, and developer infrastructure built to perform at any scale." />

  <!-- Open Graph base -->
  <meta property="og:site_name" content="Mook·AI" />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="{page.url.origin}/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="Mook·AI — Edge AI Infrastructure Engineer" />

  <!-- Twitter Card base -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="{page.url.origin}/og-image.png" />

  <!-- Theme color for mobile browsers -->
  <meta name="theme-color" content="#0a0e1a" />

  <!-- Favicon & web app manifest -->
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <link rel="manifest" href="/site.webmanifest" />

  <!-- Cloudflare Web Analytics — replace token with your site token from dash.cloudflare.com -->
  <!-- <script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"REPLACE_WITH_YOUR_TOKEN"}'></script> -->
</svelte:head>

<!-- Skip-to-content for keyboard users -->
<a
  href="#main-content"
  class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100]
         focus:px-4 focus:py-2 focus:rounded-lg focus:bg-blue-600 focus:text-white
         focus:text-sm focus:font-sans focus:font-medium focus:shadow-lg
         focus:outline-none focus:ring-2 focus:ring-white/50"
>
  Skip to content
</a>

<NavigationProgress />
<Header />

<main id="main-content" tabindex="-1">
  {@render children()}
</main>

<Footer />
