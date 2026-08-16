<script lang="ts">
  import { CheckCircle2, X } from 'lucide-svelte';
  import { focusFirstInDialog, handleDialogKeydown } from '../lib/focusTrap';
  import { translate, type Locale } from '../lib/i18n';

  interface Props {
    open: boolean;
    locale: Locale;
    onClose: () => void;
  }

  let { open, locale, onClose }: Props = $props();
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
    <div bind:this={dialogElement} class="confirm-dialog max-w-md" role="dialog" aria-modal="true" aria-labelledby="help-title" tabindex="-1" onkeydown={(event) => handleDialogKeydown(event, dialogElement, onClose)}>
      <button class="icon-button absolute right-3 top-3" title={translate(locale, 'button.close')} aria-label={translate(locale, 'button.close')} onclick={onClose}>
        <X size={18} />
      </button>
      <h2 id="help-title" class="pr-10 text-xl font-extrabold text-white">{translate(locale, 'help.title')}</h2>
      <ol class="mt-5 space-y-4">
        {#each steps as step, index}
          <li class="flex gap-3">
            <span class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-500/15 text-sm font-extrabold text-blue-300">{index + 1}</span>
            <span class="pt-1 text-sm font-medium leading-relaxed text-slate-200">{translate(locale, step)}</span>
          </li>
        {/each}
      </ol>
      <div class="mt-5 flex justify-end">
        <button class="primary-button" onclick={onClose}><CheckCircle2 size={16} />{translate(locale, 'button.close')}</button>
      </div>
    </div>
  </div>
{/if}
