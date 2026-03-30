<script lang="ts">
  import ProjectForm from '../_components/ProjectForm.svelte';
  import ImageUploader from '../_components/ImageUploader.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  // Lifted so both form and uploader stay in sync when a gallery image is
  // promoted to thumbnail without a full form submit.
  let thumbnailKeyOverride = $state<string | undefined>(undefined);
</script>

<div class="max-w-4xl">
  <div class="mb-6">
    <h1 class="font-display text-3xl text-[--color-text-primary]">{data.project.title}</h1>
    <p class="mt-1 font-mono text-xs text-[--color-text-disabled]">
      <span class="text-[--color-text-muted]">{data.project.slug}</span>
      · last saved {new Date(data.project.updated_at ?? '').toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}
    </p>
  </div>

  <ProjectForm project={data.project} {thumbnailKeyOverride} />

  <!-- Gallery / image upload — only available on existing projects -->
  <div class="mt-10 border-t border-[--color-border-subtle] pt-8">
    <ImageUploader
      projectId={data.project.id}
      onThumbnailSelect={(key) => (thumbnailKeyOverride = key)}
    />
  </div>
</div>
