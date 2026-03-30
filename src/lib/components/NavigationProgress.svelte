<script lang="ts">
  import { navigating } from '$app/state';

  let width = $state(0);
  let opacity = $state(0);
  let duration = $state('2.4s');

  $effect(() => {
    if (navigating.to) {
      // Navigation started — reveal bar and grow toward 72%
      opacity = 1;
      duration = '2.4s';
      // Tick so the transition fires from the reset state, not instantly
      requestAnimationFrame(() => {
        width = 72;
      });
    } else if (opacity > 0) {
      // Navigation complete — rush to 100%, then fade out
      duration = '0.2s';
      width = 100;
      const id = setTimeout(() => {
        opacity = 0;
        // Reset width after fade so next nav starts fresh
        setTimeout(() => { width = 0; }, 350);
      }, 220);
      return () => clearTimeout(id);
    }
  });
</script>

<div
  class="fixed top-0 left-0 z-[100] h-[2px] pointer-events-none
         bg-gradient-to-r from-blue-800 via-blue-500 to-blue-300"
  style="width: {width}%; opacity: {opacity};
         transition: width {duration} ease-out, opacity 0.3s ease;"
  aria-hidden="true"
></div>
