<script lang="ts">
  import HandColumn from './HandColumn.svelte';
  import { translate, type Locale } from '../lib/i18n';
  import type { FingerProfile } from '../lib/types';

  interface Props {
    locale: Locale;
    profiles: FingerProfile[];
    selectedId: number;
    onSelect: (id: number) => void;
  }

  let { locale, profiles, selectedId, onSelect }: Props = $props();
  const left = $derived(profiles.filter((profile) => profile.hand === 'left'));
  const right = $derived(profiles.filter((profile) => profile.hand === 'right'));
</script>

<section class="glass-card rounded-3xl p-5" aria-labelledby="finger-map-title">
  <div class="mb-4 flex items-start justify-between gap-4">
    <div>
      <h2 id="finger-map-title" class="text-lg font-extrabold text-white">{translate(locale, 'handMap.title')}</h2>
      <p class="mt-1 text-xs font-medium leading-relaxed text-slate-300">{translate(locale, 'handMap.description')}</p>
    </div>
    <div class="pill mono shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold text-slate-300">01–10</div>
  </div>

  <div class="grid gap-4 md:grid-cols-2">
    <HandColumn {locale} title={translate(locale, 'hand.left')} profiles={left} {selectedId} {onSelect} />
    <HandColumn {locale} title={translate(locale, 'hand.right')} profiles={right} {selectedId} {onSelect} />
  </div>
</section>
