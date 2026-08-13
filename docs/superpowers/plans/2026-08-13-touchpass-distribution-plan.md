# TouchPass 1-Click Web Flasher & 1-Prompt AI Agent Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the All-in-One GitHub Pages landing page with Web Serial 1-Click flasher, Windows desktop 1-click launcher, and copy-paste 1-Prompt AI Agent template for TouchPass.

**Architecture:** TouchPass uses Web Serial API (`esptool-js`) in Chrome/Edge to flash ESP32-S3 firmware directly from browser without software installation. For desktop management, a Python backend runs locally on port 8787. For AI agents, a standardized copy-paste prompt executes automated setup.

**Tech Stack:** HTML5, Modern CSS (Vanilla Dark Theme), JavaScript ES modules (`esptool-js`), Python 3.11, Windows Batch.

## Global Constraints
- Target Hardware: ESP32-S3 SuperMini / Seeed XIAO ESP32-S3.
- Web Serial API supported browsers: Google Chrome, Microsoft Edge, Brave, Opera.
- Port: Local Web UI runs on `http://127.0.0.1:8787/`.
- Zero external CSS frameworks (Vanilla CSS only).

---

### Task 1: GitHub Pages Hero Landing Page & All-in-One UI Structure

**Files:**
- Modify: `web/flasher/index.html`
- Modify: `web/flasher/styles.css`

**Interfaces:**
- Consumes: Static asset paths (`assets/`, `web/flasher/firmware/`)
- Produces: Responsive dark-theme HTML DOM structure with `#flash`, `#message`, `#progress-wrap`, `#log`, `#ai-prompt-copy` elements.

- [ ] **Step 1: Update HTML5 structure in `web/flasher/index.html`**

Update `web/flasher/index.html` to include Hero Section, Hardware Card, Web Serial Flasher Widget, Desktop Downloads Section, and AI Prompt Section with copy button.

- [ ] **Step 2: Update CSS design system in `web/flasher/styles.css`**

Add dark theme tokens (`#121815` background, `#22c55e` accent), responsive container cards, typography scale, code block styling, and progress bar animations.

- [ ] **Step 3: Test HTML structure in local browser or test script**

Verify HTML elements `#flash`, `#message`, `#progress-wrap`, `#ai-prompt-copy` exist and render cleanly.

- [ ] **Step 4: Commit UI changes**

```bash
git add web/flasher/index.html web/flasher/styles.css
git commit -m "feat(web): update GitHub Pages hero landing page and flasher UI"
```

---

### Task 2: Web Serial Flashing Engine & Friendly Error Recovery

**Files:**
- Modify: `web/flasher/app.js`

**Interfaces:**
- Consumes: `vendor/esptool-js.js`, `./firmware/bootloader.bin`, `./firmware/partition-table.bin`, `./firmware/tiny_touch_smartcard.bin`
- Produces: Event listener on `#flash` for Web Serial connection, SHA256 checksum validation, flash progress callback, and copy-prompt button handler.

- [ ] **Step 1: Enhance `web/flasher/app.js` with SHA256 pre-check and friendly error messages**

Add copy prompt clipboard functionality, refine `friendlyError` function for BOOT/RESET hints, baud rate setting `460800`, and automatic post-flash hard reset call.

- [ ] **Step 2: Verify JavaScript syntax and module imports**

Validate node script or syntax check on `web/flasher/app.js`.

- [ ] **Step 3: Commit JavaScript flasher enhancements**

```bash
git add web/flasher/app.js
git commit -m "feat(flasher): enhance Web Serial flashing engine and error guidance"
```

---

### Task 3: 1-Click Desktop Launcher & Setup Auto-Detection

**Files:**
- Modify: `start_touchpass.bat`
- Modify: `run_portal_win.py`

**Interfaces:**
- Consumes: Python virtual environment `software/`
- Produces: Auto-creation of venv, dependency installation, and web browser launch to `http://127.0.0.1:8787/`.

- [ ] **Step 1: Verify and update `start_touchpass.bat`**

Ensure `start_touchpass.bat` checks for Python 3.11+, creates virtual environment if missing, installs `software/requirements.txt`, and launches `run_portal_win.py`.

- [ ] **Step 2: Verify `run_portal_win.py` background server startup**

Confirm `run_portal_win.py` opens `http://127.0.0.1:8787/` in default browser and starts Flask app on port 8787.

- [ ] **Step 3: Test execution using `run_test_gate.py`**

Run: `python run_test_gate.py`
Expected: PASS all gate checks.

- [ ] **Step 4: Commit desktop launcher changes**

```bash
git add start_touchpass.bat run_portal_win.py
git commit -m "feat(desktop): optimize 1-click Windows launcher and portal startup"
```

---

### Task 4: 1-Prompt AI Agent Integration Documentation

**Files:**
- Create: `docs/AI_AGENT_PROMPT.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: Setup commands & repository endpoints.
- Produces: Clear 1-prompt copy-paste block for Claude Code, Cursor, Antigravity, OpenCode agents.

- [ ] **Step 1: Create `docs/AI_AGENT_PROMPT.md`**

Document the AI Agent automated setup protocol with copyable prompts for Windows and macOS.

- [ ] **Step 2: Update `README.md` and `README.vi.md`**

Add badge and section for "🌐 GitHub Pages Web Flasher" and "🤖 1-Prompt AI Agent Setup".

- [ ] **Step 3: Commit documentation**

```bash
git add docs/AI_AGENT_PROMPT.md README.md README.vi.md
git commit -m "docs: add 1-prompt AI agent setup guide and web flasher badges"
```

---

### Task 5: End-to-End Verification & Gate Test

**Files:**
- Modify/Run: `run_test_gate.py`

**Interfaces:**
- Consumes: Entire codebase (`web/flasher`, `software/`, `start_touchpass.bat`).
- Produces: Clean pass output across unit tests and system checks.

- [ ] **Step 1: Execute test gate**

Run: `python run_test_gate.py`
Expected: PASS

- [ ] **Step 2: Commit final verification**

```bash
git add run_test_gate.py
git commit -m "test: verify 1-click flasher and distribution assets"
```
