<script lang="ts">
  import {
    Bot,
    Check,
    CornerDownLeft,
    Ellipsis,
    Fingerprint,
    KeyRound,
    Keyboard,
    Play,
    RotateCw,
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
    onReset: (id: number) => Promise<void>;
    onTest: (id: number) => Promise<void>;
    onDirtyChange: (dirty: boolean) => void;
    resetRevision: number;
    interactionLocked: boolean;
    draftDirty?: boolean;
  }

  let { locale, profile, saving, deviceConnected, onSave, onEnroll, onReset, onTest, onDirtyChange, resetRevision, interactionLocked, draftDirty = false }: Props = $props();
  let selectedType = $state<ActionType>('enter');
  let customPayload = $state('');
  let secret = $state('');
  let requireConfirm = $state(true);
  let moreOpen = $state(false);
  let deleteOpen = $state(false);
  let deleteDialogElement: HTMLDivElement | undefined = $state();
  let moreButtonElement: HTMLButtonElement | undefined = $state();
  let moreMenuElement: HTMLDivElement | undefined = $state();
  let actionListElement: HTMLDivElement | undefined = $state();

  const presets: Array<{ type: ActionType; icon: typeof Bot; accent: string }> = [
    { type: 'ai_accept', icon: Bot, accent: 'text-blue-300' },
    { type: 'password', icon: KeyRound, accent: 'text-purple-300' },
    { type: 'enter', icon: CornerDownLeft, accent: 'text-emerald-300' },
    { type: 'escape', icon: Keyboard, accent: 'text-cyan-300' },
    { type: 'custom', icon: WandSparkles, accent: 'text-amber-300' }
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

  $effect(() => {
    void resetRevision;
    selectedType = profile.actionType === 'disabled' ? 'enter' : profile.actionType;
    customPayload = profile.customPayload ?? '';
    secret = '';
    requireConfirm = profile.requireConfirm;
    moreOpen = false;
  });

  $effect(() => {
    if (moreOpen) queueMicrotask(() => moreMenuElement?.querySelector<HTMLButtonElement>('button:not([disabled])')?.focus());
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

  async function rescan() {
    if (interactionLocked || draftDirty || !deviceConnected) return;
    moreOpen = false;
    await onEnroll(profile.id);
  }

  async function deleteFingerprint() {
    deleteOpen = false;
    moreOpen = false;
    try {
      await onReset(profile.id);
    } catch {
      // App-level callbacks surface the error.
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

<section class="action-editor" aria-labelledby="selected-finger-title">
  <div class="action-editor-heading">
    <div class="min-w-0">
      <div class="mono mb-1 text-[11px] font-bold text-blue-300">#{String(profile.id).padStart(2, '0')}</div>
      <h2 id="selected-finger-title" class="text-2xl font-extrabold text-white">{fingerName(locale, profile.id)}</h2>
      <p class="mt-1 text-sm font-medium leading-relaxed text-slate-300">
        {profile.configured ? actionDescription(locale, profile.actionType) : translate(locale, 'finger.selectedDescription')}
      </p>
    </div>

    <div class={`status-badge ${profile.configured ? 'status-badge-ready' : 'status-badge-idle'}`}>
      {translate(locale, profile.configured ? 'finger.configured' : 'finger.unconfigured')}
    </div>
  </div>

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
        <Icon size={21} aria-hidden="true" class={preset.accent} />
        <span class="action-row-copy"><span>{actionLabel(locale, preset.type)}</span><small>{actionDescription(locale, preset.type)}</small></span>
      </button>
    {/each}
  </div>

  {#if selectedType === 'password'}
    <label class="mt-4 block">
      <span class="mb-2 block text-xs font-extrabold text-slate-300">{translate(locale, 'field.password')}</span>
      <input
        class="text-input"
        type="password"
        bind:value={secret}
        oninput={() => onDirtyChange(true)}
        autocomplete="current-password"
        placeholder={profile.secretConfigured ? translate(locale, 'field.passwordStored') : translate(locale, 'field.passwordPlaceholder')}
        aria-invalid={validationCode === 'secret_required' || validationCode === 'password_ascii'}
      />
    </label>
  {/if}

  {#if selectedType === 'custom'}
    <label class="mt-4 block">
      <span class="mb-2 block text-xs font-extrabold text-slate-300">{translate(locale, 'field.custom')}</span>
      <input
        class="text-input"
        bind:value={customPayload}
        oninput={() => onDirtyChange(true)}
        maxlength="128"
        placeholder={translate(locale, 'field.customPlaceholder')}
        aria-invalid={validationCode === 'custom_required' || validationCode === 'custom_ascii'}
      />
    </label>
  {/if}

  {#if validationText}
    <p class="mt-2 text-xs font-semibold text-amber-300" role="alert">{validationText}</p>
  {/if}

  <label class="setting-row mt-4">
    <span>
      <span class="block text-sm font-extrabold text-white">{translate(locale, 'field.confirm')}</span>
      <span class="block text-xs font-medium leading-relaxed text-slate-400">{translate(locale, 'field.confirmDescription')}</span>
    </span>
    <input class="h-5 w-5 shrink-0 accent-blue-500" type="checkbox" checked={requireConfirm} onchange={(event) => updateConfirm(event.currentTarget.checked)} />
  </label>

  <footer class="action-footer">
    <button class="primary-button" disabled={saving || !canSave || interactionLocked} onclick={save}>
      {#if profile.configured}<Check size={16} />{:else}<Fingerprint size={16} />{/if}
      <span>{translate(locale, profile.configured ? 'button.saveChanges' : 'button.saveAndEnroll')}</span>
    </button>

    <div class="relative">
      <button bind:this={moreButtonElement} class="secondary-button" disabled={interactionLocked} aria-haspopup="menu" aria-expanded={moreOpen} onclick={() => (moreOpen = !moreOpen)}>
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
          <button role="menuitem" onclick={disableAction}>
            <X size={16} /><span>{translate(locale, 'button.disable')}</span>
          </button>
          {#if profile.configured}
            <div class="my-1 border-t border-white/10"></div>
            <button class="danger-menu-item" role="menuitem" onclick={() => { moreOpen = false; deleteOpen = true; }}>
              <Trash2 size={16} /><span>{translate(locale, 'button.delete')}</span>
            </button>
          {/if}
        </div>
      {/if}
    </div>

    {#if !deviceConnected && !profile.configured}
      <span class="text-xs font-semibold text-amber-300">{translate(locale, 'device.disconnectedTitle')}</span>
    {/if}
  </footer>
</section>

{#if deleteOpen}
  <div class="dialog-backdrop" role="presentation">
    <div bind:this={deleteDialogElement} class="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-description" tabindex="-1" onkeydown={(event) => handleDialogKeydown(event, deleteDialogElement, () => (deleteOpen = false))}>
      <h3 id="delete-title" class="text-lg font-extrabold text-white">{translate(locale, 'delete.title')}</h3>
      <p id="delete-description" class="mt-2 text-sm leading-relaxed text-slate-300">{translate(locale, 'delete.description')}</p>
      <div class="mt-5 flex justify-end gap-2">
        <button class="secondary-button" onclick={() => (deleteOpen = false)}>{translate(locale, 'button.cancel')}</button>
        <button class="danger-button" onclick={deleteFingerprint}><Trash2 size={16} />{translate(locale, 'button.confirmDelete')}</button>
      </div>
    </div>
  </div>
{/if}
