# TouchPass Repository Layout Optimization Specification

## Goal
Make the repository root lean, clean, and logical by moving non-English READMEs (`README.vi.md`, `README.zh.md`, `README.ru.md`) and non-English SECURITY policies (`SECURITY.vi.md`, `SECURITY.zh.md`, `SECURITY.ru.md`) into `docs/translations/`.

## Clean Root Structure
Root files:
- `README.md`
- `SECURITY.md`
- `LICENSE`
- `touchpass`
- `run_portal_win.py`
- `start_touchpass.bat`
- `run_test_gate.py`

Documentation hierarchy in `docs/`:
- `docs/translations/`: `README.vi.md`, `README.zh.md`, `README.ru.md`, `SECURITY.vi.md`, `SECURITY.zh.md`, `SECURITY.ru.md`
- `docs/build/`: `BUILD_GUIDE.md`, `BUILD_GUIDE.vi.md`, `BUILD_GUIDE.zh.md`, `BUILD_GUIDE.ru.md`
- `docs/user/`: `USER_GUIDE.md`, `USER_GUIDE.vi.md`, `USER_GUIDE.zh.md`, `USER_GUIDE.ru.md`
- `docs/agent/`: `AI_AGENT_PROMPT.md`, `AI_AGENT_PROMPT.vi.md`, `AI_AGENT_PROMPT.zh.md`, `AI_AGENT_PROMPT.ru.md`
