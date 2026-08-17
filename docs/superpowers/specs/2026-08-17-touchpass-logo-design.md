# TouchPass Logo & App Icon Design Specification

- **Date:** 2026-08-17
- **Topic:** TouchPass macOS/iOS Style Logo & App Icon
- **Status:** Approved by User

---

## 1. Overview & Concept

TouchPass is a hardware-integrated biometric developer utility that turns physical touch into keyboard actions and credential unlocks.
The objective of this design is to establish a premium, minimalist, and timeless App Icon and Logo fitting the modern Apple macOS (Sequoia/Sonoma) and iOS visual aesthetic.

### Core Visual Metaphor: "The Luminous Titan Key"
- **Symbol:** A single, monolithic unlocked key poised at a dynamic 45-degree angle.
- **Meaning:** Represents instantaneous unlocking, biometric access authorization, and security elevation with zero unnecessary clutter (no literal fingerprints, chips, or extraneous badges).

---

## 2. Visual Architecture & Geometry

### 2.1. Canvas & Squircle Frame
- **Geometry:** Apple Squircle (Superellipse $r \approx 22.5\%$).
- **Safe Zone Margin:** 15% inner padding to ensure no visual cutoff across macOS Dock, iOS Springboard, and window switchers.
- **Lighting Rim:** 1px micro-specular rim light along the top arc (`rgba(255, 255, 255, 0.18)`), creating tactile glass/metal dimensionality.

### 2.2. The Key Geometry
- **Angle:** $45^\circ$ diagonal tilt (bottom-left to top-right).
- **Bow / Handle:** Continuous minimalist rounded loop with precise inner counter-space.
- **Shaft & Bit:** Monolithic brushed titanium silhouette with clean, geometric unlocking notch/teeth.

---

## 3. Color Palette & Material Finish

| Element | Color / Gradient Code | Description |
| :--- | :--- | :--- |
| **Canvas Background** | `#0D0F12` $\rightarrow$ `#16191E` ($135^\circ$) | Deep Obsidian / Dark Space Slate with subtle matte micro-texture |
| **Key Material** | `#A0A5AE` $\rightarrow$ `#E2E6ED` ($45^\circ$) | Space Gray Brushed Titanium with natural soft specular highlights |
| **Luminous Accent** | `#00F2FE` (Cyan) / `#FFE259` (Gold) | Subtle micro-glow radiating from the unlocking notch/bit |
| **Shadow / Depth** | `#000000` (Opacity: 45%, Blur: 24px) | Soft ambient occlusion ground shadow behind the key |

---

## 4. Deliverables & Integration Plan

### 4.1. Master Assets
- `assets/logo/touchpass-icon-1024.png`: High-resolution Master $1024 \times 1024$ Retina image.
- `assets/logo/touchpass-icon-vector.svg`: Clean vector glyph for dark & light UI contexts.
- `assets/logo/touchpass-tray.png` ($32 \times 32$, $16 \times 16$): High-contrast monochrome tray / status-bar icon.

### 4.2. Tauri Desktop App Integration
Update desktop bundle icons in `software/desktop-app/src-tauri/icons/`:
- `icon.icns` (macOS multi-resolution icon bundle: 16x16 to 1024x1024).
- `icon.ico` (Windows multi-resolution icon bundle: 16x16 to 256x256).
- `icon.png` ($512 \times 512$), `32x32.png`, `128x128.png` (Linux & Cross-platform fallback).

### 4.3. Web & Documentation Integration
- `web/flasher/favicon.ico` & `web/flasher/favicon.png`: Web Serial flasher browser tab icon.
- `README.md`: Update header logo / visual banner to match the new Apple-grade identity.

---

## 5. Verification & Acceptance Criteria
- [x] Visual consistency with Apple HIG standards (Squircle curvature, subdued materials, precision lighting).
- [x] Crisp legibility at small sizes (16px / 32px) and stunning fidelity on 4K/Retina displays (512px / 1024px).
- [x] Compatible bundle build with Tauri v2 pipeline without icon format errors.
