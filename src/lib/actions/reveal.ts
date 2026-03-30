/**
 * Intersection Observer action that adds `is-revealed` to an element
 * when it enters the viewport. Pair with the `.reveal` CSS class.
 *
 * Usage:
 *   <div use:reveal={{ delay: 120 }} class="reveal">…</div>
 */
export function reveal(
  node: HTMLElement,
  options?: { delay?: number; threshold?: number },
) {
  const delay = options?.delay ?? 0;
  const threshold = options?.threshold ?? 0.1;

  // Skip animation for users who prefer reduced motion
  if (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    node.classList.add('is-revealed');
    return;
  }

  node.style.setProperty('--reveal-delay', `${delay}ms`);

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          node.classList.add('is-revealed');
          observer.disconnect();
          break;
        }
      }
    },
    { threshold },
  );

  observer.observe(node);

  return {
    destroy() {
      observer.disconnect();
    },
  };
}
