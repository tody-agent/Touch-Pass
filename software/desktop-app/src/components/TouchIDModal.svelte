<script lang="ts">
  import { Check, Fingerprint, X } from 'lucide-svelte';
  import type { FingerProfile } from '../lib/types';

  interface Props {
    open: boolean;
    profile: FingerProfile | undefined;
    step: number;
    total: number;
    onClose: () => void;
  }

  let { open, profile, step, total, onClose }: Props = $props();
  const progress = $derived(Math.max(0, Math.min(100, (step / total) * 100)));
  const done = $derived(step >= total);
  const label = $derived(done ? 'Hoàn tất!' : step <= 1 ? 'Đặt ngón tay lên cảm biến...' : 'Nhấc ra rồi chạm lại...');
</script>

{#if open}
  <div class="absolute inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-2xl">
    <div class="relative w-full max-w-sm rounded-[28px] border border-white/10 bg-[#111620]/95 p-6 text-center shadow-2xl">
      <button class="icon-button absolute right-3 top-3" title="Đóng" onclick={onClose}>
        <X size={16} />
      </button>

      <div class="relative mx-auto mb-5 grid h-32 w-32 place-items-center">
        <div class="pulse-glow absolute inset-0 rounded-full bg-blue-500/15"></div>
        <div class="absolute inset-4 rounded-full bg-blue-500/10 blur-xl"></div>
        <div class="relative grid h-24 w-24 place-items-center overflow-hidden rounded-full border border-blue-400/25 bg-blue-500/[0.08] text-blue-300">
          {#if done}
            <Check size={48} strokeWidth={2.4} />
          {:else}
            <Fingerprint size={54} strokeWidth={1.6} />
            <div class="scanning-line absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-300 to-transparent"></div>
          {/if}
        </div>
      </div>

      <h3 class="text-xl font-extrabold text-white">{done ? 'Đã liên kết vân tay' : 'Quét Vân Tay'}</h3>
      <p class="mt-1 text-xs font-semibold text-slate-400">Đang liên kết với {profile?.name ?? 'ngón tay đã chọn'}</p>
      <div class="mt-5 h-2 overflow-hidden rounded-full bg-white/[0.08]">
        <div class="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-300" style={`width: ${progress}%`}></div>
      </div>
      <div class="mt-3 text-xs font-extrabold text-blue-300">{label}</div>
      <div class="mono mt-1 text-[11px] font-bold text-slate-500">Bước {Math.max(1, step)}/{total}</div>
    </div>
  </div>
{/if}
