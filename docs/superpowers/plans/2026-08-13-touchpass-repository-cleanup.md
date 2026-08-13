# TouchPass Repository Security Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Untrack build cache files (`.cm/`), AI execution logs (`.superpowers/`), and temporary test scripts (`verify_apis.py`), while strengthening `.gitignore`.

**Architecture:** Repository hygiene and Git cleanup.

---

### Task 1: Update `.gitignore` and Untrack Unnecessary Files

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Update `.gitignore` with `.cm/`, `.superpowers/`, `verify_apis.py`**
- [ ] **Step 2: Untrack files via `git rm -r --cached .cm .superpowers verify_apis.py`**
- [ ] **Step 3: Commit changes to git**

```bash
git add .gitignore
git commit -m "chore(git): remove build cache .cm/ and .superpowers/ from git tracking and update .gitignore"
```

---

### Task 2: Verification & Push to GitHub

- [ ] **Step 1: Verify git status and run unit tests**
- [ ] **Step 2: Push clean main branch to GitHub remote**

```bash
git push origin main
```
