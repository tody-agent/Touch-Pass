# TouchPass Release & GitHub PR Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng hệ thống tự động hóa đóng gói phát hành đa nền tảng (Windows, macOS, Ubuntu) qua GitHub Actions Release cho TouchPass Rust/Tauri Desktop App v0.1.0 và tạo GitHub Pull Request hoàn chỉnh.

**Architecture:** Sử dụng GitHub Actions Matrix để build native bundles trên 3 nền tảng (`windows-latest`, `macos-latest`, `ubuntu-24.04`), đóng gói NSIS installer / MSI / Portable Zip (Windows), DMG / App (macOS), DEB / AppImage (Ubuntu Linux), đính kèm tự động vào GitHub Release với mã băm SHA256 `checksums.txt`. Quản lý mã nguồn trên nhánh `feat/desktop-app-rust-release-v0.1.0` và mở PR chính thức vào `main`.

**Tech Stack:** Rust (Tauri v2), Svelte 5, TypeScript, GitHub Actions, GitHub CLI (`gh`), Pytest, Vitest.

## Global Constraints
- Target version: `0.1.0`
- Release Trigger: Push Git Tag `v*` (ví dụ `v0.1.0`) và `workflow_dispatch`
- Multi-Platform Matrix: `windows-latest`, `macos-latest`, `ubuntu-24.04`
- Git remote: `origin` (`tody-agent/Touch-Pass`)

---

### Task 1: Clean Git Hygiene & Ignore Rules

**Files:**
- Modify: `.gitignore`

**Interfaces:**
- Produces: Clean git status excluding `node_modules`, `target`, and build caches.

- [ ] **Step 1: Update `.gitignore` with Desktop App directories**
Add ignores for `software/desktop-app/node_modules/`, `software/desktop-app/dist/`, `software/desktop-app/src-tauri/target/`, `software/desktop-app/src-tauri/gen/`.

- [ ] **Step 2: Verify git status is clean of node_modules and target artifacts**
Run: `git status --short`
Expected: No `node_modules` or `.exe`/`.pdb` files in untracked list.

---

### Task 2: Multi-Platform GitHub Actions Release & CI Workflows

**Files:**
- Create: `.github/workflows/release.yml`
- Modify: `.github/workflows/desktop-app.yml`

**Interfaces:**
- Produces: Automated release builds on tag/dispatch and CI tests on PRs.

- [ ] **Step 1: Create `.github/workflows/release.yml`**
Configure multi-platform matrix (`windows-latest`, `macos-latest`, `ubuntu-24.04`), install dependencies (Node 24, Rust toolchain, Linux gtk/webkit/appindicator libraries), run tests, run `npm run tauri:build`, aggregate artifacts into GitHub Release with `softprops/action-gh-release@v2` and `checksums.txt`.

- [ ] **Step 2: Update `.github/workflows/desktop-app.yml` for CI validation**
Ensure standard CI matrix runs on PR and main push to validate code quality across Windows, macOS, and Linux.

---

### Task 3: Local Verification & Documentation

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Run comprehensive tests locally**
Run `npm test` in `software/desktop-app`, `cargo test` in `software/desktop-app/src-tauri`, and `pytest` in repository root.
Expected: All tests pass.

- [ ] **Step 2: Update `README.md` with multi-platform installation guide**
Add section detailing download & installation instructions for Windows (.exe/.msi), macOS (.dmg), and Ubuntu Linux (.deb/.AppImage).

---

### Task 4: Git Branch, Commit, Push & GitHub Pull Request

**Files:**
- Repository branches & GitHub PR

- [ ] **Step 1: Create feature branch**
Run: `git checkout -b feat/desktop-app-rust-release-v0.1.0`

- [ ] **Step 2: Stage and commit all release files**
Run: `git add .`
Run: `git commit -m "feat(release): add multi-platform release workflows and Rust Tauri desktop app v0.1.0"`

- [ ] **Step 3: Push branch to GitHub**
Run: `git push -u origin feat/desktop-app-rust-release-v0.1.0`

- [ ] **Step 4: Create GitHub Pull Request**
Run: `gh pr create --title "feat: TouchPass v0.1.0 Multi-Platform Desktop App & Release Workflows" --body "..."`
Expected: PR is created and URL returned.
