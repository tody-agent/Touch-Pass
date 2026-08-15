<script lang="ts">
  import { Sparkles } from 'lucide-svelte';

  interface Props {
    message: string | undefined;
  }

  let { message }: Props = $props();
</script>

{#if message}
  <div class="hud-enter absolute bottom-5 left-1/2 z-50 flex max-w-[86%] items-center gap-2 rounded-full border border-white/10 bg-slate-950/85 px-4 py-2 text-xs font-extrabold text-white shadow-2xl backdrop-blur-2xl">
    <Sparkles size={15} class="text-blue-300" />
    <span class="truncate">{message}</span>
  </div>
{/if}
