<script lang="ts">
  import { CheckCircle2, HelpCircle, X } from 'lucide-svelte';
  import { focusFirstInDialog, handleDialogKeydown } from '../lib/focusTrap';
  import { translate, type Locale } from '../lib/i18n';

  interface Props {
    open: boolean;
    locale: Locale;
    onClose: () => void;
    onRestartOnboarding?: () => void;
  }

  let { open, locale, onClose, onRestartOnboarding }: Props = $props();
  let dialogElement: HTMLDivElement | undefined = $state();
  const steps = ['help.step1', 'help.step2', 'help.step3'] as const;

  $effect(() => {
    if (!open || typeof document === 'undefined') return;
    const previousFocus = document.activeElement as HTMLElement | null;
    queueMicrotask(() => focusFirstInDialog(dialogElement));
    return () => previousFocus?.focus();
  });
</script>

{#if open}
  <div class="dialog-backdrop items-center justify-center p-4" role="presentation" onclick={(event) => event.target === event.currentTarget && onClose()}>
    <div
      bind:this={dialogElement}
      class="confirm-dialog max-w-md backdrop-blur-2xl bg-[var(--bg)] border border-[var(--border)] shadow-2xl rounded-2xl p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-title"
      tabindex="-1"
      onkeydown={(event) => handleDialogKeydown(event, dialogElement, onClose)}
    >
      <button class="icon-button absolute right-4 top-4 text-[var(--fg-muted)] hover:text-[var(--fg)]" title={translate(locale, 'button.close')} aria-label={translate(locale, 'button.close')} onclick={onClose}>
        <X size={18} />
      </button>
      <div class="flex items-center gap-3 pr-10">
        <div class="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-500">
          <HelpCircle size={18} />
        </div>
        <h2 id="help-title" class="text-base font-bold text-[var(--fg)] m-0">{translate(locale, 'help.title')}</h2>
      </div>
      <ol class="mt-4 space-y-2.5 list-none p-0">
        {#each steps as step, index}
          <li class="flex items-start gap-3 p-2.5 rounded-lg bg-[var(--card)] border border-[var(--border)]">
            <span class="grid h-6 w-6 shrink-0 place-items-center rounded bg-blue-500/15 text-[11px] font-bold text-blue-500 border border-blue-500/25">{index + 1}</span>
            <span class="pt-0.5 text-xs font-medium leading-relaxed text-[var(--fg)]">{translate(locale, step)}</span>
          </li>
        {/each}
      </ol>

      {#if onRestartOnboarding}
        <div class="mt-4 p-3 rounded-xl border border-blue-500/20 bg-blue-500/5 flex items-center justify-between gap-3">
          <div class="min-w-0">
            <h3 class="text-xs font-bold text-[var(--fg)] m-0 truncate">{translate(locale, 'onboarding.title')}</h3>
            <p class="text-[11px] text-[var(--fg-muted)] m-0 mt-0.5 leading-tight">{translate(locale, 'onboarding.restartHelpDesc')}</p>
          </div>
          <button
            class="secondary-button text-xs py-1 px-2.5 shrink-0"
            onclick={() => {
              onClose();
              onRestartOnboarding();
            }}
          >
            {translate(locale, 'onboarding.restartButton')}
          </button>
        </div>
      {/if}

      <div class="mt-5 flex justify-end">
        <button class="primary-button text-xs py-1.5 px-3" onclick={onClose}><CheckCircle2 size={15} />{translate(locale, 'button.close')}</button>
      </div>
    </div>
  </div>
{/if}
