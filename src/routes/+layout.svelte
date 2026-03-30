<script lang="ts">
  import '../app.css';
  import { onNavigate } from '$app/navigation';
  import { Header, NavigationProgress } from '$lib/components';

  let { children } = $props();

  // Hook the View Transitions API into every SvelteKit navigation.
  // Returning a Promise makes SvelteKit wait for startViewTransition's
  // callback before swapping the DOM, so the snapshot is clean.
  onNavigate((navigation) => {
    if (!document.startViewTransition) return;

    return new Promise((resolve) => {
      document.startViewTransition(async () => {
        resolve();
        await navigation.complete;
      });
    });
  });
</script>

<NavigationProgress />
<Header />

<main>
  {@render children()}
</main>
