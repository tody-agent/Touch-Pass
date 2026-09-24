<script lang="ts">
  import {
    Activity,
    AlertTriangle,
    Bot,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    CornerDownLeft,
    Cpu,
    Fingerprint,
    HelpCircle,
    KeyRound,
    Layers,
    LoaderCircle,
    Play,
    RefreshCw,
    Rocket,
    ScanLine,
    Search,
    Shield,
    ShieldCheck,
    Sparkles,
    Usb,
    WandSparkles,
    X
  } from 'lucide-svelte';
  import { focusFirstInDialog, handleDialogKeydown } from '../lib/focusTrap';
  import {
    actionLabel,
    enrollmentMessage,
    fingerName,
    firmwareModeLabel,
    sensorStatusLabel,
    translate,
    type Locale
  } from '../lib/i18n';
  import type { AppStatusResponse, FingerProfile } from '../lib/types';
  import type { InlineEnrollmentState } from '../lib/vaultWorkspaceState';

  interface Props {
    open: boolean;
    locale: Locale;
    status: AppStatusResponse;
    profiles: FingerProfile[];
    autostartEnabled: boolean;
    autostartLoading?: boolean;
    autostartAvailable?: boolean;
    inlineEnrollment?: InlineEnrollmentState;
    onRefresh: () => Promise<void>;
    onSaveProfile: (profile: FingerProfile, secret?: string) => Promise<FingerProfile>;
    onEnroll: (id: number) => Promise<void>;
    onAutostartChange: (enabled: boolean) => Promise<void>;
    onApplyRecommendedPresets: () => Promise<void>;
    onClose: () => void;
    onComplete: () => void;
    onTestUnlock?: (fingerId: number) => void;
  }

  let {
    open,
    locale,
    status,
    profiles,
    autostartEnabled,
    autostartLoading = false,
    autostartAvailable = true,
    inlineEnrollment,
    onRefresh,
    onSaveProfile,
    onEnroll,
    onAutostartChange,
    onApplyRecommendedPresets,
    onClose,
    onComplete,
    onTestUnlock
  }: Props = $props();

  let dialogElement: HTMLDivElement | undefined = $state();
  let currentStep = $state<1 | 2 | 3 | 4>(1);
  let showTroubleshoot = $state(false);
  let refreshing = $state(false);

  // Step 2: Mac Unlock states
  let selectedFingerId = $state<number>(7); // Default right index finger
  let macPassword = $state('');
  let showPassword = $state(false);
  let isSavingAndEnrolling = $state(false);
  let passwordError = $state<string | undefined>(undefined);

  // Step 3: Presets states
  let isApplyingPresets = $state(false);
  let appliedPresets = $state(false);

  const steps = $derived([
    { id: 1 as const, label: translate(locale, 'onboarding.step1Title') },
    { id: 2 as const, label: translate(locale, 'onboarding.step2Title') },
    { id: 3 as const, label: translate(locale, 'onboarding.step3Title') },
    { id: 4 as const, label: translate(locale, 'onboarding.step4Title') }
  ]);

  const deviceReady = $derived(status.connected && status.sensorStatus === 'ok');
  const targetProfile = $derived(profiles.find((p) => p.id === selectedFingerId) ?? profiles[6]);
  const isEnrolling = $derived(inlineEnrollment?.fingerId === selectedFingerId && inlineEnrollment.state === 'scanning');
  const isEnrollComplete = $derived(
    (inlineEnrollment?.fingerId === selectedFingerId && inlineEnrollment.state === 'success') ||
    (targetProfile.actionType === 'password' && targetProfile.configured)
  );
  const enrollProgress = $derived(
    inlineEnrollment && inlineEnrollment.fingerId === selectedFingerId
      ? Math.round((inlineEnrollment.step / inlineEnrollment.total) * 100)
      : isEnrollComplete ? 100 : 0
  );
  const hasPasswordProfile = $derived(profiles.some((p) => p.actionType === 'password' && (p.configured || p.secretConfigured)));

  $effect(() => {
    if (!open || typeof document === 'undefined') return;
    const previousFocus = document.activeElement as HTMLElement | null;
    queueMicrotask(() => focusFirstInDialog(dialogElement));
    return () => previousFocus?.focus();
  });

  async function handleRefresh() {
    refreshing = true;
    try {
      await onRefresh();
    } finally {
      refreshing = false;
    }
  }

  async function handleSaveAndEnrollUnlock() {
    passwordError = undefined;
    if (!targetProfile.secretConfigured && !macPassword.trim()) {
      passwordError = translate(locale, 'validation.secret_required');
      return;
    }
    if (macPassword && !/^[\x00-\x7F]*$/.test(macPassword)) {
      passwordError = translate(locale, 'validation.password_ascii');
      return;
    }

    isSavingAndEnrolling = true;
    try {
      const updatedProfile: FingerProfile = {
        ...targetProfile,
        actionType: 'password',
        requireConfirm: true
      };
      await onSaveProfile(updatedProfile, macPassword || undefined);
      await onEnroll(selectedFingerId);
    } catch (error) {
      console.error('[Onboarding] Save/Enroll error:', error);
    } finally {
      isSavingAndEnrolling = false;
    }
  }

  async function handleApplyPresets() {
    isApplyingPresets = true;
    try {
      await onApplyRecommendedPresets();
      appliedPresets = true;
    } finally {
      isApplyingPresets = false;
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    handleDialogKeydown(event, dialogElement, onClose);
  }
</script>

{#if open}
  <div class="dialog-backdrop items-center justify-center p-4 z-50" role="presentation">
    <div
      bind:this={dialogElement}
      class="onboarding-dialog max-w-2xl w-full backdrop-blur-2xl bg-[var(--bg)] border border-[var(--border)] shadow-2xl rounded-2xl p-6 flex flex-col max-h-[92vh] overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      tabindex="-1"
      onkeydown={handleKeydown}
    >
      <!-- Modal Header -->
      <header class="flex items-center justify-between gap-3 pb-3 border-b border-[var(--border)] shrink-0">
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-8 h-8 rounded-lg bg-[var(--card-strong)] border border-[var(--border)] flex items-center justify-center p-1.5 shrink-0 shadow-xs">
            <img src="/favicon.png" alt="TouchPass" class="w-full h-full object-contain" />
          </div>
          <div>
            <h1 id="onboarding-title" class="text-sm font-bold text-[var(--fg)] tracking-tight m-0">
              {translate(locale, 'onboarding.title')}
            </h1>
            <p class="text-[11px] text-[var(--fg-muted)] m-0">
              {translate(locale, 'onboarding.stepIndicator', { step: currentStep, total: 4 })}
            </p>
          </div>
        </div>
        <button
          type="button"
          class="p-1.5 rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--card-hover)] transition-colors cursor-pointer"
          aria-label={translate(locale, 'button.close')}
          title={translate(locale, 'button.close')}
          onclick={onClose}
        >
          <X size={16} aria-hidden="true" />
        </button>
      </header>

      <!-- Clean 4-Column Segmented Stepper -->
      <nav class="py-3 border-b border-[var(--border-subtle)] shrink-0" aria-label="Onboarding Steps">
        <div class="grid grid-cols-4 gap-2">
          {#each steps as step}
            <button
              type="button"
              class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all text-left truncate cursor-pointer {currentStep === step.id ? 'bg-[var(--accent-bg)] text-[var(--accent)] border border-[var(--accent)]/30' : step.id < currentStep ? 'text-[var(--fg)] hover:bg-[var(--card)] border border-transparent' : 'text-[var(--fg-subtle)] hover:text-[var(--fg-muted)] border border-transparent'}"
              onclick={() => (currentStep = step.id)}
            >
              <span class="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold {currentStep === step.id ? 'bg-[var(--accent)] text-white shadow-xs' : step.id < currentStep ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' : 'bg-[var(--card-strong)] text-[var(--fg-muted)]'}">
                {#if step.id < currentStep}
                  <Check size={11} strokeWidth={2.5} />
                {:else}
                  {step.id}
                {/if}
              </span>
              <span class="truncate text-[11.5px]">{step.label}</span>
            </button>
          {/each}
        </div>
        <!-- Sleek segmented progress line -->
        <div class="w-full bg-[var(--border-subtle)] h-1 rounded-full mt-2.5 overflow-hidden">
          <div
            class="bg-[var(--accent)] h-full transition-all duration-300 rounded-full"
            style={`width: ${(currentStep / 4) * 100}%`}
          ></div>
        </div>
      </nav>

      <!-- Step Content Area (Scrollable) -->
      <main class="flex-1 min-h-0 overflow-y-auto py-4 space-y-4 pr-1">
        <!-- =================== STEP 1: Connect & Diagnose =================== -->
        {#if currentStep === 1}
          <div class="space-y-4">
            <!-- Connection Hero Status -->
            <div class="apple-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 {deviceReady ? 'border-emerald-500/30 bg-emerald-500/8' : 'border-amber-500/30 bg-amber-500/8'}">
              <div class="flex items-start gap-3 min-w-0">
                <div class="p-2.5 rounded-xl shrink-0 {deviceReady ? 'bg-emerald-500/15 text-emerald-500' : 'bg-amber-500/15 text-amber-500'}">
                  {#if deviceReady}
                    <CheckCircle2 size={24} aria-hidden="true" />
                  {:else}
                    <LoaderCircle size={24} class="animate-spin text-amber-500" aria-hidden="true" />
                  {/if}
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <h2 class="text-sm font-bold text-[var(--fg)] m-0">
                      {translate(locale, deviceReady ? 'onboarding.deviceDetected' : 'onboarding.deviceSearching')}
                    </h2>
                    {#if deviceReady}
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                        {status.port ?? 'USB CDC'}
                      </span>
                    {/if}
                  </div>
                  <p class="text-xs text-[var(--fg-muted)] mt-1 m-0 leading-relaxed">
                    {translate(locale, 'onboarding.connSub')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                class="secondary-button text-xs py-1.5 px-3 shrink-0 self-start sm:self-center flex items-center gap-1.5"
                disabled={refreshing}
                onclick={handleRefresh}
              >
                <RefreshCw size={13} class={refreshing ? 'animate-spin' : ''} aria-hidden="true" />
                <span>{translate(locale, 'onboarding.recheck')}</span>
              </button>
            </div>

            <!-- Connection Guide 3 Steps -->
            <section class="apple-card p-4 space-y-3">
              <h3 class="text-xs font-bold uppercase tracking-wider text-[var(--fg-subtle)] m-0">
                {translate(locale, 'onboarding.connHeading')}
              </h3>
              <ol class="space-y-2.5 list-none p-0 m-0">
                <li class="flex items-start gap-3 text-xs leading-relaxed text-[var(--fg)]">
                  <div class="w-5 h-5 rounded-full bg-blue-500/15 text-blue-500 border border-blue-500/30 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    1
                  </div>
                  <span>{translate(locale, 'onboarding.guideStep1')}</span>
                </li>
                <li class="flex items-start gap-3 text-xs leading-relaxed text-[var(--fg)]">
                  <div class="w-5 h-5 rounded-full bg-purple-500/15 text-purple-500 border border-purple-500/30 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    2
                  </div>
                  <span>{translate(locale, 'onboarding.guideStep2')}</span>
                </li>
                <li class="flex items-start gap-3 text-xs leading-relaxed text-[var(--fg)]">
                  <div class="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    3
                  </div>
                  <span>{translate(locale, 'onboarding.guideStep3')}</span>
                </li>
              </ol>
            </section>

            <!-- Real-time Diagnostics Table -->
            <section class="apple-card p-4">
              <h3 class="text-xs font-bold uppercase tracking-wider text-[var(--fg-subtle)] m-0 mb-3">
                {translate(locale, 'onboarding.diagnosticsTitle')}
              </h3>
              <dl class="device-status-list m-0">
                <div>
                  <dt><Usb size={14} class="text-blue-600 dark:text-blue-400" aria-hidden="true" />{translate(locale, 'onboarding.diagPort')}</dt>
                  <dd class:ready={status.connected} class="mono text-xs font-semibold">
                    {status.connected ? status.port ?? translate(locale, 'settings.connected') : translate(locale, 'settings.searching')}
                  </dd>
                </div>
                <div>
                  <dt><Fingerprint size={14} class="text-emerald-600 dark:text-emerald-400" aria-hidden="true" />{translate(locale, 'onboarding.diagSensor')}</dt>
                  <dd class:ready={deviceReady} class="flex items-center justify-end gap-1.5 font-semibold">
                    <span class="w-1.5 h-1.5 rounded-full {deviceReady ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-amber-600 dark:bg-amber-400'}"></span>
                    {sensorStatusLabel(locale, status.sensorStatus)}
                  </dd>
                </div>
                <div>
                  <dt><Cpu size={14} class="text-purple-600 dark:text-purple-400" aria-hidden="true" />{translate(locale, 'onboarding.diagFirmware')}</dt>
                  <dd class="font-semibold">{firmwareModeLabel(locale, status.firmwareMode)}</dd>
                </div>
              </dl>
            </section>

            <!-- Troubleshooting Accordion -->
            <section class="border border-[var(--border)] rounded-xl overflow-hidden">
              <button
                class="w-full flex items-center justify-between p-3 text-left text-xs font-bold text-[var(--fg)] bg-[var(--card)] hover:bg-[var(--card-hover)] transition-colors"
                onclick={() => (showTroubleshoot = !showTroubleshoot)}
                aria-expanded={showTroubleshoot}
              >
                <div class="flex items-center gap-2">
                  <HelpCircle size={14} class="text-blue-500" aria-hidden="true" />
                  <span>{translate(locale, 'onboarding.troubleshootTitle')}</span>
                </div>
                {#if showTroubleshoot}
                  <ChevronUp size={14} class="text-[var(--fg-muted)]" />
                {:else}
                  <ChevronDown size={14} class="text-[var(--fg-muted)]" />
                {/if}
              </button>
              {#if showTroubleshoot}
                <div class="p-3.5 space-y-2 bg-[var(--bg-subtle)] border-t border-[var(--border)] text-xs text-[var(--fg-muted)]">
                  <p class="m-0 leading-relaxed">• <strong>{translate(locale, 'onboarding.troubleshootTip1')}</strong></p>
                  <p class="m-0 leading-relaxed">• <strong>{translate(locale, 'onboarding.troubleshootTip2')}</strong></p>
                  <p class="m-0 leading-relaxed">• <strong>{translate(locale, 'onboarding.troubleshootTip3')}</strong></p>
                </div>
              {/if}
            </section>
          </div>

        <!-- =================== STEP 2: Unlock Mac with Fingerprint (CORE FOCUS) =================== -->
        {:else if currentStep === 2}
          <div class="space-y-4">
            <!-- Mac Unlock Hero Banner -->
            <div class="apple-card p-4 border-purple-500/30 bg-purple-500/5 flex items-start gap-3">
              <div class="p-2.5 rounded-xl bg-purple-500/15 text-purple-500 shrink-0">
                <KeyRound size={24} aria-hidden="true" />
              </div>
              <div>
                <h2 class="text-sm font-bold text-[var(--fg)] m-0">
                  {translate(locale, 'onboarding.unlockHeading')}
                </h2>
                <p class="text-xs text-[var(--fg-muted)] mt-1 m-0 leading-relaxed">
                  {translate(locale, 'onboarding.unlockSub')}
                </p>
              </div>
            </div>

            <!-- Finger Selection & Password Input -->
            <section class="apple-card p-4 space-y-4">
              <!-- Finger Selector -->
              <div>
                <label for="onboarding-finger-select" class="block text-xs font-semibold text-[var(--fg)] mb-1.5">
                  {translate(locale, 'onboarding.selectFinger')}
                  <span class="text-purple-600 dark:text-purple-400 font-normal ml-1">
                    {translate(locale, 'onboarding.selectFingerRecommend')}
                  </span>
                </label>
                <select
                  id="onboarding-finger-select"
                  class="select-input text-xs"
                  bind:value={selectedFingerId}
                  disabled={isEnrolling}
                >
                  {#each profiles as profile}
                    <option value={profile.id}>
                      #{String(profile.id).padStart(2, '0')} - {fingerName(locale, profile.id)}
                      {profile.id === 7 ? ` ★ ${translate(locale, 'onboarding.selectFingerRecommend')}` : ''}
                      {profile.actionType === 'password' && profile.configured ? ` (${translate(locale, 'onboarding.configured')})` : ''}
                    </option>
                  {/each}
                </select>
              </div>

              <!-- Password Input -->
              <div>
                <label for="onboarding-password-input" class="block text-xs font-semibold text-[var(--fg)] mb-1.5">
                  {translate(locale, 'onboarding.macPassword')}
                </label>
                <div class="relative">
                  <input
                    id="onboarding-password-input"
                    type={showPassword ? 'text' : 'password'}
                    class="text-input text-xs pr-10"
                    placeholder={targetProfile.secretConfigured ? translate(locale, 'field.passwordStored') : translate(locale, 'onboarding.macPasswordPlaceholder')}
                    bind:value={macPassword}
                    disabled={isEnrolling}
                  />
                  <button
                    type="button"
                    class="absolute right-2 top-1.5 text-xs text-[var(--fg-subtle)] hover:text-[var(--fg)]"
                    onclick={() => (showPassword = !showPassword)}
                    tabindex="-1"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {#if passwordError}
                  <p class="text-xs text-rose-500 font-semibold mt-1 m-0">{passwordError}</p>
                {/if}
                <p class="text-[11px] text-[var(--fg-muted)] mt-1.5 m-0 leading-relaxed">
                  {translate(locale, 'onboarding.macPasswordNote')}
                </p>
              </div>

              <!-- Live Enrollment Visualizer Card -->
              <div class="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--card)] flex flex-col items-center justify-center text-center">
                {#if isEnrolling}
                  <div class="enrollment-visual scanning">
                    <ScanLine size={32} class="animate-pulse" aria-hidden="true" />
                  </div>
                  <h4 class="text-xs font-bold text-[var(--fg)] mt-2 mb-1">
                    {translate(locale, 'scan.linking', { finger: fingerName(locale, selectedFingerId) })}
                  </h4>
                  <p class="text-[11px] text-[var(--fg-muted)] m-0 leading-tight">
                    {inlineEnrollment?.message ? enrollmentMessage(locale, inlineEnrollment.message) : translate(locale, 'scan.placeFinger')}
                  </p>
                  <div
                    class="enrollment-progress w-48 mt-2.5"
                    role="progressbar"
                    aria-label={translate(locale, 'scan.step', { step: inlineEnrollment?.step ?? 1, total: inlineEnrollment?.total ?? 4 })}
                    aria-valuemin="1"
                    aria-valuemax={inlineEnrollment?.total ?? 4}
                    aria-valuenow={inlineEnrollment?.step ?? 1}
                  >
                    <span style={`width: ${enrollProgress}%`}></span>
                  </div>
                  <span class="mono text-[10px] text-[var(--fg-subtle)] mt-1.5">
                    {translate(locale, 'scan.step', { step: inlineEnrollment?.step ?? 1, total: inlineEnrollment?.total ?? 4 })}
                  </span>
                {:else if isEnrollComplete}
                  <div class="enrollment-visual success">
                    <CheckCircle2 size={32} class="text-emerald-500" aria-hidden="true" />
                  </div>
                  <h4 class="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-2 mb-1">
                    {translate(locale, 'onboarding.enrollSuccess', { finger: fingerName(locale, selectedFingerId) })}
                  </h4>
                  <p class="text-[11px] text-[var(--fg-muted)] m-0">
                    {translate(locale, 'hud.fingerprintReady')}
                  </p>
                  {#if onTestUnlock}
                    <button
                      class="secondary-button text-xs py-1 px-3 mt-2.5"
                      onclick={() => onTestUnlock(selectedFingerId)}
                    >
                      <Play size={13} aria-hidden="true" />
                      <span>{translate(locale, 'onboarding.btnTestUnlock')}</span>
                    </button>
                  {/if}
                {:else}
                  <div class="enrollment-visual">
                    <Fingerprint size={32} class="text-[var(--fg-muted)]" aria-hidden="true" />
                  </div>
                  <button
                    class="primary-button text-xs py-1.5 px-4 mt-2"
                    disabled={!deviceReady || isSavingAndEnrolling}
                    onclick={handleSaveAndEnrollUnlock}
                  >
                    {#if isSavingAndEnrolling}
                      <LoaderCircle size={14} class="animate-spin" aria-hidden="true" />
                    {:else}
                      <Fingerprint size={14} aria-hidden="true" />
                    {/if}
                    <span>{translate(locale, 'onboarding.btnSaveEnroll')}</span>
                  </button>
                {/if}
              </div>
            </section>
          </div>

        <!-- =================== STEP 3: Superpowers & AI Presets =================== -->
        {:else if currentStep === 3}
          <div class="space-y-4">
            <!-- Superpowers Hero Banner -->
            <div class="apple-card p-4 border-blue-500/30 bg-blue-500/5 flex items-start gap-3">
              <div class="p-2.5 rounded-xl bg-blue-500/15 text-blue-500 shrink-0">
                <Sparkles size={24} aria-hidden="true" />
              </div>
              <div>
                <h2 class="text-sm font-bold text-[var(--fg)] m-0">
                  {translate(locale, 'onboarding.superHeading')}
                </h2>
                <p class="text-xs text-[var(--fg-muted)] mt-1 m-0 leading-relaxed">
                  {translate(locale, 'onboarding.superSub')}
                </p>
              </div>
            </div>

            <!-- 3 Category Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="apple-card p-3 flex flex-col justify-between">
                <div>
                  <div class="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold text-xs mb-1">
                    <Bot size={15} />
                    <span>AI Coding</span>
                  </div>
                  <h4 class="text-xs font-bold text-[var(--fg)] m-0">{translate(locale, 'onboarding.featAiTitle')}</h4>
                  <p class="text-[11px] text-[var(--fg-muted)] mt-1 m-0 leading-relaxed">
                    {translate(locale, 'onboarding.featAiDesc')}
                  </p>
                </div>
                <span class="mono text-[10px] text-blue-500 font-semibold mt-2.5">y + Enter • /plan</span>
              </div>

              <div class="apple-card p-3 flex flex-col justify-between">
                <div>
                  <div class="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-bold text-xs mb-1">
                    <Layers size={15} />
                    <span>macOS Fast</span>
                  </div>
                  <h4 class="text-xs font-bold text-[var(--fg)] m-0">{translate(locale, 'onboarding.featMacTitle')}</h4>
                  <p class="text-[11px] text-[var(--fg-muted)] mt-1 m-0 leading-relaxed">
                    {translate(locale, 'onboarding.featMacDesc')}
                  </p>
                </div>
                <span class="mono text-[10px] text-purple-500 font-semibold mt-2.5">Cmd+Tab • Cmd+Space</span>
              </div>

              <div class="apple-card p-3 flex flex-col justify-between">
                <div>
                  <div class="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold text-xs mb-1">
                    <Activity size={15} />
                    <span>Developer</span>
                  </div>
                  <h4 class="text-xs font-bold text-[var(--fg)] m-0">{translate(locale, 'onboarding.featDevTitle')}</h4>
                  <p class="text-[11px] text-[var(--fg-muted)] mt-1 m-0 leading-relaxed">
                    {translate(locale, 'onboarding.featDevDesc')}
                  </p>
                </div>
                <span class="mono text-[10px] text-amber-500 font-semibold mt-2.5">git status • clear</span>
              </div>
            </div>

            <!-- Recommended Layout Box -->
            <section class="apple-card p-4 space-y-3">
              <div class="flex items-center justify-between gap-2">
                <h3 class="text-xs font-bold text-[var(--fg)] m-0">
                  {translate(locale, 'onboarding.recommendedLayout')}
                </h3>
                {#if appliedPresets}
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    <Check size={12} />
                    {translate(locale, 'onboarding.appliedRecommended')}
                  </span>
                {/if}
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div class="p-2 rounded-lg bg-[var(--card)] border border-[var(--border-subtle)] space-y-1">
                  <div class="font-bold text-[var(--fg-subtle)] uppercase text-[10px]">Tay phải / Right hand</div>
                  <div class="flex items-center justify-between text-[11.5px]">
                    <span class="text-[var(--fg)]">#07 Ngón trỏ</span>
                    <span class="font-semibold text-purple-500">Mở khóa Mac (Password)</span>
                  </div>
                  <div class="flex items-center justify-between text-[11.5px]">
                    <span class="text-[var(--fg)]">#08 Ngón giữa</span>
                    <span class="font-semibold text-blue-500">Chấp thuận AI (y + ↵)</span>
                  </div>
                  <div class="flex items-center justify-between text-[11.5px]">
                    <span class="text-[var(--fg)]">#06 Ngón cái</span>
                    <span class="font-semibold text-emerald-500">Phím Enter (↵)</span>
                  </div>
                </div>

                <div class="p-2 rounded-lg bg-[var(--card)] border border-[var(--border-subtle)] space-y-1">
                  <div class="font-bold text-[var(--fg-subtle)] uppercase text-[10px]">Tay trái / Left hand</div>
                  <div class="flex items-center justify-between text-[11.5px]">
                    <span class="text-[var(--fg)]">#02 Ngón trỏ</span>
                    <span class="font-semibold text-blue-500">Chuyển App (Cmd+Tab)</span>
                  </div>
                  <div class="flex items-center justify-between text-[11.5px]">
                    <span class="text-[var(--fg)]">#03 Ngón giữa</span>
                    <span class="font-semibold text-cyan-500">Spotlight (Cmd+Space)</span>
                  </div>
                  <div class="flex items-center justify-between text-[11.5px]">
                    <span class="text-[var(--fg)]">#01 Ngón cái</span>
                    <span class="font-semibold text-rose-500">Phím Escape (Esc)</span>
                  </div>
                </div>
              </div>

              <div class="pt-1 flex justify-end">
                <button
                  class="secondary-button text-xs py-1.5 px-3"
                  disabled={isApplyingPresets}
                  onclick={handleApplyPresets}
                >
                  <WandSparkles size={14} class="text-amber-500" aria-hidden="true" />
                  <span>{appliedPresets ? translate(locale, 'onboarding.appliedRecommended') : translate(locale, 'onboarding.btnApplyRecommended')}</span>
                </button>
              </div>
            </section>
          </div>

        <!-- =================== STEP 4: Ready to Go =================== -->
        {:else if currentStep === 4}
          <div class="space-y-4">
            <!-- Ready Hero -->
            <div class="apple-card p-5 border-emerald-500/30 bg-emerald-500/5 text-center flex flex-col items-center">
              <div class="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-500 grid place-items-center mb-3">
                <CheckCircle2 size={28} aria-hidden="true" />
              </div>
              <h2 class="text-base font-bold text-[var(--fg)] m-0">
                {translate(locale, 'onboarding.readyHeading')}
              </h2>
              <p class="text-xs text-[var(--fg-muted)] mt-1.5 max-w-md m-0 leading-relaxed">
                {translate(locale, 'onboarding.readySub')}
              </p>
            </div>

            <!-- Health Summary Checklist -->
            <section class="apple-card p-4 space-y-2.5">
              <div class="flex items-center justify-between text-xs py-1 border-b border-[var(--border-subtle)]">
                <div class="flex items-center gap-2">
                  <Usb size={15} class={deviceReady ? 'text-emerald-500' : 'text-amber-500'} />
                  <span class="font-semibold text-[var(--fg)]">{translate(locale, 'onboarding.summaryDevice', { status: deviceReady ? translate(locale, 'status.sensor.ok') : translate(locale, 'settings.searching') })}</span>
                </div>
                <span class="mono text-[11px] {deviceReady ? 'text-emerald-500 font-bold' : 'text-amber-500'}">{status.port ?? 'USB CDC'}</span>
              </div>

              <div class="flex items-center justify-between text-xs py-1 border-b border-[var(--border-subtle)]">
                <div class="flex items-center gap-2">
                  <KeyRound size={15} class={hasPasswordProfile ? 'text-purple-500' : 'text-[var(--fg-muted)]'} />
                  <span class="font-semibold text-[var(--fg)]">{translate(locale, 'onboarding.summaryUnlock', { status: hasPasswordProfile ? translate(locale, 'onboarding.configured') : translate(locale, 'onboarding.notConfigured') })}</span>
                </div>
                <span class="text-[11px] {hasPasswordProfile ? 'text-emerald-500 font-bold' : 'text-[var(--fg-muted)]'}">
                  {hasPasswordProfile ? 'Slot #07 Ready' : 'Setup later'}
                </span>
              </div>

              <div class="flex items-center justify-between text-xs py-1">
                <div class="flex items-center gap-2">
                  <Shield size={15} class="text-emerald-500" />
                  <span class="font-semibold text-[var(--fg)]">{translate(locale, 'onboarding.summarySecurity')}</span>
                </div>
                <span class="text-[11px] text-emerald-500 font-bold">100% Local</span>
              </div>
            </section>

            <!-- Autostart Preference Switch -->
            {#if autostartAvailable}
              <section class="setting-row apple-card p-3">
                <div class="space-y-0.5">
                  <h4 class="text-xs font-bold text-[var(--fg)] m-0">{translate(locale, 'onboarding.autostartPrompt')}</h4>
                  <p class="text-[11px] text-[var(--fg-muted)] m-0 leading-relaxed">{translate(locale, 'onboarding.autostartNote')}</p>
                </div>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={autostartEnabled}
                  aria-label={translate(locale, 'onboarding.autostartPrompt')}
                  class="apple-switch shrink-0"
                  class:checked={autostartEnabled}
                  disabled={autostartLoading}
                  onclick={() => onAutostartChange(!autostartEnabled)}
                >
                  <span class="apple-switch-track">
                    <span
                      class="apple-switch-thumb"
                      style={autostartEnabled ? 'transform: translateX(16px);' : 'transform: translateX(0);'}
                    ></span>
                  </span>
                </button>
              </section>
            {/if}
          </div>
        {/if}
      </main>

      <!-- Modal Footer -->
      <footer class="pt-3.5 border-t border-[var(--border)] flex items-center justify-between gap-3 shrink-0">
        <div>
          {#if currentStep > 1}
            <button
              type="button"
              class="secondary-button text-xs py-1.5 px-3 flex items-center gap-1 cursor-pointer"
              onclick={() => (currentStep = (currentStep - 1) as any)}
            >
              <span>←</span>
              <span>{translate(locale, 'onboarding.back')}</span>
            </button>
          {:else}
            <button
              type="button"
              class="secondary-button text-xs py-1.5 px-3 text-[var(--fg-muted)] hover:text-[var(--fg)] cursor-pointer"
              onclick={onClose}
            >
              {translate(locale, 'onboarding.skipSetup')}
            </button>
          {/if}
        </div>

        <div class="flex items-center gap-2">
          {#if currentStep === 2}
            <button
              type="button"
              class="secondary-button text-xs py-1.5 px-3 text-[var(--fg-muted)] cursor-pointer"
              onclick={() => (currentStep = 3)}
            >
              {translate(locale, 'onboarding.skipStep')}
            </button>
          {/if}

          {#if currentStep === 1}
            <button
              type="button"
              class="primary-button text-xs py-1.5 px-4 cursor-pointer"
              onclick={() => (currentStep = 2)}
            >
              <span>{translate(locale, 'onboarding.step1Next')}</span>
            </button>
          {:else if currentStep === 2}
            <button
              type="button"
              class="primary-button text-xs py-1.5 px-4 cursor-pointer"
              onclick={() => (currentStep = 3)}
            >
              <span>{translate(locale, 'onboarding.step2Next')}</span>
            </button>
          {:else if currentStep === 3}
            <button
              type="button"
              class="primary-button text-xs py-1.5 px-4 cursor-pointer"
              onclick={() => (currentStep = 4)}
            >
              <span>{translate(locale, 'onboarding.step3Next')}</span>
            </button>
          {:else}
            <button
              type="button"
              class="primary-button text-xs py-2 px-5 bg-emerald-600 hover:bg-emerald-500 border-0 flex items-center gap-1.5 font-bold shadow-md shadow-emerald-600/20 cursor-pointer"
              onclick={onComplete}
            >
              <Rocket size={14} aria-hidden="true" />
              <span>{translate(locale, 'onboarding.finish')}</span>
            </button>
          {/if}
        </div>
      </footer>
    </div>
  </div>
{/if}
