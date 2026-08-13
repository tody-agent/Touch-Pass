# TouchPass Repository Security Cleanup & Hygiene Specification

## Overview
Clean up repository index by untracking build artifacts (`.cm/`), AI execution logs (`.superpowers/`), and temporary test scripts (`verify_apis.py`), while enhancing `.gitignore` to prevent any potential API keys, secret header leaks, or unnecessary internal files from being published to GitHub.

## Cleanup Actions

1. **Untrack Build & Cache Artifacts from Git**:
   - `.cm/` (Compiler cache directory containing binary objects `.o`, `.d`, `.bin`).
   - `.superpowers/` (Internal agent trajectory logs).
   - `verify_apis.py` (Temporary local API test script).

2. **Update `.gitignore`**:
   - Add `.cm/`, `.superpowers/`, `*.log`, `*.bin`, `*.elf`, `verify_apis.py`, `secrets.h`.

3. **Verify Public Code Safety**:
   - Confirm only `secrets.example.h` exists in git tracking.
   - Run verification test suite to ensure application code remains 100% functional.
