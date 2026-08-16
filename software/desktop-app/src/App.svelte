<script lang="ts">
  import { onMount } from 'svelte';
  import { AlertTriangle, RefreshCw, ShieldCheck } from 'lucide-svelte';
  import ActionPane from './components/ActionPane.svelte';
  import HandMap from './components/HandMap.svelte';
  import HelpSheet from './components/HelpSheet.svelte';
  import HUDPill from './components/HUDPill.svelte';
  import SettingsPane from './components/SettingsPane.svelte';
  import TitleBar from './components/TitleBar.svelte';
  import TouchIDModal from './components/TouchIDModal.svelte';
  import {
    actionLabel,
    commandErrorMessage,
    deviceGuidance,
    enrollmentMessage,
    fingerName,
    resolveLocale,
    translate,
    type Locale
  } from './lib/i18n';
  import {
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

  let locale = $state<Locale>(resolveLocale(typeof navigator === 'undefined' ? undefined : navigator.language));
  let profiles = $state<FingerProfile[]>(defaultProfiles());
  let status = $state<AppStatusResponse>(defaultStatus());
  let selectedFingerId = $state(1);
  let saving = $state(false);
  let loading = $state(true);
  let loadError = $state(false);
  let hudMessage = $state<string | undefined>(undefined);
  let settingsOpen = $state(false);
  let helpOpen = $state(false);
  let autostartEnabled = $state(false);
  let autostartLoading = $state(false);
  let enrollOpen = $state(false);
  let enrollDismissed = $state(false);
  let enrollFingerId = $state<number | undefined>(undefined);
  let enrollStep = $state(1);
  let enrollStatusMessage = $state(enrollmentMessage('vi'));
  let enrollTimer: number | undefined;
  let hudTimer: number | undefined;

  const configuredCount = $derived(profiles.filter((profile) => profile.configured).length);
  const selectedProfile = $derived(profiles.find((profile) => profile.id === selectedFingerId) ?? profiles[0]);
  const deviceReady = $derived(status.connected && status.sensorStatus === 'ok');
  const unavailableGuidance = $derived(deviceGuidance(locale, status.sensorStatus));

  $effect(() => {
    if (typeof document !== 'undefined') document.documentElement.lang = locale;
  });

  onMount(() => {
    void initialize();
    const unsubs: Array<() => void> = [];
    void subscribeDeviceStatus((payload) => {
      status.connected = payload.connected;
      status.port = payload.port;
      status.sensorStatus = payload.sensorStatus;
    }).then((unlisten) => unsubs.push(unlisten));
    void subscribeEnrollProgress((payload) => {
      if (payload.fingerId && payload.fingerId !== enrollFingerId) enrollFingerId = payload.fingerId;
      if (payload.step <= 0) {
        showHud(enrollmentMessage(locale, payload.message));
        enrollOpen = false;
        return;
      }
      if (!enrollDismissed) enrollOpen = true;
      enrollStep = payload.step;
      enrollStatusMessage = enrollmentMessage(locale, payload.message);
      if (enrollDismissed) showHud(enrollStatusMessage);
      if (payload.step >= payload.total) {
        markProfileConfigured(payload.fingerId || selectedFingerId);
        showHud(translate(locale, 'hud.fingerprintReady'));
        window.setTimeout(() => (enrollOpen = false), 850);
      }
    }).then((unlisten) => unsubs.push(unlisten));
    void subscribeFingerTouch((payload) => {
      const action = actionLabel(locale, payload.actionType);
      showHud(translate(locale, payload.status === 'armed' ? 'hud.touchAgain' : 'hud.actionExecuted', { action }));
    }).then((unlisten) => unsubs.push(unlisten));
    return () => {
      unsubs.forEach((unlisten) => unlisten());
      if (enrollTimer) window.clearInterval(enrollTimer);
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
      if (!profiles.some((profile) => profile.id === selectedFingerId)) selectedFingerId = 1;
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

  async function resetProfile(id: number) {
    try {
      const reset = await resetFingerProfile(id);
      profiles = profiles.map((item) => (item.id === id ? reset : item));
      showHud(translate(locale, 'hud.deleted'));
    } catch (error) {
      showCommandError(error);
      throw error;
    }
  }

  async function beginEnrollment(id: number) {
    enrollFingerId = id;
    enrollDismissed = false;
    enrollStep = 1;
    enrollStatusMessage = enrollmentMessage(locale);
    enrollOpen = true;
    try {
      await startEnrollment(id);
      if (!isTauriRuntime()) simulateEnrollment(id);
      showHud(translate(locale, 'hud.placeFinger'));
    } catch (error) {
      enrollOpen = false;
      showCommandError(error);
      throw error;
    }
  }

  function simulateEnrollment(id: number) {
    if (enrollTimer) window.clearInterval(enrollTimer);
    enrollStep = 1;
    enrollTimer = window.setInterval(() => {
      enrollStep += 1;
      if (enrollStep >= 4) {
        if (enrollTimer) window.clearInterval(enrollTimer);
        markProfileConfigured(id);
        showHud(translate(locale, 'hud.fingerprintReady'));
        window.setTimeout(() => (enrollOpen = false), 850);
      }
    }, 620);
  }

  function markProfileConfigured(id: number) {
    profiles = profiles.map((profile) => (profile.id === id ? { ...profile, configured: true } : profile));
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
</script>

<main class="app-stage">
  <div class="apple-window relative">
    <TitleBar {locale} {status} onSettings={() => (settingsOpen = true)} onHelp={() => (helpOpen = true)} />

    <div class="content-scroll">
      <div class="mx-auto w-full max-w-6xl space-y-5">
        <header class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 class="text-2xl font-extrabold text-white">{translate(locale, 'main.title')}</h1>
            <p class="mt-1 max-w-2xl text-sm font-medium leading-relaxed text-slate-300">{translate(locale, 'main.subtitle')}</p>
          </div>
          <div class="pill rounded-full px-3 py-2 text-xs font-extrabold text-slate-200">
            {translate(locale, 'main.configuredCount', { count: configuredCount })}
          </div>
        </header>

        {#if loading}
          <section class="glass-card rounded-3xl p-5" aria-busy="true" aria-label={translate(locale, 'main.loading')}>
            <div class="animate-pulse" aria-hidden="true">
              <div class="h-5 w-40 rounded-lg bg-white/[0.09]"></div>
              <div class="mt-3 h-3 w-72 max-w-full rounded bg-white/[0.06]"></div>
              <div class="mt-6 grid gap-3 sm:grid-cols-2">
                {#each Array(2) as _}
                  <div class="rounded-2xl border border-white/[0.06] bg-black/10 p-3">
                    <div class="h-3 w-20 rounded bg-white/[0.07]"></div>
                    <div class="mt-4 grid grid-cols-5 gap-2">
                      {#each Array(5) as _}
                        <div class="h-24 rounded-xl bg-white/[0.06]"></div>
                      {/each}
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          </section>
        {:else if loadError}
          <section class="glass-card grid min-h-56 place-items-center rounded-3xl p-6 text-center" role="alert">
            <div>
              <AlertTriangle class="mx-auto text-amber-300" size={30} />
              <p class="mt-3 text-sm font-semibold text-slate-200">{translate(locale, 'main.loadError')}</p>
              <button class="primary-button mt-4" onclick={() => void refresh(true)}><RefreshCw size={16} />{translate(locale, 'main.retry')}</button>
            </div>
          </section>
        {:else}
          {#if !deviceReady}
            <aside class="device-banner" role="status">
              <ShieldCheck size={22} class="shrink-0 text-amber-300" />
              <div>
                <div class="text-sm font-extrabold text-white">{unavailableGuidance.title}</div>
                <p class="mt-0.5 text-xs font-medium leading-relaxed text-slate-300">{unavailableGuidance.description}</p>
              </div>
            </aside>
          {/if}

          <HandMap {locale} {profiles} selectedId={selectedFingerId} onSelect={(id) => (selectedFingerId = id)} />
          {#if selectedProfile}
            <ActionPane
              {locale}
              profile={selectedProfile}
              {saving}
              deviceConnected={deviceReady}
              onSave={saveProfile}
              onEnroll={beginEnrollment}
              onReset={resetProfile}
              onTest={testAction}
            />
          {/if}
        {/if}
      </div>
    </div>

    <SettingsPane
      open={settingsOpen}
      {locale}
      {status}
      {autostartEnabled}
      {autostartLoading}
      autostartAvailable={isTauriRuntime()}
      onLocaleChange={changeLocale}
      onAutostartChange={changeAutostart}
      onRefresh={async () => {
        await refresh(false);
        if (!loadError) showHud(translate(locale, 'hud.refreshed'));
      }}
      onClose={() => (settingsOpen = false)}
    />
    <HelpSheet open={helpOpen} {locale} onClose={() => (helpOpen = false)} />
    <TouchIDModal
      open={enrollOpen}
      {locale}
      profile={profiles.find((profile) => profile.id === enrollFingerId)}
      step={enrollStep}
      total={4}
      message={enrollStatusMessage}
      onDismiss={() => {
        enrollDismissed = true;
        enrollOpen = false;
      }}
    />
    <HUDPill message={hudMessage} />
  </div>
</main>
