# TouchPass Shortcut Recorder & AI Presets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement an interactive Keyboard Shortcut Recorder and an AI Tools Shortcut Library in the TouchPass Web Portal.

**Architecture:** Extended Vanilla JS event listener catching `keydown` events in profile dialog, mapping key modifiers and keyCodes into TouchPass action protocol steps, paired with predefined preset templates in HTML/JS.

**Tech Stack:** HTML5, CSS3, JavaScript (ES6+).

## Global Constraints
- Support cross-platform modifier mapping (Ctrl, Shift, Alt, Cmd/Meta).
- Preserve existing 10 slot configuration structure and USB HID execution logic.

---

### Task 1: Add Shortcut Recorder Box and AI Tool Preset Cards to HTML

**Files:**
- Modify: `software/macos-helper/portal/index.html:150-250`

- [ ] **Step 1: Add Shortcut Recorder element in profile dialog**
- [ ] **Step 2: Add AI Tools Shortcut Library cards in Guide tab**
- [ ] **Step 3: Commit HTML changes**

```bash
git add software/macos-helper/portal/index.html
git commit -m "feat(portal): add shortcut recorder container and AI tool preset cards in HTML"
```

---

### Task 2: Add CSS Styles for Shortcut Recorder and AI Tool Badges

**Files:**
- Modify: `software/macos-helper/portal/styles.css:350-450`

- [ ] **Step 1: Add `.shortcut-recorder` and `.recording-active` pulse effect styles**
- [ ] **Step 2: Add `.ai-tool-card`, `.shortcut-badge`, and `.preset-category` styles**
- [ ] **Step 3: Commit CSS changes**

```bash
git add software/macos-helper/portal/styles.css
git commit -m "style(portal): add styles for shortcut recorder box and AI tool shortcut cards"
```

---

### Task 3: Implement Keyboard Keydown Recorder and AI Presets in JS

**Files:**
- Modify: `software/macos-helper/portal/app.js:250-450`

- [ ] **Step 1: Implement `initShortcutRecorder()` to capture live keystrokes**
- [ ] **Step 2: Implement `initAIToolPresets()` to bind 1-click preset appliers**
- [ ] **Step 3: Verify JS syntax with `node -c`**
- [ ] **Step 4: Commit JS changes**

```bash
git add software/macos-helper/portal/app.js
git commit -m "feat(portal): implement live keydown recorder and AI tool shortcut presets in JS"
```

---

### Task 4: Verification & E2E Testing

**Files:**
- Create: `docs/superpowers/plans/2026-08-13-touchpass-shortcut-recorder-verification.md`

- [ ] **Step 1: Run API verification script**
- [ ] **Step 2: Save verification report**
- [ ] **Step 3: Final commit**

```bash
git add .
git commit -m "docs: complete verification for TouchPass shortcut recorder & AI presets"
```
