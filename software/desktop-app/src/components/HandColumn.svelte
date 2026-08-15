<script lang="ts">
  import { Check, Fingerprint } from 'lucide-svelte';
  import type { FingerProfile } from '../lib/types';

  interface Props {
    title: string;
    profiles: FingerProfile[];
    selectedId: number;
    onSelect: (id: number) => void;
  }

  let { title, profiles, selectedId, onSelect }: Props = $props();
</script>

<div class="rounded-2xl border border-white/[0.06] bg-black/20 p-3">
  <div class="mb-3 text-xs font-extrabold uppercase text-slate-500">{title}</div>
  <div class="grid grid-cols-5 gap-2">
    {#each profiles as profile}
      <button
        class={`group flex aspect-[0.72] min-h-24 flex-col items-center justify-between rounded-2xl border px-2 py-3 transition ${
          selectedId === profile.id
            ? 'border-blue-400 bg-blue-500/[0.18] shadow-[0_0_26px_rgba(10,132,255,0.22)]'
            : profile.configured
              ? 'border-emerald-400/[0.28] bg-emerald-400/10 hover:border-emerald-300/50'
              : 'border-white/[0.08] bg-white/[0.04] hover:border-blue-400/50 hover:bg-white/[0.08]'
        }`}
        onclick={() => onSelect(profile.id)}
        title={profile.name}
      >
        <span class="mono text-[10px] font-bold text-slate-500">{String(profile.id).padStart(2, '0')}</span>
        <Fingerprint
          size={24}
          class={profile.configured ? 'text-emerald-300' : selectedId === profile.id ? 'text-blue-300' : 'text-slate-500'}
        />
        <span class={`grid h-5 w-5 place-items-center rounded-full ${profile.configured ? 'bg-emerald-400 text-slate-950' : 'bg-white/[0.08] text-slate-500'}`}>
          {#if profile.configured}
            <Check size={13} strokeWidth={3} />
          {:else}
            <span class="text-sm leading-none">+</span>
          {/if}
        </span>
      </button>
    {/each}
  </div>
</div>
