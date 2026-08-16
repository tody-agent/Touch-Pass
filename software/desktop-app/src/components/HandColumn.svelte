<script lang="ts">
  import { Check, Fingerprint } from 'lucide-svelte';
  import { fingerName, type Locale } from '../lib/i18n';
  import type { FingerProfile } from '../lib/types';

  interface Props {
    locale: Locale;
    title: string;
    profiles: FingerProfile[];
    selectedId: number;
    onSelect: (id: number) => void;
  }

  let { locale, title, profiles, selectedId, onSelect }: Props = $props();
</script>

<div class="hand-group">
  <div class="mb-3 text-xs font-extrabold uppercase tracking-wide text-slate-400">{title}</div>
  <div class="grid grid-cols-5 gap-2">
    {#each profiles as profile}
      <button
        class={`finger-button ${
          selectedId === profile.id
            ? 'finger-button-selected'
            : profile.configured
              ? 'finger-button-configured'
              : 'finger-button-idle'
        }`}
        onclick={() => onSelect(profile.id)}
        title={fingerName(locale, profile.id)}
        aria-label={fingerName(locale, profile.id)}
        aria-pressed={selectedId === profile.id}
      >
        <span class="mono text-[10px] font-bold text-slate-400">{String(profile.id).padStart(2, '0')}</span>
        <Fingerprint
          size={24}
          aria-hidden="true"
          class={profile.configured ? 'text-emerald-300' : selectedId === profile.id ? 'text-blue-300' : 'text-slate-400'}
        />
        <span class={`finger-state ${profile.configured ? 'finger-state-ready' : 'finger-state-empty'}`}>
          {#if profile.configured}
            <Check size={13} strokeWidth={3} aria-hidden="true" />
          {:else}
            <span class="text-sm leading-none" aria-hidden="true">+</span>
          {/if}
        </span>
      </button>
    {/each}
  </div>
</div>
