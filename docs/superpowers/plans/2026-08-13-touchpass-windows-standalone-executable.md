# TouchPass Windows Standalone Executable Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a standalone PyInstaller build script for Windows, generate `TouchPass.exe` and `TouchPass-v2.0.0-Windows-x64.zip`, and upload them directly to GitHub Release `v2.0.0`.

**Architecture:** PyInstaller executable packaging + GitHub CLI Release Asset upload.

---

### Task 1: Create PyInstaller Build Script (`packaging/build-standalone-win.py`)

**Files:**
- Create: `packaging/build-standalone-win.py`

- [ ] **Step 1: Write `packaging/build-standalone-win.py`**
- [ ] **Step 2: Install PyInstaller via `pip install pyinstaller`**
- [ ] **Step 3: Run `python packaging/build-standalone-win.py` to build `dist/TouchPass.exe`**
- [ ] **Step 4: Commit build script to git**

```bash
git add packaging/build-standalone-win.py
git commit -m "feat(win): add PyInstaller standalone build script packaging/build-standalone-win.py"
```

---

### Task 2: Package ZIP and Upload Release Assets to GitHub Release `v2.0.0`

**Files:**
- Create: `dist/TouchPass-v2.0.0-Windows-x64.zip`
- Modify: `README.md`
- Modify: `README.vi.md`

- [ ] **Step 1: Compress `dist/TouchPass.exe` and `start_touchpass.bat` into `dist/TouchPass-v2.0.0-Windows-x64.zip`**
- [ ] **Step 2: Upload assets using `gh release upload v2.0.0 dist/TouchPass.exe dist/TouchPass-v2.0.0-Windows-x64.zip --clobber`**
- [ ] **Step 3: Update `README.md` and `README.vi.md` with direct download links**
- [ ] **Step 4: Commit documentation changes to git**

```bash
git add README.md README.vi.md
git commit -m "docs: add direct download links for TouchPass.exe in README"
```

---

### Task 3: Verification & Push to GitHub

- [ ] **Step 1: Run documentation test gate `python run_test_gate.py`**
- [ ] **Step 2: Push changes to GitHub main branch**

```bash
git push origin main
```
