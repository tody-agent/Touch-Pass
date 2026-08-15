<script lang="ts">
  import { Circle, Hand, Settings } from 'lucide-svelte';
  import type { AppStatusResponse } from '../lib/types';
  import { closeWindow, minimizeWindow } from '../lib/tauriBridge';

  interface Props {
    status: AppStatusResponse;
    onSettings: () => void;
    onHud: (message: string) => void;
  }

  let { status, onSettings, onHud }: Props = $props();

  function hideToTray() {
    onHud('TouchPass đang chạy ngầm trong Menu Bar');
    void closeWindow();
  }
</script>

<div class="h-12 shrink-0 border-b border-white/[0.07] bg-white/[0.01] px-5" data-tauri-drag-region>
  <div class="grid h-full grid-cols-[112px_1fr_112px] items-center" data-tauri-drag-region>
    <div class="flex items-center gap-2">
      <button class="h-3 w-3 rounded-full border border-[#E0443E] bg-[#FF5F56] shadow-sm" title="Ẩn ứng dụng" onclick={hideToTray}></button>
      <button class="h-3 w-3 rounded-full border border-[#DEA123] bg-[#FFBD2E] shadow-sm" title="Thu nhỏ" onclick={() => void minimizeWindow()}></button>
      <button class="h-3 w-3 rounded-full border border-[#1AAB29] bg-[#27C93F] shadow-sm" title="Sẵn sàng"></button>
    </div>

    <div class="flex items-center justify-center gap-2 text-xs font-semibold text-slate-200" data-tauri-drag-region>
      <Hand size={16} class="text-blue-300" />
      <span class="font-extrabold text-white">TouchPass</span>
      <span class="text-slate-600">•</span>
      <div
        class={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
          status.connected
            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
            : 'border-amber-500/20 bg-amber-500/10 text-amber-300'
        }`}
      >
        <Circle size={6} fill="currentColor" strokeWidth={0} />
        <span>{status.connected ? 'Thiết bị sẵn sàng' : 'Đang tìm thiết bị'}</span>
      </div>
    </div>

    <div class="flex justify-end">
      <button class="icon-button" title="Cài đặt" onclick={onSettings}>
        <Settings size={17} />
      </button>
    </div>
  </div>
</div>
