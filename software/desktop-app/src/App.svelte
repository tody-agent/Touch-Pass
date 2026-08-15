<script lang="ts">
  import { onMount } from 'svelte';
  import ActionPane from './components/ActionPane.svelte';
  import HandMap from './components/HandMap.svelte';
  import HUDPill from './components/HUDPill.svelte';
  import SettingsPane from './components/SettingsPane.svelte';
  import Sidebar from './components/Sidebar.svelte';
  import TitleBar from './components/TitleBar.svelte';
  import TouchIDModal from './components/TouchIDModal.svelte';
  import TrayPopover from './components/TrayPopover.svelte';
  import {
    getAppStatus,
    isTauriRuntime,
    listFingerProfiles,
    resetFingerProfile,
    saveFingerProfile,
    startEnrollment,
    subscribeDeviceStatus,
    subscribeEnrollProgress,
    subscribeFingerTouch,
    testDispatchAction
  } from './lib/tauriBridge';
  import { defaultProfiles, defaultStatus, type AppStatusResponse, type FingerProfile } from './lib/types';

  let activeTab = $state<'fingers' | 'settings'>('fingers');
  let profiles = $state<FingerProfile[]>(defaultProfiles());
  let status = $state<AppStatusResponse>(defaultStatus());
  let selectedFingerId = $state(2);
  let saving = $state(false);
  let hudMessage = $state<string | undefined>(undefined);
  let trayOpen = $state(false);
  let enrollOpen = $state(false);
  let enrollFingerId = $state<number | undefined>(undefined);
  let enrollStep = $state(1);
  let enrollTimer: number | undefined;
  let hudTimer: number | undefined;

  const configuredCount = $derived(profiles.filter((profile) => profile.configured).length);
  const selectedProfile = $derived(profiles.find((profile) => profile.id === selectedFingerId) ?? profiles[0]);

  onMount(() => {
    void refresh();
    const unsubs: Array<() => void> = [];
    void subscribeDeviceStatus((payload) => {
      status.connected = payload.connected;
      status.port = payload.port;
      status.sensorStatus = payload.connected ? 'ok' : 'unavailable';
    }).then((unlisten) => unsubs.push(unlisten));
    void subscribeEnrollProgress((payload) => {
      if (payload.fingerId && payload.fingerId !== enrollFingerId) {
        enrollFingerId = payload.fingerId;
      }
      if (payload.step <= 0) {
        showHud('Không thể quét: chưa thấy cảm biến vân tay');
        enrollOpen = false;
        return;
      }
      enrollOpen = true;
      enrollStep = payload.step;
      if (payload.step >= payload.total) {
        markProfileConfigured(payload.fingerId || selectedFingerId);
        showHud('Vân tay đã sẵn sàng');
        window.setTimeout(() => (enrollOpen = false), 850);
      }
    }).then((unlisten) => unsubs.push(unlisten));
    void subscribeFingerTouch((payload) => {
      showHud(payload.status === 'armed' ? `Chạm lại để chạy ${payload.action}` : `Đã chạy ${payload.action}`);
    }).then((unlisten) => unsubs.push(unlisten));
    return () => unsubs.forEach((unlisten) => unlisten());
  });

  async function refresh() {
    try {
      const [nextStatus, nextProfiles] = await Promise.all([getAppStatus(), listFingerProfiles()]);
      status = nextStatus;
      profiles = nextProfiles;
    } catch (error) {
      showHud(error instanceof Error ? error.message : 'Không thể tải trạng thái TouchPass');
    }
  }

  function showHud(message: string) {
    hudMessage = message;
    if (hudTimer) window.clearTimeout(hudTimer);
    hudTimer = window.setTimeout(() => (hudMessage = undefined), 2600);
  }

  async function saveProfile(profile: FingerProfile, secret?: string) {
    saving = true;
    try {
      const saved = await saveFingerProfile(profile, secret);
      profiles = profiles.map((item) => (item.id === saved.id ? saved : item));
      showHud(`${saved.name} đã nhận năng lực ${saved.label}`);
    } catch (error) {
      showHud(error instanceof Error ? error.message : 'Không thể lưu năng lực');
    } finally {
      saving = false;
    }
  }

  async function resetProfile(id: number) {
    try {
      const reset = await resetFingerProfile(id);
      profiles = profiles.map((item) => (item.id === id ? reset : item));
      showHud('Đã xóa cấu hình ngón tay');
    } catch (error) {
      showHud(error instanceof Error ? error.message : 'Không thể xóa cấu hình');
    }
  }

  async function beginEnrollment(id: number) {
    enrollFingerId = id;
    enrollStep = 1;
    enrollOpen = true;
    try {
      await startEnrollment(id);
      if (!isTauriRuntime()) simulateEnrollment(id);
      showHud('Đặt ngón tay lên cảm biến');
    } catch (error) {
      showHud(error instanceof Error ? error.message : 'Không thể bắt đầu quét');
      if (!isTauriRuntime()) simulateEnrollment(id);
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
        showHud('Vân tay đã sẵn sàng');
        window.setTimeout(() => (enrollOpen = false), 850);
      }
    }, 620);
  }

  function markProfileConfigured(id: number) {
    profiles = profiles.map((profile) => (profile.id === id ? { ...profile, configured: true } : profile));
  }

  async function testAction(id: number) {
    try {
      await testDispatchAction(id);
      showHud(`Đã gửi lệnh thử cho ngón ${String(id).padStart(2, '0')}`);
    } catch (error) {
      showHud(error instanceof Error ? error.message : 'Không thể thử hành động');
    }
  }

  function openFirstTimeWizard() {
    activeTab = 'fingers';
    selectedFingerId = profiles.find((profile) => !profile.configured)?.id ?? 1;
    showHud('Hướng dẫn nhanh: chọn năng lực, quét vân tay, dùng ngay');
  }

  function simulateTouchEvent() {
    const profile = selectedProfile;
    showHud(profile.configured ? `Chạm thử: ${profile.label}` : 'Ngón này chưa được cài đặt');
  }
