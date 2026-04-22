# Capacitor Android (Trainlog)

The Android app **bundles the TanStack Start SPA build** (`dist/client/`) and
boots from disk, so the app works fully offline in airplane mode from a cold
start. There is no `server.url`; `capacitor.config.ts` only configures `appId`,
`appName`, and `webDir: "dist/client"`.

Online-only features (coach chat, shopping-list generation) and initial
sign-in / sync talk to the deployed API, whose base URL is compiled into the
bundle via `VITE_API_URL`.

## Prerequisites

- [Android Studio](https://developer.android.com/studio) with SDK + emulator
  or a USB device. Set **`ANDROID_HOME`** (or `android/local.properties` with
  `sdk.dir=…`).
- Node 22+ (Capacitor 8 expectation). JDK 17 or 21 for Gradle.
- After cloning, run **`npm install`** then **`npm run build && npm run
  cap:sync`** at least once before opening the project in Android Studio —
  generated files under `android/app/src/main/assets/` are gitignored by the
  Capacitor template.

## Dev workflow

Because the APK contains the SPA, a code change on the host does not live-update
the installed app. Iteration loop:

```bash
VITE_API_URL=http://<host-reachable-from-device>:3001 npm run build
npm run cap:sync
npm run cap:run:android
```

Set `VITE_API_URL` to whatever the device can reach your API at (see the table
below). The SPA will make sync + auth + coach requests to that origin.

### URL matrix

| Scenario                                   | `VITE_API_URL`                |
| ------------------------------------------ | ----------------------------- |
| WSL + emulator (Windows) + `adb reverse`   | `http://127.0.0.1:3001`       |
| Vite on Windows + emulator                 | `http://10.0.2.2:3001`        |
| Physical device on same Wi-Fi              | `http://192.168.x.x:3001`     |
| Production                                 | `https://your-domain`         |

Release builds reject cleartext HTTP; use HTTPS for production.

### adb reverse (WSL)

```bash
npm run android:adb-reverse   # adb reverse tcp:3001 tcp:3001 via Windows adb
```

## Offline model

- RxDB (IndexedDB via Dexie) stores every user entity locally. All CRUD UI
  reads/writes through `src/lib/stores/*` hooks — there is no "online" code
  path for those screens.
- Sync runs on startup, the `online` event, every 30 seconds, and on window
  focus. Writes made offline queue in IndexedDB and push as soon as sync
  succeeds.
- Coach chat + shopping-list generation gracefully degrade: banner,
  disabled composer, previously synced conversations / lists still readable.

## Commands

| Command                        | Purpose                                  |
| ------------------------------ | ---------------------------------------- |
| `npm run cap:sync`             | `cap sync` (copies `dist/client/` over)  |
| `npm run cap:run:android`      | Build + run on device                    |
| `npm run cap:open:android`     | Open in Android Studio                   |
| `npm run android:build`        | sync + `assembleDebug` (JDK 17/21)       |
| `npm run android:adb-reverse`  | WSL helper to forward :3001 to Windows   |
| `npm run android:install:win`  | Install the debug APK via Windows adb    |
