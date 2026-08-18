# TouchPass Unified Categorized Action & Presets Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a clean, unified, categorized action picker in `ActionPane.svelte` with rich presets for AI agents (Claude, Codex, Antigravity), OS window switching, Terminal tools, and basic security keys.

**Architecture:** Create a typed preset catalog in `shortcutPresets.ts`, extend `i18n.ts` with Vietnamese/English/Chinese copy, refactor `ActionPane.svelte` into a grouped 1-click action selector with expandable detail inputs, and verify with unit/integration tests and a full Tauri build.

**Tech Stack:** Svelte 5 (Runes), TypeScript, Tailwind CSS, Lucide Icons, Vitest, Tauri v2, Rust.

## Global Constraints
- All shortcut payloads must be valid ASCII and 1-128 bytes in length.
- Must support 3 locales: `vi`, `en`, `zh-CN`.
- Must remain 100% compatible with the ESP32 firmware HID action execution engine and Tauri Rust backend.
- Package manager: always use `pnpm`.

---

### Task 1: Create `shortcutPresets.ts` and Unit Tests

**Files:**
- Create: `software/desktop-app/src/lib/shortcutPresets.ts`
- Create: `software/desktop-app/src/lib/shortcutPresets.test.ts`

**Interfaces:**
- Produces:
  - `ActionCategory = 'ai_agent' | 'os_window' | 'developer' | 'basic_security'`
  - `ActionOptionItem` interface
  - `ACTION_PRESETS: ActionOptionItem[]`
  - `getAvailablePresets(os?: 'windows' | 'macos' | 'all'): ActionOptionItem[]`
  - `matchPreset(profile: FingerProfile, presets?: ActionOptionItem[]): ActionOptionItem | undefined`

- [ ] **Step 1: Write the failing unit tests for shortcut presets**

```typescript
// software/desktop-app/src/lib/shortcutPresets.test.ts
import { describe, expect, it } from 'vitest';
import { ACTION_PRESETS, getAvailablePresets, matchPreset } from './shortcutPresets';
import type { FingerProfile } from './types';

describe('shortcutPresets catalog', () => {
  it('contains valid presets with unique IDs and ASCII payloads <= 128 bytes', () => {
    const ids = new Set<string>();
    for (const preset of ACTION_PRESETS) {
      expect(ids.has(preset.id)).toBe(false);
      ids.add(preset.id);
      expect(preset.labelKey).toBeTruthy();
      expect(preset.descKey).toBeTruthy();
      if (preset.payload) {
        expect(preset.payload.length).toBeGreaterThan(0);
        expect(preset.payload.length).toBeLessThanOrEqual(128);
        expect(/^[\x00-\x7F]*$/.test(preset.payload)).toBe(true);
      }
    }
  });

  it('filters presets appropriately by operating system', () => {
    const winPresets = getAvailablePresets('windows');
    const macPresets = getAvailablePresets('macos');

    expect(winPresets.some((p) => p.id === 'win_switch_window')).toBe(true);
    expect(winPresets.some((p) => p.id === 'mac_switch_app')).toBe(false);

    expect(macPresets.some((p) => p.id === 'mac_switch_app')).toBe(true);
    expect(macPresets.some((p) => p.id === 'win_switch_window')).toBe(false);
  });

  it('matches a finger profile to its corresponding preset', () => {
    const aiProfile: FingerProfile = {
      id: 1,
      hand: 'left',
      configured: true,
      actionType: 'ai_accept',
      requireConfirm: true,
      secretConfigured: false
    };
    expect(matchPreset(aiProfile)?.id).toBe('ai_accept');

    const rejectProfile: FingerProfile = {
      id: 2,
      hand: 'left',
      configured: true,
      actionType: 'custom',
      customPayload: 'n',
      requireConfirm: true,
      secretConfigured: false
    };
    expect(matchPreset(rejectProfile)?.id).toBe('ai_reject');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/shortcutPresets.test.ts`
Expected: FAIL (file not found)

- [ ] **Step 3: Implement `shortcutPresets.ts`**

