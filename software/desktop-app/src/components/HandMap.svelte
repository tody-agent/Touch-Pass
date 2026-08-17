<script lang="ts">
  import {
    Bot,
    Check,
    CornerDownLeft,
    KeyRound,
    Pause,
    Plus,
    Terminal,
    X
  } from 'lucide-svelte';
  import { actionLabel, fingerName, translate, type Locale } from '../lib/i18n';
  import type { FingerProfile } from '../lib/types';

  interface Props {
    locale: Locale;
    profiles: FingerProfile[];
    selectedId: number;
    locked?: boolean;
    onSelect: (id: number) => void;
  }

  let { locale, profiles, selectedId, locked = false, onSelect }: Props = $props();
  const configuredCount = $derived(profiles.filter((profile) => profile.configured).length);
</script>

<nav class="finger-navigator" aria-label={translate(locale, 'handMap.title')}>
  <header class="navigator-heading flex items-start justify-between gap-3 pb-3 border-b border-white/[0.06]">
    <div class="min-w-0 flex-1">
      <h1 class="text-base font-bold tracking-tight text-white">{translate(locale, 'handMap.title')}</h1>
      <p class="mt-0.5 text-xs text-slate-400 leading-relaxed">{translate(locale, 'handMap.description')}</p>
    </div>
    <span class="bg-blue-500/10 text-blue-300 border border-blue-500/20 text-xs px-2.5 py-0.5 rounded-full font-medium mono shrink-0">
      {configuredCount} of 10
    </span>
  </header>

  <div class="space-y-4 pt-3">
    {#each ['left', 'right'] as hand}
      {@const handProfiles = profiles.filter((profile) => profile.hand === hand)}
      <section class="navigator-hand" aria-label={translate(locale, `hand.${hand}` as 'hand.left' | 'hand.right')}>
        <h2 class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 px-1">
          {translate(locale, `hand.${hand}` as 'hand.left' | 'hand.right')}
        </h2>
        <div class="space-y-1.5">
          {#each handProfiles as profile}
            {@const isSelected = selectedId === profile.id}
            {@const isDisabled = profile.configured && profile.actionType === 'disabled'}
            <button
              class="group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all duration-150 {isSelected
                ? 'bg-blue-600/15 border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.15)] text-white'
                : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/[0.06] hover:border-white/[0.1] text-slate-300'}"
              class:selected={isSelected}
              class:configured={profile.configured}
              disabled={locked}
              onclick={() => !locked && onSelect(profile.id)}
              aria-current={isSelected ? 'true' : undefined}
              aria-label={fingerName(locale, profile.id)}
            >
              <!-- Left: Monospace slot numeral with muted slate background -->
              <span
                class="mono flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold transition-colors {isSelected
                  ? 'bg-blue-500/20 text-blue-300'
                  : 'bg-slate-800/80 text-slate-400 group-hover:text-slate-300'}"
              >
                {String(profile.id).padStart(2, '0')}
              </span>

              <!-- Center: Clean finger name + small action type icon or label -->
              <div class="flex min-w-0 flex-1 flex-col justify-center">
                <span class="truncate text-xs font-semibold leading-tight {isSelected ? 'text-white' : 'text-slate-200'}">
                  {fingerName(locale, profile.id)}
                </span>
                <div class="mt-0.5 flex items-center gap-1.5 text-[11px] leading-tight {isSelected ? 'text-blue-200/80' : 'text-slate-400'}">
                  {#if profile.configured}
                    {#if profile.actionType === 'ai_accept'}
                      <Bot size={12} class={isSelected ? 'text-blue-300' : 'text-blue-400'} aria-hidden="true" />
                    {:else if profile.actionType === 'password'}
                      <KeyRound size={12} class={isSelected ? 'text-amber-300' : 'text-amber-400'} aria-hidden="true" />
                    {:else if profile.actionType === 'enter'}
                      <CornerDownLeft size={12} class={isSelected ? 'text-emerald-300' : 'text-emerald-400'} aria-hidden="true" />
                    {:else if profile.actionType === 'escape'}
                      <X size={12} class={isSelected ? 'text-rose-300' : 'text-rose-400'} aria-hidden="true" />
                    {:else if profile.actionType === 'custom'}
                      <Terminal size={12} class={isSelected ? 'text-purple-300' : 'text-purple-400'} aria-hidden="true" />
                    {:else if profile.actionType === 'disabled'}
                      <Pause size={12} class="text-amber-400" aria-hidden="true" />
                    {/if}
                    <span class="truncate">{actionLabel(locale, profile.actionType)}</span>
                  {:else}
                    <span class="truncate text-slate-500">{translate(locale, 'finger.unconfigured')}</span>
                  {/if}
                </div>
              </div>

              <!-- Right: Status icon -->
              <div class="flex shrink-0 items-center justify-center">
                {#if profile.configured}
                  {#if isDisabled}
                    <span
                      class="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30"
                      title={translate(locale, 'finger.disabled')}
                    >
                      <Pause size={11} strokeWidth={2.5} aria-label={translate(locale, 'finger.disabled')} />
                    </span>
                  {:else}
                    <span
                      class="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      title={translate(locale, 'finger.configured')}
                    >
                      <Check size={12} strokeWidth={2.5} aria-label={translate(locale, 'finger.configured')} />
                    </span>
                  {/if}
                {:else}
                  <span
                    class="flex h-5 w-5 items-center justify-center rounded-full text-slate-500 group-hover:text-slate-400 group-hover:bg-white/[0.04] transition-colors"
                    title={translate(locale, 'finger.unconfigured')}
                  >
                    <Plus size={13} strokeWidth={2} aria-label={translate(locale, 'finger.unconfigured')} />
                  </span>
                {/if}
              </div>
            </button>
          {/each}
        </div>
      </section>
    {/each}
  </div>
</nav>
