# macOS / 1Password Style UI & UX Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the TouchPass Desktop application UI/UX into an ultra-clean, fluid, Apple macOS / 1Password-grade experience with responsive scroll containment, refined typography, Apple-style toggle switches, sleek glassmorphism, and zero cut-off controls.

**Architecture:** Refactor CSS design system tokens into authentic macOS dark aesthetic, enhance Svelte components (`TitleBar`, `HandMap`, `ActionPane`, `DeviceInspector`, `SettingsPane`, `HelpSheet`) with strict flexbox/grid scroll containment, native-feeling micro-animations, and verified accessibility.

**Tech Stack:** Svelte 5 (runes `$state`, `$derived`, `$effect`), Tailwind CSS, Lucide Icons, TypeScript, Vite, Vitest, Tauri v2.

---

## Global Constraints
- **Design Standard**: 100% faithful to Apple macOS / 1Password dark design language (neutral zinc/slate surfaces, `font-semibold` / `font-medium` typography, smooth glassmorphism, no harsh high-contrast box borders, no all-caps badges).
- **Responsiveness**: Strict viewport containment (`h-screen overflow-hidden`) with dedicated internal scroll containers (`overflow-y-auto`) so action buttons (`Save`, `More`, `Delete`) are never pushed off-screen at any screen resolution (down to 1024x600).
- **Package Manager**: Use `pnpm` exclusively for all npm commands (`pnpm test`, `pnpm run check`, `pnpm run test:gate`).
- **Regression Prevention**: All 54+ Vitest tests and 50+ Rust backend tests must pass with 0 errors and 0 warnings at each milestone.

---

### Task 1: Apple macOS Design System & Core CSS Foundations

**Files:**
- Modify: `software/desktop-app/src/app.css`
- Test: `software/desktop-app/src/nativeSizing.test.ts`

**Interfaces:**
- Consumes: Tailwind utilities, CSS variables
- Produces: Apple macOS surface layers (`.apple-window`, `.apple-sidebar`, `.apple-card`, `.apple-switch`), refined typography classes, custom sleek scrollbars, glassmorphism filters

- [ ] **Step 1: Inspect existing app.css design tokens and identify obsolete styles**

Verify current layout containers, font weights, and color tokens in `software/desktop-app/src/app.css`.

- [ ] **Step 2: Update `app.css` with macOS design tokens and Apple Toggle Switch**

Add:
1. Apple dark surface hierarchy:
   - Window base: `#0e131f` with subtle radial lighting
   - Sidebar & Panels: `#131926` with `border-white/[0.06]`
   - Grouped Card Inset: `rgba(255, 255, 255, 0.03)` with `border-white/[0.08]` and soft hover `rgba(255, 255, 255, 0.05)`
2. Apple Toggle Switch (`.apple-switch`, `.apple-switch-track`, `.apple-switch-thumb`) with 60fps spring transitions.
3. Sleek macOS scrollbar (`::-webkit-scrollbar` with transparent track and thin rounded slate thumb).
4. Refined typography rules: `font-sans` with `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`, `tracking-tight` for titles, title-cased status pills.

- [ ] **Step 3: Run existing styling and native sizing tests**

Run: `pnpm test src/nativeSizing.test.ts`
Expected: PASS (4 tests passed)

- [ ] **Step 4: Commit design system foundation**

```bash
git add software/desktop-app/src/app.css
git commit -m "style: introduce apple macos design system tokens and apple switch styling"
```

---

### Task 2: Unified Window Header & TitleBar Refinement

**Files:**
- Modify: `software/desktop-app/src/components/TitleBar.svelte`
- Test: `software/desktop-app/src/lib/i18n.test.ts`

**Interfaces:**
- Consumes: `status: AppStatusResponse`, `locale: Locale`, `onSettings: () => void`, `onHelp: () => void`
- Produces: Frosted glass TitleBar with live status pulsing dot, brand touchpass icon with glow, and refined macOS tooltips

- [ ] **Step 1: Write test or verify TitleBar interaction contracts**

Verify toolbar status label and accessibility bindings in `software/desktop-app/src/lib/i18n.test.ts`.

- [ ] **Step 2: Refactor `TitleBar.svelte`**

1. Apply frosted glass header styling (`backdrop-blur-xl bg-slate-950/70 border-b border-white/[0.06] px-4 py-2.5 h-13`).
2. Style the status badge with a live animated glowing dot (`animate-pulse` when checking, solid green when ready, amber when waiting).
3. Enhance icon buttons (`CircleHelp`, `Settings`) with tactile hover states (`hover:bg-white/10 active:scale-95 rounded-lg p-2 text-slate-300 hover:text-white transition`).

