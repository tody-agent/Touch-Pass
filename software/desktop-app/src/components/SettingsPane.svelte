<script lang="ts">
  import { Activity, Database, HardDrive, Shield } from 'lucide-svelte';
  import type { AppStatusResponse } from '../lib/types';

  interface Props {
    status: AppStatusResponse;
    onHud: (message: string) => void;
  }

  let { status, onHud }: Props = $props();
  let haptics = $state(true);
  let launchAtLogin = $state(false);
  let devOpen = $state(false);
</script>

<section class="space-y-5">
  <div>
    <h1 class="text-2xl font-extrabold text-white">Cài Đặt</h1>
    <p class="mt-1 text-sm font-medium text-slate-400">Điều khiển kết nối, bảo mật và phản hồi khi chạm.</p>
  </div>

  <div class="grid gap-4 md:grid-cols-2">
    <div class="glass-card rounded-3xl p-5">
      <div class="mb-4 flex items-center gap-3">
        <div class="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-400/10 text-emerald-300">
          <Activity size={20} />
        </div>
        <div>
          <div class="text-sm font-extrabold text-white">Thiết bị</div>
          <div class="text-xs font-semibold text-slate-500">{status.connected ? 'Đã kết nối' : 'Đang tìm kiếm'}</div>
        </div>
      </div>
      <div class="space-y-2 text-xs font-semibold text-slate-400">
        <div class="flex justify-between"><span>Cổng</span><span class="mono text-slate-200">{status.port ?? 'N/A'}</span></div>
        <div class="flex justify-between"><span>Firmware</span><span class="mono text-slate-200">{status.firmwareMode}</span></div>
        <div class="flex justify-between"><span>Cảm biến</span><span class="mono text-slate-200">{status.sensorStatus}</span></div>
      </div>
    </div>

    <div class="glass-card rounded-3xl p-5">
      <div class="mb-4 flex items-center gap-3">
        <div class="grid h-10 w-10 place-items-center rounded-2xl bg-purple-400/10 text-purple-300">
          <Shield size={20} />
        </div>
        <div>
          <div class="text-sm font-extrabold text-white">Bảo mật cục bộ</div>
          <div class="text-xs font-semibold text-slate-500">Không cloud, không đồng bộ ngoài máy</div>
        </div>
      </div>
      <div class="space-y-3">
        <label class="flex items-center justify-between rounded-2xl border border-white/[0.07] bg-black/20 px-4 py-3">
          <span class="text-sm font-bold text-slate-200">Rung/âm phản hồi nhẹ</span>
          <input class="h-5 w-5 accent-blue-500" type="checkbox" bind:checked={haptics} />
        </label>
        <label class="flex items-center justify-between rounded-2xl border border-white/[0.07] bg-black/20 px-4 py-3">
          <span class="text-sm font-bold text-slate-200">Mở TouchPass khi đăng nhập</span>
          <input class="h-5 w-5 accent-blue-500" type="checkbox" bind:checked={launchAtLogin} />
        </label>
      </div>
    </div>
  </div>

  <div class="glass-card rounded-3xl p-5">
    <button class="flex w-full items-center justify-between text-left" onclick={() => (devOpen = !devOpen)}>
      <span class="flex items-center gap-3">
        <span class="grid h-10 w-10 place-items-center rounded-2xl bg-blue-400/10 text-blue-300">
          <Database size={20} />
        </span>
        <span>
          <span class="block text-sm font-extrabold text-white">Bộ kiểm tra nhà phát triển</span>
          <span class="block text-xs font-semibold text-slate-500">Ẩn mặc định để giữ trải nghiệm gọn</span>
        </span>
      </span>
      <HardDrive size={18} class="text-slate-500" />
    </button>
    {#if devOpen}
      <div class="mt-4 rounded-2xl border border-white/[0.07] bg-black/25 p-4">
        <div class="mono text-[11px] leading-relaxed text-slate-400">
          worker={status.backgroundWorker}<br />
          fingerprints={status.fingerprintCount}<br />
          hidKeyConfigured={String(status.hidKeyConfigured)}
        </div>
        <button class="secondary-button mt-4" onclick={() => onHud('Đã làm mới trạng thái thiết bị')}>
          Làm mới trạng thái
        </button>
      </div>
    {/if}
  </div>
</section>
