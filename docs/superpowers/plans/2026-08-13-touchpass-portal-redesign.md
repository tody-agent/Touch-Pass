# TouchPass Portal Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the TouchPass local web portal (`http://127.0.0.1:8787/`) to match the visual style of the Web Flasher (`https://tody-agent.github.io/Touch-Pass/web/flasher/`), apply Apple Human Interface Guidelines (HIG), support 3 languages (`EN`, `RU`, `VI`), and implement a 4-step user flow tailored for macOS AI Developers (Claude Code, Cursor, Antigravity, Codex).

**Architecture:** A static HTML5/CSS3/JS Web App served by `software/macos-helper/tinytouch_portal.py` via Python `ThreadingHTTPServer`. The app interacts with loopback REST APIs (`/api/status`, `/api/fingers`, `/api/jobs`, `/api/test`, `/api/logs`).

**Tech Stack:** Vanilla JavaScript (ES6+), Vanilla CSS (Glassmorphic Dark Theme `#121815`), HTML5, Python `pytest` for backend contract verification.

## Global Constraints

- CSS Design Tokens: `--bg: #121815`, `--card: #1c2621`, `--card-border: #283830`, `--accent: #22c55e`, `--text: #e2e8f0`, `--muted: #94a3b8`, `--code-bg: #0d1310`.
- Fonts: Google Fonts `Inter` (sans-serif) and `JetBrains Mono` (monospace).
- Asset Directory: `software/macos-helper/portal/` (`index.html`, `styles.css`, `app.js`).
- Languages Supported: `EN` (English), `RU` (Russian), `VI` (Vietnamese).
- API CSRF: State-changing requests (`POST`, `PUT`, `DELETE`) pass `X-CSRF-Token` retrieved from `/api/status`.

---

### Task 1: CSS Design System & Apple HIG Styling

**Files:**
- Modify: `software/macos-helper/portal/styles.css`

**Interfaces:**
- Produces: Complete CSS tokens, glassmorphism topbar, rounded card layouts (`16px`), key chips (`<kbd>`), Apple segmented control, concentric scan ring animation, and dark activity log container.

- [ ] **Step 1: Write CSS rules in `styles.css`**

Add root tokens, reset, typography, navbar glassmorphism, 4-step segmented control, cards, key chips, finger slots, hand map grid, concentric pulse animation, and log stream styles.

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
  --radius: 16px;
  --radius-sm: 8px;
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
}
/* Includes glassmorphic backdrop, segmented controls, pulse animations */
```

- [ ] **Step 2: Verify CSS formatting and responsiveness**

Check CSS syntax and verify no missing closing brackets or malformed rules.

- [ ] **Step 3: Commit CSS changes**

```bash
git add software/macos-helper/portal/styles.css
git commit -m "style: implement TouchPass portal design system and Apple HIG CSS"
```

---

### Task 2: HTML Markup & i18n Structure

**Files:**
- Modify: `software/macos-helper/portal/index.html`

**Interfaces:**
- Produces: HTML5 structure with `data-i18n` attributes, Apple navbar, status indicator, language switcher, 4-step tab panels (Setup/Sandbox, macOS AI Dev Presets, Biometric Studio, Live Activity), and Enrollment Modal Sheet.

- [ ] **Step 1: Rewrite `index.html` with complete HTML5 structure**

```html
<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>TouchPass Portal</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css?v=4">
  <script src="app.js" defer></script>
</head>
<body>
  <!-- Header with Brand, Status & Lang Switcher -->
  <!-- 4-Step Segmented Control -->
  <!-- Step 1: Hardware Setup & Sandbox -->
  <!-- Step 2: macOS AI Dev Presets & Live Preview -->
  <!-- Step 3: Biometric Studio & Hand Map -->
  <!-- Step 4: Live Activity Console -->
  <!-- Enrollment Modal Sheet -->
