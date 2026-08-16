<script lang="ts">
  import { Check, CirclePlus, Fingerprint } from 'lucide-svelte';
  import { fingerName, translate, type Locale } from '../lib/i18n';
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
  <header class="navigator-heading">
    <div>
      <h1>{translate(locale, 'handMap.title')}</h1>
      <p>{translate(locale, 'handMap.description')}</p>
    </div>
    <span class="navigator-count">{configuredCount}/10</span>
  </header>

  {#each ['left', 'right'] as hand}
    {@const handProfiles = profiles.filter((profile) => profile.hand === hand)}
    <section class="navigator-hand" aria-label={translate(locale, `hand.${hand}` as 'hand.left' | 'hand.right')}>
      <h2>{translate(locale, `hand.${hand}` as 'hand.left' | 'hand.right')}</h2>
      <div class="navigator-list">
        {#each handProfiles as profile}
          <button
            class:selected={selectedId === profile.id}
            class:configured={profile.configured}
            disabled={locked}
            onclick={() => !locked && onSelect(profile.id)}
            aria-current={selectedId === profile.id ? 'true' : undefined}
            aria-label={fingerName(locale, profile.id)}
          >
            <Fingerprint size={20} aria-hidden="true" />
            <span class="mono">{String(profile.id).padStart(2, '0')}</span>
            <span class="navigator-finger-name">{fingerName(locale, profile.id)}</span>
            {#if profile.configured}
              <Check class="navigator-state ready" size={18} strokeWidth={3} aria-label={translate(locale, 'finger.configured')} />
            {:else}
              <CirclePlus class="navigator-state" size={19} aria-label={translate(locale, 'finger.unconfigured')} />
            {/if}
          </button>
        {/each}
      </div>
    </section>
  {/each}
</nav>
