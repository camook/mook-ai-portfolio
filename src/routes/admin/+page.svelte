<script lang="ts">
  const sections = [
    { href: "/admin/projects", label: "Projects", description: "Portfolio cards and gallery images" },
    { href: "/admin/experience", label: "Experience", description: "Work history entries" },
    { href: "/admin/tech-stack", label: "Tech Stack", description: "Named tech items with categories" },
    { href: "/admin/site-content", label: "Site Content", description: "Hero copy and flat key/value CMS" },
    { href: "/admin/stats", label: "Stats", description: "Metric callouts for hero section" },
  ];
</script>

<div class="max-w-2xl">
  <h1 class="font-display text-3xl text-[--color-text-primary]">Dashboard</h1>
  <p class="mt-2 font-mono text-xs text-[--color-text-disabled]">Select a section to manage content.</p>

  <ul class="mt-8 space-y-2">
    {#each sections as s (s.href)}
      <li>
        <a
          href={s.href}
          class="flex items-center justify-between rounded border border-[--color-border-subtle] bg-[--color-bg-subtle] px-5 py-4 transition-colors hover:border-[--color-border-muted] hover:bg-[--color-bg-elevated]"
        >
          <div>
            <p class="font-mono text-sm text-[--color-text-primary]">{s.label}</p>
            <p class="mt-0.5 font-mono text-xs text-[--color-text-disabled]">{s.description}</p>
          </div>
          <span class="font-mono text-xs text-[--color-text-disabled]">→</span>
        </a>
      </li>
    {/each}
  </ul>
</div>
