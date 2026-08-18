<script lang="ts">
  import { onMount } from 'svelte';
  import { AlertTriangle, RefreshCw, ShieldCheck } from 'lucide-svelte';
  import ActionPane from './components/ActionPane.svelte';
  import DeviceInspector from './components/DeviceInspector.svelte';
  import HandMap from './components/HandMap.svelte';
  import HelpSheet from './components/HelpSheet.svelte';
  import HUDPill from './components/HUDPill.svelte';
  import SettingsPane from './components/SettingsPane.svelte';
  import TitleBar from './components/TitleBar.svelte';
  import {
    actionLabel,
    commandErrorMessage,
    deviceGuidance,
    enrollmentMessage,
    fingerName,
    resolveLocale,
    hidConfigurationErrorMessage,
    translate,
    type Locale
  } from './lib/i18n';
  import {
    configureHidMode,
    getAppPreferences,
    getAppStatus,
    getAutostartEnabled,
    isTauriRuntime,
    listFingerProfiles,
    normalizeCommandError,
    resetFingerProfile,
    saveFingerProfile,
    setAppLocale,
    setAutostartEnabled,
    startEnrollment,
    subscribeDeviceStatus,
    subscribeEnrollProgress,
    subscribeFingerTouch
  } from './lib/tauriBridge';
  import { defaultProfiles, defaultStatus, type AppStatusResponse, type FingerProfile } from './lib/types';
  import { focusFirstInDialog, handleDialogKeydown } from './lib/focusTrap';
  import {
    beginInlineEnrollment,
    completeInlineEnrollment,
    confirmPendingNavigation,
    createVaultWorkspaceState,
    dismissCompletedInlineEnrollment,
    requestFingerSelection,
    requestWorkspaceMode,
    updateInlineEnrollment
  } from './lib/vaultWorkspaceState';

  let theme = $state<'dark' | 'light'>(
    typeof window !== 'undefined' && localStorage.getItem('touchpass_theme') === 'light' ? 'light' : 'dark'
  );
  let locale = $state<Locale>(resolveLocale(typeof navigator === 'undefined' ? undefined : navigator.language));
  let profiles = $state<FingerProfile[]>(defaultProfiles());
  let status = $state<AppStatusResponse>(defaultStatus());
  let workspace = $state(createVaultWorkspaceState(1));
  let saving = $state(false);
  let loading = $state(true);
  let loadError = $state(false);
  let hudMessage = $state<string | undefined>(undefined);
  let helpOpen = $state(false);
  let autostartEnabled = $state(false);
  let autostartLoading = $state(false);
  let hidConfigurationLoading = $state(false);
  let editorResetRevision = $state(0);
  let discardDialogElement: HTMLDivElement | undefined = $state();
  let enrollTimer: number | undefined;
  let enrollmentSuccessTimer: number | undefined;
  let hudTimer: number | undefined;

  const selectedProfile = $derived(profiles.find((profile) => profile.id === workspace.selectedFingerId) ?? profiles[0]);
  const deviceReady = $derived(status.connected && status.sensorStatus === 'ok');
  const unavailableGuidance = $derived(deviceGuidance(locale, status.sensorStatus));

  $effect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
      document.documentElement.setAttribute('data-theme', theme);
      if (theme === 'light') {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
      }
      try {
        localStorage.setItem('touchpass_theme', theme);
      } catch {}
    }
  });

  function toggleTheme() {
    theme = theme === 'dark' ? 'light' : 'dark';
  }

  $effect(() => {
    if (!workspace.pendingNavigation || typeof document === 'undefined') return;
    const previousFocus = document.activeElement as HTMLElement | null;
    queueMicrotask(() => focusFirstInDialog(discardDialogElement));
    return () => previousFocus?.focus();
  });

  onMount(() => {
    void initialize();
    const unsubs: Array<() => void> = [];
    void subscribeDeviceStatus((payload) => {
      status.connected = payload.connected;
      status.port = payload.port;
      status.sensorStatus = payload.sensorStatus;
      status.firmwareMode = payload.firmwareMode;
      status.hidKeyConfigured = payload.hidKeyConfigured;
      status.hidConfigurationSupported = payload.hidConfigurationSupported;
      status.localPairingKeyConfigured = payload.localPairingKeyConfigured;
      status.pairingInDoubt = payload.pairingInDoubt;
    }).then((unlisten) => unsubs.push(unlisten));
    void subscribeEnrollProgress((payload) => {
      if (payload.step <= 0) {
        showHud(enrollmentMessage(locale, payload.message));
        workspace = { ...workspace, inlineEnrollment: undefined };
        return;
      }
      workspace = updateInlineEnrollment(workspace, payload);
      if (payload.step >= payload.total) {
        markProfileConfigured(payload.fingerId || workspace.selectedFingerId);
        finishEnrollmentFeedback();
        showHud(translate(locale, 'hud.fingerprintReady'));
      }
    }).then((unlisten) => unsubs.push(unlisten));
    void subscribeFingerTouch((payload) => {
      const action = actionLabel(locale, payload.actionType);
      showHud(translate(locale, payload.status === 'armed' ? 'hud.touchAgain' : 'hud.actionExecuted', { action }));
    }).then((unlisten) => unsubs.push(unlisten));
    return () => {
      unsubs.forEach((unlisten) => unlisten());
      if (enrollTimer) window.clearInterval(enrollTimer);
      if (enrollmentSuccessTimer) window.clearTimeout(enrollmentSuccessTimer);
      if (hudTimer) window.clearTimeout(hudTimer);
    };
  });

  async function initialize() {
    try {
      const preferences = await getAppPreferences();
      if (preferences.locale) locale = preferences.locale;
      else await setAppLocale(locale);
    } catch (error) {
      showCommandError(error);
    }
    await Promise.all([refresh(true), refreshAutostart()]);
  }

  async function refresh(showLoading = false) {
    if (showLoading) loading = true;
    loadError = false;
    try {
      const [nextStatus, nextProfiles] = await Promise.all([getAppStatus(), listFingerProfiles()]);
      status = nextStatus;
      profiles = nextProfiles;
      if (!profiles.some((profile) => profile.id === workspace.selectedFingerId)) workspace = { ...workspace, selectedFingerId: 1 };
    } catch (error) {
      loadError = true;
      showCommandError(error);
    } finally {
      loading = false;
    }
  }

  async function refreshAutostart() {
    autostartLoading = true;
    try {
      autostartEnabled = await getAutostartEnabled();
    } catch (error) {
      showCommandError(error);
    } finally {
      autostartLoading = false;
    }
  }

  function showHud(message: string) {
    hudMessage = message;
    if (hudTimer) window.clearTimeout(hudTimer);
    hudTimer = window.setTimeout(() => (hudMessage = undefined), 3000);
  }

  function showCommandError(error: unknown) {
    const normalized = normalizeCommandError(error);
    if (normalized.detail) console.error('[TouchPass]', normalized.code, normalized.detail);
    showHud(commandErrorMessage(locale, normalized.code));
  }

  async function saveProfile(profile: FingerProfile, secret?: string): Promise<FingerProfile> {
    saving = true;
    try {
      const saved = await saveFingerProfile(profile, secret);
      profiles = profiles.map((item) => (item.id === saved.id ? saved : item));
      showHud(translate(locale, 'hud.saved', { action: actionLabel(locale, saved.actionType), finger: fingerName(locale, saved.id) }));
      return saved;
    } catch (error) {
      showCommandError(error);
      throw error;
    } finally {
      saving = false;
    }
  }

  async function resetProfile(id: number, forceLocal?: boolean) {
    try {
      const reset = await resetFingerProfile(id, forceLocal);
      profiles = profiles.map((item) => (item.id === id ? reset : item));
      showHud(translate(locale, 'hud.deleted'));
    } catch (error) {
      showCommandError(error);
      throw error;
    }
  }

  async function beginEnrollment(id: number) {
    if (enrollmentSuccessTimer) window.clearTimeout(enrollmentSuccessTimer);
    workspace = { ...workspace, selectedFingerId: id };
    workspace = beginInlineEnrollment(workspace, 4);
    try {
      await startEnrollment(id);
      if (!isTauriRuntime()) simulateEnrollment(id);
      showHud(translate(locale, 'hud.placeFinger'));
    } catch (error) {
      workspace = { ...workspace, inlineEnrollment: undefined };
      showCommandError(error);
      throw error;
    }
  }

  function simulateEnrollment(id: number) {
    if (enrollTimer) window.clearInterval(enrollTimer);
    enrollTimer = window.setInterval(() => {
      const nextStep = (workspace.inlineEnrollment?.step ?? 1) + 1;
      workspace = updateInlineEnrollment(workspace, { step: nextStep, total: 4, message: nextStep > 2 ? 'touch_again' : 'lift' });
      if (nextStep >= 4) {
        if (enrollTimer) window.clearInterval(enrollTimer);
        markProfileConfigured(id);
        finishEnrollmentFeedback();
        showHud(translate(locale, 'hud.fingerprintReady'));
      }
    }, 620);
  }

  function markProfileConfigured(id: number) {
    profiles = profiles.map((profile) => (profile.id === id ? { ...profile, configured: true } : profile));
  }

  function finishEnrollmentFeedback() {
    workspace = completeInlineEnrollment(workspace);
    if (enrollmentSuccessTimer) window.clearTimeout(enrollmentSuccessTimer);
    enrollmentSuccessTimer = window.setTimeout(() => {
      workspace = dismissCompletedInlineEnrollment(workspace);
      enrollmentSuccessTimer = undefined;
    }, 2400);
  }

  async function testAction(id: number) {
    const profile = profiles.find((item) => item.id === id);
    if (!profile) return;
    showHud(translate(locale, 'hud.testPrompt', {
      finger: fingerName(locale, id),
      action: actionLabel(locale, profile.actionType)
    }));
  }

  async function changeLocale(nextLocale: Locale) {
    const previous = locale;
    locale = nextLocale;
    try {
      await setAppLocale(nextLocale);
    } catch (error) {
      locale = previous;
      showCommandError(error);
    }
  }

  async function changeAutostart(enabled: boolean) {
    autostartLoading = true;
    try {
      await setAutostartEnabled(enabled);
      autostartEnabled = enabled;
    } catch (error) {
      showCommandError(error);
    } finally {
      autostartLoading = false;
    }
  }

  async function configureHid(repair: boolean) {
    hidConfigurationLoading = true;
    showHud(translate(locale, 'hud.hidConfiguring'));
    try {
      await configureHidMode(repair);
      await refresh(false);
      showHud(translate(locale, 'hud.hidConfigured'));
    } catch (error) {
      const normalized = normalizeCommandError(error);
      if (normalized.detail) console.error('[TouchPass]', normalized.code, normalized.detail);
      showHud(hidConfigurationErrorMessage(locale, normalized.code, normalized.detail));
    } finally {
      hidConfigurationLoading = false;
    }
  }

  function selectFinger(id: number) {
    if (workspace.inlineEnrollment?.state === 'scanning') return;
    workspace = requestFingerSelection(workspace, id);
  }

  function requestSettings() {
    if (workspace.inlineEnrollment?.state === 'scanning') return;
    workspace = requestWorkspaceMode(workspace, 'settings');
  }

  function closeSettings() {
    workspace = requestWorkspaceMode(workspace, 'fingers');
  }

  function confirmNavigation() {
    if (!workspace.pendingNavigation) return;
    editorResetRevision += 1;
    workspace = confirmPendingNavigation(workspace);
  }