Implement `ACTION_PRESETS`, `getAvailablePresets`, and `matchPreset` with support for AI Agent approvals, Claude/Codex/Antigravity workflows, OS window switching, terminal tools, and basic keys.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/lib/shortcutPresets.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add software/desktop-app/src/lib/shortcutPresets.ts software/desktop-app/src/lib/shortcutPresets.test.ts
git commit -m "feat: add shortcutPresets catalog with AI, OS, and developer templates"
```

---

### Task 2: Add Localization for All Presets in `i18n.ts`

**Files:**
- Modify: `software/desktop-app/src/lib/i18n.ts`
- Modify: `software/desktop-app/src/lib/i18n.test.ts`

**Interfaces:**
- Consumes: Keys used in `shortcutPresets.ts`
- Produces: Translations for categories, action titles, and descriptions across `vi`, `en`, `zh-CN`.

- [ ] **Step 1: Write test in `i18n.test.ts` verifying all preset translation keys exist**

```typescript
it('translates all preset categories and items in vi, en, and zh-CN', () => {
  for (const locale of ['vi', 'en', 'zh-CN'] as const) {
    for (const preset of ACTION_PRESETS) {
      expect(translate(locale, preset.labelKey as any)).not.toContain('missing translation');
      expect(translate(locale, preset.descKey as any)).not.toContain('missing translation');
    }
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/i18n.test.ts`
Expected: FAIL (keys missing)

- [ ] **Step 3: Add translations in `i18n.ts`**

Add all localized strings for AI agent approval (`ai_accept`, `ai_reject`, `ai_cancel`), Claude/Codex/Antigravity modes (`claude_switch_mode`, `claude_new_task`, `codex_new_chat`, `antigravity_plan`, `antigravity_grill`, `claude_compact`), OS window switching (`win_switch_window`, `win_task_view`, `win_show_desktop`, `win_clipboard_history`, `mac_switch_app`, `mac_spotlight`, `mac_mission_control`), dev tools (`git_status`, `git_diff`, `terminal_clear`, `docker_ps`), and basic security keys.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/lib/i18n.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add software/desktop-app/src/lib/i18n.ts software/desktop-app/src/lib/i18n.test.ts
git commit -m "feat(i18n): add comprehensive translations for preset library"
```

---

### Task 3: Refactor `ActionPane.svelte` to Unified Categorized Action List

**Files:**
- Modify: `software/desktop-app/src/components/ActionPane.svelte`

**Interfaces:**
- Consumes: `ACTION_PRESETS`, `getAvailablePresets`, `matchPreset` from `shortcutPresets.ts`, translations from `i18n.ts`.
- Produces: Clean, accessible, non-nested grouped action list with smooth expansion for password/custom inputs.

- [ ] **Step 1: Update `ActionPane.svelte`**
  - Group actions by categories: 🤖 Trợ lý AI, 🪟 Chuyển cửa sổ & Hệ thống, 💻 Terminal & Lập trình, 🔒 Bảo mật & Phím cơ bản.
  - Render each item with radio button, themed Lucide icon, label, description, and keyboard badge.
  - Seamlessly expand the password secret input when `password` is selected.
  - Seamlessly expand the custom payload input when `custom_input` (or any custom preset that user wants to tweak) is selected.
  - Ensure Arrow keys (Up / Down) navigate through the grouped items smoothly.

- [ ] **Step 2: Run `svelte-check` and vitest**

Run: `pnpm run check && pnpm vitest run --no-file-parallelism`
Expected: 0 errors, all tests pass.

- [ ] **Step 3: Commit**

```bash
git add software/desktop-app/src/components/ActionPane.svelte
git commit -m "feat(ui): implement Option A unified categorized action list in ActionPane"
```

---

### Task 4: End-to-End Verification, UX Audit & Packaging

**Files:**
- Test: Full Vitest suite
- Test: Svelte check
- Test: Cargo test
- Build: Tauri desktop binary

- [ ] **Step 1: Run comprehensive tests**

```bash
pnpm run check
pnpm vitest run --no-file-parallelism
cargo test --manifest-path software/desktop-app/src-tauri/Cargo.toml
python -m unittest discover -s tests
```

- [ ] **Step 2: Build desktop app bundle**

```bash
pnpm run tauri:build
```

- [ ] **Step 3: Update `dist/TouchPass.exe` and commit**

```bash
git add -A
git commit -m "chore: verify tests and rebuild desktop app with categorized preset library"
```
