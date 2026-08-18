<script lang="ts">
  import {
    Activity,
    ArrowLeft,
    Cpu,
    Database,
    Fingerprint,
    KeyRound,
    Languages,
    LoaderCircle,
    Rocket,
    Shield,
    Usb
  } from 'lucide-svelte';
  import { firmwareModeLabel, sensorStatusLabel, translate, workerStatusLabel, type Locale } from '../lib/i18n';
  import { focusFirstInDialog, handleDialogKeydown } from '../lib/focusTrap';
  import type { AppStatusResponse } from '../lib/types';

  type SettingsCategory = 'general' | 'device' | 'security' | 'developer';

  interface Props {
    open: boolean;
    locale: Locale;
    status: AppStatusResponse;
    autostartEnabled: boolean;
    autostartLoading: boolean;
    autostartAvailable: boolean;
    hidConfigurationLoading: boolean;
    onLocaleChange: (locale: Locale) => Promise<void>;
    onAutostartChange: (enabled: boolean) => Promise<void>;
    onRefresh: () => Promise<void>;
    onConfigureHid: (repair: boolean) => Promise<void>;
    onClose: () => void;
  }

  let {
    open,
    locale,
    status,
    autostartEnabled,
    autostartLoading,
    autostartAvailable,
    hidConfigurationLoading,
    onLocaleChange,
    onAutostartChange,
    onRefresh,
    onConfigureHid,
    onClose
  }: Props = $props();

  let category = $state<SettingsCategory>('general');
  let backButton: HTMLButtonElement | undefined = $state();
  let hidActionButton: HTMLButtonElement | undefined = $state();
  let repairDialog: HTMLDivElement | undefined = $state();
  let repairConfirmOpen = $state(false);

  const deviceReady = $derived(status.connected && status.sensorStatus === 'ok');
  const hidFirmwareReady = $derived(status.firmwareMode === 'hid' && status.hidKeyConfigured);
  const hidReady = $derived(
    hidFirmwareReady &&
    status.localPairingKeyConfigured &&
    !status.pairingInDoubt
  );
  const hidRepairRequired = $derived(hidReady || status.pairingInDoubt);
  const categoryKeys = {
    general: 'settings.general',
    device: 'settings.device',
    security: 'settings.security',
    developer: 'settings.developerCategory'
  } as const;
  const categoryKey = $derived(categoryKeys[category]);

  const categories: Array<{ id: SettingsCategory; icon: typeof Languages }> = [
    { id: 'general', icon: Languages },
    { id: 'device', icon: Activity },
    { id: 'security', icon: Shield },
    { id: 'developer', icon: Database }
  ];

  $effect(() => {
    if (!open || typeof document === 'undefined') return;
    const opener = document.activeElement as HTMLElement | null;
    queueMicrotask(() => backButton?.focus());
    return () => opener?.focus();
  });

  $effect(() => {
    if (!repairConfirmOpen || typeof document === 'undefined') return;
    queueMicrotask(() => focusFirstInDialog(repairDialog));
    return () => hidActionButton?.focus();
  });

  $effect(() => {
    if (!open || typeof window === 'undefined') return;
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  });

  function handleKeydown(event: KeyboardEvent) {
    if (event.key !== 'Escape' || event.defaultPrevented) return;
    event.preventDefault();
    onClose();
  }

  async function confirmRepair() {
    await onConfigureHid(true);
    repairConfirmOpen = false;
  }
</script>

