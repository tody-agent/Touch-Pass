<script lang="ts">
  import { Hand, Power, Settings } from 'lucide-svelte';
  import type { AppStatusResponse } from '../lib/types';

  interface Props {
    open: boolean;
    status: AppStatusResponse;
    onFingers: () => void;
    onSettings: () => void;
  }

  let { open, status, onFingers, onSettings }: Props = $props();
</script>

{#if open}
  <div class="absolute right-5 top-14 z-40 w-64 rounded-3xl border border-white/10 bg-slate-950/90 p-3 shadow-2xl backdrop-blur-2xl">
    <div class="mb-3 flex items-center gap-3 rounded-2xl bg-white/[0.05] p-3">
      <div class={`h-2.5 w-2.5 rounded-full ${status.connected ? 'bg-emerald-400' : 'bg-amber-400'}`}></div>
      <div>
        <div class="text-sm font-extrabold text-white">TouchPass</div>
        <div class="text-xs font-semibold text-slate-500">{status.port ?? 'Chưa thấy thiết bị'}</div>
      </div>
    </div>
    <button class="secondary-button mb-2 w-full justify-start" onclick={onFingers}>
      <Hand size={15} />
      <span>Mở bản đồ ngón tay</span>
    </button>
    <button class="secondary-button mb-2 w-full justify-start" onclick={onSettings}>
      <Settings size={15} />
      <span>Cài đặt nhanh</span>
    </button>
    <button class="danger-button w-full justify-start">
      <Power size={15} />
      <span>Tạm dừng tự động</span>
    </button>
  </div>
{/if}
