# TouchPass Expanded & Bilingual Security Policy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand and split TouchPass security policy and legal disclaimers into two detailed, standalone documents (`SECURITY.md` in English and `SECURITY.vi.md` in Vietnamese) and update all documentation cross-links and unit tests.

**Architecture:** Create `SECURITY.vi.md` and update `SECURITY.md` with multi-section threat models, architecture defense layers, vulnerability disclosure SLAs, and legal disclaimers. Update cross-file markdown links in `README.md`, `README.vi.md`, and `docs/USER_GUIDE.md`. Update `tests/test_documentation.py` to test both files.

**Tech Stack:** Markdown, Python (unittest / pytest).

## Global Constraints

- **File Paths:** `SECURITY.md`, `SECURITY.vi.md`, `README.md`, `README.vi.md`, `docs/USER_GUIDE.md`, `tests/test_documentation.py`.
- **Language Switchers:**
  - `SECURITY.md`: `🌐 **English** | [🇻🇳 **Tiếng Việt**](SECURITY.vi.md)`
  - `SECURITY.vi.md`: `[🌐 **English**](SECURITY.md) | 🇻🇳 **Tiếng Việt**`

---

### Task 1: Create Detailed `SECURITY.md` (English) and `SECURITY.vi.md` (Vietnamese)

**Files:**
- Create: `SECURITY.vi.md`
- Modify: `SECURITY.md`

**Interfaces:**
- Consumes: Existing TouchPass architecture notes and legal disclaimer terms.
- Produces: Standalone `SECURITY.md` and `SECURITY.vi.md` files.

- [ ] **Step 1: Write expanded `SECURITY.md` (English)**

Write full multi-section security documentation covering architecture defense-in-depth, threat model matrix, supported versions, responsible disclosure SLA, security best practices, and standard MIT legal disclaimers.

- [ ] **Step 2: Write expanded `SECURITY.vi.md` (Vietnamese)**

Write corresponding full multi-section security documentation translated into clear, professional Vietnamese.

- [ ] **Step 3: Commit Task 1**

```bash
git add SECURITY.md SECURITY.vi.md
git commit -m "docs: expand security policy into detailed English and Vietnamese versions"
```

---

### Task 2: Update Cross-File Documentation Links

**Files:**
- Modify: `README.md`
- Modify: `README.vi.md`
- Modify: `docs/USER_GUIDE.md`

**Interfaces:**
- Consumes: File paths `SECURITY.md` and `SECURITY.vi.md`.
- Produces: Correct cross-language markdown links.

- [ ] **Step 1: Update security links in `README.md` and `README.vi.md`**

Ensure `README.md` points to `SECURITY.md` and `README.vi.md` points to `SECURITY.vi.md`.

- [ ] **Step 2: Update security links in `docs/USER_GUIDE.md`**

Ensure English section links to `../SECURITY.md` and Vietnamese section links to `../SECURITY.vi.md`.

- [ ] **Step 3: Commit Task 2**

```bash
git add README.md README.vi.md docs/USER_GUIDE.md
git commit -m "docs: update SECURITY link targets across English and Vietnamese docs"
```

---

### Task 3: Update and Verify Documentation Tests

**Files:**
- Modify: `tests/test_documentation.py`

**Interfaces:**
- Consumes: Test runner `python run_test_gate.py` / `pytest`.
- Produces: 100% passing quality gate verifying both security documents.

- [ ] **Step 1: Update `tests/test_documentation.py` to check `SECURITY.md` and `SECURITY.vi.md`**

Update `DocumentationTests` to define `SECURITY_VI`, test markdown link resolution for both security files, test required content in both English and Vietnamese files, and check disclaimer links in `README.md`, `README.vi.md`, and `docs/USER_GUIDE.md`.

- [ ] **Step 2: Run automated test gate**

Run: `python run_test_gate.py`
Expected: All 4 stages pass cleanly with 0 errors.

- [ ] **Step 3: Commit Task 3**

```bash
git add tests/test_documentation.py
git commit -m "test: add test coverage for SECURITY.vi.md and updated links"
```
