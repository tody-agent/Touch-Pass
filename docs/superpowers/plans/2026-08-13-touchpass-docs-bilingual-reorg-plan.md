# TouchPass Bilingual Documentation & Structure Reorganization Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tổ chức lại toàn bộ hệ thống tài liệu TouchPass theo kiến trúc song ngữ đồng nhất, mạch lạc: tiếng Anh là mặc định (`.md`), kèm bản tiếng Việt tương ứng (`.vi.md` hoặc `*.vi.md`), đồng thời tạo liên kết chuyển đổi ngôn ngữ linh hoạt.

**Doc Architecture:**
- Root: `README.md` (English default) & `README.vi.md` (Vietnamese)
- `docs/BUILD_GUIDE.md` (English default) & `docs/BUILD_GUIDE.vi.md` (Vietnamese)
- `docs/USER_GUIDE.md` (English default) & `docs/USER_GUIDE.vi.md` (Vietnamese)
- `docs/esp32-s3-zw101-portal-vi.md` (Redirect pointer to `BUILD_GUIDE.vi.md`)

## Global Constraints
- Tiếng Anh làm ngôn ngữ mặc định cho các file `.md` chính.
- Tất cả các link nội bộ và kiểm thử `tests/test_documentation.py` và `run_test_gate.py` phải pass 100%.

---

### Task 1: Create `README.vi.md` and update `README.md` with Language Navigation

**Files:**
- Create: `README.vi.md`
- Modify: `README.md`

- [ ] **Step 1: Create `README.vi.md`**
  Write complete Vietnamese version of README.md.

- [ ] **Step 2: Add language navigation banner to `README.md`**
  Add `🌐 English | [🇻🇳 Tiếng Việt](README.vi.md)` to top of `README.md`.

- [ ] **Step 3: Commit changes**

```bash
git add README.md README.vi.md
git commit -m "docs: add bilingual Vietnamese README.vi.md and update README.md"
```

---

### Task 2: Create `docs/BUILD_GUIDE.vi.md` and update `docs/BUILD_GUIDE.md`

**Files:**
- Create: `docs/BUILD_GUIDE.vi.md`
- Modify: `docs/BUILD_GUIDE.md`
- Modify: `docs/esp32-s3-zw101-portal-vi.md`

- [ ] **Step 1: Create `docs/BUILD_GUIDE.vi.md`**
  Combine and refine full Vietnamese hardware build guide (wiring, parts, compilation, 1-click launcher, flashing).

- [ ] **Step 2: Update `docs/esp32-s3-zw101-portal-vi.md` as redirect guide**
  Point `esp32-s3-zw101-portal-vi.md` to `BUILD_GUIDE.vi.md` and `USER_GUIDE.vi.md`.

- [ ] **Step 3: Add language navigation banner to `docs/BUILD_GUIDE.md`**

- [ ] **Step 4: Commit changes**

```bash
git add docs/BUILD_GUIDE.md docs/BUILD_GUIDE.vi.md docs/esp32-s3-zw101-portal-vi.md
git commit -m "docs: add bilingual Vietnamese BUILD_GUIDE.vi.md and update BUILD_GUIDE.md"
```

---

### Task 3: Create `docs/USER_GUIDE.vi.md` and update `docs/USER_GUIDE.md`

**Files:**
- Create: `docs/USER_GUIDE.vi.md`
- Modify: `docs/USER_GUIDE.md`

- [ ] **Step 1: Create `docs/USER_GUIDE.vi.md`**
  Write full Vietnamese version of User Guide (portal usage, enrollment, AI presets, shortcut recorder, security).

- [ ] **Step 2: Add language navigation banner to `docs/USER_GUIDE.md`**

- [ ] **Step 3: Commit changes**

```bash
git add docs/USER_GUIDE.md docs/USER_GUIDE.vi.md
git commit -m "docs: add bilingual Vietnamese USER_GUIDE.vi.md and update USER_GUIDE.md"
```

---

### Task 4: Automated Verification with Test Gate

- [ ] **Step 1: Run complete test gate**

```bash
python run_test_gate.py
```

- [ ] **Step 2: Commit final documentation reorganization**

```bash
git add .
git commit -m "docs: complete verification for bilingual documentation reorganization"
```
