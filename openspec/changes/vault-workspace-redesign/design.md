# Design: Vault Workspace Redesign

## Context & Technical Approach

Recreate the selected Vault Workspace visual in the existing Svelte 5 + Tauri desktop app. Keep the Rust IPC, profile schema v2, firmware, serial protocol, and dark multilingual product behavior unchanged. The main and Settings surfaces share a fixed three-pane desktop shell with pane-local overflow.

## Global Constraints

- Selected visual truth: `software/desktop-app/design/references/vault-workspace.png`.
- Default window `1180x760`; minimum `960x640`; native decorations remain enabled.
- Grid: `clamp(200px, 19vw, 230px) minmax(460px, 1fr) clamp(260px, 25vw, 320px)`.
- One primary CTA: a new finger uses Save and Enroll; an enrolled finger uses Save Changes. Enrollment starts only after save succeeds.
- Settings is a full-window workspace, not a modal or separate native window.
- Dirty action drafts must be confirmed before changing fingers or entering Settings.
- All UI copy is typed i18n with key parity for `vi`, `en`, and `zh-CN`.
- Body never scrolls; toolbar is fixed and each pane owns its overflow.
- No backend, firmware, serial protocol, or profile schema changes.

## Proposed Changes

### Main Workspace

Replace the stacked HandMap and ActionPane layout with a shared three-pane shell: finger navigator, action editor, and device/fingerprint inspector. Move enrollment progress inline into the inspector and keep destructive actions inside a separated More menu with confirmation.

### Settings Workspace

Replace the Settings modal with a full-window workspace using categories on the left, the selected settings form in the center, and persistent device/privacy status on the right. Escape/back returns to the finger workspace and restores focus.

### Responsive and States

Add pane-local loading, error, disconnected, bootloader, sensor-error, empty, scanning, and success states. Preserve accessibility, keyboard navigation, 44px key targets, reduced motion, and 140% translated-string expansion.

## Verification

Use component tests for navigation, dirty guard, save/enroll ordering, inline progress, and Settings behavior. Run Svelte checks, Vitest, production build, Rust fmt/clippy/tests, visual comparison against the selected mock, Tauri packaging, and Windows native smoke testing.
