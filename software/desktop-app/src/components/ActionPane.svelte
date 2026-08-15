<script lang="ts">
  import {
    Bot,
    Check,
    CornerDownLeft,
    Fingerprint,
    KeyRound,
    Keyboard,
    Play,
    RotateCw,
    Trash2,
    WandSparkles,
    X
  } from 'lucide-svelte';
  import { actionLabels, validateActionDraft, type ActionType, type FingerProfile } from '../lib/types';

  interface Props {
    profile: FingerProfile;
    saving: boolean;
    onSave: (profile: FingerProfile, secret?: string) => Promise<void>;
    onEnroll: (id: number) => Promise<void>;
    onReset: (id: number) => Promise<void>;
    onTest: (id: number) => Promise<void>;
    onHud: (message: string) => void;
  }

  let { profile, saving, onSave, onEnroll, onReset, onTest, onHud }: Props = $props();
  let selectedType = $state<ActionType>('disabled');
  let customPayload = $state('');
  let secret = $state('');
  let requireConfirm = $state(false);

  const presets: Array<{ type: ActionType; icon: typeof Bot; accent: string }> = [
    { type: 'ai_accept', icon: Bot, accent: 'text-blue-300' },
    { type: 'password', icon: KeyRound, accent: 'text-purple-300' },
    { type: 'enter', icon: CornerDownLeft, accent: 'text-emerald-300' },
    { type: 'custom', icon: WandSparkles, accent: 'text-amber-300' }
  ];

  const selectedMeta = $derived(actionLabels[selectedType]);
  const validationMessage = $derived(
    validateActionDraft({
      actionType: selectedType,
      customPayload,
      secret,
      secretConfigured: profile.secretConfigured
    })
  );
  const canSave = $derived(!validationMessage);

  $effect(() => {
    selectedType = profile.actionType;
    customPayload = profile.customPayload ?? '';
    secret = '';
    requireConfirm = profile.requireConfirm;
  });

  async function save() {
    if (!canSave) {
      onHud(validationMessage ?? 'Không thể lưu năng lực này');
      return;
    }
    const nextProfile: FingerProfile = {
      ...profile,
      configured: selectedType !== 'disabled',
      actionType: selectedType,
      label: selectedMeta.label,
      description: selectedMeta.description,
      icon: selectedMeta.icon,
      requireConfirm,
      customPayload: selectedType === 'custom' ? customPayload.trim() : undefined
    };
    await onSave(nextProfile, selectedType === 'password' && secret ? secret : undefined);
  }
</script>

<section class="glass-card flex min-h-[382px] flex-col rounded-3xl p-5">
  <div class="mb-4 flex items-start justify-between gap-4">
    <div>
      <div class="mono mb-1 text-[11px] font-bold text-blue-300">NGÓN {String(profile.id).padStart(2, '0')}</div>
      <h2 class="text-2xl font-extrabold text-white">{profile.name}</h2>
      <p class="mt-1 text-sm font-medium text-slate-400">
        {profile.configured ? profile.description : 'Chọn năng lực, quét vân tay, dùng ngay.'}
      </p>
    </div>

    <div
      class={`rounded-full border px-3 py-1.5 text-xs font-extrabold ${
        profile.configured
          ? 'border-emerald-400/[0.24] bg-emerald-400/10 text-emerald-300'
          : 'border-slate-500/20 bg-white/[0.05] text-slate-400'
      }`}
    >
      {profile.configured ? 'ĐÃ CÀI' : 'CHƯA CÀI'}
    </div>
  </div>

  <div class="grid gap-3 md:grid-cols-2">
    {#each presets as preset}
      {@const meta = actionLabels[preset.type]}
      {@const Icon = preset.icon}
      <button
        class={`interactive-card rounded-2xl border p-3.5 text-left ${
          selectedType === preset.type ? 'border-blue-400/60 bg-blue-500/[0.12]' : 'border-white/[0.08] bg-slate-950/55'
        }`}
        onclick={() => (selectedType = preset.type)}
      >
        <div class="mb-3 flex items-center justify-between">
          <div class={`grid h-9 w-9 place-items-center rounded-xl bg-white/[0.07] ${preset.accent}`}>
            <Icon size={19} />
          </div>
          {#if selectedType === preset.type}
            <Check size={17} class="text-blue-300" strokeWidth={3} />
          {/if}
        </div>
        <div class="text-sm font-extrabold text-white">{meta.label}</div>
        <div class="mt-1 min-h-9 text-xs font-medium leading-relaxed text-slate-400">{meta.description}</div>
      </button>
    {/each}
  </div>

  {#if selectedType === 'password'}
    <label class="mt-4 block">
      <span class="mb-2 block text-xs font-extrabold text-slate-400">Mật khẩu máy tính</span>
      <input
        class="h-11 w-full rounded-2xl border border-white/[0.08] bg-black/25 px-4 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400/60"
        type="password"
        bind:value={secret}
        placeholder={profile.secretConfigured ? 'Đã có trong kho bảo mật, nhập để thay đổi' : 'Nhập mật khẩu ASCII'}
      />
    </label>
  {/if}

  {#if selectedType === 'custom'}
    <label class="mt-4 block">
      <span class="mb-2 block text-xs font-extrabold text-slate-400">Chuỗi phím tắt</span>
      <input
        class="h-11 w-full rounded-2xl border border-white/[0.08] bg-black/25 px-4 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400/60"
        bind:value={customPayload}
        maxlength="128"
        placeholder="Ví dụ: /approve"
      />
    </label>
  {/if}

  <label class="mt-4 flex items-center justify-between rounded-2xl border border-white/[0.07] bg-black/20 px-4 py-3">
    <span>
      <span class="block text-sm font-extrabold text-white">Chạm 2 lần để xác nhận</span>
      <span class="block text-xs font-medium text-slate-500">Giảm rủi ro kích hoạt nhầm khi đang làm việc.</span>
    </span>
    <input class="h-5 w-5 accent-blue-500" type="checkbox" bind:checked={requireConfirm} />
  </label>

  <div class="mt-auto flex flex-wrap items-center gap-2 pt-4">
    <button class="primary-button" disabled={saving || !canSave} onclick={save}>
      <Check size={15} />
      <span>Lưu Năng Lực</span>
    </button>
    <button class="secondary-button" onclick={() => onEnroll(profile.id)}>
      <Fingerprint size={15} />
      <span>Quét Vân Tay</span>
    </button>
    <button class="secondary-button" onclick={() => onTest(profile.id)}>
      <Play size={15} />
      <span>Thử gõ test</span>
    </button>
    <button class="secondary-button" onclick={() => onSave({ ...profile, actionType: 'escape', label: actionLabels.escape.label, description: actionLabels.escape.description, icon: actionLabels.escape.icon }, undefined)}>
      <Keyboard size={15} />
      <span>Escape</span>
    </button>
    {#if profile.configured}
      <button class="secondary-button" onclick={() => onEnroll(profile.id)}>
        <RotateCw size={15} />
        <span>Quét lại</span>
      </button>
      <button class="danger-button" onclick={() => onReset(profile.id)}>
        <Trash2 size={15} />
        <span>Xóa</span>
      </button>
    {:else}
      <button class="danger-button" onclick={() => onSave({ ...profile, actionType: 'disabled', configured: false, label: actionLabels.disabled.label, description: actionLabels.disabled.description, icon: actionLabels.disabled.icon }, undefined)}>
        <X size={15} />
        <span>Tắt</span>
      </button>
    {/if}
  </div>
</section>
