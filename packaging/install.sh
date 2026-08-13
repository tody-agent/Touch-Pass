#!/usr/bin/env bash
# TouchPass POSIX Installer & Daemon Bootstrap Script
set -e

echo "🖐️ TouchPass POSIX Setup & Launcher"
echo "------------------------------------"

# Detect Python
PYTHON_CMD=""
if command -v python3 &>/dev/null; then
    PYTHON_CMD="python3"
elif command -v python &>/dev/null; then
    PYTHON_CMD="python"
else
    echo "❌ Error: Python 3.11+ is required but not found on PATH."
    echo "Please install Python 3.11 or higher and try again."
    exit 1
fi

echo "✓ Found Python: $($PYTHON_CMD --version)"

# Create virtual environment if missing
VENV_DIR="software/.venv"
if [ ! -d "$VENV_DIR" ]; then
    echo "📦 Creating virtual environment in $VENV_DIR..."
    $PYTHON_CMD -m venv "$VENV_DIR"
fi

# Activate venv & install dependencies
echo "📥 Installing dependencies from software/requirements.txt..."
if [ -f "$VENV_DIR/bin/pip" ]; then
    "$VENV_DIR/bin/pip" install --upgrade pip > /dev/null 2>&1 || true
    if [ -f "software/requirements.txt" ]; then
        "$VENV_DIR/bin/pip" install -r software/requirements.txt
    elif [ -f "requirements.txt" ]; then
        "$VENV_DIR/bin/pip" install -r requirements.txt
    else
        "$VENV_DIR/bin/pip" install "pyserial>=3.5"
    fi
else
    echo "⚠️ Warning: venv pip not found, using system python..."
    $PYTHON_CMD -m pip install "pyserial>=3.5"
fi

# Launch portal server
echo "🚀 Starting TouchPass Portal Service at http://127.0.0.1:8787/..."
if [ -f "run_portal_win.py" ]; then
    "$VENV_DIR/bin/python" run_portal_win.py
elif [ -f "software/app.py" ]; then
    "$VENV_DIR/bin/python" software/app.py
else
    echo "❌ Error: Could not locate TouchPass launcher entrypoint."
    exit 1
fi
