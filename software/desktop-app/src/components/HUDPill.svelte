<script lang="ts">
  import { Sparkles } from 'lucide-svelte';

  interface Props {
    message: string | undefined;
  }

  let { message }: Props = $props();
</script>

{#if message}
  <div class="hud-enter absolute bottom-5 left-1/2 z-[70] flex max-w-[86%] items-start gap-2 rounded-2xl border border-white/10 bg-slate-950/90 px-4 py-3 text-xs font-extrabold text-white shadow-2xl backdrop-blur-2xl" role="status" aria-live="polite">
    <Sparkles size={15} class="mt-0.5 shrink-0 text-blue-300" />
    <span class="min-w-0 whitespace-normal break-words leading-relaxed">{message}</span>
  </div>
{/if}