{#if open}
  <section class="settings-workspace h-full flex min-h-0 overflow-hidden" aria-label={translate(locale, 'settings.title')}>
    <!-- Sidebar Navigation -->
    <nav class="settings-navigator shrink-0 p-4 border-r border-[var(--border)] bg-[var(--sidebar)] w-60 flex flex-col gap-3" aria-label={translate(locale, 'settings.navigation')}>
      <div class="settings-navigator-heading pb-2 border-b border-[var(--border)]">
        <h1 class="text-base font-bold text-[var(--fg)]">{translate(locale, 'settings.title')}</h1>
      </div>
      <div class="settings-category-list flex flex-col gap-1">
        {#each categories as item}
          {@const Icon = item.icon}
          <button
            class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all {category === item.id ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30' : 'text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--card-hover)]'}"
            class:active={category === item.id}
            aria-current={category === item.id ? 'page' : undefined}
            onclick={() => (category = item.id)}
          >
            <Icon size={16} aria-hidden="true" />
            <span>{translate(locale, categoryKeys[item.id])}</span>
          </button>
        {/each}
      </div>
    </nav>

    <!-- Main Content Area -->
    <main class="settings-main flex-1 min-h-0 overflow-y-auto p-4 flex flex-col" aria-label={translate(locale, categoryKey)}>
      <header class="settings-main-heading shrink-0 pb-3 border-b border-[var(--border)] flex items-center gap-3 mb-3">
        <button bind:this={backButton} class="secondary-button settings-back py-1 px-2.5 text-xs" onclick={onClose}>
          <ArrowLeft size={14} aria-hidden="true" />{translate(locale, 'settings.back')}
        </button>
        <h2 class="text-sm font-bold text-[var(--fg)] m-0">{translate(locale, categoryKey)}</h2>
      </header>

      <div class="settings-content flex-1 min-h-0 space-y-3">
        {#if category === 'general'}
          <!-- Language Setting -->
          <section class="settings-card apple-card p-3" aria-labelledby="language-title">
            <div class="flex items-start gap-3">
              <span class="p-2 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 shrink-0"><Languages size={17} /></span>
              <div class="min-w-0 flex-1">
                <label id="language-title" class="block text-xs font-bold text-[var(--fg)]" for="language-select">{translate(locale, 'settings.language')}</label>
                <p class="mt-0.5 text-[11px] text-[var(--fg-muted)] font-normal">{translate(locale, 'settings.languageDescription')}</p>
                <select id="language-select" class="select-input mt-2 py-1.5 px-2.5 text-xs w-full max-w-xs font-medium" value={locale} onchange={(event) => void onLocaleChange(event.currentTarget.value as Locale)}>
                  <option value="vi">{translate(locale, 'locale.vi')}</option>
                  <option value="en">{translate(locale, 'locale.en')}</option>
                  <option value="zh-CN">{translate(locale, 'locale.zh-CN')}</option>
                </select>
              </div>
            </div>
          </section>

          <!-- Startup Launch Setting -->
          <section class="settings-card apple-card p-3" aria-labelledby="autostart-gen-title">
            <label class="flex items-center justify-between gap-3 cursor-pointer">
              <div class="flex items-center gap-3">
                <span class="p-2 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 shrink-0"><Rocket size={17} /></span>
                <div>
                  <span id="autostart-gen-title" class="block text-xs font-bold text-[var(--fg)]">{translate(locale, 'settings.autostart')}</span>
                  {#if !autostartAvailable}<span class="block text-[11px] text-[var(--fg-muted)]">{translate(locale, 'settings.autostartUnavailable')}</span>{/if}
                </div>
              </div>
              <span class="inline-flex items-center">
                <span class="apple-switch {autostartEnabled ? 'checked' : ''}" aria-hidden="true">
                  <span class="apple-switch-track"><span class="apple-switch-thumb"></span></span>
                </span>
                <input
                  class="sr-only"
                  type="checkbox"
                  checked={autostartEnabled}
                  disabled={autostartLoading || !autostartAvailable}
                  onchange={(event) => void onAutostartChange(event.currentTarget.checked)}
                />
              </span>
            </label>
          </section>
        {:else if category === 'device'}
          <section class="settings-card apple-card p-3" aria-labelledby="device-title">
            <div class="mb-3 flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <span class="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0"><Activity size={17} /></span>
                <div>
                  <h3 id="device-title" class="text-xs font-bold text-[var(--fg)] m-0">{translate(locale, 'settings.device')}</h3>
                </div>
              </div>
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold {status.connected ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'}">
                <span class="w-1.5 h-1.5 rounded-full {status.connected ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-amber-600 dark:bg-amber-400'}"></span>
                {status.connected ? translate(locale, 'settings.connected') : translate(locale, 'settings.searching')}
              </span>
            </div>
            <dl class="settings-details font-medium">
              <div><dt>{translate(locale, 'settings.port')}</dt><dd class="mono text-xs font-semibold">{status.port ?? '—'}</dd></div>
              <div><dt>{translate(locale, 'settings.firmware')}</dt><dd class="font-semibold">{firmwareModeLabel(locale, status.firmwareMode)}</dd></div>
              <div><dt>{translate(locale, 'settings.sensor')}</dt><dd class="flex items-center justify-end gap-1.5 font-semibold"><span class="w-1.5 h-1.5 rounded-full {deviceReady ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-amber-600 dark:bg-amber-400'}"></span>{sensorStatusLabel(locale, status.sensorStatus)}</dd></div>
            </dl>
            <div class="mt-3 flex gap-2">
              <button class="secondary-button py-1 px-3 text-xs" onclick={() => void onRefresh()}>{translate(locale, 'settings.refresh')}</button>
            </div>
          </section>

          <section class="settings-card apple-card p-3" aria-labelledby="hid-automation-title">
            <div class="flex items-start gap-3">
              <span class="p-1.5 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 shrink-0"><KeyRound size={17} /></span>
              <div class="min-w-0 flex-1">
                <h3 id="hid-automation-title" class="text-xs font-bold text-[var(--fg)] m-0">{translate(locale, 'settings.hidAutomation')}</h3>
                <p class="mt-1 text-xs font-bold {hidReady ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}">{translate(locale, hidReady ? 'settings.hidReady' : 'settings.hidNotReady')}</p>
                <p class="mt-0.5 text-[11px] text-[var(--fg-muted)] font-normal">{translate(locale, hidConfigurationLoading ? 'settings.hidTouchToAuthorize' : !status.hidConfigurationSupported ? 'settings.hidManagedByFirmware' : status.pairingInDoubt ? 'settings.hidRecoveryRequired' : hidReady ? 'settings.hidReadyDescription' : 'settings.hidNotReadyDescription')}</p>
                {#if status.hidConfigurationSupported}
                  <button
                    bind:this={hidActionButton}
                    class="secondary-button mt-3 py-1 px-3 text-xs"
                    disabled={!deviceReady || hidConfigurationLoading}
                    aria-busy={hidConfigurationLoading}
                    onclick={() => hidRepairRequired ? (repairConfirmOpen = true) : void onConfigureHid(false)}
                  >
                    {#if hidConfigurationLoading}<LoaderCircle class="animate-spin" size={14} aria-hidden="true" />{/if}
                    {translate(locale, hidConfigurationLoading ? 'settings.configuringHid' : hidRepairRequired ? 'settings.repairHid' : 'settings.configureHid')}
                  </button>
                {/if}
              </div>
            </div>
          </section>
        {:else if category === 'security'}
          <section class="settings-card apple-card p-3" aria-labelledby="security-title">
            <div class="mb-3 flex items-center gap-2.5">
              <span class="p-1.5 rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 shrink-0"><Shield size={17} /></span>
              <div>
                <h3 id="security-title" class="text-xs font-bold text-[var(--fg)] m-0">{translate(locale, 'settings.localSecurity')}</h3>
                <p class="text-[11px] text-[var(--fg-muted)] mt-0.5">{translate(locale, 'settings.localSecurityDescription')}</p>
              </div>
            </div>
            <label class="setting-row cursor-pointer py-1">
              <span class="flex items-center gap-2.5">
                <Rocket size={16} class="text-blue-600 dark:text-blue-400 shrink-0" />
                <span class="text-xs font-bold text-[var(--fg)]">{translate(locale, 'settings.autostart')}</span>
              </span>
              <span class="inline-flex items-center gap-2">
                <span class="apple-switch {autostartEnabled ? 'checked' : ''}" aria-hidden="true">
                  <span class="apple-switch-track"><span class="apple-switch-thumb"></span></span>
                </span>
                <input
                  class="sr-only"
                  type="checkbox"
                  checked={autostartEnabled}
                  disabled={autostartLoading || !autostartAvailable}
                  onchange={(event) => void onAutostartChange(event.currentTarget.checked)}
                />
              </span>
            </label>
          </section>
        {:else}
          <section class="settings-card apple-card p-3" aria-labelledby="developer-title">
            <div class="mb-3 flex items-center gap-2.5">
              <span class="p-1.5 rounded-lg bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30 shrink-0"><Database size={17} /></span>
              <div>
                <h3 id="developer-title" class="text-xs font-bold text-[var(--fg)] m-0">{translate(locale, 'settings.developer')}</h3>
                <p class="text-[11px] text-[var(--fg-muted)] mt-0.5">{translate(locale, 'settings.developerDescription')}</p>
              </div>
            </div>
            <dl class="settings-diagnostics mono text-xs font-medium">
              <div><dt>{translate(locale, 'settings.worker')}</dt><dd class="font-semibold">{workerStatusLabel(locale, status.backgroundWorker)}</dd></div>
              <div><dt>{translate(locale, 'settings.fingerprintCount')}</dt><dd class="font-semibold">{status.fingerprintCount}</dd></div>
              <div><dt>{translate(locale, 'settings.hidKeyConfigured')}</dt><dd class="font-semibold">{translate(locale, status.hidKeyConfigured ? 'common.yes' : 'common.no')}</dd></div>
            </dl>
          </section>
        {/if}
      </div>
    </main>

    <!-- Status Sidebar -->
    <aside class="settings-status-pane shrink-0 p-4 border-l border-[var(--border)] bg-[var(--sidebar)] w-72 flex flex-col gap-3" aria-label={translate(locale, 'settings.statusSidebar')}>
      <section class="inspector-section apple-card p-3">
        <div class="flex items-center justify-between gap-2 pb-2 border-b border-[var(--border)]">
          <h2 class="text-[10px] font-bold uppercase tracking-wider text-[var(--fg-subtle)] m-0">{translate(locale, 'settings.device')}</h2>
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold {status.connected ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'}">
            <span class="w-1.5 h-1.5 rounded-full {status.connected ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-amber-600 dark:bg-amber-400'}"></span>
            {status.connected ? translate(locale, 'settings.connected') : translate(locale, 'settings.searching')}
          </span>
        </div>
        <dl class="device-status-list mt-2">
          <div><dt><Usb size={14} class="text-blue-600 dark:text-blue-400" aria-hidden="true" />{translate(locale, 'settings.port')}</dt><dd class:ready={status.connected} class="mono text-xs font-semibold">{status.connected ? status.port ?? translate(locale, 'settings.connected') : translate(locale, 'settings.searching')}</dd></div>
          <div><dt><Cpu size={14} class="text-purple-600 dark:text-purple-400" aria-hidden="true" />{translate(locale, 'settings.firmware')}</dt><dd class="font-semibold">{firmwareModeLabel(locale, status.firmwareMode)}</dd></div>
          <div><dt><Fingerprint size={14} class="text-emerald-600 dark:text-emerald-400" aria-hidden="true" />{translate(locale, 'settings.sensor')}</dt><dd class:ready={deviceReady} class="flex items-center justify-end gap-1.5 font-semibold"><span class="w-1.5 h-1.5 rounded-full {deviceReady ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-amber-600 dark:bg-amber-400'}"></span>{sensorStatusLabel(locale, status.sensorStatus)}</dd></div>
        </dl>
      </section>
      <section class="inspector-section settings-privacy-status apple-card p-2.5">
        <div class="flex items-center gap-2">
          <Shield size={14} class="text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
          <span class="text-[11px] font-semibold text-[var(--fg-muted)] truncate">100% Local Security • Secure OS Keyring</span>
        </div>
      </section>
    </aside>
  </section>

  {#if repairConfirmOpen}
    <div class="dialog-backdrop items-center justify-center p-4" role="presentation">
      <div
        bind:this={repairDialog}
        class="confirm-dialog max-w-md backdrop-blur-2xl bg-slate-900/90 border border-white/10 shadow-2xl rounded-2xl p-6"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="repair-hid-title"
        aria-describedby="repair-hid-description"
        tabindex="-1"
        onkeydown={(event) => handleDialogKeydown(event, repairDialog, () => (repairConfirmOpen = false))}
      >
        <h2 id="repair-hid-title" class="text-lg font-bold text-white">{translate(locale, 'settings.repairHidTitle')}</h2>
        <p id="repair-hid-description" class="mt-2 text-sm leading-relaxed text-slate-300">{translate(locale, 'settings.repairHidDescription')}</p>
        <div class="mt-6 flex justify-end gap-2.5">
          <button class="secondary-button" disabled={hidConfigurationLoading} onclick={() => (repairConfirmOpen = false)}>{translate(locale, 'button.cancel')}</button>
          <button class="danger-button" disabled={hidConfigurationLoading} onclick={() => void confirmRepair()}>{translate(locale, 'settings.confirmRepairHid')}</button>
        </div>
      </div>
    </div>
  {/if}
{/if}
