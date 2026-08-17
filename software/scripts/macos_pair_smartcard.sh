#!/usr/bin/env bash
set -euo pipefail

# TouchPass macOS Smart Card Pairing Automation Script

USER_NAME="${1:-$(whoami)}"

echo "==> Searching for TouchPass PIV Smart Card identities on macOS..."
IDENTITIES_RAW=$(sc_auth identities 2>/dev/null || true)

if [[ -z "$IDENTITIES_RAW" ]]; then
    echo "ERROR: No smart card identities found. Please connect your TouchPass device." >&2
    exit 1
fi

echo "Identities found:"
echo "$IDENTITIES_RAW"

# Extract first 40-character hex hash
HASH=$(echo "$IDENTITIES_RAW" | grep -Eo '[0-9a-fA-F]{40}' | head -n 1 || true)

if [[ -z "$HASH" ]]; then
    echo "ERROR: Could not extract a valid 40-character hash from sc_auth output." >&2
    exit 2
fi

echo "==> Pairing identity ${HASH} with user ${USER_NAME}..."
echo "NOTE: Touch your enrolled finger on the TouchPass sensor when prompted!"

sudo sc_auth pair -u "${USER_NAME}" -h "${HASH}"

echo "==> Verification:"
sc_auth list "${USER_NAME}"
echo "==> Successfully paired TouchPass PIV Smart Card for ${USER_NAME}!"
