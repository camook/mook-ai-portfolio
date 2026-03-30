<script lang="ts">
  import { Header, NavigationProgress } from '$lib/components';

  let { children } = $props();
</script>

<NavigationProgress />
<Header />

<main>
  {@render children()}
</main>
