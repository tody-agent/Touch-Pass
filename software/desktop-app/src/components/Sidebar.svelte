<script lang="ts">
  import { Hand, Settings } from 'lucide-svelte';

  interface Props {
    activeTab: 'fingers' | 'settings';
    configuredCount: number;
    onSelect: (tab: 'fingers' | 'settings') => void;
  }

  let { activeTab, configuredCount, onSelect }: Props = $props();
</script>

<aside class="flex w-48 shrink-0 flex-col justify-between border-r border-white/[0.06] bg-[rgba(12,14,22,0.72)] p-3 backdrop-blur-3xl">
  <div class="space-y-1">
    <button
      class={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs transition ${
        activeTab === 'fingers'
          ? 'border border-blue-500/30 bg-blue-600/20 font-extrabold text-blue-400 shadow-sm'
          : 'font-semibold text-slate-400 hover:bg-white/5 hover:text-white'
      }`}
      onclick={() => onSelect('fingers')}
    >
      <Hand size={16} />
      <span>Ngón Tay</span>
      <span class="mono ml-auto rounded-full bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-bold text-blue-300">{configuredCount}/10</span>
    </button>

    <button
      class={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs transition ${
        activeTab === 'settings'
          ? 'border border-blue-500/30 bg-blue-600/20 font-extrabold text-blue-400 shadow-sm'
          : 'font-semibold text-slate-400 hover:bg-white/5 hover:text-white'
      }`}
      onclick={() => onSelect('settings')}
    >
      <Settings size={16} />
      <span>Cài Đặt</span>
    </button>
  </div>

  <div class="rounded-2xl border border-white/[0.06] bg-black/20 p-3 text-[11px] leading-relaxed text-slate-500">
    <div class="mb-1 font-bold text-slate-300">Riêng tư 100%</div>
    <div>Mọi cấu hình nằm trên máy này. Mật khẩu không rời khỏi kho bảo mật hệ điều hành.</div>
  </div>
</aside>
