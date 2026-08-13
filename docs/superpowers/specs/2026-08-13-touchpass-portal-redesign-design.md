# TouchPass Web Portal Redesign - Design Specification

## Overview
Rebrand the web interface to **TouchPass**, providing a self-serve onboarding wizard, interactive debugging & log monitor, streamlined slot configuration for 10 fingerprint profiles, and built-in usage guides with real-world examples.

## Key Features

1. **Rebranding**: Change all UI branding from `tinyTouch` to `TouchPass`.
2. **Navigation**: Single Page Application (SPA) with 4 main tabs:
   - 🚀 **Onboarding (Step-by-step)**
   - ⚙️ **Slots Configuration (Slot 1-10)**
   - 🛠️ **Debug & Live Logs**
   - 📚 **User Guide & Examples**
3. **Debug & Live Logs**:
   - Live stream of serial logs (`TOUCH`, `MATCH`, `PW`, `ERR`, `ADMIN`).
   - Hardware telemetry dashboard (COM Port, HID status, Sensor state, Enrolled count).
   - Test utility buttons (`PING`, `TYPE_TEST`).
4. **Self-Serve Onboarding**:
   - Guided 4-step wizard with visual wiring diagrams and testing checkpoints.
5. **Interactive Documentation**:
   - Integrated use-case guide for terminal sudo, git commands, custom macros, and credential autofill.

## File Changes
- `software/macos-helper/portal/index.html`: Restructure into 4-tab SPA with onboarding, debug monitor, slot grid, and user guide.
- `software/macos-helper/portal/styles.css`: Modernized dark theme, log console styling, tab navigation, and wizard layout.
- `software/macos-helper/portal/app.js`: Implement tab switching, live log streaming API integration, test actions, and onboarding wizard state.
- `run_portal_win.py` & `software/macos-helper/tinytouch_portal.py`: Add `/api/logs` endpoint or live log buffer.
