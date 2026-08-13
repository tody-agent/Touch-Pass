# TouchPass Portal Redesign Design Document (Apple HIG & macOS AI Developer Flow)

- **Date**: 2026-08-13
- **Status**: Approved
- **Target URL**: `http://127.0.0.1:8787/`
- **Reference Web Flasher**: `https://tody-agent.github.io/Touch-Pass/web/flasher/`

---

## 1. Overview & Objectives

TouchPass Portal is the local Web GUI running on `http://127.0.0.1:8787/` (served by `run_portal_win.py` and `software/macos-helper/tinytouch_portal.py`). This design document outlines the complete redesign of the local portal to:

1. **Unify Visual Style**: Match the dark theme, typography, color tokens, and header layout of the Web Flasher (`https://tody-agent.github.io/Touch-Pass/web/flasher/`).
2. **Apple Human Interface Guidelines (HIG)**: Incorporate clean cards, translucent glassmorphism (`#121815` with `backdrop-filter: blur(20px)`), rounded pills (`16px`), generous whitespace, and a high-contrast visual hierarchy.
3. **Multilingual (i18n)**: Seamless language switching across `EN` (English), `RU` (Russian), and `VI` (Vietnamese), persisted in `localStorage`.
4. **macOS & AI Developer 4-Step User Flow**:
   - **Step 1: Setup & Web Flasher (Hardware & Sandbox)** — Verify connection to ESP32-S3 / ZW101, link to Web Flasher, and test USB HID keystrokes.
   - **Step 2: Presets & Templates** — 1-Click batch configuration tailored specifically for macOS AI Developers using Claude Code, Cursor, Antigravity, and Codex CLI.
   - **Step 3: Biometric Studio (10 Finger Slots)** — Interactive visual hand map (Left 1–5, Right 6–10) with real-time biometric enrollment pulse modal, slot action editing, and Keychain encryption status.
   - **Step 4: Live Activity Console (Debug & Logs)** — Human-readable, color-coded, live event log stream with filtering and test controls.

---

## 2. Architecture & Design Tokens

### 2.1 CSS Design Tokens (Shared with Web Flasher)

```css
:root {
  --bg: #121815;
  --card: #1c2621;
  --card-border: #283830;
  --accent: #22c55e;
  --accent-hover: #16a34a;
  --accent-light: rgba(34, 197, 94, 0.15);
  --text: #e2e8f0;
  --muted: #94a3b8;
  --code-bg: #0d1310;
  --shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
  --radius: 12px;
  --radius-lg: 16px;
  --radius-sm: 6px;
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
}
```

### 2.2 Navigation Structure

- **Navbar Header**:
  - Logo: `⚡ TouchPass` with `ESP32-S3 · ZW101` eyebrow badge.
  - Hardware Connection Badge: `🟢 Connected (COM3)` / `🔴 Disconnected`.
  - Apple-style Segmented Language Picker: `[ EN | RU | (VI) ]`.
- **4-Step Apple Segmented Control**:
  - `[ 🚀 1. Setup & Flash ]`
  - `[ 📋 2. Presets ]`
  - `[ 🖐️ 3. Biometric Studio ]`
  - `[ ⚡ 4. Live Activity ]`

---

## 3. Detailed 4-Step User Flow Specification

### 3.1 Step 1: Setup & Web Flasher (Hardware & Sandbox)

- **Connection Status Card**:
  - Displays device status: Serial ID, sensor status (`ZW101`), COM port, baud rate.
- **Web Flasher Quick Link Card**:
  - Direct call-to-action button opening `https://tody-agent.github.io/Touch-Pass/web/flasher/` if firmware update is required.
- **USB HID Keystroke Sandbox**:
  - Live text input box to capture keystrokes.
  - "⚡ Test USB HID (y+Enter)" button calling `POST /api/test` to trigger physical keyboard simulation.
  - Interactive key indicator chips (`<kbd>y</kbd> + <kbd>Enter</kbd>`).
- **Hardware Wiring Guide Table**:
  - Reference table for ESP32-S3 and ZW101 pin assignments (VCC, GND, TX, RX, IRQ).

