# Implementation Checklist: Vault Workspace Redesign

## Global Constraints

Use the exact constraints in `design.md`. Work only in `software/desktop-app`, this OpenSpec change, and this plan's git-ignored SDD workspace. Preserve unrelated dirty files. Do not commit because the shared feature checkout already contains uncommitted user work; report touched files and test evidence instead.

## Task 1: Behavior-first state and component tests

- Add failing tests for dirty-draft navigation guarding, workspace mode transitions, selected-finger synchronization across panes, and inline enrollment state.
- Add the smallest pure frontend state helpers required to make those tests pass.
- Verify the focused tests fail for the missing behavior before implementation, then pass without regressing the existing suite.

## Task 2: Main Vault Workspace

- Build the shared three-pane shell, accessible finger navigator, compact action editor, and device/fingerprint inspector from the selected visual.
- Replace stacked HandMap/ActionPane rendering and replace TouchIDModal enrollment presentation with inline inspector progress.
- Enforce one primary CTA and preserve the save-before-enroll contract and destructive confirmations.
- Add or update component tests before production changes and run focused tests plus Svelte check.

## Task 3: Full-window Settings Workspace

- Replace the Settings sheet with a full-window workspace using General, Device, Security, and Developer categories.
- Preserve instant locale/autostart behavior, device refresh, Escape/back navigation, focus restoration, selected finger, and dirty-draft confirmation.
- Add failing component tests first, then implement and run focused tests plus Svelte check.

## Task 4: Responsive, i18n, and native sizing polish

- Complete typed i18n keys across `vi`, `en`, and `zh-CN`; remove obsolete copy and validate 140% expansion.
- Apply the approved window sizes and pane-local responsive behavior at `960x640`, `1180x760`, and `1440x1024`.
- Finish loading/error/empty/disconnected states, accessibility, reduced motion, and visual tokens.
- Run the full frontend gate and Rust regression suite.

## Task 5: Design QA and release verification

- Capture the implementation and compare it with the selected visual at the same viewport in one combined visual review input.
- Write `software/desktop-app/design-qa.md`; fix all P0/P1/P2 issues until `final result: passed`.
- Run independent whole-change code review, full frontend/Rust gates, Tauri NSIS packaging, and Windows native smoke testing.
