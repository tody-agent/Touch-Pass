<script lang="ts">
  import { Activity, ArrowLeft, Cpu, Database, Fingerprint, KeyRound, Languages, LoaderCircle, Rocket, Shield, Usb } from 'lucide-svelte';
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
  <section class="settings-workspace" aria-label={translate(locale, 'settings.title')}>
    <nav class="settings-navigator" aria-label={translate(locale, 'settings.navigation')}>
      <div class="settings-navigator-heading">
        <h1>{translate(locale, 'settings.title')}</h1>
        <p>{translate(locale, 'settings.subtitle')}</p>
      </div>
      <div class="settings-category-list">
        {#each categories as item}
          {@const Icon = item.icon}
          <button
            class:active={category === item.id}
            aria-current={category === item.id ? 'page' : undefined}
            onclick={() => (category = item.id)}
          >
            <Icon size={19} aria-hidden="true" />
            <span>{translate(locale, categoryKeys[item.id])}</span>
          </button>
        {/each}
      </div>
    </nav>

    <main class="settings-main" aria-label={translate(locale, categoryKey)}>
      <header class="settings-main-heading">
        <button bind:this={backButton} class="secondary-button settings-back" onclick={onClose}>
          <ArrowLeft size={17} aria-hidden="true" />{translate(locale, 'settings.back')}
        </button>
        <div>
          <h2>{translate(locale, categoryKey)}</h2>
          {#if category === 'general'}
            <p>{translate(locale, 'settings.generalDescription')}</p>
          {:else if category === 'device'}
            <p>{translate(locale, 'settings.deviceDescription')}</p>
          {:else if category === 'security'}
            <p>{translate(locale, 'settings.localSecurityDescription')}</p>
          {:else}
            <p>{translate(locale, 'settings.developerDescription')}</p>
          {/if}
        </div>
      </header>

      <div class="settings-content">
        {#if category === 'general'}
          <section class="settings-card" aria-labelledby="language-title">
            <div class="flex items-start gap-3">
              <span class="settings-icon bg-blue-400/10 text-blue-300"><Languages size={20} /></span>
              <div class="min-w-0 flex-1">
                <label id="language-title" class="block text-sm font-extrabold text-white" for="language-select">{translate(locale, 'settings.language')}</label>
                <p class="mt-1 text-xs leading-relaxed text-slate-400">{translate(locale, 'settings.languageDescription')}</p>
                <select id="language-select" class="select-input mt-3" value={locale} onchange={(event) => void onLocaleChange(event.currentTarget.value as Locale)}>
                  <option value="vi">{translate(locale, 'locale.vi')}</option>
                  <option value="en">{translate(locale, 'locale.en')}</option>
                  <option value="zh-CN">{translate(locale, 'locale.zh-CN')}</option>
                </select>
              </div>
            </div>
          </section>
        {:else if category === 'device'}
          <section class="settings-card" aria-labelledby="device-title">
            <div class="mb-4 flex items-center gap-3">
              <span class="settings-icon bg-emerald-400/10 text-emerald-300"><Activity size={20} /></span>
              <div>
                <h3 id="device-title" class="text-sm font-extrabold text-white">{translate(locale, 'settings.device')}</h3>
                <p class="text-xs font-semibold text-slate-400">{translate(locale, status.connected ? 'settings.connected' : 'settings.searching')}</p>
              </div>
            </div>
            <dl class="settings-details">
              <div><dt>{translate(locale, 'settings.port')}</dt><dd class="mono">{status.port ?? '—'}</dd></div>
              <div><dt>{translate(locale, 'settings.firmware')}</dt><dd>{firmwareModeLabel(locale, status.firmwareMode)}</dd></div>
              <div><dt>{translate(locale, 'settings.sensor')}</dt><dd>{sensorStatusLabel(locale, status.sensorStatus)}</dd></div>
            </dl>
            <div class="mt-4 flex flex-wrap gap-2">
              <button class="secondary-button" onclick={() => void onRefresh()}>{translate(locale, 'settings.refresh')}</button>
            </div>
          </section>
          <section class="settings-card" aria-labelledby="hid-automation-title">
            <div class="flex items-start gap-3">
              <span class="settings-icon bg-blue-400/10 text-blue-300"><KeyRound size={20} /></span>
              <div class="min-w-0 flex-1">
                <h3 id="hid-automation-title" class="text-sm font-extrabold text-white">{translate(locale, 'settings.hidAutomation')}</h3>
                <p class="mt-1 text-xs font-bold" class:text-emerald-300={hidReady} class:text-amber-300={!hidReady}>{translate(locale, hidReady ? 'settings.hidReady' : 'settings.hidNotReady')}</p>
                <p class="mt-1 text-xs leading-relaxed text-slate-400">{translate(locale, hidConfigurationLoading ? 'settings.hidTouchToAuthorize' : !status.hidConfigurationSupported ? 'settings.hidManagedByFirmware' : status.pairingInDoubt ? 'settings.hidRecoveryRequired' : hidReady ? 'settings.hidReadyDescription' : 'settings.hidNotReadyDescription')}</p>
                {#if status.hidConfigurationSupported}
                  <button
                    bind:this={hidActionButton}
                    class="secondary-button mt-4"
                    disabled={!deviceReady || hidConfigurationLoading}
                    aria-busy={hidConfigurationLoading}
                    onclick={() => hidRepairRequired ? (repairConfirmOpen = true) : void onConfigureHid(false)}
                  >
                    {#if hidConfigurationLoading}<LoaderCircle class="animate-spin" size={16} aria-hidden="true" />{/if}
                    {translate(locale, hidConfigurationLoading ? 'settings.configuringHid' : hidRepairRequired ? 'settings.repairHid' : 'settings.configureHid')}
                  </button>
                {/if}
              </div>
            </div>
          </section>
        {:else if category === 'security'}
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
                  {#if !autostartAvailable}<span class="block text-xs leading-relaxed text-slate-400">{translate(locale, 'settings.autostartUnavailable')}</span>{/if}
                </span>
              </span>
              <input class="h-5 w-5 shrink-0 accent-blue-500" type="checkbox" checked={autostartEnabled} disabled={autostartLoading || !autostartAvailable} onchange={(event) => void onAutostartChange(event.currentTarget.checked)} />
            </label>
          </section>
        {:else}
          <section class="settings-card" aria-labelledby="developer-title">
            <div class="mb-4 flex items-center gap-3">
              <span class="settings-icon bg-slate-400/10 text-slate-300"><Database size={20} /></span>
              <div><h3 id="developer-title" class="text-sm font-extrabold text-white">{translate(locale, 'settings.developer')}</h3><p class="text-xs font-semibold leading-relaxed text-slate-400">{translate(locale, 'settings.developerDescription')}</p></div>
            </div>
            <dl class="settings-diagnostics mono">
              <div><dt>{translate(locale, 'settings.worker')}</dt><dd>{workerStatusLabel(locale, status.backgroundWorker)}</dd></div>
              <div><dt>{translate(locale, 'settings.fingerprintCount')}</dt><dd>{status.fingerprintCount}</dd></div>
              <div><dt>{translate(locale, 'settings.hidKeyConfigured')}</dt><dd>{translate(locale, status.hidKeyConfigured ? 'common.yes' : 'common.no')}</dd></div>
            </dl>
          </section>
        {/if}
      </div>
    </main>

    <aside class="settings-status-pane" aria-label={translate(locale, 'settings.statusSidebar')}>
      <section class="inspector-section">
        <h2>{translate(locale, 'settings.device')}</h2>
        <dl class="device-status-list">
          <div><dt><Usb size={18} aria-hidden="true" />{translate(locale, 'settings.port')}</dt><dd class:ready={status.connected}>{status.connected ? status.port ?? translate(locale, 'settings.connected') : translate(locale, 'settings.searching')}</dd></div>
          <div><dt><Cpu size={18} aria-hidden="true" />{translate(locale, 'settings.firmware')}</dt><dd>{firmwareModeLabel(locale, status.firmwareMode)}</dd></div>
          <div><dt><Fingerprint size={18} aria-hidden="true" />{translate(locale, 'settings.sensor')}</dt><dd class:ready={deviceReady}>{sensorStatusLabel(locale, status.sensorStatus)}</dd></div>
        </dl>
      </section>
      <section class="inspector-section settings-privacy-status">
        <h2>{translate(locale, 'settings.localSecurity')}</h2>
        <p>{translate(locale, 'settings.localSecurityDescription')}</p>
      </section>
    </aside>
  </section>

  {#if repairConfirmOpen}
    <div class="dialog-backdrop items-center justify-center p-4" role="presentation">
      <div
        bind:this={repairDialog}
        class="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="repair-hid-title"
        aria-describedby="repair-hid-description"
        tabindex="-1"
        onkeydown={(event) => handleDialogKeydown(event, repairDialog, () => (repairConfirmOpen = false))}
      >
        <h2 id="repair-hid-title" class="text-lg font-extrabold text-white">{translate(locale, 'settings.repairHidTitle')}</h2>
        <p id="repair-hid-description" class="mt-2 text-sm leading-relaxed text-slate-300">{translate(locale, 'settings.repairHidDescription')}</p>
        <div class="mt-5 flex justify-end gap-2">
          <button class="secondary-button" disabled={hidConfigurationLoading} onclick={() => (repairConfirmOpen = false)}>{translate(locale, 'button.cancel')}</button>
          <button class="danger-button" disabled={hidConfigurationLoading} onclick={() => void confirmRepair()}>{translate(locale, 'settings.confirmRepairHid')}</button>
        </div>
      </div>
    </div>
  {/if}
{/if}
