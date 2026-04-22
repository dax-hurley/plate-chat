#!/usr/bin/env bash
# Forward device/emulator localhost:PORT to Windows host localhost:PORT (Windows adb).
# Use with CAP_SERVER_URL=http://127.0.0.1:PORT when Next runs in WSL and adb targets Windows.
set -euo pipefail

PORT="${1:-${PORT:-3000}}"

if ! command -v powershell.exe >/dev/null 2>&1; then
  echo "android:adb-reverse: powershell.exe not found (run from WSL with Windows interop)." >&2
  exit 1
fi

powershell.exe -NoProfile -Command "\$adb = Join-Path \$env:LOCALAPPDATA 'Android\Sdk\platform-tools\adb.exe'; if (-not (Test-Path -LiteralPath \$adb)) { Write-Error 'adb not found under LOCALAPPDATA'; exit 1 }; & \$adb @('reverse', 'tcp:${PORT}', 'tcp:${PORT}')"
echo "android:adb-reverse: tcp:${PORT} (device/emulator) -> tcp:${PORT} (Windows host). Re-run after adb reconnects if needed."
