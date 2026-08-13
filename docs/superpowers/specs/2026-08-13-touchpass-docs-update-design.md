# TouchPass Documentation Update Specification

## Overview
Update all project documentation (`README.md` and `docs/USER_GUIDE.md`) to reflect the rebranded **TouchPass** platform, including detailed self-serve onboarding guides, interactive keyboard shortcut recorder usage, live debug console monitoring, and the comprehensive AI Developer Tools Shortcut Library.

## Target Documents
- `docs/USER_GUIDE.md`: Comprehensive user guide with bilingual Vietnamese/English setup, step-by-step onboarding, shortcut recording instructions, and AI tool preset references.
- `README.md`: Project summary, architecture overview, Windows/macOS deployment steps, and feature list.

## Structure of Updated User Guide
1. **Introduction & Architecture**: TouchPass overview (USB HID Native + Fingerprint Sensor + Local Web Portal).
2. **Self-Serve Onboarding Flow**:
   - Web Portal Launch (`http://127.0.0.1:8787/`).
   - USB HID Virtual Keyboard Diagnostic Test.
   - ESP32-S3 Pinout & Sensor Wiring Diagram.
   - Enrollment Workflow.
3. **Interactive Shortcut Recorder**:
   - How to record live keystrokes with modifiers (Ctrl, Shift, Alt, Cmd/Meta).
4. **AI Developer Tools Shortcut Preset Library**:
   - Claude Code CLI (`Ctrl+C`, `Ctrl+L`, `/compact`).
   - Cursor IDE (`Cmd/Ctrl+K`, `Cmd/Ctrl+I`, `Cmd/Ctrl+L`, `Shift+Tab`).
   - Claude Desktop (`Cmd/Ctrl+K`, `Cmd/Ctrl+Shift+O`, `Cmd/Ctrl+Shift+C`).
   - Antigravity IDE (`Cmd/Ctrl+Shift+A`, `Cmd/Ctrl+Shift+L`, `Cmd/Ctrl+Shift+P`).
   - OpenCode & Codex CLI (`Ctrl+Enter`, `Alt+Enter`).
5. **Debug Log Console**:
   - Reading live color-coded event tags.
