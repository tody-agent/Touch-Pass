# Web Flasher Thumbnail & Meta Tags Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a hardware showcase thumbnail card to the Hero section of `web/flasher/index.html` and add complete favicon and social preview meta tags to `<head>`.

**Architecture:** Update HTML tags in `web/flasher/index.html` and CSS rules in `web/flasher/styles.css`, then verify using Python test suite and browser validation.

**Tech Stack:** HTML5, Vanilla CSS, Python (pytest).

## Global Constraints

- Use valid image references (`og.png` / `https://tody-agent.github.io/Touch-Pass/web/flasher/og.png`).
- Preserve existing i18n attributes (`data-i18n`) and layout responsiveness.
- All tests in `run_test_gate.py` must pass.

---

### Task 1: HTML Metadata & Hero Section Thumbnail

**Files:**
- Modify: `web/flasher/index.html`

**Interfaces:**
- Consumes: `web/flasher/og.png`
- Produces: HTML structure with favicon, OpenGraph image, Twitter card, and `.hero-thumb-card` element.

- [ ] **Step 1: Inspect `<head>` and Hero section in `web/flasher/index.html`**

Read lines 1-45 of `web/flasher/index.html`.

- [ ] **Step 2: Add Favicon and Twitter/OpenGraph metadata to `<head>`**

Add SVG favicon and social media tags to `<head>`:
```html
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⚡</text></svg>">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://tody-agent.github.io/Touch-Pass/web/flasher/">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="TouchPass — Web Flasher & Setup Portal">
  <meta name="twitter:description" content="Give every finger a superpower. 1-Click Hardware Web Flasher & Setup Portal for AI Developers & Non-Tech Users.">
  <meta name="twitter:image" content="https://tody-agent.github.io/Touch-Pass/web/flasher/og.png">
```

- [ ] **Step 3: Add `.hero-thumb-card` container to `<section class="hero">`**

Below `<p class="hero-subtitle"...>`, insert:
```html
      <div class="hero-thumb-card">
        <img src="og.png" alt="TouchPass Hardware Web Flasher Preview" class="hero-thumb-img" loading="eager">
      </div>
```

---

### Task 2: CSS Styling & Micro-Interactions

**Files:**
- Modify: `web/flasher/styles.css`

**Interfaces:**
- Consumes: `.hero-thumb-card`, `.hero-thumb-img` class definitions
- Produces: Responsive styling and hover effects in `styles.css`.

- [ ] **Step 1: Add CSS rules for `.hero-thumb-card` and `.hero-thumb-img`**

Append to `web/flasher/styles.css`:
```css
/* Hero Thumbnail Showcase Card */
.hero-thumb-card {
  margin: 24px auto 0;
  max-width: 780px;
  width: 100%;
  border-radius: var(--radius);
  border: 1px solid var(--card-border);
  background: var(--card);
  overflow: hidden;
  box-shadow: var(--shadow), 0 0 24px var(--accent-light);
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.hero-thumb-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 40px -10px rgba(0, 0, 0, 0.7), 0 0 32px rgba(34, 197, 94, 0.25);
}

.hero-thumb-img {
  width: 100%;
  height: auto;
  display: block;
  object-fit: cover;
}
```

---

### Task 3: Test Gate Verification & Commit

**Files:**
- Run: `python run_test_gate.py`

- [ ] **Step 1: Execute Python test gate suite**

Run `python run_test_gate.py` to ensure all tests pass cleanly.

- [ ] **Step 2: Verify git status and commit changes**

Check `git status` and commit modified files.
