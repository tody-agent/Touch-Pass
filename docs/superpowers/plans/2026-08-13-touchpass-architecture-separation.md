# TouchPass Architecture Separation & Launcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a 1-click Windows launcher (`start_touchpass.bat`) and update documentation to clearly distinguish between ESP32-S3 Firmware and Local Helper Web Portal.

**Architecture:** A Windows batch script starting the Python HTTP helper and automatically opening `http://127.0.0.1:8787/` in the default browser, paired with explicit architecture documentation in `USER_GUIDE.md` and `README.md`.

**Tech Stack:** Windows Batch, Python 3, Markdown.

## Global Constraints
- Preserve existing Python portal helper functionality.
- Ensure 1-click launcher opens default web browser automatically.

---

### Task 1: Create 1-Click Launcher Script for Windows (`start_touchpass.bat`)

**Files:**
- Create: `start_touchpass.bat`

- [ ] **Step 1: Write `start_touchpass.bat`**

```bat
@echo off
title TouchPass Local Helper Launcher
echo Starting TouchPass Web Portal...
start http://127.0.0.1:8787/
python run_portal_win.py
pause
```

- [ ] **Step 2: Verify launcher file syntax**

Run: `cmd /c "start_touchpass.bat --help"` (or check file existence)

- [ ] **Step 3: Commit changes**

```bash
git add start_touchpass.bat
git commit -m "feat(win): add 1-click launcher batch script start_touchpass.bat"
```

---

### Task 2: Update Documentation with Architecture Diagram & Setup Guide

**Files:**
- Modify: `docs/USER_GUIDE.md`
- Modify: `README.md`

- [ ] **Step 1: Add Architecture Separation section to `USER_GUIDE.md`**
- [ ] **Step 2: Add 1-Click launcher guide to `README.md`**
- [ ] **Step 3: Commit changes**

```bash
git add docs/USER_GUIDE.md README.md
git commit -m "docs: explain firmware vs local helper architecture and 1-click launcher"
```

---

### Task 3: Verification

- [ ] **Step 1: Run documentation and portal unit tests**

```bash
python -m unittest tests/test_documentation.py tests/test_portal_api.py
```

- [ ] **Step 2: Commit final verification**

```bash
git add .
git commit -m "docs: complete verification for architecture separation plan"
```