</script>

<div class="app-stage {theme}" data-theme={theme}>
  <div class="apple-window relative {theme}" data-theme={theme}>
    <TitleBar {locale} {status} {theme} onThemeToggle={toggleTheme} onSettings={requestSettings} onHelp={() => (helpOpen = true)} />

    <div class="workspace-shell">
      {#if workspace.mode === 'settings'}
        <SettingsPane
          open={true}
          {locale}
          {status}
          {autostartEnabled}
          {autostartLoading}
          {hidConfigurationLoading}
          autostartAvailable={isTauriRuntime()}
          onLocaleChange={changeLocale}
          onAutostartChange={changeAutostart}
          onRefresh={async () => {
            await refresh(false);
            if (!loadError) showHud(translate(locale, 'hud.refreshed'));
          }}
          onConfigureHid={configureHid}
          onClose={closeSettings}
        />
      {:else if loading}
        <main class="workspace-state" aria-busy="true" aria-label={translate(locale, 'main.loading')}><div class="workspace-skeleton" aria-hidden="true"></div></main>
      {:else if loadError}
        <main class="workspace-state" role="alert">
          <AlertTriangle class="mx-auto text-amber-300" size={30} />
          <p>{translate(locale, 'main.loadError')}</p>
          <button class="primary-button" onclick={() => void refresh(true)}><RefreshCw size={16} />{translate(locale, 'main.retry')}</button>
        </main>
      {:else if selectedProfile}
        <HandMap {locale} {profiles} selectedId={workspace.selectedFingerId} locked={workspace.inlineEnrollment?.state === 'scanning'} onSelect={selectFinger} />
        <main class="workspace-editor-pane">
          {#if !deviceReady}
            <aside class="device-banner" role="status"><ShieldCheck size={22} class="shrink-0 text-amber-300" /><div><div>{unavailableGuidance.title}</div><p>{unavailableGuidance.description}</p></div></aside>
          {/if}
          <ActionPane {locale} profile={selectedProfile} {saving} deviceConnected={deviceReady} resetRevision={editorResetRevision} interactionLocked={workspace.inlineEnrollment?.state === 'scanning'} draftDirty={workspace.draftDirty} onSave={saveProfile} onEnroll={beginEnrollment} onReset={resetProfile} onTest={testAction} onDirtyChange={(dirty) => (workspace = { ...workspace, draftDirty: dirty })} />
        </main>
        <DeviceInspector {locale} {status} profile={selectedProfile} enrollment={workspace.inlineEnrollment} deviceReady={deviceReady} rescanDisabled={workspace.draftDirty} onEnroll={beginEnrollment} />
      {/if}
    </div>

    <HelpSheet open={helpOpen} {locale} onClose={() => (helpOpen = false)} />
    {#if workspace.pendingNavigation}
      <div class="dialog-backdrop items-center justify-center p-4" role="presentation">
        <div bind:this={discardDialogElement} class="confirm-dialog max-w-md backdrop-blur-2xl bg-slate-900/90 border border-white/10 shadow-2xl rounded-2xl p-6" role="alertdialog" aria-modal="true" aria-labelledby="discard-title" aria-describedby="discard-description" tabindex="-1" onkeydown={(event) => handleDialogKeydown(event, discardDialogElement, () => (workspace = { ...workspace, pendingNavigation: undefined }))}>
          <h2 id="discard-title" class="text-lg font-bold text-white">{translate(locale, 'discard.title')}</h2>
          <p id="discard-description" class="mt-2 text-sm leading-relaxed text-slate-300">{translate(locale, 'discard.description')}</p>
          <div class="mt-6 flex justify-end gap-2.5"><button class="secondary-button" onclick={() => (workspace = { ...workspace, pendingNavigation: undefined })}>{translate(locale, 'button.cancel')}</button><button class="danger-button" onclick={confirmNavigation}>{translate(locale, 'button.discard')}</button></div>
        </div>
      </div>
    {/if}
    <HUDPill message={hudMessage} />
  </div>
</div>
