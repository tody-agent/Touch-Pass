# TouchPass Hero Thumbnail Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update hero thumbnail image in all 4 README files (EN, VI, ZH, RU) to `03-login-success.png`.

**Architecture:** Documentation Assets & Image Link Synchronization.

---

### Task 1: Update Hero Image Links in README Files

**Files:**
- Modify: `README.md`, `docs/translations/README.vi.md`, `docs/translations/README.zh.md`, `docs/translations/README.ru.md`

- [ ] **Step 1: Replace hero image paths with `03-login-success.png`**
- [ ] **Step 2: Run `python run_test_gate.py` to verify unit test pass**
- [ ] **Step 3: Commit changes & push to GitHub `origin/main`**

```bash
git add README.md docs/translations/README*.md
git commit -m "docs: update main hero thumbnail image to 03-login-success.png across all READMEs"
git push origin main
```