- [ ] **Step 3: Run verification tests**

Run: `pnpm test src/lib/i18n.test.ts`
Expected: PASS

- [ ] **Step 4: Commit TitleBar improvements**

```bash
git add software/desktop-app/src/components/TitleBar.svelte
git commit -m "feat(ui): refine TitleBar with frosted glass and macOS status badge"
```

---

### Task 3: Left Sidebar (HandMap & Finger Navigation) Refinement

**Files:**
- Modify: `software/desktop-app/src/components/HandMap.svelte`
- Modify: `software/desktop-app/src/components/HandColumn.svelte`
- Test: `software/desktop-app/src/components/HandMap.test.ts`

**Interfaces:**
- Consumes: `profiles: FingerProfile[]`, `selectedId: number`, `locked: boolean`, `onSelect: (id: number) => void`
- Produces: 1Password-style list navigation with finger slot badges, action type icons, counter badge, and fluid selection indicator

- [ ] **Step 1: Verify current HandMap unit test suite**

Run: `pnpm test src/components/HandMap.test.ts`
Expected: PASS (9 tests passed)

- [ ] **Step 2: Refactor `HandMap.svelte` layout & cards**

1. Top header: Title `Finger map` + subtle pill counter `2 of 10` (`bg-blue-500/10 text-blue-300 border border-blue-500/20 text-xs px-2.5 py-0.5 rounded-full font-medium`).
2. Hand sections: Distinct `Left hand` and `Right hand` groups with subtle muted subheaders.
3. List item cards:
   - Rounded-xl container with `gap-3 px-3 py-2.5`.
   - Left: Monospace slot numeral (`#01`) with muted slate background.
   - Center: Clean finger name + small action type icon (Bot, Key, Enter, Command, or Pause).
   - Right: Status icon (Green checkmark badge for configured, Amber pause for disabled, subtle `+` for unconfigured).
   - Selected state: Soft blue glass pill highlight (`bg-blue-600/15 border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.15)] text-white`).

- [ ] **Step 3: Run HandMap test suite to guarantee zero regression**

Run: `pnpm test src/components/HandMap.test.ts`
Expected: PASS (9 tests passed)

- [ ] **Step 4: Commit HandMap refactor**

```bash
git add software/desktop-app/src/components/HandMap.svelte software/desktop-app/src/components/HandColumn.svelte
git commit -m "feat(ui): refine HandMap with 1password list item styling"
```

---

### Task 4: Center Workspace (ActionPane, Apple Toggle & Scroll Containment)

**Files:**
- Modify: `software/desktop-app/src/components/ActionPane.svelte`
- Test: `software/desktop-app/src/lib/profileActions.test.ts`
- Test: `software/desktop-app/src/lib/profileState.test.ts`

**Interfaces:**
- Consumes: `profile: FingerProfile`, `deviceConnected: boolean`, `onSave`, `onEnroll`, `onReset`, `onTest`, `onDirtyChange`
- Produces: Scroll-contained action workspace with Apple toggle switch for confirmation, password show/hide toggle, non-overflowing sticky footer, and glassmorphic delete modal

- [ ] **Step 1: Verify profile action test suite**

Run: `pnpm test src/lib/profileActions.test.ts src/lib/profileState.test.ts`
Expected: PASS (7 tests passed)

- [ ] **Step 2: Refactor `ActionPane.svelte`**

1. **Scroll Containment**: Split ActionPane into:
   - Header area (`shrink-0`): Finger title, description, and soft pill status badge (`Configured` / `Not configured` / `Disabled`).
   - Scrollable body (`flex-1 overflow-y-auto space-y-4 pr-1`): Preset action cards, password input with show/hide eye toggle, custom shortcut input with helper text, and Apple Toggle Switch for "Touch twice to confirm".
   - Sticky footer (`shrink-0 pt-3 border-t border-white/[0.06] flex items-center justify-between`): `Save changes / Save and enroll` button, `More (...)` dropdown menu, and connection status indicator.
2. **Apple Toggle Switch**: Replace checkbox with custom keyboard-accessible toggle (`role="switch"`, `aria-checked`).
3. **Password Input**: Add show/hide password toggle button (`Eye` / `EyeOff` from `lucide-svelte`) and clear OS Keyring indicator.
4. **Delete Modal**: Modernize with glassmorphism, tactile action buttons (`Cancel`, `Delete locally`, `Delete from device`).

