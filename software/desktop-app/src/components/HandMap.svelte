<script lang="ts">
  import HandColumn from './HandColumn.svelte';
  import type { FingerProfile } from '../lib/types';

  interface Props {
    profiles: FingerProfile[];
    selectedId: number;
    onSelect: (id: number) => void;
  }

  let { profiles, selectedId, onSelect }: Props = $props();
  const left = $derived(profiles.filter((profile) => profile.hand === 'left'));
  const right = $derived(profiles.filter((profile) => profile.hand === 'right'));
</script>

<section class="glass-card rounded-3xl p-5">
  <div class="mb-4 flex items-center justify-between">
    <div>
      <h2 class="text-lg font-extrabold text-white">Bản Đồ Ngón Tay</h2>
      <p class="mt-1 text-xs font-medium text-slate-400">Chọn một ngón để gán năng lực hoặc quét lại vân tay.</p>
    </div>
    <div class="pill mono rounded-full px-3 py-1.5 text-[11px] font-bold text-slate-300">01-10</div>
  </div>

  <div class="grid gap-5 md:grid-cols-2">
    <HandColumn title="Tay Trái" profiles={left} selectedId={selectedId} onSelect={onSelect} />
    <HandColumn title="Tay Phải" profiles={right} selectedId={selectedId} onSelect={onSelect} />
  </div>
</section>