</body>
</html>
```

- [ ] **Step 2: Validate HTML tags**

Ensure all sections, dialogs, inputs, and buttons have correct IDs and `data-i18n` translation keys.

- [ ] **Step 3: Commit HTML changes**

```bash
git add software/macos-helper/portal/index.html
git commit -m "feat: restructure portal HTML5 markup with Apple HIG tabs and i18n hooks"
```

---

### Task 3: i18n Translation Engine & Core State Engine

**Files:**
- Modify: `software/macos-helper/portal/app.js`

**Interfaces:**
- Consumes: `/api/status` for device state and CSRF token.
- Produces: `TRANSLATIONS` dictionary (EN, RU, VI), `state` object, `setLanguage(lang)`, `fetchStatus()`, and `apiCall(path, method, body)`.

- [ ] **Step 1: Add i18n data dictionary and translation function**

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
    // ... complete keys for EN, RU, VI
  },
  ru: { /* ... */ },
  vi: { /* ... */ }
};
```

- [ ] **Step 2: Implement state manager and API request helper**

```js
const state = {
  lang: localStorage.getItem('touchpass_lang') || 'vi',
  csrfToken: '',
  device: { connected: false, sensor: 'unknown', port: null },
  fingers: [],
  logs: [],
  activeTab: 'step1'
};
```

- [ ] **Step 3: Test i18n translation switching in browser/DOM**

Verify `setLanguage('en')`, `setLanguage('ru')`, and `setLanguage('vi')` translate all text nodes dynamically.

- [ ] **Step 4: Commit i18n and core engine**

```bash
git add software/macos-helper/portal/app.js
git commit -m "feat: add i18n translation dictionary and core portal state engine"
```

---

### Task 4: Step 1 (Setup & USB HID Sandbox) Implementation

**Files:**
- Modify: `software/macos-helper/portal/app.js`

**Interfaces:**
- Consumes: `/api/status` and `POST /api/test`.
- Produces: Real-time connection badge update, Web Flasher redirect link, and keystroke test dispatcher (`triggerTestHID`).

- [ ] **Step 1: Write Step 1 UI handlers**

```js
async function triggerTestHID() {
  const res = await apiCall('/api/test', 'POST', { action: 'type_test' });
  if (res.status === 'ok') {
    showToast(t('testSuccess'));
  }
}
```

- [ ] **Step 2: Connect connection status polling**

Update status badge `🟢 Connected (COM3)` / `🔴 Disconnected` on every poll cycle.

- [ ] **Step 3: Commit Step 1 logic**

```bash
git add software/macos-helper/portal/app.js
git commit -m "feat: implement Step 1 hardware connection check and HID test sandbox"
```

---

### Task 5: Step 2 (macOS AI Dev Preset Gallery) Implementation

**Files:**
- Modify: `software/macos-helper/portal/app.js`

**Interfaces:**
- Consumes: `PUT /api/fingers/:slot`.
- Produces: macOS AI Dev Presets (`ai_dev`, `cli_master`, `ide_master`, `password_vault`), `renderPresets()`, `previewPreset(id)`, and `applyPreset(id)`.

- [ ] **Step 1: Define macOS AI Dev Presets**

```js
const PRESETS = {
  ai_dev: {
    id: "ai_dev",
    nameKey: "presetAIDevName",
    descKey: "presetAIDevDesc",
    slots: {
      1: { label: "Confirm AI Action", action: { preset: "accept", confirm: false } },
      2: { label: "Accept Ghost Text", action: { preset: "custom", steps: [{ type: "key", key: "tab" }] } },
      3: { label: "Accept Composer Diff", action: { preset: "custom", steps: [{ type: "key", key: "enter", modifiers: 8 }] } },
      4: { label: "Reject / Dismiss", action: { preset: "escape" } },
      5: { label: "Abort Process", action: { preset: "custom", steps: [{ type: "key", key: "c", modifiers: 4 }] } },
      6: { label: "macOS Sudo Vault", action: { preset: "password", secret_ref: "slot-6" } },
      7: { label: "Trigger Inline AI (Cmd+K)", action: { preset: "custom", steps: [{ type: "key", key: "k", modifiers: 8 }] } },
      8: { label: "Toggle Agent Panel (Cmd+I)", action: { preset: "custom", steps: [{ type: "key", key: "i", modifiers: 8 }] } },
      9: { label: "Toggle Terminal", action: { preset: "custom", steps: [{ type: "key", key: "grave", modifiers: 4 }] } },
      10: { label: "Command Palette", action: { preset: "custom", steps: [{ type: "key", key: "p", modifiers: 9 }] } }
    }
  },
  // cli_master, ide_master, password_vault
};
```

