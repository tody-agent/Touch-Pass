# TouchPass Windows Standalone Executable & GitHub Release Assets Specification

## Overview
Build a self-contained, standalone Windows binary (`TouchPass.exe`) using PyInstaller so users can download and run TouchPass without needing Python installed, and upload the built binary assets directly to GitHub Release `v2.0.0`.

## Features
1. **Standalone Windows Executable (`TouchPass.exe`)**:
   - Bundles Python runtime, dependencies (`pyserial`, `cryptography`), and local web portal frontend static files (`software/macos-helper/portal`).
   - Launches `http://127.0.0.1:8787/` automatically upon execution.
2. **Release Asset Packaging**:
   - Output `TouchPass.exe` and `TouchPass-v2.0.0-Windows-x64.zip`.
   - Upload assets to GitHub Release `v2.0.0` via `gh release upload`.
3. **Documentation Download Links**:
   - Add direct download links to `README.md`, `README.vi.md`, and `docs/USER_GUIDE.md`.
