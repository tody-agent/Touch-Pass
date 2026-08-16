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

<header class="app-toolbar">
  <div class="flex min-w-0 items-center gap-2.5">
    <span class="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-500/12 text-blue-300">
      <Hand size={19} aria-hidden="true" />
    </span>
    <span class="truncate text-sm font-extrabold text-white">TouchPass</span>
  </div>

  <div
    class={`status-pill ${deviceReady ? 'status-pill-ready' : 'status-pill-waiting'}`}
    role="status"
    aria-live="polite"
  >
    <Circle size={7} fill="currentColor" strokeWidth={0} aria-hidden="true" />
    <span>{toolbarStatusLabel(locale, status.sensorStatus)}</span>
  </div>

  <nav class="flex items-center justify-end gap-1" aria-label="TouchPass">
    <button class="icon-button" title={translate(locale, 'toolbar.help')} aria-label={translate(locale, 'toolbar.help')} onclick={onHelp}>
      <CircleHelp size={19} />
    </button>
    <button class="icon-button" title={translate(locale, 'toolbar.settings')} aria-label={translate(locale, 'toolbar.settings')} onclick={onSettings}>
      <Settings size={19} />
    </button>
  </nav>
</header>
