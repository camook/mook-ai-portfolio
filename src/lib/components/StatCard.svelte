<script lang="ts">
  interface Props {
    value: string;
    label: string;
    change?: string;
    trend?: 'up' | 'down' | 'neutral';
    description?: string;
    class?: string;
  }

  let {
    value,
    label,
    change,
    trend = 'neutral',
    description,
    class: extraClass = '',
  }: Props = $props();

  const trendIcon: Record<string, string> = {
    up:      '↑',
    down:    '↓',
    neutral: '→',
  };

  const trendColor: Record<string, string> = {
    up:      'text-green-400',
    down:    'text-red-400',
    neutral: 'text-text-disabled',
  };
</script>

<div
  class="group flex flex-col gap-3 p-5 rounded-lg border border-border-subtle bg-bg-elevated
         transition-all duration-300
         hover:-translate-y-0.5 hover:border-border-muted hover:bg-bg-overlay
         hover:shadow-[0_4px_20px_rgba(59,130,246,0.06)] {extraClass}"
>
  <!-- Value -->
  <div class="flex items-baseline justify-between gap-2">
    <span class="font-display text-[2.25rem] leading-none tracking-tight font-medium text-text-primary">
      {value}
    </span>

    {#if change}
      <span class="text-label-md {trendColor[trend]} shrink-0">
        {trendIcon[trend]}&nbsp;{change}
      </span>
    {/if}
  </div>

  <!-- Label -->
  <span class="text-label text-text-muted">{label}</span>

  {#if description}
    <p class="text-xs font-sans font-light text-text-disabled leading-relaxed border-t border-border-subtle pt-3 mt-1">
      {description}
    </p>
  {/if}
</div>