- [ ] **Step 3: Run profile action tests and svelte check**

Run: `pnpm test src/lib/profileActions.test.ts && pnpm run check`
Expected: PASS with 0 errors and 0 warnings

- [ ] **Step 4: Commit ActionPane refactor**

```bash
git add software/desktop-app/src/components/ActionPane.svelte
git commit -m "feat(ui): implement scroll containment, Apple toggle switch, and refined action pane"
```

---

### Task 5: Right Inspector (DeviceInspector), Settings Workspace & HelpSheet Polish

**Files:**
- Modify: `software/desktop-app/src/components/DeviceInspector.svelte`
- Modify: `software/desktop-app/src/components/SettingsPane.svelte`
- Modify: `software/desktop-app/src/components/HelpSheet.svelte`
- Modify: `software/desktop-app/src/App.svelte`
- Test: `software/desktop-app/src/components/SettingsPane.test.ts`
- Test: `software/desktop-app/src/lib/vaultWorkspaceState.test.ts`

**Interfaces:**
- Consumes: App status, preferences, categories navigation
- Produces: Clean device inspector without duplicate text, macOS System Settings layout, and glassmorphic quick guide sheet

- [ ] **Step 1: Verify SettingsPane test suite**

Run: `pnpm test src/components/SettingsPane.test.ts src/lib/vaultWorkspaceState.test.ts`
Expected: PASS (17 tests passed)

- [ ] **Step 2: Refactor `DeviceInspector.svelte`**

1. Remove duplicate step guide text.
2. Structure into clean Apple Inspector cards:
   - **Hardware Card**: Port name badge, firmware mode, sensor health with green/amber dot.
   - **Selected Finger Detail**: Tactile fingerprint circle with ambient glow, assigned action name with icon, and direct test/rescan action button.
   - **Privacy Guarantee Card**: Subtle badge "100% Local Security • Secure OS Keyring".

- [ ] **Step 3: Refactor `SettingsPane.svelte`**

1. Clean sidebar category selector with icons and macOS active highlight.
2. Content area formatted as Apple Inset Grouped cards with rows, labels, subtitles, select dropdowns, and Apple toggle switches.
3. Top navigation with clean `← Back to Vault` button.

- [ ] **Step 4: Refactor `HelpSheet.svelte`**

Apply macOS sheet dialog styling (`backdrop-blur-2xl bg-slate-900/85 border border-white/10 shadow-2xl rounded-2xl p-6`).

- [ ] **Step 5: Run full test gate to verify end-to-end functionality**

Run: `pnpm run test:gate`
Expected: PASS (svelte-check: 0 errors, vitest: 54 tests passed, vite build: successful)

- [ ] **Step 6: Commit Inspector and Settings refactor**

```bash
git add software/desktop-app/src/components/DeviceInspector.svelte software/desktop-app/src/components/SettingsPane.svelte software/desktop-app/src/components/HelpSheet.svelte software/desktop-app/src/App.svelte
git commit -m "feat(ui): refine DeviceInspector, SettingsPane and HelpSheet to macOS standard"
```

---

### Task 6: Visual Inspection & Verification Gate

**Files:**
- Verify: Full web UI via `chrome-devtools-mcp` screenshots
- Verify: Backend Rust tests via `cargo test`

- [ ] **Step 1: Capture live screenshots of Main View, Password Field, Settings, and HelpSheet**

Use `chrome-devtools-mcp` to navigate through all screens and capture screenshots to visually verify:
- No button cut-off when password/custom field is active.
- Apple toggle switch renders and toggles smoothly.
- Settings pane renders with high visual polish.
- Contrast and typography are crisp and legibly styled.

- [ ] **Step 2: Run full backend and frontend validation**

Run: `cargo test` in `src-tauri` and `pnpm run test:gate` in `desktop-app`.
Expected: 100% pass across all 50 Rust tests and 54 Vitest tests.

- [ ] **Step 3: Rebuild release installer**

Run: `pnpm run tauri:build` and copy installer to `dist/TouchPass_0.2.0_x64-setup.exe`.

- [ ] **Step 4: Final commit and cleanup**

```bash
git add dist/TouchPass_0.2.0_x64-setup.exe
git commit -m "chore: package release v0.2.0 with refined macOS UI"
```
