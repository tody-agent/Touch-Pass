# Design: Launch the Native TouchPass Desktop App

## Context & Technical Approach

The current Windows launcher prefers `dist\\TouchPass.exe`, which was built from the legacy Python web portal runner. The repository now contains a Tauri desktop app with release and debug binaries. The launcher will select the Tauri release binary first, then the Tauri debug binary, and fail with actionable instructions instead of silently opening the legacy browser portal.

## Proposed Changes

### `start_touchpass.bat`

- Prefer `software\\desktop-app\\src-tauri\\target\\release\\touchpass-desktop.exe`.
- Fall back to the debug Tauri binary for local development.
- Keep the legacy Rust helper only as a compatibility fallback.
- Remove the automatic legacy Python web-portal fallback from the default path.

### `tests/test_launcher_selection.py`

- Assert the launcher contains the Tauri release/debug candidates in the correct priority order.
- Assert the default launcher path does not invoke `run_portal_win.py`.

## Verification

- Run the new launcher-selection tests.
- Run the existing Python test suite.
- Launch the Tauri release binary and verify its native window/process exists.