---

### 3.2 Step 2: macOS AI Developer Preset Gallery

Tailored for AI Agent developers on macOS (Claude Code, Cursor, Antigravity, Codex CLI):

#### Preset 1: 🤖 "AI Agent Pair-Programming" (Recommended Default)
- **Slot 1 (Right Index)**: `y` + `Enter` (Approve Claude Code / Terminal Agent Tool Execution)
- **Slot 2 (Right Thumb)**: `Tab` (Accept Inline Ghost Text in Cursor / Antigravity)
- **Slot 3 (Right Middle)**: `⌘ + Enter` (Accept Agent Composer / Submit Prompt)
- **Slot 4 (Right Ring)**: `Escape` (Reject AI Suggestion / Dismiss Panel)
- **Slot 5 (Right Pinky)**: `Control + C` (Abort Execution / Interrupt Agent)
- **Slot 6 (Left Thumb)**: macOS Sudo Password (Encrypted in Keychain)
- **Slot 7 (Left Index)**: `⌘ + K` (Trigger Inline AI Edit in Cursor/Antigravity)
- **Slot 8 (Left Middle)**: `⌘ + I` (Toggle Antigravity / Cursor Composer Panel)
- **Slot 9 (Left Ring)**: `Control + ~` (Toggle Integrated Terminal)
- **Slot 10 (Left Pinky)**: `⌘ + Shift + P` (Command Palette)

#### Preset 2: 💻 "Claude Code & Terminal Specialist"
- **Slot 1**: `y` + `Enter` (Confirm Tool Execution)
- **Slot 2**: macOS Sudo Password
- **Slot 3**: `Enter` (Submit Input)
- **Slot 4**: `Control + C` (Interrupt Process)
- **Slot 5**: `claude` + `Enter` (Start Claude Code CLI)
- **Slot 6–10**: Terminal shortcuts (`git status`, `git diff`, `git commit -am "update"`, `git push`, `clear`)

#### Preset 3: 🖥️ "Cursor & Antigravity IDE Master"
- **Slot 1**: `Tab` (Accept Code Auto-complete)
- **Slot 2**: `⌘ + Enter` (Accept Composer Changes)
- **Slot 3**: `⌘ + K` (Edit Code with AI)
- **Slot 4**: `Escape` (Reject / Close Window)
- **Slot 5**: `⌘ + L` (Focus AI Chat)
- **Slot 6–10**: IDE Navigation shortcuts (`⌘ + Z`, `⌘ + Shift + F`, `Control + ~`, `⌘ + B`, `⌘ + W`)

#### Preset 4: 🔐 "Password Vault Master"
- Slots 1–10 configured for ASCII passwords with macOS Keychain security.

**Interaction Model**:
1. User clicks or hovers a Preset Card.
2. The **Live Slot Preview Sheet** dynamically updates showing all 10 finger mappings.
3. User clicks **"✦ Apply Preset"**, sending configuration updates to `/api/fingers/:slot` and automatically scrolling to Step 3.

---

### 3.3 Step 3: Biometric Studio (10 Finger Slots & Enrollment)

- **Interactive 10-Finger Visual Hand Map**:
  - Visual layout dividing Left Hand (Slots 1–5) and Right Hand (Slots 6–10).
  - Finger status badges: 🟢 Enrolled (Biometric data stored) vs ⚪ Unenrolled.
  - Secret status indicator: 🔒 Configured in macOS Keychain / Vault.
- **Slot Card Controls**:
  - ✏️ **Edit Profile**: Open Apple Modal Sheet to configure label, action type (`enter`, `accept`, `escape`, `password`, `custom`), secret content, or step macro.
  - 👆 **Enroll Fingerprint**: Triggers `POST /api/fingers/:slot/enroll`. Opens concentric scan pulse animation modal (0% ➔ 50% ➔ 100%).
  - 🗑️ **Delete / Reset**: Triggers `DELETE /api/fingers/:slot`.
