<script lang="ts">
  interface Props {
    value?: string;
    rows?: number;
  }
  let { value = $bindable(''), rows = 14 }: Props = $props();

  let mode = $state<'write' | 'preview'>('write');

  function esc(s: string) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function inline(s: string): string {
    return esc(s)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noreferrer">$1</a>',
      );
  }

  function renderMd(src: string): string {
    const lines = src.split('\n');
    const out: string[] = [];
    let inCode = false;
    let codeBuf: string[] = [];
    let inList = false;
    let listTag = 'ul';

    for (const line of lines) {
      if (line.startsWith('```')) {
        if (inCode) {
          if (inList) { out.push(`</${listTag}>`); inList = false; }
          out.push(`<pre><code>${esc(codeBuf.join('\n'))}</code></pre>`);
          codeBuf = [];
          inCode = false;
        } else {
          inCode = true;
        }
        continue;
      }
      if (inCode) { codeBuf.push(line); continue; }

      if (line.startsWith('### ')) {
        if (inList) { out.push(`</${listTag}>`); inList = false; }
        out.push(`<h3>${inline(line.slice(4))}</h3>`);
      } else if (line.startsWith('## ')) {
        if (inList) { out.push(`</${listTag}>`); inList = false; }
        out.push(`<h2>${inline(line.slice(3))}</h2>`);
      } else if (line.startsWith('# ')) {
        if (inList) { out.push(`</${listTag}>`); inList = false; }
        out.push(`<h1>${inline(line.slice(2))}</h1>`);
      } else if (/^[-*] /.test(line)) {
        if (!inList || listTag !== 'ul') {
          if (inList) out.push(`</${listTag}>`);
          out.push('<ul>'); inList = true; listTag = 'ul';
        }
        out.push(`<li>${inline(line.slice(2))}</li>`);
      } else if (/^\d+\. /.test(line)) {
        if (!inList || listTag !== 'ol') {
          if (inList) out.push(`</${listTag}>`);
          out.push('<ol>'); inList = true; listTag = 'ol';
        }
        out.push(`<li>${inline(line.replace(/^\d+\. /, ''))}</li>`);
      } else if (line.trim() === '') {
        if (inList) { out.push(`</${listTag}>`); inList = false; }
        out.push('');
      } else {
        if (inList) { out.push(`</${listTag}>`); inList = false; }
        out.push(`<p>${inline(line)}</p>`);
      }
    }
    if (inList) out.push(`</${listTag}>`);
    return out.join('\n');
  }

  let preview = $derived(renderMd(value));
</script>

<div class="overflow-hidden rounded border border-[--color-border-default] focus-within:border-[--color-blue-600]">
  <!-- Tabs -->
  <div class="flex items-center border-b border-[--color-border-subtle] bg-[--color-bg-muted]">
    {#each (['write', 'preview'] as const) as tab}
      <button
        type="button"
        onclick={() => (mode = tab)}
        class="px-4 py-2 font-mono text-xs capitalize transition-colors {mode === tab
          ? 'border-b-2 border-[--color-blue-600] text-[--color-text-primary]'
          : 'text-[--color-text-disabled] hover:text-[--color-text-muted]'}"
      >{tab}</button>
    {/each}
    <span class="ml-auto px-3 font-mono text-[10px] text-[--color-text-disabled]">Markdown</span>
  </div>

  {#if mode === 'write'}
    <textarea
      bind:value
      {rows}
      placeholder="Write Markdown here…"
      class="w-full resize-y bg-[--color-bg-base] px-4 py-3 font-mono text-sm text-[--color-text-primary] outline-none placeholder:text-[--color-text-disabled]"
    ></textarea>
  {:else}
    <div class="md-preview min-h-[10rem] bg-[--color-bg-base] px-4 py-3">
      {#if value.trim()}
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html preview}
      {:else}
        <p class="font-mono text-xs text-[--color-text-disabled]">Nothing to preview.</p>
      {/if}
    </div>
  {/if}
</div>

<style>
  .md-preview { color: var(--color-text-secondary); font-size: 0.875rem; line-height: 1.65; }
  .md-preview :global(h1) { font-family: var(--font-display); font-size: 1.5rem; color: var(--color-text-primary); margin: 1.5rem 0 0.375rem; }
  .md-preview :global(h2) { font-family: var(--font-display); font-size: 1.25rem; color: var(--color-text-primary); margin: 1.25rem 0 0.25rem; }
  .md-preview :global(h3) { font-family: var(--font-display); font-size: 1.05rem; color: var(--color-text-primary); margin: 1rem 0 0.2rem; }
  .md-preview :global(p) { margin: 0.4rem 0; }
  .md-preview :global(strong) { color: var(--color-text-primary); font-weight: 600; }
  .md-preview :global(em) { font-style: italic; }
  .md-preview :global(code) { font-family: var(--font-mono); font-size: 0.78em; background: var(--color-bg-elevated); padding: 0.1em 0.35em; border-radius: 3px; }
  .md-preview :global(pre) { background: var(--color-bg-muted); border: 1px solid var(--color-border-subtle); border-radius: 6px; padding: 0.75rem; margin: 0.75rem 0; overflow-x: auto; }
  .md-preview :global(pre code) { background: none; padding: 0; font-size: 0.8rem; color: var(--color-text-secondary); }
  .md-preview :global(ul) { padding-left: 1.4rem; list-style-type: disc; margin: 0.4rem 0; }
  .md-preview :global(ol) { padding-left: 1.4rem; list-style-type: decimal; margin: 0.4rem 0; }
  .md-preview :global(li) { margin: 0.15rem 0; }
  .md-preview :global(a) { color: var(--color-blue-500); text-decoration: underline; }
  .md-preview :global(a:hover) { color: var(--color-blue-400); }
</style>
