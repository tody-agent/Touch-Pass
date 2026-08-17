# TouchPass Logo & App Icon Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create, optimize, and integrate the Apple-grade "Luminous Titan Key" logo & icon set across the TouchPass ecosystem (Tauri Desktop App, Web Flasher, System Tray, and Documentation).

**Architecture:** Generate high-resolution master raster and vector assets based on the design spec, build a Python/Pillow automated icon pipeline to generate multi-resolution platform packages (`.ico`, `.icns`, `.png`), and update Tauri desktop config, web assets, and documentation.

**Tech Stack:** `generate_image`, Python 3.11+, Pillow (`PIL`), SVG Vector, Tauri v2 Asset Pipeline.

## Global Constraints
- Must follow Apple Human Interface Guidelines: Squircle superellipse frame, dark obsidian finish (`#0D0F12` $\rightarrow$ `#16191E`), space gray titanium key, 45-degree angle, subtle cyan/gold micro-glow.
- Multi-resolution icon compatibility for macOS (`.icns`), Windows (`.ico` with 16, 32, 48, 64, 128, 256px), Linux/Web (`.png` 32, 128, 512, 1024px).
- Zero broken build errors in Tauri desktop app.

---

### Task 1: Generate Master Graphic & Asset Directory Setup

**Files:**
- Create: `assets/logo/` (directory)
- Create: `assets/logo/touchpass-icon-1024.png`
- Create: `scripts/generate_logo.py`

**Interfaces:**
- Produces: `assets/logo/touchpass-icon-1024.png` (1024x1024 RGBA high-resolution master asset).

- [ ] **Step 1: Create assets directory and trigger master image generation**
Generate the master image using AI image generator with Apple HIG aesthetic prompt for "The Luminous Titan Key".

- [ ] **Step 2: Save and normalize master image**
Format and save as `assets/logo/touchpass-icon-1024.png` (1024x1024 RGBA).

- [ ] **Step 3: Verification**
Verify the file exists, has resolution 1024x1024, valid PNG header, and no corrupt channels.

- [ ] **Step 4: Commit**
```bash
git add assets/logo/touchpass-icon-1024.png
git commit -m "feat(logo): add master high-resolution 1024x1024 touchpass app icon"
```

---

### Task 2: Create Pure Vector SVG & Monochrome Tray Icons

**Files:**
- Create: `assets/logo/touchpass-icon.svg`
- Create: `assets/logo/touchpass-tray-32.png`
- Create: `assets/logo/touchpass-tray-16.png`
- Create: `assets/logo/touchpass-monochrome.svg`

**Interfaces:**
- Consumes: `assets/logo/touchpass-icon-1024.png`
- Produces: Standalone vector icon `touchpass-icon.svg` and crisp monochrome tray icons.

- [ ] **Step 1: Write the vector SVG generator**
Create `assets/logo/touchpass-icon.svg` with precision squircle, gradients, 45-degree unlocked titanium key path, and luminous accent.

- [ ] **Step 2: Generate monochrome tray icons**
Export high-contrast monochrome version for macOS menu bar and Windows system tray (16x16 and 32x32 with transparent background).

- [ ] **Step 3: Verify visual clarity at 16px and 32px**
Check that the icon silhouette is immediately recognizable at tiny status-bar sizes.

- [ ] **Step 4: Commit**
```bash
git add assets/logo/touchpass-icon.svg assets/logo/touchpass-tray-*.png assets/logo/touchpass-monochrome.svg
git commit -m "feat(logo): add vector svg and high-contrast tray icons"
```

---

### Task 3: Generate Multi-Resolution Desktop Icon Sets (ICO, ICNS, PNG)

**Files:**
- Modify: `software/desktop-app/src-tauri/icons/icon.ico`
- Modify: `software/desktop-app/src-tauri/icons/icon.icns`
- Modify: `software/desktop-app/src-tauri/icons/icon.png`
- Create/Modify: `software/desktop-app/src-tauri/icons/32x32.png`
- Create/Modify: `software/desktop-app/src-tauri/icons/128x128.png`
- Create/Modify: `software/desktop-app/src-tauri/icons/128x128@2x.png`
- Create/Modify: `software/desktop-app/src-tauri/icons/Square*.png`
- Create: `scripts/build_app_icons.py`

**Interfaces:**
- Consumes: `assets/logo/touchpass-icon-1024.png`
- Produces: Full multi-platform bundle icons for Tauri v2.

- [ ] **Step 1: Write python icon pipeline script**
Create `scripts/build_app_icons.py` using Pillow to resize and package master PNG into multi-layer ICO (16, 32, 48, 64, 128, 256), macOS ICNS, and square PNG targets.

- [ ] **Step 2: Execute build script**
Run: `python scripts/build_app_icons.py`
Expected: All icons in `software/desktop-app/src-tauri/icons/` updated successfully.

- [ ] **Step 3: Verify icon structure and sizes**
Verify that all generated files have valid file headers and proper dimensions.

- [ ] **Step 4: Commit**
```bash
git add software/desktop-app/src-tauri/icons/ scripts/build_app_icons.py
git commit -m "feat(desktop): update tauri app icons with luminous titan key set"
```

---

### Task 4: Update Web Assets & README.md Visual Identity

**Files:**
- Create/Modify: `web/favicon.ico`
- Create/Modify: `web/favicon.png`
- Create/Modify: `web/flasher/favicon.ico`
- Modify: `README.md:1-25`
- Modify: `docs/translations/README.vi.md`

**Interfaces:**
- Consumes: `assets/logo/touchpass-icon-1024.png` and `assets/logo/touchpass-icon.svg`
- Produces: Updated Web assets and branded documentation.

- [ ] **Step 1: Deploy web favicons**
Copy/resize favicons to `web/` and `web/flasher/`.

- [ ] **Step 2: Update README.md header branding**
Update `README.md` to reference the new clean logo vector/image badge.

- [ ] **Step 3: Verification**
Verify markdown rendering and favicon links.

- [ ] **Step 4: Commit**
```bash
git add web/ README.md docs/translations/
git commit -m "docs: update branding and web favicons with new logo"
```

---

### Task 5: Final Validation & Integration Test

**Files:**
- Test: `software/desktop-app/src-tauri/tauri.conf.json`
- Test: `run_test_gate.py`

- [ ] **Step 1: Check Tauri configuration**
Verify `tauri.conf.json` icon paths align with generated icon files.

- [ ] **Step 2: Run verification gate**
Run: `python run_test_gate.py`
Expected: All existing checks and test gates pass.

- [ ] **Step 3: Final commit & wrap-up**
```bash
git commit --allow-empty -m "chore: complete touchpass logo design and integration"
```
