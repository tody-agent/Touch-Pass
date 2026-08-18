<script lang="ts">
  import { Circle, CircleHelp, Hand, Moon, Settings, Sun } from 'lucide-svelte';
  import { toolbarStatusLabel, translate, type Locale } from '../lib/i18n';
  import type { AppStatusResponse } from '../lib/types';

  interface Props {
    locale: Locale;
    status: AppStatusResponse;
    theme?: 'dark' | 'light';
    onThemeToggle?: () => void;
    onSettings: () => void;
    onHelp: () => void;
  }

  let { locale, status, theme = 'dark', onThemeToggle, onSettings, onHelp }: Props = $props();
  const deviceReady = $derived(status.connected && status.sensorStatus === 'ok');
</script>

<header class="app-toolbar backdrop-blur-xl border-b px-4 py-2 h-12">
  <div class="flex min-w-0 items-center gap-2">
    <span class="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-blue-500/15 text-blue-500 border border-blue-500/20 shadow-sm">
      <Hand size={15} aria-hidden="true" />
    </span>
    <span class="truncate text-sm font-semibold tracking-tight text-[var(--fg)]">TouchPass</span>
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
        class={deviceReady ? 'text-emerald-500 drop-shadow-[0_0_6px_rgba(16,185,129,0.8)]' : 'text-amber-500'}
        aria-hidden="true"
      />
    </span>
    <span class="text-[11px] font-medium tracking-tight">{toolbarStatusLabel(locale, status.sensorStatus)}</span>
  </div>

  <nav class="flex items-center justify-end gap-0.5" aria-label="TouchPass">
    {#if onThemeToggle}
      <button
        class="icon-button"
        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        onclick={onThemeToggle}
      >
        {#if theme === 'dark'}
          <Sun size={16} />
        {:else}
          <Moon size={16} />
        {/if}
      </button>
    {/if}
    <button
      class="icon-button"
      title={translate(locale, 'toolbar.help')}
      aria-label={translate(locale, 'toolbar.help')}
      onclick={onHelp}
    >
      <CircleHelp size={16} />
    </button>
    <button
      class="icon-button"
      title={translate(locale, 'toolbar.settings')}
      aria-label={translate(locale, 'toolbar.settings')}
      onclick={onSettings}
    >
      <Settings size={16} />
    </button>
  </nav>
</header>
