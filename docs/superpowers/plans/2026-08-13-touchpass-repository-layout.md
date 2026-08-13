# TouchPass Repository Layout Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move translated READMEs and SECURITY policies to `docs/translations/` for a clean, lean root directory.

**Architecture:** Repository Re-organization & Link Resolution.

---

### Task 1: Move Translated Files & Update Links

**Files:**
- Create: `docs/translations/`
- Move: `README.vi.md`, `README.zh.md`, `README.ru.md` -> `docs/translations/`
- Move: `SECURITY.vi.md`, `SECURITY.zh.md`, `SECURITY.ru.md` -> `docs/translations/`
- Modify: `README.md`, `SECURITY.md`, and all moved docs

- [ ] **Step 1: Create `docs/translations/` and execute `git mv`**
- [ ] **Step 2: Update relative markdown links across all 16 documentation files**
- [ ] **Step 3: Commit file moves and link updates to git**

```bash
git add -A
git commit -m "docs: move translated READMEs and SECURITY policies to docs/translations/ for a lean root directory"
```

---

### Task 2: Update Test Suite & Verify Full Quality Gate

**Files:**
- Modify: `tests/test_documentation.py`

- [ ] **Step 1: Update `tests/test_documentation.py` to point to `docs/translations/`**
- [ ] **Step 2: Run `python run_test_gate.py`**
- [ ] **Step 3: Commit test suite updates and push to GitHub `origin/main`**

```bash
git add tests/
git commit -m "test: update documentation test paths for docs/translations/"
git push origin main
```
