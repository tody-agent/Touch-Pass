#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
REPO_ROOT="$(cd "${PACKAGE_DIR}/../.." && pwd)"

OUTPUT_DIR="${PACKAGE_DIR}/dist"
APP_BUNDLE="${OUTPUT_DIR}/TouchPass.app"

echo "🔨 Building TouchPass Native macOS App (Release)..."
swift build -c release --package-path "${PACKAGE_DIR}" --product TouchPassApp

RELEASE_BIN="${PACKAGE_DIR}/.build/release/TouchPassApp"
if [[ ! -f "${RELEASE_BIN}" ]]; then
    # In newer swiftpm layouts it might be under arm64-apple-macosx/release
    RELEASE_BIN="$(find "${PACKAGE_DIR}/.build" -type f -name "TouchPassApp" -perm +111 | head -n 1)"
fi

echo "📦 Creating macOS App Bundle at ${APP_BUNDLE}..."
rm -rf "${APP_BUNDLE}"
mkdir -p "${APP_BUNDLE}/Contents/MacOS"
mkdir -p "${APP_BUNDLE}/Contents/Resources"

cp "${RELEASE_BIN}" "${APP_BUNDLE}/Contents/MacOS/TouchPass"
chmod +x "${APP_BUNDLE}/Contents/MacOS/TouchPass"

cat << 'EOF' > "${APP_BUNDLE}/Contents/Info.plist"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>en</string>
    <key>CFBundleExecutable</key>
    <string>TouchPass</string>
    <key>CFBundleIdentifier</key>
    <string>com.touchpass.desktop</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>TouchPass</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>0.3.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>CFBundleDisplayName</key>
    <string>TouchPass</string>
    <key>LSMinimumSystemVersion</key>
    <string>14.0</string>
    <key>LSApplicationCategoryType</key>
    <string>public.app-category.utilities</string>
    <key>NSPrincipalClass</key>
    <string>NSApplication</string>
    <key>NSHighResolutionCapable</key>
    <true/>
</dict>
</plist>
EOF

# swift build linker-signs the bare executable only. Without a bundle
# signature, Info.plist is not bound and LaunchServices sees a null
# bundle identifier, so the app process starts with no openable UI.
echo "🔏 Signing app bundle so Info.plist is bound..."
codesign --force --sign - \
    --identifier "com.touchpass.desktop" \
    "${APP_BUNDLE}"

# codesign -dv prints to stderr and can exit non-zero even when the
# signature is readable, so do not use the pipeline status as the check.
sign_info="$(codesign -dv "${APP_BUNDLE}" 2>&1 || true)"
if [[ "${sign_info}" != *"Info.plist entries"* ]]; then
    echo "ERROR: Info.plist was not bound into the signature." >&2
    printf '%s\n' "${sign_info}" >&2
    exit 1
fi

echo "✅ App bundle created successfully at ${APP_BUNDLE}!"
