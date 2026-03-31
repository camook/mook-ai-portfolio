<script lang="ts">
  import { reveal } from '$lib/actions/reveal';

  // ── Form state ─────────────────────────────────────────────────────────
  let name    = $state('');
  let email   = $state('');
  let message = $state('');

  let submitting = $state(false);
  let status: 'idle' | 'success' | 'error' = $state('idle');
  let errorMsg = $state('');

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (submitting) return;

    submitting = true;
    status = 'idle';
    errorMsg = '';

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        status = 'success';
        name = '';
        email = '';
        message = '';
      } else {
        status = 'error';
        errorMsg = (data as { error?: string }).error ?? 'Something went wrong. Please try again.';
      }
    } catch {
      status = 'error';
      errorMsg = 'Network error. Please check your connection and try again.';
    } finally {
      submitting = false;
    }
  }
</script>

<div class="min-h-screen bg-bg-base px-6 pt-12 pb-24 max-w-7xl mx-auto">

  <!-- Split layout -->
  <div class="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-16 lg:gap-24 items-start">

    <!-- ── Left: info ──────────────────────────────────────────────────── -->
    <div>
      <div use:reveal class="reveal mb-12">
        <div class="flex items-center gap-3 mb-4">
          <span class="block h-px w-8 bg-blue-600/60 shrink-0"></span>
          <span class="text-label text-blue-500 tracking-widest">INITIATE COLLABORATION</span>
        </div>
        <h1 class="font-display text-[3.5rem] sm:text-[4.5rem] leading-[0.95] tracking-[-0.03em]
                   font-normal text-text-primary mb-6">
          Let's build<br>
          <em class="font-light text-text-secondary not-italic">something.</em>
        </h1>
        <p class="font-sans font-light text-text-muted leading-relaxed text-base max-w-md">
          I'm open to interesting engineering problems — edge AI infrastructure,
          developer tooling, or anything that runs at global scale. Outline your
          intent and I'll respond within 48 hours.
        </p>
      </div>

      <!-- Contact details -->
      <div use:reveal={{ delay: 80 }} class="reveal space-y-5">

        <!-- Email -->
        <a
          href="mailto:hello@mook.ai"
          class="group flex items-center gap-4 text-text-secondary hover:text-text-primary
                 transition-colors duration-150"
        >
          <div class="size-9 rounded-lg border border-border-subtle bg-bg-elevated
                      flex items-center justify-center shrink-0 text-text-disabled
                      group-hover:border-border-muted group-hover:bg-bg-overlay transition-all duration-200">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h10A1.5 1.5 0 0 1 14 2.5v10a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 1 12.5v-10Zm1.5-.5a.5.5 0 0 0-.5.5v.67l5.5 3.5 5.5-3.5V2.5a.5.5 0 0 0-.5-.5h-10Zm10.5 2.07-5.07 3.22a.75.75 0 0 1-.86 0L2 4.07V12.5a.5.5 0 0 0 .5.5h10a.5.5 0 0 0 .5-.5V4.07Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"/>
            </svg>
          </div>
          <div>
            <p class="text-label text-text-disabled mb-0.5">EMAIL</p>
            <p class="font-mono text-[0.8125rem] tracking-wide">hello@mook.ai</p>
          </div>
        </a>

        <!-- Location -->
        <div class="flex items-center gap-4 text-text-secondary">
          <div class="size-9 rounded-lg border border-border-subtle bg-bg-elevated
                      flex items-center justify-center shrink-0 text-text-disabled">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M7.5 0a5.5 5.5 0 0 0-5.5 5.5c0 3.04 2.48 6.1 4.5 8.12a1.42 1.42 0 0 0 2 0c2.02-2.02 4.5-5.08 4.5-8.12A5.5 5.5 0 0 0 7.5 0Zm0 7a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"/>
            </svg>
          </div>
          <div>
            <p class="text-label text-text-disabled mb-0.5">LOCATION</p>
            <p class="font-mono text-[0.8125rem] tracking-wide">Remote — US / EU hours</p>
          </div>
        </div>

        <!-- Availability pulse -->
        <div class="flex items-center gap-4">
          <div class="size-9 rounded-lg border border-border-subtle bg-bg-elevated
                      flex items-center justify-center shrink-0">
            <span class="size-2 rounded-full bg-blue-500 animate-pulse"></span>
          </div>
          <div>
            <p class="text-label text-text-disabled mb-0.5">AVAILABILITY</p>
            <p class="font-mono text-[0.8125rem] tracking-wide text-text-secondary">
              Open to senior/staff roles &amp; contracts
            </p>
          </div>
        </div>

      </div>
    </div>

    <!-- ── Right: form ─────────────────────────────────────────────────── -->
    <div use:reveal={{ delay: 120 }} class="reveal">

      {#if status === 'success'}
        <!-- Success state -->
        <div class="rounded-xl border border-border-subtle bg-bg-elevated p-8 text-center">
          <div class="size-12 rounded-full bg-blue-600/10 border border-blue-600/30
                      flex items-center justify-center mx-auto mb-5">
            <svg width="20" height="20" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-blue-400" aria-hidden="true">
              <path d="M11.47 3.53a.75.75 0 0 1 0 1.06l-5.5 5.5a.75.75 0 0 1-1.06 0l-2.5-2.5a.75.75 0 0 1 1.06-1.06L5.5 8.44l4.97-4.97a.75.75 0 0 1 1.06 0Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"/>
            </svg>
          </div>
          <h3 class="font-display text-[1.5rem] text-text-primary mb-2">Inquiry received.</h3>
          <p class="text-sm font-sans font-light text-text-muted leading-relaxed mb-6">
            Thank you for reaching out. I'll review your brief and respond within 48 hours.
          </p>
          <button
            onclick={() => { status = 'idle'; }}
            class="text-label text-blue-400 hover:text-blue-300 transition-colors duration-150"
          >
            Send another →
          </button>
        </div>

      {:else}
        <!-- Form -->
        <form
          onsubmit={handleSubmit}
          class="rounded-xl border border-border-subtle bg-bg-elevated p-6 sm:p-8 space-y-5"
        >

          <div class="mb-6">
            <div class="flex items-center gap-3 mb-1">
              <span class="block h-px w-5 bg-blue-600/60 shrink-0"></span>
              <span class="text-label text-blue-500 tracking-widest">TRANSMISSION FORM</span>
            </div>
          </div>

          <!-- Name -->
          <div class="space-y-1.5">
            <label for="contact-name" class="text-label text-text-disabled tracking-widest">
              RELEASE NAME / IDENTITY
            </label>
            <input
              id="contact-name"
              type="text"
              bind:value={name}
              required
              autocomplete="name"
              placeholder="Your name or handle"
              class="w-full bg-bg-base border border-border-subtle rounded-lg px-4 py-3
                     font-sans text-sm text-text-primary placeholder:text-text-disabled
                     focus:outline-none focus:border-blue-600/60 focus:ring-1 focus:ring-blue-600/30
                     transition-colors duration-150"
            />
          </div>

          <!-- Email -->
          <div class="space-y-1.5">
            <label for="contact-email" class="text-label text-text-disabled tracking-widest">
              EMAIL ADDRESS
            </label>
            <input
              id="contact-email"
              type="email"
              bind:value={email}
              required
              autocomplete="email"
              placeholder="you@example.com"
              class="w-full bg-bg-base border border-border-subtle rounded-lg px-4 py-3
                     font-sans text-sm text-text-primary placeholder:text-text-disabled
                     focus:outline-none focus:border-blue-600/60 focus:ring-1 focus:ring-blue-600/30
                     transition-colors duration-150"
            />
          </div>

          <!-- Message -->
          <div class="space-y-1.5">
            <label for="contact-message" class="text-label text-text-disabled tracking-widest">
              BRIEF OF INTENT
            </label>
            <textarea
              id="contact-message"
              bind:value={message}
              required
              rows={5}
              placeholder="Describe the problem, project, or opportunity..."
              class="w-full bg-bg-base border border-border-subtle rounded-lg px-4 py-3
                     font-sans text-sm text-text-primary placeholder:text-text-disabled
                     focus:outline-none focus:border-blue-600/60 focus:ring-1 focus:ring-blue-600/30
                     transition-colors duration-150 resize-none"
            ></textarea>
          </div>

          <!-- Error message -->
          {#if status === 'error'}
            <p class="text-xs font-sans text-red-400 leading-relaxed">{errorMsg}</p>
          {/if}

          <!-- Submit -->
          <button
            type="submit"
            disabled={submitting}
            class="w-full flex items-center justify-center gap-2.5 px-6 py-3.5
                   bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/40
                   text-white font-sans text-sm font-medium rounded-lg
                   transition-all duration-200 disabled:cursor-not-allowed"
          >
            {#if submitting}
              <svg class="animate-spin size-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.37 0 0 5.37 0 12h4Z"/>
              </svg>
              Transmitting...
            {:else}
              Submit Your Inquiry
              <span aria-hidden="true">→</span>
            {/if}
          </button>

        </form>
      {/if}

    </div>
  </div>

</div>
