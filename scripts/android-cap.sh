#!/usr/bin/env bash
# Capacitor Android: sync config, build APK, or run on device/emulator.
# Set CAP_SERVER_URL in the environment or in .env.local / .env (see .env.example).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

usage() {
  echo "Usage: $(basename "$0") <sync|build|run|open>"
  echo ""
  echo "  sync   Export CAP_SERVER_URL into capacitor config and run cap sync"
  echo "  build  sync, then ./gradlew assembleDebug (debug APK)"
  echo "  run    sync, then cap run android"
  echo "  open   Open android/ in Android Studio"
  echo ""
  echo "CAP_SERVER_URL: env, or CAP_SERVER_URL=... in .env.local / .env."
  echo "If unset, defaults to http://10.0.2.2:3000. For WSL + emulator on Windows, prefer"
  echo "http://127.0.0.1:3000 + npm run android:adb-reverse (see docs/capacitor-android.md)."
  exit "${1:-0}"
}

load_cap_server_url() {
  if [[ -n "${CAP_SERVER_URL:-}" ]]; then
    return
  fi
  local f line val
  for f in .env.local .env; do
    [[ -f "$f" ]] || continue
    line="$(grep -E '^[[:space:]]*CAP_SERVER_URL=' "$f" 2>/dev/null | tail -1 || true)"
    [[ -z "$line" ]] && continue
    val="${line#*=}"
    val="${val%%#*}"
    val="${val%"${val##*[![:space:]]}"}"
    val="${val#"${val%%[![:space:]]*}"}"
    if [[ "$val" == \"*\" ]]; then val="${val#\"}"; val="${val%\"}"; fi
    if [[ "$val" == \'*\' ]]; then val="${val#\'}"; val="${val%\'}"; fi
    export CAP_SERVER_URL="$val"
    return
  done
  export CAP_SERVER_URL="http://10.0.2.2:3000"
  echo "android-cap: CAP_SERVER_URL not set; using default ${CAP_SERVER_URL}" >&2
  echo "android-cap: If you see connection refused with Next in WSL, set CAP_SERVER_URL=http://127.0.0.1:3000 and run npm run android:adb-reverse." >&2
}

find_java_home() {
  local d
  for d in /usr/lib/jvm/java-21-openjdk-amd64 /usr/lib/jvm/java-17-openjdk-amd64 /usr/lib/jvm/default-java; do
    if [[ -d "$d" && -x "$d/bin/java" ]]; then
      echo "$d"
      return 0
    fi
  done
  if [[ -n "${JAVA_HOME:-}" && -x "${JAVA_HOME}/bin/java" ]]; then
    echo "$JAVA_HOME"
    return 0
  fi
  return 1
}

run_sync() {
  load_cap_server_url
  export CAP_SERVER_URL
  npx cap sync
}

run_build() {
  run_sync
  local java_home
  java_home="$(find_java_home)" || {
    echo "android-cap: set JAVA_HOME to JDK 17 or 21 for Gradle" >&2
    exit 1
  }
  echo "android-cap: using JAVA_HOME=$java_home" >&2
  (cd android && JAVA_HOME="$java_home" ./gradlew assembleDebug)
  echo "android-cap: debug APK at android/app/build/outputs/apk/debug/app-debug.apk" >&2
}

run_run() {
  run_sync
  npx cap run android
}

run_open() {
  npx cap open android
}

cmd="${1:-}"
[[ -z "$cmd" || "$cmd" == -h || "$cmd" == --help ]] && usage 0

case "$cmd" in
  sync) run_sync ;;
  build) run_build ;;
  run) run_run ;;
  open) run_open ;;
  *) usage 1 ;;
esac
