# Touch Pass Documentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish an English-first, beginner-friendly Touch Pass repository with an engaging README, complete build and user guides, approved product images, verified instructions, and preserved TinyTouch attribution.

**Architecture:** `README.md` is the visual landing page and routes detailed work into two focused guides. A Python unittest contract validates required documents, images, links, safety language, and attribution before GitHub publication.

**Tech Stack:** GitHub-flavored Markdown, Python `unittest`, Arduino CLI, ESP32 Arduino Core 3.x, Git, GitHub CLI.

## Global Constraints

- Main path: ESP32-S3 Super Mini, ZW101, USB HID, macOS helper, local ten-finger portal.
- English-first copy must be friendly to makers, vibe coders, and non-specialists.
- PIV appears only as advanced upstream context.
- Preserve Git history and credit `ZimengXiong/TinyTouch`.
- Publish only the five user-retained PNGs in `assets/demo/`.
- Never track `.DS_Store`, real `secrets.h`, credentials, or pairing keys.
- State the focused-field and unauthenticated-UART security limits.
- Publish a private repository named `tody-agent/Touch-Pass`.

---

### Task 1: Documentation Contract and Curated Images

**Files:**
- Create: `tests/test_documentation.py`
- Modify: `.gitignore`
- Add: `assets/demo/*.png` (the five approved files only)

**Interfaces:**
- Consumes: the approved image list from the design spec.
- Produces: a contract used by every later documentation task.

- [ ] **Step 1: Write the failing documentation contract**

Create `tests/test_documentation.py`:

```python
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
README = ROOT / "README.md"
BUILD_GUIDE = ROOT / "docs" / "BUILD_GUIDE.md"
USER_GUIDE = ROOT / "docs" / "USER_GUIDE.md"
APPROVED_IMAGES = {
    "01-hero-showcase-v2.png",
    "02-mac-mini-claude-accept-v2.png",
    "03-login-success.png",
    "04-features.png",
    "05-exploded-view-v3.png",
}

class DocumentationTests(unittest.TestCase):
    def test_required_guides_and_images_exist(self):
        self.assertTrue(BUILD_GUIDE.is_file())
        self.assertTrue(USER_GUIDE.is_file())
        actual = {p.name for p in (ROOT / "assets" / "demo").glob("*.png")}
        self.assertEqual(actual, APPROVED_IMAGES)

    def test_readme_routes_and_credits(self):
        text = README.read_text(encoding="utf-8")
        self.assertIn("docs/BUILD_GUIDE.md", text)
        self.assertIn("docs/USER_GUIDE.md", text)
        self.assertIn("ZimengXiong/TinyTouch", text)
        self.assertIn("Give every finger a superpower", text)

    def test_local_markdown_links_resolve(self):
        for document in (README, BUILD_GUIDE, USER_GUIDE):
            text = document.read_text(encoding="utf-8")
            for target in re.findall(r"!?\[[^]]*\]\(([^)]+)\)", text):
                if target.startswith(("http://", "https://", "#")):
                    continue
                path = (document.parent / target.split("#", 1)[0]).resolve()
                self.assertTrue(path.exists(), f"broken link in {document}: {target}")

    def test_safety_limits_are_visible(self):
        combined = "\n".join(
            p.read_text(encoding="utf-8")
            for p in (README, BUILD_GUIDE, USER_GUIDE)
        ).lower()
        self.assertIn("focused", combined)
        self.assertIn("unauthenticated uart", combined)
```

- [ ] **Step 2: Run the contract and confirm the red state**

Run: `.venv/bin/python -m unittest tests.test_documentation -v`

Expected: FAIL because both new guides and README routing are absent.

- [ ] **Step 3: Ignore Finder metadata and stage approved assets**

Add to `.gitignore`:

```gitignore
.DS_Store
**/.DS_Store
```

Keep exactly the five filenames in `APPROVED_IMAGES`; do not delete files outside `assets/demo/`.

- [ ] **Step 4: Commit the contract and images**

```bash
git add .gitignore tests/test_documentation.py assets/demo/*.png
git commit -m "test: define Touch Pass documentation contract"
```

### Task 2: Story-Driven README

**Files:**
- Modify: `README.md`
- Test: `tests/test_documentation.py`

**Interfaces:**
- Consumes: approved images and future guide paths.
- Produces: the GitHub landing page and navigation entry point.

- [ ] **Step 1: Replace README content**

Use this exact section order:

```markdown
# Touch Pass
> Give every finger a superpower.
## What is Touch Pass?
## Ten fingers, ten useful actions
## Built for makers, vibe coders, and curious humans
## How it works
## See it in action
## Start here
## Before you trust it
## Project status
## Built on TinyTouch
```

Embed the hero, Claude Accept, and feature images with relative paths. Link `docs/BUILD_GUIDE.md`, `docs/USER_GUIDE.md`, and the Vietnamese guide. Say plainly that HID types into the focused field and ZW101 UART is unauthenticated.

- [ ] **Step 2: Run the README contract**

Run: `.venv/bin/python -m unittest tests.test_documentation.DocumentationTests.test_readme_routes_and_credits -v`

Expected: PASS.

- [ ] **Step 3: Commit README**

```bash
git add README.md
git commit -m "docs: introduce Touch Pass"
```

### Task 3: Beginner Build Guide

**Files:**
- Create: `docs/BUILD_GUIDE.md`
- Test: `tests/test_documentation.py`

**Interfaces:**
- Consumes: firmware/helper paths and `assets/demo/05-exploded-view-v3.png`.
- Produces: the parts-to-first-portal tutorial.