</script>

<main class="app-stage">
  <div class="apple-window relative">
    <TitleBar
      {status}
      onSettings={() => (activeTab = 'settings')}
      onHud={showHud}
    />

    <div class="flex min-h-0 flex-1">
      <Sidebar {activeTab} {configuredCount} onSelect={(tab) => (activeTab = tab)} />

      <div class="min-w-0 flex-1 overflow-auto p-5">
        {#if activeTab === 'fingers'}
          <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 class="text-2xl font-extrabold text-white">Ngón Tay</h1>
              <p class="mt-1 text-sm font-medium text-slate-400">Gán một năng lực cho mỗi ngón, mọi thứ chạy cục bộ.</p>
            </div>
            <div class="flex flex-wrap gap-2">
              <button class="primary-button" onclick={openFirstTimeWizard}>Hướng Dẫn Nhanh 30s</button>
              <button class="secondary-button" onclick={simulateTouchEvent}>Chạm Thử Vân Tay</button>
              <button class="secondary-button" onclick={() => (trayOpen = !trayOpen)}>Menu Bar</button>
            </div>
          </div>

          <div class="grid gap-5 xl:grid-cols-[1fr_380px]">
            <HandMap {profiles} selectedId={selectedFingerId} onSelect={(id) => (selectedFingerId = id)} />
            {#if selectedProfile}
              <ActionPane
                profile={selectedProfile}
                {saving}
                onSave={saveProfile}
                onEnroll={beginEnrollment}
                onReset={resetProfile}
                onTest={testAction}
                onHud={showHud}
              />
            {/if}
          </div>
        {:else}
          <SettingsPane {status} onHud={showHud} />
        {/if}
      </div>
    </div>

    <TrayPopover
      open={trayOpen}
      {status}
      onFingers={() => {
        activeTab = 'fingers';
        trayOpen = false;
      }}
      onSettings={() => {
        activeTab = 'settings';
        trayOpen = false;
      }}
    />

    <TouchIDModal
      open={enrollOpen}
      profile={profiles.find((profile) => profile.id === enrollFingerId)}
      step={enrollStep}
      total={4}
      onClose={() => (enrollOpen = false)}
    />
    <HUDPill message={hudMessage} />
  </div>
</main>
