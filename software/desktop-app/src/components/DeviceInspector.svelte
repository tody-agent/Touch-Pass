<script lang="ts">
  import {
    Bot,
    CheckCircle2,
    CornerDownLeft,
    Cpu,
    Fingerprint,
    KeyRound,
    Keyboard,
    Pause,
    ScanLine,
    Shield,
    Usb,
    WandSparkles
  } from 'lucide-svelte';
  import {
    actionDescription,
    actionLabel,
    enrollmentMessage,
    fingerName,
    firmwareModeLabel,
    sensorStatusLabel,
    translate,
    type Locale
  } from '../lib/i18n';
  import type { ActionType, AppStatusResponse, FingerProfile } from '../lib/types';
  import type { InlineEnrollmentState } from '../lib/vaultWorkspaceState';

  interface Props {
    locale: Locale;
    status: AppStatusResponse;
    profile: FingerProfile;
    enrollment?: InlineEnrollmentState;
    deviceReady: boolean;
    onEnroll: (id: number) => Promise<void>;
    rescanDisabled?: boolean;
  }

  let { locale, status, profile, enrollment, deviceReady, onEnroll, rescanDisabled = false }: Props = $props();
  const scanning = $derived(enrollment?.fingerId === profile.id && enrollment.state === 'scanning');
  const complete = $derived(enrollment?.fingerId === profile.id && enrollment.state === 'success');
  const progress = $derived(enrollment && enrollment.fingerId === profile.id ? Math.round((enrollment.step / enrollment.total) * 100) : 0);

  const actionIcons: Record<ActionType, typeof Bot> = {
    ai_accept: Bot,
    password: KeyRound,
    enter: CornerDownLeft,
    escape: Keyboard,
    custom: WandSparkles,
    disabled: Pause
  };
  const ActionIcon = $derived(actionIcons[profile.actionType] ?? Fingerprint);
  const isDisabled = $derived(profile.actionType === 'disabled');
</script>

