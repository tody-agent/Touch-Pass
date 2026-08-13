# Design Specification: Web Flasher Thumbnail & Meta Tags

**Date:** 2026-08-13  
**Status:** Approved  
**Target Page:** `https://tody-agent.github.io/Touch-Pass/web/flasher/`

---

## 1. Objective

Enhance the TouchPass Web Flasher page (`web/flasher/index.html`) by integrating a prominent hardware showcase thumbnail card directly within the Hero section, and adding complete web metadata tags (`<link rel="icon">`, OpenGraph, Twitter Cards) in `<head>` for rich link previews and favicon support.

---

## 2. Component Changes

### 2.1 HTML Metadata (`web/flasher/index.html`)
Add the following meta tags to the `<head>` section:
- **Favicon**: Inline SVG favicon featuring the `⚡` branding icon.
- **OpenGraph Image**: Absolute URL `https://tody-agent.github.io/Touch-Pass/web/flasher/og.png` alongside relative fallback `og.png`.
- **Twitter Card**: `summary_large_image` format with `twitter:title`, `twitter:description`, and `twitter:image`.

### 2.2 Hero Section Showcase Card (`web/flasher/index.html`)
Inside the `<section class="hero">`, immediately below `.hero-subtitle`:
```html
<div class="hero-thumb-card">
  <img src="og.png" alt="TouchPass Hardware Web Flasher Preview" class="hero-thumb-img" loading="eager">
</div>
```

### 2.3 CSS Design System & Micro-Interactions (`web/flasher/styles.css`)
Style `.hero-thumb-card` to match TouchPass dark green aesthetic (`#121815` / `#1c2621`):
- `max-width: 780px`, `width: 100%`, `margin: 24px auto 0`.
- `border-radius: var(--radius)` (12px), `border: 1px solid var(--card-border)`.
- Glow shadow: `box-shadow: var(--shadow), 0 0 24px var(--accent-light)`.
- Interactive hover effect: subtle elevation transform `-3px` and enhanced green accent aura (`rgba(34, 197, 94, 0.25)`).

---

## 3. Verification Criteria

1. **Visual Appearance**: Thumbnail image renders cleanly below the hero subtitle without causing layout shifts or horizontal scrollbars.
2. **Responsive Design**: Image scales down fluidly on narrow screens / mobile viewports.
3. **Link Sharing Preview**: OpenGraph and Twitter card meta tags correctly point to valid image assets.
4. **Browser Tab Icon**: Favicon displays `⚡` logo icon on browser tabs.
