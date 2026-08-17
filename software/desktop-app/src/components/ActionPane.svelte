<script lang="ts">
  import {
    AlertCircle,
    Bot,
    Check,
    CornerDownLeft,
    Ellipsis,
    Eye,
    EyeOff,
    Fingerprint,
    KeyRound,
    Keyboard,
    Play,
    RotateCw,
    ShieldCheck,
    Trash2,
    WandSparkles,
    X
  } from 'lucide-svelte';
  import {
    actionDescription,
    actionLabel,
    fingerName,
    translate,
    validationMessage,
    type Locale
  } from '../lib/i18n';
  import { saveProfileWithEnrollment } from '../lib/profileActions';
  import { focusFirstInDialog, handleDialogKeydown } from '../lib/focusTrap';
  import { validateActionDraft, type ActionType, type FingerProfile } from '../lib/types';

  interface Props {
    locale: Locale;
    profile: FingerProfile;
    saving: boolean;
    deviceConnected: boolean;
    onSave: (profile: FingerProfile, secret?: string) => Promise<FingerProfile>;
    onEnroll: (id: number) => Promise<void>;
    onReset: (id: number, forceLocal?: boolean) => Promise<void>;
    onTest: (id: number) => Promise<void>;
    onDirtyChange: (dirty: boolean) => void;
    resetRevision: number;
    interactionLocked: boolean;
    draftDirty?: boolean;
  }

  let {
    locale,
    profile,
    saving,
    deviceConnected,
    onSave,
    onEnroll,
    onReset,
    onTest,
    onDirtyChange,
    resetRevision,
    interactionLocked,
    draftDirty = false
  }: Props = $props();

  let selectedType = $state<ActionType>('enter');
  let customPayload = $state('');
  let secret = $state('');
  let showPassword = $state(false);
  let requireConfirm = $state(true);
  let moreOpen = $state(false);
  let deleteOpen = $state(false);
  let deleting = $state(false);
  let deleteDialogElement: HTMLDivElement | undefined = $state();
  let moreButtonElement: HTMLButtonElement | undefined = $state();
  let moreMenuElement: HTMLDivElement | undefined = $state();
  let actionListElement: HTMLDivElement | undefined = $state();

  const presets: Array<{ type: ActionType; icon: typeof Bot; accent: string }> = [
    { type: 'ai_accept', icon: Bot, accent: 'text-blue-400' },
    { type: 'password', icon: KeyRound, accent: 'text-purple-400' },
    { type: 'enter', icon: CornerDownLeft, accent: 'text-emerald-400' },
    { type: 'escape', icon: Keyboard, accent: 'text-cyan-400' },
    { type: 'custom', icon: WandSparkles, accent: 'text-amber-400' }
  ];

  const validationCode = $derived(
    validateActionDraft({
      actionType: selectedType,
      customPayload,
      secret,
      secretConfigured: profile.secretConfigured
    })
  );
  const validationText = $derived(validationMessage(locale, validationCode));
  const canSave = $derived(!validationCode && (profile.configured || deviceConnected));
  const isDisabled = $derived(profile.actionType === 'disabled');

  $effect(() => {
    void resetRevision;
    if (profile.actionType !== 'disabled') {
      selectedType = profile.actionType;
    }
    customPayload = profile.customPayload ?? '';
    secret = '';
    showPassword = false;
    requireConfirm = profile.requireConfirm;
    moreOpen = false;
  });

  $effect(() => {
    if (moreOpen) {
      queueMicrotask(() => moreMenuElement?.querySelector<HTMLButtonElement>('button:not([disabled])')?.focus());
    }
  });

  $effect(() => {
    if (interactionLocked) moreOpen = false;
  });

  function handleMenuKeydown(event: KeyboardEvent) {
    if (!moreMenuElement) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      moreOpen = false;
      queueMicrotask(() => moreButtonElement?.focus());
      return;
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const items = Array.from(moreMenuElement.querySelectorAll<HTMLButtonElement>('button:not([disabled])'));
    const current = items.indexOf(document.activeElement as HTMLButtonElement);
    const direction = event.key === 'ArrowDown' ? 1 : -1;
    const next = current < 0 ? 0 : (current + direction + items.length) % items.length;
    items[next]?.focus();
  }

  $effect(() => {
    if (!deleteOpen || typeof document === 'undefined') return;
    const previousFocus = document.activeElement as HTMLElement | null;
    queueMicrotask(() => focusFirstInDialog(deleteDialogElement));
    return () => previousFocus?.focus();
  });

  async function save() {
    if (!canSave || interactionLocked) return;
    const draft: FingerProfile = {
      ...profile,
      actionType: selectedType,
      requireConfirm,
      customPayload: selectedType === 'custom' ? customPayload.trim() : undefined
    };
    try {
      await saveProfileWithEnrollment(
        draft,
        selectedType === 'password' && secret ? secret : undefined,
        onSave,
        onEnroll
      );
      onDirtyChange(false);
    } catch {
      // App-level callbacks localize and surface command errors.
    }
  }

  async function disableAction() {
    moreOpen = false;
    try {
      await onSave({ ...profile, actionType: 'disabled' });
      onDirtyChange(false);
    } catch {
      // App-level callbacks surface the error.
    }
  }

  async function enableAction() {
    moreOpen = false;
    try {
      await onSave({ ...profile, actionType: selectedType });
      onDirtyChange(false);
    } catch {
      // App-level callbacks surface the error.
    }
  }

  async function rescan() {
    if (interactionLocked || draftDirty || !deviceConnected) return;
    moreOpen = false;
    await onEnroll(profile.id);
  }

  async function deleteFingerprint(forceLocal = false) {
    deleting = true;
    try {
      await onReset(profile.id, forceLocal);
      deleteOpen = false;
      moreOpen = false;
    } catch {
      // App-level callbacks surface the error.
    } finally {
      deleting = false;
    }
  }

  function selectAction(type: ActionType) {
    selectedType = type;
    onDirtyChange(true);
  }

  function handleActionKeydown(event: KeyboardEvent, type: ActionType) {
    const keys = ['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'Home', 'End'];
    if (!keys.includes(event.key) || interactionLocked) return;
    event.preventDefault();
    const current = presets.findIndex((preset) => preset.type === type);
    const next = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? presets.length - 1
        : (current + (event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : -1) + presets.length) % presets.length;
    const nextType = presets[next].type;
    selectAction(nextType);
    queueMicrotask(() => actionListElement?.querySelector<HTMLButtonElement>(`[data-action-type="${nextType}"]`)?.focus());
  }

  function updateConfirm(checked: boolean) {
    requireConfirm = checked;
    onDirtyChange(true);
  }
</script>

<section class="action-editor h-full flex flex-col min-h-0 overflow-hidden" aria-labelledby="selected-finger-title">
  <!-- Header Area (shrink-0) -->
  <div class="action-editor-heading shrink-0 pb-4 border-b border-white/[0.06] flex items-start justify-between gap-4">
    <div class="min-w-0">
      <div class="mono mb-1 text-[11px] font-bold text-blue-400">#{String(profile.id).padStart(2, '0')}</div>
      <h2 id="selected-finger-title" class="text-xl font-bold tracking-tight text-white">{fingerName(locale, profile.id)}</h2>
      <p class="mt-0.5 text-xs font-normal leading-relaxed text-slate-400">
        {profile.configured ? actionDescription(locale, profile.actionType) : translate(locale, 'finger.selectedDescription')}
      </p>
    </div>

    <div class={`status-pill shrink-0 ${isDisabled ? 'bg-amber-500/10 text-amber-300 border-amber-500/25' : profile.configured ? 'status-pill-ready' : 'status-badge-idle'}`}>
      {translate(locale, isDisabled ? 'finger.disabled' : profile.configured ? 'finger.configured' : 'finger.unconfigured')}
    </div>
  </div>

  <!-- Scrollable Body (flex-1 min-h-0 overflow-y-auto) -->
  <div class="flex-1 min-h-0 overflow-y-auto space-y-4 py-4 pr-1">
    <!-- Preset Action Cards -->
    <div bind:this={actionListElement} class="action-list" role="radiogroup" aria-label={translate(locale, 'field.action')}>
      {#each presets as preset}
        {@const Icon = preset.icon}
        <button
          class={`action-row ${selectedType === preset.type ? 'action-row-selected' : ''}`}
          onclick={() => selectAction(preset.type)}
          onkeydown={(event) => handleActionKeydown(event, preset.type)}
          role="radio"
          aria-checked={selectedType === preset.type}
          tabindex={selectedType === preset.type ? 0 : -1}
          data-action-type={preset.type}
          disabled={interactionLocked}
        >
          <span class="action-row-radio" aria-hidden="true">
            {#if selectedType === preset.type}<span></span>{/if}
          </span>
          <Icon size={20} aria-hidden="true" class={preset.accent} />
          <span class="action-row-copy">
            <span>{actionLabel(locale, preset.type)}</span>
            <small>{actionDescription(locale, preset.type)}</small>
          </span>
        </button>
      {/each}
    </div>

    <!-- Password Input with show/hide toggle & OS Keyring indicator -->
    {#if selectedType === 'password'}
      <div class="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-2">
        <label class="block" for="password-secret-input">
          <span class="mb-1.5 block text-xs font-semibold text-slate-300">{translate(locale, 'field.password')}</span>
          <div class="relative flex items-center">
            <input
              id="password-secret-input"
              class="text-input pr-10"
              type={showPassword ? 'text' : 'password'}
              bind:value={secret}
              oninput={() => onDirtyChange(true)}
              autocomplete="current-password"
              placeholder={profile.secretConfigured ? translate(locale, 'field.passwordStored') : translate(locale, 'field.passwordPlaceholder')}
              aria-invalid={validationCode === 'secret_required' || validationCode === 'password_ascii'}
            />
            <button
              type="button"
              class="absolute right-2.5 p-1 rounded-md text-slate-400 hover:text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-400"
              onclick={() => (showPassword = !showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabindex="0"
            >
              {#if showPassword}
                <EyeOff size={16} />
              {:else}
                <Eye size={16} />
              {/if}
            </button>
          </div>
        </label>
        <div class="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
          <ShieldCheck size={13} class="text-emerald-400 shrink-0" />
          <span>{translate(locale, 'action.password.description')}</span>
        </div>
      </div>
    {/if}

    <!-- Custom Shortcut Input with helper text -->
    {#if selectedType === 'custom'}
      <div class="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-2">
        <label class="block" for="custom-shortcut-input">
          <span class="mb-1.5 block text-xs font-semibold text-slate-300">{translate(locale, 'field.custom')}</span>
          <input
            id="custom-shortcut-input"
            class="text-input"
            bind:value={customPayload}
            oninput={() => onDirtyChange(true)}
            maxlength="128"
            placeholder={translate(locale, 'field.customPlaceholder')}
            aria-invalid={validationCode === 'custom_required' || validationCode === 'custom_ascii'}
          />
        </label>
        <p class="text-[11px] font-medium text-slate-400">
          {translate(locale, 'action.custom.description')}
        </p>
      </div>
    {/if}

    <!-- Validation Error Alert -->
    {#if validationText}
      <div class="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs font-medium text-amber-300" role="alert">
        <AlertCircle size={15} class="shrink-0 text-amber-400" />
        <span>{validationText}</span>
      </div>
    {/if}

    <!-- Apple Toggle Switch for "Touch twice to confirm" -->
    <div
      class="setting-row cursor-pointer"
      onclick={() => !interactionLocked && updateConfirm(!requireConfirm)}
      role="presentation"
    >
      <div class="min-w-0 pr-4">
        <span class="block text-sm font-semibold text-white">{translate(locale, 'field.confirm')}</span>
        <span class="block text-xs font-normal leading-relaxed text-slate-400">{translate(locale, 'field.confirmDescription')}</span>
      </div>
      <button
        type="button"
        class="apple-switch shrink-0"
        role="switch"
        aria-checked={requireConfirm}
        aria-label={translate(locale, 'field.confirm')}
        disabled={interactionLocked}
        onclick={(event) => {
          event.stopPropagation();
          updateConfirm(!requireConfirm);
        }}
        onkeydown={(event) => {
          if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault();
            event.stopPropagation();
            updateConfirm(!requireConfirm);
          }
        }}
      >
        <span class="apple-switch-track" aria-hidden="true">
          <span class="apple-switch-thumb"></span>
        </span>
      </button>
    </div>
  </div>

  <!-- Sticky Footer (shrink-0) -->
  <footer class="action-footer shrink-0 pt-3 border-t border-white/[0.06] flex items-center justify-between gap-3">
    <div class="flex items-center gap-2">
      <button class="primary-button" disabled={saving || !canSave || interactionLocked} onclick={save}>
        {#if profile.configured}<Check size={16} />{:else}<Fingerprint size={16} />{/if}
        <span>{translate(locale, profile.configured ? 'button.saveChanges' : 'button.saveAndEnroll')}</span>
      </button>

      <div class="relative">
        <button
          bind:this={moreButtonElement}
          class="secondary-button"
          disabled={interactionLocked}
          aria-haspopup="menu"
          aria-expanded={moreOpen}
          onclick={() => (moreOpen = !moreOpen)}
        >
          <Ellipsis size={17} />
          <span>{translate(locale, 'button.more')}</span>
        </button>
        {#if moreOpen}
          <div bind:this={moreMenuElement} class="action-menu" role="menu" tabindex="-1" onkeydown={handleMenuKeydown}>
            <button role="menuitem" disabled={!profile.configured || !deviceConnected} onclick={() => { moreOpen = false; void onTest(profile.id); }}>
              <Play size={16} /><span>{translate(locale, 'button.test')}</span>
            </button>
            <button role="menuitem" disabled={interactionLocked || draftDirty || !deviceConnected} onclick={() => void rescan()}>
              <RotateCw size={16} /><span>{translate(locale, 'button.rescan')}</span>
            </button>
            {#if profile.actionType === 'disabled'}
              <button role="menuitem" onclick={enableAction}>
                <Play size={16} /><span>{translate(locale, 'button.enable')}</span>
              </button>
            {:else}
              <button role="menuitem" onclick={disableAction}>
                <X size={16} /><span>{translate(locale, 'button.disable')}</span>
              </button>
            {/if}
            {#if profile.configured}
              <div class="my-1 border-t border-white/10"></div>
              <button class="danger-menu-item" role="menuitem" onclick={() => { moreOpen = false; deleteOpen = true; }}>
                <Trash2 size={16} /><span>{translate(locale, 'button.delete')}</span>
              </button>
            {/if}
          </div>
        {/if}
      </div>
    </div>

    {#if !deviceConnected && !profile.configured}
      <div class="flex items-center gap-1.5 text-xs font-medium text-amber-300/90">
        <AlertCircle size={14} class="shrink-0" />
        <span>{translate(locale, 'device.disconnectedTitle')}</span>
      </div>
    {/if}
  </footer>
</section>

<!-- Glassmorphism Delete Confirmation Dialog -->
{#if deleteOpen}
  <div class="dialog-backdrop items-center justify-center p-4" role="presentation">
    <div
      bind:this={deleteDialogElement}
      class="confirm-dialog"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-title"
      aria-describedby="delete-description"
      tabindex="-1"
      onkeydown={(event) => handleDialogKeydown(event, deleteDialogElement, () => (deleteOpen = false))}
    >
      <h3 id="delete-title" class="text-lg font-bold tracking-tight text-white">{translate(locale, 'delete.title')}</h3>
      <p id="delete-description" class="mt-2 text-sm leading-relaxed text-slate-300">
        {deviceConnected ? translate(locale, 'delete.touchPrompt') : translate(locale, 'delete.description')}
      </p>
      <div class="mt-6 flex flex-wrap justify-end gap-2.5">
        <button class="secondary-button" disabled={deleting} onclick={() => (deleteOpen = false)}>
          {translate(locale, 'button.cancel')}
        </button>
        {#if deviceConnected}
          <button class="secondary-button" disabled={deleting} onclick={() => void deleteFingerprint(true)}>
            {translate(locale, 'delete.forceLocal')}
          </button>
        {/if}
        <button class="danger-button" disabled={deleting} onclick={() => void deleteFingerprint(false)}>
          <Trash2 size={16} />
          <span>{translate(locale, 'button.confirmDelete')}</span>
        </button>
      </div>
    </div>
  </div>
{/if}
