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

<nav class="finger-navigator h-full flex flex-col min-h-0 overflow-y-auto" aria-label={translate(locale, 'handMap.title')}>
  <header class="navigator-heading shrink-0 flex items-center justify-between gap-2 pb-2.5 border-b border-[var(--border)]">
    <div class="min-w-0 flex-1">
      <h1 class="text-sm font-bold tracking-tight text-[var(--fg)]">{translate(locale, 'handMap.title')}</h1>
    </div>
    <span class="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[11px] px-2 py-0.5 rounded-full font-semibold mono shrink-0">
      {configuredCount} / 10
    </span>
  </header>

  <div class="flex-1 min-h-0 space-y-3 pt-2">
    {#each ['left', 'right'] as hand}
      {@const handProfiles = profiles.filter((profile) => profile.hand === hand)}
      <section class="navigator-hand" aria-label={translate(locale, `hand.${hand}` as 'hand.left' | 'hand.right')}>
        <h2 class="text-[10px] font-bold uppercase tracking-wider text-[var(--fg-subtle)] mb-1 px-1">
          {translate(locale, `hand.${hand}` as 'hand.left' | 'hand.right')}
        </h2>
        <div class="space-y-1">
          {#each handProfiles as profile}
            {@const isSelected = selectedId === profile.id}
            {@const isDisabled = profile.configured && profile.actionType === 'disabled'}
            <button
              class="group relative w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg border text-left transition-all duration-150 {isSelected
                ? 'bg-blue-500/15 border-blue-500/50 shadow-sm text-[var(--fg)] font-medium'
                : 'bg-[var(--card)] hover:bg-[var(--card-hover)] border-[var(--border)] text-[var(--fg)]'}"
              class:selected={isSelected}
              class:configured={profile.configured}
              disabled={locked}
              onclick={() => !locked && onSelect(profile.id)}
              aria-current={isSelected ? 'true' : undefined}
              aria-label={fingerName(locale, profile.id)}
            >
              <!-- Left: Monospace slot numeral -->
              <span
                class="mono flex h-6 w-6 shrink-0 items-center justify-center rounded text-[11px] font-bold transition-colors {isSelected
                  ? 'bg-blue-500/25 text-blue-600 dark:text-blue-400'
                  : 'bg-[var(--card-strong)] text-[var(--fg-muted)] group-hover:text-[var(--fg)]'}"
              >
                {String(profile.id).padStart(2, '0')}
              </span>

              <!-- Center: Clean finger name + small action type icon or label -->
              <div class="flex min-w-0 flex-1 flex-col justify-center">
                <span class="truncate text-xs font-semibold leading-tight text-[var(--fg)]">
                  {fingerName(locale, profile.id)}
                </span>
                <div class="mt-0.5 flex items-center gap-1 text-[10.5px] leading-tight {isSelected ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-[var(--fg-muted)]'}">
                  {#if profile.configured}
                    {#if profile.actionType === 'ai_accept'}
                      <Bot size={11} class="text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
                    {:else if profile.actionType === 'password'}
                      <KeyRound size={11} class="text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
                    {:else if profile.actionType === 'enter'}
                      <CornerDownLeft size={11} class="text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                    {:else if profile.actionType === 'escape'}
                      <X size={11} class="text-rose-600 dark:text-rose-400 shrink-0" aria-hidden="true" />
                    {:else if profile.actionType === 'custom'}
                      <Terminal size={11} class="text-purple-600 dark:text-purple-400 shrink-0" aria-hidden="true" />
                    {:else if profile.actionType === 'disabled'}
                      <Pause size={11} class="text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
                    {/if}
                    <span class="truncate">{actionLabel(locale, profile.actionType)}</span>
                  {:else}
                    <span class="truncate text-[var(--fg-subtle)] font-medium">{translate(locale, 'finger.unconfigured')}</span>
                  {/if}
                </div>
              </div>

              <!-- Right: Status icon -->
              <div class="flex shrink-0 items-center justify-center">
                {#if profile.configured}
                  {#if isDisabled}
                    <span
                      class="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                      title={translate(locale, 'finger.disabled')}
                    >
                      <Pause size={9} strokeWidth={2.5} aria-label={translate(locale, 'finger.disabled')} />
                    </span>
                  {:else}
                    <span
                      class="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                      title={translate(locale, 'finger.configured')}
                    >
                      <Check size={10} strokeWidth={2.5} aria-label={translate(locale, 'finger.configured')} />
                    </span>
                  {/if}
                {:else}
                  <span
                    class="flex h-4 w-4 items-center justify-center rounded-full text-[var(--fg-subtle)] group-hover:text-[var(--fg)] transition-colors"
                    title={translate(locale, 'finger.unconfigured')}
                  >
                    <Plus size={11} strokeWidth={2} aria-label={translate(locale, 'finger.unconfigured')} />
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
