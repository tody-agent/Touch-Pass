<script lang="ts">
  import { CheckCircle2, Cpu, Fingerprint, ScanLine, Usb } from 'lucide-svelte';
  import { actionDescription, enrollmentMessage, fingerName, firmwareModeLabel, sensorStatusLabel, translate, type Locale } from '../lib/i18n';
  import type { AppStatusResponse, FingerProfile } from '../lib/types';
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
</script>

<aside class="device-inspector" aria-label={translate(locale, 'settings.device')}>
  <section class="inspector-section">
    <h2>{translate(locale, 'settings.device')}</h2>
    <dl class="device-status-list">
      <div><dt><Usb size={18} aria-hidden="true" />{translate(locale, 'settings.port')}</dt><dd class:ready={status.connected}>{status.connected ? status.port ?? translate(locale, 'settings.connected') : translate(locale, 'settings.searching')}</dd></div>
      <div><dt><Cpu size={18} aria-hidden="true" />{translate(locale, 'settings.firmware')}</dt><dd>{firmwareModeLabel(locale, status.firmwareMode)}</dd></div>
      <div><dt><Fingerprint size={18} aria-hidden="true" />{translate(locale, 'settings.sensor')}</dt><dd class:ready={deviceReady}>{sensorStatusLabel(locale, status.sensorStatus)}</dd></div>
    </dl>
  </section>

  <section class="inspector-section enrollment-inspector" aria-labelledby="inspector-finger-title">
    <h2 id="inspector-finger-title">{fingerName(locale, profile.id)}</h2>
    <div role="status" aria-live="polite" aria-atomic="true">
    {#if scanning}
      <div class="enrollment-visual scanning">
        <ScanLine size={52} aria-hidden="true" />
      </div>
      <h3>{translate(locale, 'scan.linking', { finger: fingerName(locale, profile.id) })}</h3>
      <p>{enrollment?.message ? enrollmentMessage(locale, enrollment.message) : translate(locale, 'scan.placeFinger')}</p>
      <div
        class="enrollment-progress"
        role="progressbar"
        aria-label={translate(locale, 'scan.step', { step: enrollment?.step ?? 1, total: enrollment?.total ?? 4 })}
        aria-valuemin="1"
        aria-valuemax={enrollment?.total ?? 4}
        aria-valuenow={enrollment?.step ?? 1}
      >
        <span style={`width: ${progress}%`}></span>
      </div>
    {:else if complete}
      <div class="enrollment-visual success"><CheckCircle2 size={52} aria-hidden="true" /></div>
      <h3>{translate(locale, 'scan.doneTitle')}</h3>
      <p>{translate(locale, 'scan.complete')}</p>
    {:else if profile.configured}
      <div class="enrollment-visual success"><Fingerprint size={52} aria-hidden="true" /></div>
      <h3>{translate(locale, 'finger.configured')}</h3>
      <p>{actionDescription(locale, profile.actionType)}</p>
    {:else}
      <div class="enrollment-visual"><Fingerprint size={52} aria-hidden="true" /></div>
      <h3>{translate(locale, 'finger.unconfigured')}</h3>
      <p>{translate(locale, 'finger.selectedDescription')}</p>
      <ol class="enrollment-steps">
        <li>{translate(locale, 'help.step1')}</li>
        <li>{translate(locale, 'help.step2')}</li>
        <li>{translate(locale, 'help.step3')}</li>
      </ol>
    {/if}
    </div>

    {#if profile.configured && !scanning && !complete}
      <button class="secondary-button inspector-rescan" disabled={!deviceReady || rescanDisabled} onclick={() => void onEnroll(profile.id)}>
        <ScanLine size={17} />{translate(locale, 'button.rescan')}
      </button>
    {/if}
  </section>
</aside>
