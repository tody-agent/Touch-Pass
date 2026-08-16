<script lang="ts">
  import { Activity, ChevronDown, Database, Languages, Rocket, Shield, X } from 'lucide-svelte';
  import { focusFirstInDialog, handleDialogKeydown } from '../lib/focusTrap';
  import { firmwareModeLabel, sensorStatusLabel, translate, workerStatusLabel, type Locale } from '../lib/i18n';
  import type { AppStatusResponse } from '../lib/types';

  interface Props {
    open: boolean;
    locale: Locale;
    status: AppStatusResponse;
    autostartEnabled: boolean;
    autostartLoading: boolean;
    autostartAvailable: boolean;
    onLocaleChange: (locale: Locale) => Promise<void>;
    onAutostartChange: (enabled: boolean) => Promise<void>;
    onRefresh: () => Promise<void>;
    onClose: () => void;
  }

  let {
    open,
    locale,
    status,
    autostartEnabled,
    autostartLoading,
    autostartAvailable,
    onLocaleChange,
    onAutostartChange,
    onRefresh,
    onClose
  }: Props = $props();
  let devOpen = $state(false);
  let dialogElement: HTMLDivElement | undefined = $state();

  $effect(() => {
    if (!open || typeof document === 'undefined') return;
    const previousFocus = document.activeElement as HTMLElement | null;
    queueMicrotask(() => focusFirstInDialog(dialogElement));
    return () => previousFocus?.focus();
  });
</script>

{#if open}
  <div
    class="dialog-backdrop items-center justify-center p-4"
    role="presentation"
    onclick={(event) => event.target === event.currentTarget && onClose()}
  >
    <div
      bind:this={dialogElement}
      class="settings-sheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      tabindex="-1"
      onkeydown={(event) => handleDialogKeydown(event, dialogElement, onClose)}
    >
      <header class="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/[0.07] bg-[#111620]/95 px-5 py-4 backdrop-blur-xl">
        <div>
          <h2 id="settings-title" class="text-xl font-extrabold text-white">{translate(locale, 'settings.title')}</h2>
          <p class="mt-1 text-xs font-medium leading-relaxed text-slate-300">{translate(locale, 'settings.subtitle')}</p>
        </div>
        <button class="icon-button shrink-0" title={translate(locale, 'button.close')} aria-label={translate(locale, 'button.close')} onclick={onClose}>
          <X size={19} />
        </button>
      </header>

      <div class="space-y-4 p-5">
        <section class="settings-card" aria-labelledby="language-title">
          <div class="flex items-start gap-3">
            <span class="settings-icon bg-blue-400/10 text-blue-300"><Languages size={20} /></span>
            <div class="min-w-0 flex-1">
              <label id="language-title" class="block text-sm font-extrabold text-white" for="language-select">{translate(locale, 'settings.language')}</label>
              <p class="mt-1 text-xs leading-relaxed text-slate-400">{translate(locale, 'settings.languageDescription')}</p>
              <select
                id="language-select"
                class="select-input mt-3"
                value={locale}
                onchange={(event) => void onLocaleChange(event.currentTarget.value as Locale)}
              >
                <option value="vi">{translate(locale, 'locale.vi')}</option>
                <option value="en">{translate(locale, 'locale.en')}</option>
                <option value="zh-CN">{translate(locale, 'locale.zh-CN')}</option>
              </select>
            </div>
          </div>
        </section>

        <section class="settings-card" aria-labelledby="device-title">
          <div class="mb-4 flex items-center gap-3">
            <span class="settings-icon bg-emerald-400/10 text-emerald-300"><Activity size={20} /></span>
            <div>
              <h3 id="device-title" class="text-sm font-extrabold text-white">{translate(locale, 'settings.device')}</h3>
              <p class="text-xs font-semibold text-slate-400">{translate(locale, status.connected ? 'settings.connected' : 'settings.searching')}</p>
            </div>
          </div>
          <dl class="space-y-2 text-xs font-semibold text-slate-300">
            <div class="flex justify-between gap-4"><dt>{translate(locale, 'settings.port')}</dt><dd class="mono text-right text-slate-100">{status.port ?? '—'}</dd></div>
            <div class="flex justify-between gap-4"><dt>{translate(locale, 'settings.firmware')}</dt><dd class="text-right text-slate-100">{firmwareModeLabel(locale, status.firmwareMode)}</dd></div>
            <div class="flex justify-between gap-4"><dt>{translate(locale, 'settings.sensor')}</dt><dd class="text-right text-slate-100">{sensorStatusLabel(locale, status.sensorStatus)}</dd></div>
          </dl>
          <button class="secondary-button mt-4" onclick={() => void onRefresh()}>{translate(locale, 'settings.refresh')}</button>
        </section>

        <section class="settings-card" aria-labelledby="security-title">
          <div class="mb-4 flex items-center gap-3">
            <span class="settings-icon bg-purple-400/10 text-purple-300"><Shield size={20} /></span>
            <div>
              <h3 id="security-title" class="text-sm font-extrabold text-white">{translate(locale, 'settings.localSecurity')}</h3>
              <p class="text-xs font-semibold leading-relaxed text-slate-400">{translate(locale, 'settings.localSecurityDescription')}</p>
            </div>
          </div>
          <label class="setting-row">
            <span class="flex items-center gap-3">
              <Rocket size={18} class="text-blue-300" />
              <span>
                <span class="block text-sm font-bold text-slate-100">{translate(locale, 'settings.autostart')}</span>
                {#if !autostartAvailable}
                  <span class="block text-xs leading-relaxed text-slate-400">{translate(locale, 'settings.autostartUnavailable')}</span>
                {/if}
              </span>
            </span>
            <input
              class="h-5 w-5 shrink-0 accent-blue-500"
              type="checkbox"
              checked={autostartEnabled}
              disabled={autostartLoading || !autostartAvailable}
              onchange={(event) => void onAutostartChange(event.currentTarget.checked)}
            />
          </label>
        </section>

        <section class="settings-card">
          <button class="flex min-h-11 w-full items-center justify-between gap-4 text-left" aria-expanded={devOpen} onclick={() => (devOpen = !devOpen)}>
            <span class="flex items-center gap-3">
              <span class="settings-icon bg-slate-400/10 text-slate-300"><Database size={20} /></span>
              <span>
                <span class="block text-sm font-extrabold text-white">{translate(locale, 'settings.developer')}</span>
                <span class="block text-xs font-semibold leading-relaxed text-slate-400">{translate(locale, 'settings.developerDescription')}</span>
              </span>
            </span>
            <ChevronDown size={18} class={`shrink-0 text-slate-400 transition ${devOpen ? 'rotate-180' : ''}`} />
          </button>
          {#if devOpen}
            <div class="mono mt-4 rounded-2xl border border-white/[0.07] bg-black/25 p-4 text-[11px] leading-relaxed text-slate-300">
              {translate(locale, 'settings.worker')}={workerStatusLabel(locale, status.backgroundWorker)}<br />
              {translate(locale, 'settings.fingerprintCount')}={status.fingerprintCount}<br />
              {translate(locale, 'settings.hidKeyConfigured')}={translate(locale, status.hidKeyConfigured ? 'common.yes' : 'common.no')}
            </div>
          {/if}
        </section>
      </div>
    </div>
  </div>
{/if}
