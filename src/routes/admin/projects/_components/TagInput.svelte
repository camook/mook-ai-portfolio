<script lang="ts">
  interface Props {
    value?: string[];
    placeholder?: string;
    id?: string;
  }
  let { value = $bindable<string[]>([]), placeholder = 'Add…', id = '' }: Props = $props();

  let input = $state('');

  function commit() {
    const tags = input
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && !value.includes(t));
    if (tags.length) value = [...value, ...tags];
    input = '';
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    } else if (e.key === ',') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Backspace' && input === '' && value.length > 0) {
      value = value.slice(0, -1);
    }
  }

  function remove(tag: string) {
    value = value.filter((t) => t !== tag);
  }
</script>

<div
  class="flex min-h-[2.5rem] flex-wrap items-center gap-1.5 rounded border border-[--color-border-default] bg-[--color-bg-base] px-2 py-1.5 transition-colors focus-within:border-[--color-blue-600]"
>
  {#each value as tag (tag)}
    <span
      class="flex items-center gap-1 rounded bg-[--color-bg-elevated] px-2 py-0.5 font-mono text-[11px] text-[--color-text-secondary]"
    >
      {tag}
      <button
        type="button"
        onclick={() => remove(tag)}
        class="leading-none text-[--color-text-disabled] hover:text-[--color-text-primary]"
        aria-label="Remove {tag}"
      >×</button>
    </span>
  {/each}
  <input
    {id}
    type="text"
    bind:value={input}
    {placeholder}
    onkeydown={onKeydown}
    onblur={commit}
    class="min-w-[5rem] flex-1 bg-transparent font-mono text-xs text-[--color-text-primary] outline-none placeholder:text-[--color-text-disabled]"
  />
</div>