- [ ] **Step 1: Write `docs/BUILD_GUIDE.md`**

Use sections: What you are building; Parts and tools; Wiring; Assemble; Prepare your Mac; Create pairing key; Configure Arduino; Flash; Start helper and portal; First-build checklist; Troubleshooting; What automated tests prove.

Include this exact wiring table:

| ZW101 | ESP32-S3 Super Mini |
| --- | --- |
| V_TOUCH (pin 1) | 3V3 |
| TouchOut (pin 2) | GPIO1 |
| VCC (pin 3) | 3V3 |
| TX (pin 4) | GPIO6 / ESP RX |
| RX (pin 5) | GPIO7 / ESP TX |
| GND (pin 6) | GND |

Include board settings: `ESP32S3 Dev Module`, `USB-OTG (TinyUSB)`, USB CDC enabled, 4 MB flash, PSRAM disabled. Warn never to connect ZW101 VCC/UART to 5 V.

- [ ] **Step 2: Verify every command references real project files**

```bash
test -f firmware/tiny_touch_keyboard/tiny_touch_keyboard.ino
test -f firmware/tiny_touch_keyboard/secrets.example.h
test -f software/macos-helper/requirements.txt
test -f software/macos-helper/tinytouch_helper.py
```

Expected: exit 0.

- [ ] **Step 3: Commit build guide**

```bash
git add docs/BUILD_GUIDE.md
git commit -m "docs: add beginner Touch Pass build guide"
```

### Task 4: Practical User Guide

**Files:**
- Create: `docs/USER_GUIDE.md`
- Test: `tests/test_documentation.py`

**Interfaces:**
- Consumes: portal behavior and approved desk/login images.
- Produces: the ten-finger daily-use and recovery manual.

- [ ] **Step 1: Write `docs/USER_GUIDE.md`**

Use sections: Open the portal; Your ten slots; Enroll; Choose an action; One touch or double touch; Starter layouts; Edit/replace/delete; Secrets and privacy; Troubleshooting; Safe-use checklist.

Document Password + Enter, Accept (`y` + Enter), Enter, Escape, and custom Text/Key/Delay sequences (maximum 16 steps). Password is one touch; non-password actions require the same finger twice within three seconds. Explain ABC/US keyboard layout and focused-window behavior.

- [ ] **Step 2: Run the complete documentation contract**

Run: `.venv/bin/python -m unittest tests.test_documentation -v`

Expected: all documentation tests PASS.

- [ ] **Step 3: Commit user guide**

```bash
git add docs/USER_GUIDE.md
git commit -m "docs: add Touch Pass user guide"
```

### Task 5: Validate and Publish Private Fork

**Files:**
- Verify: all tracked files
- External state: `tody-agent/Touch-Pass`

**Interfaces:**
- Consumes: completed documentation commits on `main`.
- Produces: verified private GitHub repository and safe upstream/origin remotes.

- [ ] **Step 1: Run full validation**

```bash
.venv/bin/python -m unittest discover -s tests -v
.venv/bin/python -m py_compile software/macos-helper/tinytouch_helper.py software/macos-helper/tinytouch_portal.py tinytouch
node --check software/macos-helper/portal/app.js
git diff --check
```

Expected: all tests pass and all other commands exit 0.

- [ ] **Step 2: Compile firmware using a temporary copy of `secrets.example.h` as `secrets.h`**

Create and populate an explicit temporary sketch directory, then run Arduino CLI:

```bash
mkdir -p /tmp/touch-pass-doc-sketch-20260811/tiny_touch_keyboard
mkdir -p /tmp/touch-pass-doc-build-20260811
cp firmware/tiny_touch_keyboard/tiny_touch_keyboard.ino firmware/tiny_touch_keyboard/action_protocol.h firmware/tiny_touch_keyboard/secrets.example.h /tmp/touch-pass-doc-sketch-20260811/tiny_touch_keyboard/
cp firmware/tiny_touch_keyboard/secrets.example.h /tmp/touch-pass-doc-sketch-20260811/tiny_touch_keyboard/secrets.h
arduino-cli compile --fqbn esp32:esp32:esp32s3:USBMode=default,CDCOnBoot=cdc,FlashSize=4M,PSRAM=disabled --build-path /tmp/touch-pass-doc-build-20260811 /tmp/touch-pass-doc-sketch-20260811/tiny_touch_keyboard
```

Expected: exit 0 with flash/RAM usage. Never copy the temporary key back into the repository.

- [ ] **Step 3: Audit tracked content**

```bash
git ls-files | rg '(^|/)\.DS_Store$|(^|/)secrets\.h$' && exit 1 || true
git status --short
```

Expected: no tracked `.DS_Store`/real `secrets.h`; clean tree.

- [ ] **Step 4: Create private GitHub repository**

```bash
gh repo create tody-agent/Touch-Pass --private --description "Give every finger a superpower — a DIY ESP32-S3 fingerprint action pad for macOS." --disable-wiki
```

Expected: GitHub returns the new private repository URL.

- [ ] **Step 5: Preserve upstream and configure origin**

```bash
git remote rename origin upstream
git remote add origin https://github.com/tody-agent/Touch-Pass.git
git remote -v
```

Expected: `origin` is Touch Pass; `upstream` is `ZimengXiong/TinyTouch`.

- [ ] **Step 6: Push and verify**

```bash
git push -u origin main
gh repo view tody-agent/Touch-Pass --json nameWithOwner,visibility,url,defaultBranchRef
git status --short --branch
```

Expected: private repo, default branch `main`, local `main` tracks `origin/main`, clean tree.
