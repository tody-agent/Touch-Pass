#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
OUTPUT_DIR="${PACKAGE_DIR}/dist"
APP_BUNDLE="${OUTPUT_DIR}/TouchPass.app"
DMG_PATH="${OUTPUT_DIR}/TouchPass-macos.dmg"

if [[ ! -d "${APP_BUNDLE}" ]]; then
    echo "⚠️ App bundle not found at ${APP_BUNDLE}. Building first..."
    "${SCRIPT_DIR}/build-app.sh"
fi

echo "📦 Creating disk image ${DMG_PATH}..."
rm -f "${DMG_PATH}"

DMG_TMP="${OUTPUT_DIR}/dmg_staging"
rm -rf "${DMG_TMP}"
mkdir -p "${DMG_TMP}"

cp -R "${APP_BUNDLE}" "${DMG_TMP}/"
ln -s /Applications "${DMG_TMP}/Applications"

hdiutil create -volname "TouchPass" -srcfolder "${DMG_TMP}" -ov -format UDZO "${DMG_PATH}"
rm -rf "${DMG_TMP}"

echo "✅ Disk image created at ${DMG_PATH}!"
