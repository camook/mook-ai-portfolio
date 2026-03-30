<script lang="ts">
  interface Props {
    label: string;
    heading: string;
    subtext?: string;
    align?: 'left' | 'center';
    size?: 'sm' | 'md' | 'lg';
    class?: string;
  }

  let {
    label,
    heading,
    subtext,
    align = 'left',
    size = 'md',
    class: extraClass = '',
  }: Props = $props();

  const alignClass: Record<string, string> = {
    left:   'items-start text-left',
    center: 'items-center text-center',
  };

  const headingSizes: Record<string, string> = {
    sm: 'text-display-xs',
    md: 'text-display-sm',
    lg: 'text-display-md',
  };
</script>

<header class="flex flex-col gap-4 {alignClass[align]} {extraClass}">
  <!-- Eyebrow: thin rule + mono label -->
  <div class="flex items-center gap-3 {align === 'center' ? 'justify-center' : ''}">
    <span class="block h-px w-8 bg-blue-600/60 shrink-0"></span>
    <span class="text-label text-blue-500">{label}</span>
  </div>

  <!-- Display heading -->
  <h2 class="{headingSizes[size]} text-text-primary max-w-3xl">
    {heading}
  </h2>

  {#if subtext}
    <p class="text-lead max-w-2xl mt-1">{subtext}</p>
  {/if}
</header>
