# TouchPass Web Portal Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the TouchPass local web portal into a feature-rich, self-serve single page application (SPA) with onboarding wizard, debug & serial log monitor, slot profile setup, and interactive user guides.

**Architecture:** A single-page web app built with Vanilla HTML5, CSS3 (Dark Theme, CSS Grid/Flexbox, Glassmorphism), and modular JavaScript. Server backend in Python providing REST endpoints `/api/status`, `/api/fingers`, `/api/logs`, `/api/test`, and serving static portal assets.

**Tech Stack:** HTML5, CSS3, JavaScript (ES6+), Python 3 (http.server, serial), Arduino CLI.

## Global Constraints
- Rebrand all copy from `tinyTouch` to `TouchPass`.
- Preserve backward compatibility with ESP32-S3 HID keyboard actions.
- Maintain responsive dark-mode styling with no external heavy JS framework dependencies.

---

### Task 1: Rebrand Copy and Update Portal HTML Structure to SPA Tabs

**Files:**
- Modify: `software/macos-helper/portal/index.html:1-98`

**Interfaces:**
- Consumes: None
- Produces: 4 Tab Navigation Containers (`#tab-onboarding`, `#tab-slots`, `#tab-debug`, `#tab-guide`) in `index.html`.

- [ ] **Step 1: Update index.html header and navigation tabs**

Update `index.html` title to "TouchPass Portal", change brand text to "TouchPass", and add the tab navigation bar with 4 tabs.

- [ ] **Step 2: Add Onboarding, Slots, Debug, and User Guide sections**

Structure `<main>` with 4 tab sections (`#tab-onboarding`, `#tab-slots`, `#tab-debug`, `#tab-guide`), including the step-by-step onboarding wizard, live log console, and example guide cards.

- [ ] **Step 3: Verify HTML syntax**

Run: `powershell -Command "Test-Path software/macos-helper/portal/index.html"`
Expected: True

- [ ] **Step 4: Commit changes**

```bash
git add software/macos-helper/portal/index.html
git commit -m "feat(portal): rebrand to TouchPass and restructure HTML into 4-tab SPA"
```

---

### Task 2: Enhance CSS Styles for Dark Theme, Tabs, Onboarding Wizard, and Debug Console

**Files:**
- Modify: `software/macos-helper/portal/styles.css:1-300`

**Interfaces:**
- Consumes: SPA HTML tab IDs and class names from Task 1.
- Produces: CSS rules for `.nav-tabs`, `.tab-content`, `.wizard-step`, `.log-console`, `.log-entry`, `.guide-card`.

- [ ] **Step 1: Add CSS design tokens and tab navigation styles**

Define color variables, tab bar buttons, active tab indicators, and transitions.

- [ ] **Step 2: Add Onboarding Wizard & Debug Log styles**

Add CSS for step numbers, diagram containers, live log terminal box with monospaced font, color-coded log tags (`TOUCH`, `MATCH`, `PW`, `ERR`), and guide example cards.

- [ ] **Step 3: Commit CSS changes**

```bash
git add software/macos-helper/portal/styles.css
git commit -m "style(portal): add styling for tabs, debug console, wizard, and guide cards"
```

---

### Task 3: Implement Backend Logging and Test API Endpoints in Python Server

**Files:**
- Modify: `run_portal_win.py:1-45`
- Modify: `software/macos-helper/tinytouch_portal.py:330-400`

**Interfaces:**
- Consumes: Serial events and HTTP requests on `/api/logs` and `/api/test`.
- Produces: JSON response with log entries buffer and trigger test actions.

- [ ] **Step 1: Add log buffer and `/api/logs` endpoint to PortalAPI**

In `software/macos-helper/tinytouch_portal.py`, add a thread-safe ring buffer for serial/system logs and expose `/api/logs` in `dispatch()`.

- [ ] **Step 2: Add `/api/test` endpoint to trigger TYPE_TEST / PING**

Add endpoint in `dispatch()` to allow front-end to trigger diagnostic test commands down to ESP32-S3 over COM port.

- [ ] **Step 3: Verify Python server syntax**

Run: `powershell -Command "& 'C:\Users\block\AppData\Local\hermes\hermes-agent\venv\Scripts\python.exe' -m py_compile run_portal_win.py software/macos-helper/tinytouch_portal.py"`
Expected: Clean exit code 0.

- [ ] **Step 4: Commit backend changes**

```bash
git add run_portal_win.py software/macos-helper/tinytouch_portal.py
git commit -m "feat(backend): add /api/logs and /api/test endpoints for live debugging"
```

---

### Task 4: Implement SPA Tab Switching, Live Log Streaming, and Onboarding Logic in JS

**Files:**
- Modify: `software/macos-helper/portal/app.js:1-350`

**Interfaces:**
- Consumes: `/api/status`, `/api/fingers`, `/api/logs`, `/api/test` endpoints.
- Produces: Interactive tab switching, auto-scrolling log console, step-by-step wizard navigation, test button handlers.

- [ ] **Step 1: Add Tab Switching & State Management**

Implement click listeners for tab buttons to toggle active tab content sections and save active tab in `localStorage`.

- [ ] **Step 2: Implement Debug Console polling & log renderer**

Poll `/api/logs` every 1000ms, append new log lines with timestamp and color badges, and auto-scroll to bottom.

- [ ] **Step 3: Implement Self-Serve Onboarding Wizard controls**

Add next/prev step button handlers, wiring diagram toggle, and "Run HID Test Type" interactive button.

- [ ] **Step 4: Test in browser**

Run: `powershell -Command "Invoke-WebRequest -Uri http://127.0.0.1:8787/ -UseBasicParsing"`
Expected: StatusCode 200 OK.

- [ ] **Step 5: Commit JavaScript changes**

```bash
git add software/macos-helper/portal/app.js
git commit -m "feat(portal): implement tab navigation, debug log monitor, and onboarding wizard in JS"
```

---

### Task 5: End-to-End Verification & Verification Report

**Files:**
- Create: `docs/superpowers/plans/2026-08-13-touchpass-portal-redesign-verification.md`

- [ ] **Step 1: Launch Web Portal server**

Run: `cmd /c "C:\Users\block\AppData\Local\hermes\hermes-agent\venv\Scripts\python.exe run_portal_win.py"`

- [ ] **Step 2: Verify all 4 tabs and API endpoints**

Test GET `/`, GET `/api/status`, GET `/api/fingers`, GET `/api/logs`.

- [ ] **Step 3: Document verification results**

Save verification output into `docs/superpowers/plans/2026-08-13-touchpass-portal-redesign-verification.md`.

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "docs: complete verification for TouchPass Web Portal redesign"
```
