# TouchPass Shortcut Recorder & AI Tools Preset Library Specification

## Overview
Add an interactive Keyboard Shortcut Recorder to instantly capture user keystrokes into TouchPass action steps, and integrate a comprehensive AI Developer Tools Shortcut Library (Claude Code, Cursor, Claude Desktop, Antigravity, OpenCode, Codex).

## Features

1. **Interactive Shortcut Recorder**:
   - Live `keydown` listener in profile setup modal.
   - Automatically maps modifier keys (Ctrl=0x01, Shift=0x02, Alt=0x04, GUI=0x08) and KeyCodes (Enter, Esc, Tab, Space, Arrows, A-Z, 0-9).
   - Generates exact TouchPass macro step sequence automatically.

2. **AI Tools Shortcut Presets**:
   - **Claude Code CLI**: `Ctrl+C` (Cancel), `Ctrl+L` (Clear terminal), `/compact` (Context compression).
   - **Cursor IDE**: `Ctrl+K` / `Cmd+K` (Inline Edit), `Ctrl+I` / `Cmd+I` (Composer Agent), `Ctrl+L` / `Cmd+L` (Chat Drawer), `Shift+Tab` (Accept Completion).
   - **Claude Desktop**: `Ctrl+K` (Quick Prompt), `Ctrl+Shift+O` (New Chat), `Ctrl+Shift+C` (Copy AI Answer).
   - **Antigravity IDE**: `Ctrl+Shift+A` (Agent Command Bar), `Ctrl+Shift+L` (Agent Terminal Log Focus).
   - **OpenCode & Codex CLI**: `Ctrl+Enter` (Run Prompt with Context), `Alt+Enter` (Multi-line prompt).

## File Changes
- `software/macos-helper/portal/index.html`: Add shortcut recorder UI block in profile dialog & add AI tool preset section in Guide tab.
- `software/macos-helper/portal/styles.css`: Add styles for `.shortcut-recorder-box`, `.recorder-active`, `.ai-tool-grid`, and `.preset-tag`.
- `software/macos-helper/portal/app.js`: Implement `initShortcutRecorder()` keydown capturing & `initAIToolPresets()` auto-populator.
