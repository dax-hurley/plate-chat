#!/usr/bin/env bash
# Install the debug APK using Windows adb (for AVD/USB devices attached to Windows while you build in WSL).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APK="${1:-$ROOT/android/app/build/outputs/apk/debug/app-debug.apk}"

if ! command -v wslpath >/dev/null 2>&1; then
  echo "wsl-install-apk: wslpath not found — run this script from WSL." >&2
  exit 1
fi
if ! command -v powershell.exe >/dev/null 2>&1; then
  echo "wsl-install-apk: powershell.exe not found — WSL/Windows interop may be disabled." >&2
  exit 1
fi
if [[ ! -f "$APK" ]]; then
  echo "wsl-install-apk: APK not found: $APK" >&2
  echo "Build first: npm run android:build" >&2
  exit 1
fi

WIN_APK="$(wslpath -w "$APK")"
WIN_PS1="$(wslpath -w "$ROOT/scripts/install-apk-windows.ps1")"

exec powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$WIN_PS1" -ApkPath "$WIN_APK"
