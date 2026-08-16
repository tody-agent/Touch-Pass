<script lang="ts">
  import { Check, Fingerprint, X } from 'lucide-svelte';
  import { focusFirstInDialog, handleDialogKeydown } from '../lib/focusTrap';
  import { fingerName, translate, type Locale } from '../lib/i18n';
  import type { FingerProfile } from '../lib/types';

  interface Props {
    open: boolean;
    locale: Locale;
    profile: FingerProfile | undefined;
    step: number;
    total: number;
    message?: string;
    onDismiss: () => void;
  }

  let { open, locale, profile, step, total, message, onDismiss }: Props = $props();
  let dialogElement: HTMLDivElement | undefined = $state();
  const progress = $derived(Math.max(0, Math.min(100, (step / total) * 100)));
  const done = $derived(step >= total);

  $effect(() => {
    if (!open || typeof document === 'undefined') return;
    const previousFocus = document.activeElement as HTMLElement | null;
    queueMicrotask(() => focusFirstInDialog(dialogElement));
    return () => previousFocus?.focus();
  });
</script>

{#if open}
  <div class="dialog-backdrop items-center justify-center p-4" role="presentation">
    <div bind:this={dialogElement} class="confirm-dialog max-w-sm text-center" role="dialog" aria-modal="true" aria-labelledby="scan-title" tabindex="-1" onkeydown={(event) => handleDialogKeydown(event, dialogElement, onDismiss)}>
      <button class="icon-button absolute right-3 top-3" title={translate(locale, 'button.close')} aria-label={translate(locale, 'button.close')} onclick={onDismiss}>
        <X size={17} />
      </button>

      <div class="relative mx-auto mb-5 grid h-32 w-32 place-items-center" aria-hidden="true">
        <div class="pulse-glow absolute inset-0 rounded-full bg-blue-500/15"></div>
        <div class="absolute inset-4 rounded-full bg-blue-500/10 blur-xl"></div>
        <div class="relative grid h-24 w-24 place-items-center overflow-hidden rounded-full border border-blue-400/25 bg-blue-500/[0.08] text-blue-300">
          {#if done}
            <Check size={48} strokeWidth={2.4} />
          {:else}
            <Fingerprint size={54} strokeWidth={1.6} />
            <div class="scanning-line absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-300 to-transparent"></div>
          {/if}
        </div>
      </div>

      <h3 id="scan-title" class="text-xl font-extrabold text-white">{translate(locale, done ? 'scan.doneTitle' : 'scan.title')}</h3>
      <p class="mt-1 text-xs font-semibold text-slate-300">
        {translate(locale, 'scan.linking', { finger: profile ? fingerName(locale, profile.id) : '' })}
      </p>
      <div class="mt-5 h-2 overflow-hidden rounded-full bg-white/[0.08]" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress}>
        <div class="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-300" style={`width: ${progress}%`}></div>
      </div>
      <div class="mt-3 text-xs font-extrabold text-blue-300">
        {done ? translate(locale, 'scan.complete') : message ?? translate(locale, step <= 1 ? 'scan.placeFinger' : 'scan.touchAgain')}
      </div>
      <div class="mono mt-1 text-[11px] font-bold text-slate-400">{translate(locale, 'scan.step', { step: Math.max(1, step), total })}</div>
    </div>
  </div>
{/if}
