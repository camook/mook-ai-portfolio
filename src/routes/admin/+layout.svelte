<script lang="ts">
  import "../../app.css";
  import { page } from "$app/state";
  import Toaster from "$lib/components/admin/Toaster.svelte";
  import ConfirmDialog from "$lib/components/admin/ConfirmDialog.svelte";

  let { children, data } = $props();

  const navItems = [
    { href: "/admin/projects", label: "Projects" },
    { href: "/admin/experience", label: "Experience" },
    { href: "/admin/tech-stack", label: "Tech Stack" },
    { href: "/admin/site-content", label: "Site Content" },
    { href: "/admin/stats", label: "Stats" },
    { href: "/admin/contact", label: "Contact" },
  ];

  function isActive(href: string) {
    return page.url.pathname === href || page.url.pathname.startsWith(href + "/");
  }
</script>

<div class="flex min-h-screen bg-[--color-bg-base]">
  <!-- Sidebar -->
  <aside class="flex w-56 flex-col border-r border-[--color-border-subtle] bg-[--color-bg-subtle]">
    <div class="border-b border-[--color-border-subtle] px-5 py-4">
      <a href="/admin" class="font-mono text-sm text-[--color-text-muted] hover:text-[--color-text-secondary] transition-colors">
        admin
      </a>
    </div>

    <nav class="flex-1 px-3 py-4">
      <ul class="space-y-0.5">
        {#each navItems as item}
          <li>
            <a
              href={item.href}
              class="flex items-center rounded px-3 py-2 font-mono text-xs tracking-wide transition-colors {isActive(item.href)
                ? 'bg-[--color-bg-elevated] text-[--color-text-primary]'
                : 'text-[--color-text-muted] hover:bg-[--color-bg-muted] hover:text-[--color-text-secondary]'}"
            >
              {item.label}
            </a>
          </li>
        {/each}
      </ul>
    </nav>

    <div class="border-t border-[--color-border-subtle] px-5 py-4 space-y-1">
      <p class="font-mono text-xs text-[--color-text-disabled] truncate">{data.user.email}</p>
      <a
        href="/cdn-cgi/access/logout"
        class="font-mono text-xs text-[--color-text-muted] underline-offset-2 hover:underline"
      >logout</a>
    </div>
  </aside>

  <!-- Main content -->
  <div class="flex flex-1 flex-col min-w-0">
    <main class="flex-1 px-8 py-8">
      {@render children()}
    </main>
  </div>
</div>

<Toaster />
<ConfirmDialog />
