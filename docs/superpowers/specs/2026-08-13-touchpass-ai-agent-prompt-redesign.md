# TouchPass Comprehensive AI Agent 1-Prompt Onboarding Specification

## Overview
Re-architect `docs/AI_AGENT_PROMPT.md` and `docs/AI_AGENT_PROMPT.vi.md` to provide fully autonomous, step-by-step 1-prompt instructions designed for non-technical users. The AI agent acts as a full-service technical assistant to fetch, install, flash firmware via Web Serial, launch local portal services, and verify TouchPass hardware completely hands-free.

## Core Features
1. **Fully Autonomous Setup Execution**:
   - Auto-detect OS & CLI tools (`git`, `python`, `curl`).
   - Fallback to downloading release assets (`TouchPass.exe` / `install.sh`) if environment lacks dev tools.
   - Autonomous background daemon launch at `http://127.0.0.1:8787/`.
2. **Beginner-Friendly Hardware & Web Flasher Guidance**:
   - Zero-Arduino-experience hardware check (cable type, USB data detection).
   - Direct Web Serial Flasher link (`https://tody-agent.github.io/Touch-Pass/web/flasher/`).
   - Clear BOOT/RESET physical button entry guide.
3. **Step-by-Step Verification Protocol**:
   - Automated API ping test to `http://127.0.0.1:8787/api/status`.
   - Fingerprint registration prompt.