<aside class="device-inspector h-full flex flex-col min-h-0 overflow-y-auto space-y-3" aria-label={translate(locale, 'settings.device')}>
  <!-- Hardware Card -->
  <section class="inspector-section apple-card p-3 shrink-0">
    <div class="flex items-center justify-between gap-2 pb-2 border-b border-[var(--border)]">
      <h2 class="text-[10px] font-bold uppercase tracking-wider text-[var(--fg-subtle)] m-0">{translate(locale, 'settings.device')}</h2>
      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold {status.connected ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'}">
        <span class="w-1.5 h-1.5 rounded-full {status.connected ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-amber-600 dark:bg-amber-400'}"></span>
        {status.connected ? translate(locale, 'settings.connected') : translate(locale, 'settings.searching')}
      </span>
    </div>
    <dl class="device-status-list mt-2">
      <div>
        <dt><Usb size={14} class="text-blue-600 dark:text-blue-400" aria-hidden="true" />{translate(locale, 'settings.port')}</dt>
        <dd class:ready={status.connected} class="mono text-xs font-semibold">{status.connected ? status.port ?? translate(locale, 'settings.connected') : translate(locale, 'settings.searching')}</dd>
      </div>
      <div>
        <dt><Cpu size={14} class="text-purple-600 dark:text-purple-400" aria-hidden="true" />{translate(locale, 'settings.firmware')}</dt>
        <dd class="font-semibold">{firmwareModeLabel(locale, status.firmwareMode)}</dd>
      </div>
      <div>
        <dt><Fingerprint size={14} class="text-emerald-600 dark:text-emerald-400" aria-hidden="true" />{translate(locale, 'settings.sensor')}</dt>
        <dd class:ready={deviceReady} class="flex items-center justify-end gap-1.5 font-semibold">
          <span class="w-1.5 h-1.5 rounded-full {deviceReady ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-amber-600 dark:bg-amber-400'}"></span>
          {sensorStatusLabel(locale, status.sensorStatus)}
        </dd>
      </div>
    </dl>
  </section>

  <!-- Selected Finger Detail Card -->
  <section class="inspector-section enrollment-inspector apple-card p-3 flex-1 flex flex-col min-h-0" aria-labelledby="inspector-finger-title">
    <div class="flex items-center justify-between gap-2 pb-2 border-b border-[var(--border)] shrink-0">
      <h2 id="inspector-finger-title" class="text-xs font-bold text-[var(--fg)] m-0">{fingerName(locale, profile.id)}</h2>
      <span class="mono text-[10.5px] font-bold text-[var(--fg-muted)] px-1.5 py-0.5 rounded bg-[var(--card-strong)] border border-[var(--border)]">#{String(profile.id).padStart(2, '0')}</span>
    </div>

    <div role="status" aria-live="polite" aria-atomic="true" class="my-auto py-2 flex flex-col items-center justify-center text-center">
      {#if scanning}
        <div class="enrollment-visual scanning">
          <ScanLine size={32} aria-hidden="true" />
        </div>
        <h3 class="text-xs font-bold text-[var(--fg)] mt-2 mb-1">{translate(locale, 'scan.linking', { finger: fingerName(locale, profile.id) })}</h3>
        <p class="text-[11px] text-[var(--fg-muted)] leading-tight">{enrollment?.message ? enrollmentMessage(locale, enrollment.message) : translate(locale, 'scan.placeFinger')}</p>
        <div
          class="enrollment-progress w-full mt-2"
          role="progressbar"
          aria-label={translate(locale, 'scan.step', { step: enrollment?.step ?? 1, total: enrollment?.total ?? 4 })}
          aria-valuemin="1"
          aria-valuemax={enrollment?.total ?? 4}
          aria-valuenow={enrollment?.step ?? 1}
        >
          <span style={`width: ${progress}%`}></span>
        </div>
      {:else if complete}
        <div class="enrollment-visual success">
          <CheckCircle2 size={32} aria-hidden="true" />
        </div>
        <h3 class="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-2 mb-1">{translate(locale, 'scan.doneTitle')}</h3>
        <p class="text-[11px] text-[var(--fg-muted)] leading-tight">{translate(locale, 'scan.complete')}</p>
      {:else if profile.configured}
        <div class="enrollment-visual {isDisabled ? '' : 'success'}">
          <Fingerprint size={32} aria-hidden="true" class={isDisabled ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'} />
        </div>
        <div class="mt-1.5 mb-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold {isDisabled ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30' : 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30'}">
          <ActionIcon size={12} aria-hidden="true" />
          <span>{actionLabel(locale, profile.actionType)}</span>
        </div>
        <h3 class="text-xs font-bold text-[var(--fg)] m-0">{isDisabled ? translate(locale, 'finger.disabled') : translate(locale, 'finger.configured')}</h3>
      {:else}
        <div class="enrollment-visual">
          <Fingerprint size={32} aria-hidden="true" />
        </div>
        <h3 class="text-xs font-bold text-[var(--fg)] mt-2 mb-0.5">{translate(locale, 'finger.unconfigured')}</h3>
        <p class="text-[11px] text-[var(--fg-muted)] leading-tight">{translate(locale, 'finger.selectedDescription')}</p>
      {/if}
    </div>

    {#if profile.configured && !scanning && !complete}
      <button class="secondary-button inspector-rescan mt-auto py-1.5 text-xs" disabled={!deviceReady || rescanDisabled} onclick={() => void onEnroll(profile.id)}>
        <ScanLine size={14} aria-hidden="true" />{translate(locale, 'button.rescan')}
      </button>
    {/if}
  </section>

  <!-- Clean Privacy Guarantee Strip -->
  <section class="inspector-section settings-privacy-status apple-card p-2.5 shrink-0" aria-label={translate(locale, 'settings.localSecurity')}>
    <div class="flex items-center gap-2">
      <Shield size={14} class="text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
      <span class="text-[11px] font-semibold text-[var(--fg-muted)] truncate">100% Local Security • Secure OS Keyring</span>
    </div>
  </section>
</aside>
