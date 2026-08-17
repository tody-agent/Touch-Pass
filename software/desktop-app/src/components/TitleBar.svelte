<script lang="ts">
  import { Circle, CircleHelp, Hand, Settings } from 'lucide-svelte';
  import { toolbarStatusLabel, translate, type Locale } from '../lib/i18n';
  import type { AppStatusResponse } from '../lib/types';

  interface Props {
    locale: Locale;
    status: AppStatusResponse;
    onSettings: () => void;
    onHelp: () => void;
  }

  let { locale, status, onSettings, onHelp }: Props = $props();
  const deviceReady = $derived(status.connected && status.sensorStatus === 'ok');
</script>

<header class="app-toolbar backdrop-blur-xl bg-slate-950/70 border-b border-white/[0.06] px-4 py-2.5 h-13">
  <div class="flex min-w-0 items-center gap-2.5">
    <span class="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-blue-500/15 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.2)] border border-blue-500/20">
      <Hand size={17} aria-hidden="true" />
    </span>
    <span class="truncate text-sm font-semibold tracking-tight text-white">TouchPass</span>
  </div>

  <div
    class={`status-pill ${deviceReady ? 'status-pill-ready' : 'status-pill-waiting'}`}
    role="status"
    aria-live="polite"
  >
    <span class="relative flex h-2 w-2 items-center justify-center">
      {#if !deviceReady}
        <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
      {/if}
      <Circle
        size={6}
        fill="currentColor"
        strokeWidth={0}
        class={deviceReady ? 'text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'text-amber-400'}
        aria-hidden="true"
      />
    </span>
    <span class="text-xs font-medium tracking-tight">{toolbarStatusLabel(locale, status.sensorStatus)}</span>
  </div>

  <nav class="flex items-center justify-end gap-1" aria-label="TouchPass">
    <button
      class="icon-button hover:bg-white/10 active:scale-95 rounded-lg p-2 text-slate-300 hover:text-white transition"
      title={translate(locale, 'toolbar.help')}
      aria-label={translate(locale, 'toolbar.help')}
      onclick={onHelp}
    >
      <CircleHelp size={18} />
    </button>
    <button
      class="icon-button hover:bg-white/10 active:scale-95 rounded-lg p-2 text-slate-300 hover:text-white transition"
      title={translate(locale, 'toolbar.settings')}
      aria-label={translate(locale, 'toolbar.settings')}
      onclick={onSettings}
    >
      <Settings size={18} />
    </button>
  </nav>
</header>