- **Apple Concentric Scan Ring Modal**:
  - Animated concentric ring pulse giving real-time feedback during 2-touch fingerprint enrollment on ZW101.

---

### 3.4 Step 4: Live Activity Console (Debug & Human-Readable Logs)

- **Human-Readable Log Stream**:
  - Translates raw API & hardware events into clear, natural language entries.
  - Tag Color Coding:
    - 🟢 `[SYSTEM]` / `[KẾT NỐI]`: Device status updates (e.g. `System Connected — ESP32-S3 on COM3`).
    - 👆 `[BIOMETRIC]` / `[VÂN TAY]`: Touch events (e.g. `Slot 1 (Right Index) matched — Sent 'y + Enter'`).
    - ⚙️ `[CONFIG]` / `[CẤU HÌNH]`: Profile updates.
    - ⚡ `[TEST]` / `[THỬ NGHIỆM]`: Keystroke test triggers.
    - 🔴 `[ERROR]` / `[LỖI]`: Hardware or protocol errors.
- **Console Controls**:
  - Filter Segmented Control: `[ All ] [ Biometrics ] [ System ] [ Errors ]`.
  - Buttons: 🗑️ Clear Logs, ⚡ Ping Device, ⌨️ Test HID Key, 📥 Export Logs.

---

## 4. Internationalization (i18n) Data Dictionary

The portal frontend will include a comprehensive `TRANSLATIONS` dictionary supporting `en`, `ru`, and `vi`:

```js
const TRANSLATIONS = {
  en: {
    brandTitle: "TouchPass Portal",
    eyebrow: "ESP32-S3 · ZW101",
    statusConnected: "Connected",
    statusDisconnected: "Disconnected",
    step1Title: "1. Setup & Flash",
    step2Title: "2. Presets",
    step3Title: "3. Biometric Studio",
    step4Title: "4. Live Activity",
    // ...
  },
  ru: {
    brandTitle: "TouchPass Портал",
    eyebrow: "ESP32-S3 · ZW101",
    statusConnected: "Подключено",
    statusDisconnected: "Отключено",
    // ...
  },
  vi: {
    brandTitle: "TouchPass Portal",
    eyebrow: "ESP32-S3 · ZW101",
    statusConnected: "Đã kết nối",
    statusDisconnected: "Chưa kết nối",
    // ...
  }
};
```

---

## 5. File Modifications Plan

The redesign affects the files served by `run_portal_win.py` and `software/macos-helper/tinytouch_portal.py`:

- `software/macos-helper/portal/index.html` — Full HTML5 rewrite matching Web Flasher markup, Apple HIG cards, i18n data attributes, 4-step segmented sections, hand map, enrollment modal sheet, and live activity log.
- `software/macos-helper/portal/styles.css` — CSS design tokens from Web Flasher, glassmorphism backdrop blur, rounded pill cards, key chip styling, concentric scan ring animation, responsive grid layouts.
- `software/macos-helper/portal/app.js` — Frontend state management, i18n translation engine, API polling (`/api/status`, `/api/fingers`, `/api/logs`), preset applier, enrollment job poller with animated modal, USB HID test handler.

---

## 6. Verification & Test Plan

1. **Visual Style Verification**: Verify fonts (`Inter`, `JetBrains Mono`), color scheme, responsive card layout, and language switcher behavior against `web/flasher`.
2. **i18n Test**: Switch between `EN`, `RU`, and `VI` to ensure all 4 steps, cards, modals, and logs update without missing translation keys.
3. **Backend API Integration Test**: Verify `/api/status`, `/api/fingers`, `/api/jobs`, `/api/test`, and `/api/logs` using python test runner `pytest tests/test_portal_api.py tests/test_portal_http.py`.
4. **User Flow Verification**:
   - Step 1: Keystroke sandbox test triggers HID key dispatch.
   - Step 2: Applying "AI Agent Pair-Programming" preset populates slots 1–10 correctly and transitions to Step 3.
   - Step 3: Finger slot editing and enrollment modal lifecycle.
   - Step 4: Real-time event log streaming and filter controls.
