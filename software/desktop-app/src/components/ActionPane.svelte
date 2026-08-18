<script lang="ts">
  import {
    AlertCircle,
    Bot,
    Box,
    Check,
    Clipboard,
    CornerDownLeft,
    Ellipsis,
    Eye,
    EyeOff,
    Fingerprint,
    GitBranch,
    GitCompare,
    HelpCircle,
    KeyRound,
    Keyboard,
    Layers,
    LayoutGrid,
    MessageSquarePlus,
    Minimize2,
    Monitor,
    Play,
    PlusSquare,
    RefreshCw,
    RotateCw,
    Search,
    ShieldCheck,
    Sparkles,
    Terminal,
    Trash2,
    WandSparkles,
    X,
    XCircle
  } from 'lucide-svelte';
  import {
    actionDescription,
    actionLabel,
    fingerName,
    translate,
    validationMessage,
    type Locale
  } from '../lib/i18n';
  import {
    CATEGORY_GROUPS,
    getAvailablePresets,
    matchPreset,
    type ActionCategory,
    type ActionOptionItem
  } from '../lib/shortcutPresets';
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

  const iconMap: Record<string, any> = {
    Bot,
    Box,
    Clipboard,
    CornerDownLeft,
    GitBranch,
    GitCompare,
    HelpCircle,
    KeyRound,
    Keyboard,
    Layers,
    LayoutGrid,
    MessageSquarePlus,
    Minimize2,
    Monitor,
    PlusSquare,
    RefreshCw,
    Search,
    ShieldCheck,
    Sparkles,
    Terminal,
    WandSparkles,
    XCircle
  };

  const availablePresets = $derived(getAvailablePresets());
  const groupedPresets = $derived(
    CATEGORY_GROUPS.map((group) => ({
      group,
      items: availablePresets.filter((item) => item.category === group.key)
    })).filter((section) => section.items.length > 0)
  );

  let selectedType = $state<ActionType>('enter');
  let selectedPresetId = $state<string>('enter');
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
    } else if (profile.secretConfigured) {
      selectedType = 'password';
    } else if (profile.customPayload) {
      selectedType = 'custom';
    }
    customPayload = profile.customPayload ?? '';
    secret = '';
    showPassword = false;
    requireConfirm = profile.requireConfirm;
    moreOpen = false;

    const matched = matchPreset(profile, availablePresets);
    selectedPresetId = matched
      ? matched.id
      : selectedType === 'password'
        ? 'password'
        : selectedType === 'custom'
          ? 'custom_input'
          : selectedType;
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

  function selectPreset(item: ActionOptionItem) {
    selectedPresetId = item.id;
    selectedType = item.actionType;
    if (item.actionType === 'custom') {
      if (item.payload !== undefined) {
        customPayload = item.payload;
      }
    }
    onDirtyChange(true);
  }

  function handleActionKeydown(event: KeyboardEvent, itemId: string) {
    const keys = ['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'Home', 'End'];
    if (!keys.includes(event.key) || interactionLocked) return;
    event.preventDefault();
    const items = availablePresets;
    const current = items.findIndex((p) => p.id === itemId);
    const next = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? items.length - 1
        : (current + (event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length;
    const nextItem = items[next];
    selectPreset(nextItem);
    queueMicrotask(() => actionListElement?.querySelector<HTMLButtonElement>(`[data-preset-id="${nextItem.id}"]`)?.focus());
  }

  function updateConfirm(checked: boolean) {
    requireConfirm = checked;
    onDirtyChange(true);
  }
</script>

<section class="action-editor h-full flex flex-col min-h-0 overflow-hidden" aria-labelledby="selected-finger-title">
  <!-- Header Area (shrink-0) -->
  <div class="action-editor-heading shrink-0 pb-2.5 border-b border-[var(--border)] flex items-center justify-between gap-3">
    <div class="min-w-0">
      <div class="flex items-center gap-2">
        <span class="mono text-[11px] font-bold text-blue-600 dark:text-blue-400">#{String(profile.id).padStart(2, '0')}</span>
        <h2 id="selected-finger-title" class="text-base font-bold tracking-tight text-[var(--fg)]">{fingerName(locale, profile.id)}</h2>
      </div>
    </div>

    <div class={`status-pill shrink-0 ${isDisabled ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25' : profile.configured ? 'status-pill-ready' : 'status-badge-idle'}`}>
      {translate(locale, isDisabled ? 'finger.disabled' : profile.configured ? 'finger.configured' : 'finger.unconfigured')}
    </div>
  </div>

  <!-- Body Area -->
  <div class="flex-1 min-h-0 overflow-y-auto space-y-4 py-3 pr-1">
    <!-- Grouped Preset Action List -->
    <div bind:this={actionListElement} class="space-y-4" role="radiogroup" aria-label={translate(locale, 'field.action')}>
      {#each groupedPresets as section}
        {@const GroupIcon = iconMap[section.group.iconName] || Bot}
        <div class="space-y-1.5">
          <div class="flex items-center gap-1.5 px-1">
            <GroupIcon size={13} class="text-[var(--fg-subtle)]" aria-hidden="true" />
            <h3 class="text-[11px] font-bold tracking-wider uppercase text-[var(--fg-subtle)]">
              {translate(locale, section.group.labelKey as any)}
            </h3>
          </div>

          <div class="action-list space-y-1">
            {#each section.items as item}
              {@const Icon = iconMap[item.iconName] || Bot}
              {@const isSelected = selectedPresetId === item.id}
              <button
                class={`action-row ${isSelected ? 'action-row-selected' : ''}`}
                onclick={() => selectPreset(item)}
                onkeydown={(event) => handleActionKeydown(event, item.id)}
                role="radio"
                aria-checked={isSelected}
                tabindex={isSelected ? 0 : -1}
                data-preset-id={item.id}
                data-action-type={item.actionType}
                disabled={interactionLocked}
              >
                <span class="action-row-radio" aria-hidden="true">
                  {#if isSelected}<span></span>{/if}
                </span>
                <Icon size={16} aria-hidden="true" class={item.accentColor} />
                <span class="action-row-copy">
                  <span class="text-xs font-semibold text-[var(--fg)]">{translate(locale, item.labelKey as any)}</span>
                  <small class="text-[10.5px] text-[var(--fg-muted)] font-normal">{translate(locale, item.descKey as any)}</small>
                </span>
                {#if item.badge}
                  <span class="ml-auto shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-500/10 dark:bg-slate-400/10 text-[var(--fg-muted)] border border-slate-500/20">
                    {item.badge}
                  </span>
                {/if}
              </button>

              <!-- Inline Expandable Password Input -->
              {#if isSelected && item.id === 'password'}
                <div class="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 space-y-1.5 ml-6">
                  <label class="block" for="password-secret-input">
                    <span class="mb-1 block text-xs font-semibold text-[var(--fg)]">{translate(locale, 'field.password')}</span>
                    <div class="relative flex items-center">
                      <input
                        id="password-secret-input"
                        class="text-input pr-9 py-1.5 text-xs"
                        type={showPassword ? 'text' : 'password'}
                        bind:value={secret}
                        oninput={() => onDirtyChange(true)}
                        autocomplete="current-password"
                        placeholder={profile.secretConfigured ? translate(locale, 'field.passwordStored') : translate(locale, 'field.passwordPlaceholder')}
                        aria-invalid={validationCode === 'secret_required' || validationCode === 'password_ascii'}
                      />
                      <button
                        type="button"
                        class="absolute right-2 p-1 rounded text-[var(--fg-subtle)] hover:text-[var(--fg)] transition-colors"
                        onclick={() => (showPassword = !showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        tabindex="0"
                      >
                        {#if showPassword}
                          <EyeOff size={14} />
                        {:else}
                          <Eye size={14} />
                        {/if}
                      </button>
                    </div>
                  </label>
                  <div class="flex items-center gap-1.5 text-[10.5px] font-medium text-[var(--fg-muted)]">
                    <ShieldCheck size={12} class="text-emerald-500 shrink-0" />
                    <span>{translate(locale, 'action.password.description')}</span>
                  </div>
                </div>
              {/if}

              <!-- Inline Expandable Custom Shortcut Input -->
              {#if isSelected && item.id === 'custom_input'}
                <div class="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 space-y-1.5 ml-6">
                  <label class="block" for="custom-shortcut-input">
                    <span class="mb-1 block text-xs font-semibold text-[var(--fg)]">{translate(locale, 'field.custom')}</span>
                    <input
                      id="custom-shortcut-input"
                      class="text-input py-1.5 text-xs"
                      bind:value={customPayload}
                      oninput={() => onDirtyChange(true)}
                      maxlength="128"
                      placeholder={translate(locale, 'field.customPlaceholder')}
                      aria-invalid={validationCode === 'custom_required' || validationCode === 'custom_ascii'}
                    />
                  </label>
                  <p class="text-[10.5px] font-medium text-[var(--fg-muted)]">
                    {translate(locale, 'action.custom.description')}
                  </p>
                </div>
              {/if}
            {/each}
          </div>
        </div>
      {/each}
    </div>

    <!-- Validation Error Alert -->
    {#if validationText}
      <div class="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 text-xs font-medium text-amber-400" role="alert">
        <AlertCircle size={14} class="shrink-0 text-amber-400" />
        <span>{validationText}</span>
      </div>
    {/if}

    <!-- Apple Toggle Switch for "Touch twice to confirm" -->
    <div
      class="setting-row cursor-pointer py-1 px-1"
      onclick={() => !interactionLocked && updateConfirm(!requireConfirm)}
      role="presentation"
    >
      <div class="min-w-0 pr-3">
        <span class="block text-xs font-semibold text-[var(--fg)]">{translate(locale, 'field.confirm')}</span>
        <span class="block text-[10.5px] font-normal text-[var(--fg-subtle)]">{translate(locale, 'field.confirmDescription')}</span>
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
  <footer class="action-footer shrink-0 pt-2.5 border-t border-[var(--border)] flex items-center justify-between gap-2">
    <div class="flex items-center gap-2">
      <button class="primary-button" disabled={saving || !canSave || interactionLocked} onclick={save}>
        {#if profile.configured && !isDisabled}<Check size={16} />{:else if isDisabled}<Play size={16} />{:else}<Fingerprint size={16} />{/if}
        <span>{translate(locale, isDisabled ? 'button.enable' : profile.configured ? 'button.saveChanges' : 'button.saveAndEnroll')}</span>
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
            <button role="menuitem" disabled={!profile.configured || !deviceConnected || isDisabled} onclick={() => { moreOpen = false; void onTest(profile.id); }}>
              <Play size={16} /><span>{translate(locale, 'button.test')}</span>
            </button>
            <button role="menuitem" disabled={interactionLocked || draftDirty || !deviceConnected} onclick={() => void rescan()}>
              <RotateCw size={16} /><span>{translate(locale, 'button.rescan')}</span>
            </button>
            {#if isDisabled}
              <button role="menuitem" disabled={!profile.configured} onclick={enableAction}>
                <Play size={16} /><span>{translate(locale, 'button.enable')}</span>
              </button>
            {:else}
              <button role="menuitem" disabled={!profile.configured} onclick={disableAction}>
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