- [ ] **Step 2: Implement batch preset application**

Write `applyPreset(id)` to update slots 1 through 10 sequentially via `PUT /api/fingers/:slot` and switch active tab to `step3`.

- [ ] **Step 3: Test preset application flow**

Verify clicking "✦ Apply Preset" updates finger profiles and navigates to Step 3.

- [ ] **Step 4: Commit Step 2 logic**

```bash
git add software/macos-helper/portal/app.js
git commit -m "feat: implement Step 2 macOS AI Dev preset gallery and live slot preview"
```

---

### Task 6: Step 3 (Biometric Studio & Concentric Ring Modal) Implementation

**Files:**
- Modify: `software/macos-helper/portal/app.js`

**Interfaces:**
- Consumes: `/api/fingers`, `PUT /api/fingers/:slot`, `POST /api/fingers/:slot/enroll`, `GET /api/jobs/:id`, `DELETE /api/fingers/:slot`.
- Produces: Visual 10-Finger Hand Map renderer, slot grid cards, slot edit modal, enrollment job poller with concentric ring animation, and slot deletion.

- [ ] **Step 1: Write Hand Map & Slot Grid renderer**

Render 10 finger slots into Left Hand (Slots 1–5) and Right Hand (Slots 6–10) with status pills `🟢 Enrolled` / `⚪ Unenrolled` and Keychain encryption indicator 🔒.

- [ ] **Step 2: Implement Concentric Ring Enrollment Modal**

```js
async function startEnrollment(slot) {
  const res = await apiCall(`/api/fingers/${slot}/enroll`, 'POST');
  if (res.job) {
    showEnrollModal(slot, res.job.id);
    pollEnrollJob(res.job.id);
  }
}
```

- [ ] **Step 3: Implement Job Poller & Concentric Scan Pulse**

Poll `GET /api/jobs/:id` every 500ms until state reaches `stored`, `error`, or `cancelled`. Animate concentric scan rings and update progress percentage (0% ➔ 50% ➔ 100%).

- [ ] **Step 4: Commit Step 3 logic**

```bash
git add software/macos-helper/portal/app.js
git commit -m "feat: implement Step 3 Biometric Studio hand map and concentric ring enrollment modal"
```

---

### Task 7: Step 4 (Live Activity Console & Human-Readable Logs) Implementation

**Files:**
- Modify: `software/macos-helper/portal/app.js`

**Interfaces:**
- Consumes: `GET /api/logs`.
- Produces: Human-friendly log translation engine, category filter (`all`, `biometric`, `system`, `error`), log clearing, and ping test handler.

- [ ] **Step 1: Write human-readable log translator**

```js
function formatLogEntry(entry) {
  const tag = entry.tag || 'SYSTEM';
  const timeStr = new Date(entry.timestamp).toLocaleTimeString();
  let icon = '🟢';
  if (tag === 'ENROLL') icon = '👆';
  if (tag === 'CONFIG') icon = '⚙️';
  if (tag === 'DELETE') icon = '🗑️';
  if (tag === 'TEST') icon = '⚡';
  if (tag === 'ERROR') icon = '🔴';
  return { timeStr, icon, tag, message: translateLogMessage(entry.message) };
}
```

- [ ] **Step 2: Implement log polling and category filtering**

Poll `/api/logs` every 1.5s, update the activity console window, scroll to bottom if autoscroll is enabled, and filter by selected tag.

- [ ] **Step 3: Commit Step 4 logic**

```bash
git add software/macos-helper/portal/app.js
git commit -m "feat: implement Step 4 Live Activity console with human-readable logs and filters"
```

---

### Task 8: Verification & API Test Execution

**Files:**
- Test: `tests/test_portal_api.py`
- Test: `tests/test_portal_http.py`

- [ ] **Step 1: Run pytest backend test suite**

Run: `python -m pytest tests/test_portal_api.py tests/test_portal_http.py -v`
Expected: PASS all tests.

- [ ] **Step 2: Verify static portal asset delivery**

Verify `/`, `/app.js`, `/styles.css` return HTTP 200 with appropriate security headers (`Content-Security-Policy`, `Cache-Control`).

- [ ] **Step 3: Final Commit**

```bash
git add .
git commit -m "test: verify TouchPass portal redesign implementation against test suite"
```
