# Capacitor Android (Trainlog)

This app is a **full-stack Next.js** project (API routes, NextAuth, database). The Android shell loads that site in a **WebView** via Capacitor `server.url`, not a static export.

## Prerequisites

- [Android Studio](https://developer.android.com/studio) (SDK, emulator or USB device). Set **`ANDROID_HOME`** or create `android/local.properties` with `sdk.dir=…` so Gradle can build.
- After cloning, run **`npm run cap:sync`** before opening the project in Android Studio (generated files under `android/app/src/main/assets/` are gitignored by the Capacitor template).

## Local development: avoid connection refused

The dev server must listen on **all interfaces**, and the **WebView origin** must match **`AUTH_URL`** and **`NEXT_PUBLIC_APP_URL`** (NextAuth cookies).

Always use:

```bash
npm run dev:android
```

(`next dev --hostname 0.0.0.0 --port 3000` so the app is reachable from something other than `localhost` on the dev machine only.)

### Server Actions and HMR in the WebView

**Do not rely on Next.js Server Actions** for login (or other critical flows) when the WebView loads a **remote** `next dev` URL. Action IDs are tied to the current dev build; **restarts, Turbopack, or a cached JS bundle** in the WebView cause **“Failed to find Server Action”**. The login form uses **client-side** `signIn()` from `next-auth/react` instead.

**Turbopack / HMR WebSockets** often **fail** when the app opens the dev server as **`http://10.0.2.2:3000`** (emulator → Windows host). That is expected and does not affect production builds. Prefer **`http://127.0.0.1:3000`** + **`npm run android:adb-reverse`** so the tunnel matches your auth defaults and dev tooling behaves more like a normal browser.

### WSL + Android emulator on Windows (common)

The emulator's special IP **`10.0.2.2`** points at the **Windows** host, **not** your Linux distro. If `next dev` runs only inside WSL, nothing may be listening where the emulator connects, so you get **connection refused**.

**Recommended:** treat the app URL as **`http://127.0.0.1:3000`** on the device and use **adb reverse** so that hits the Windows host, which forwards to WSL (same as opening `http://localhost:3000` in Chrome on Windows).

1. In **`.env.local`** (same origin for all three):

   ```bash
   CAP_SERVER_URL=http://127.0.0.1:3000
   AUTH_URL=http://127.0.0.1:3000
   NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000
   ```

2. Terminal A:

   ```bash
   npm run dev:android
   ```

3. Terminal B (after emulator is up; uses **Windows** `adb` from WSL):

   ```bash
   npm run android:adb-reverse
   ```

4. Re-sync Capacitor so the embedded URL matches:

   ```bash
   npm run android:sync
   ```

5. Open the app on the emulator (re-run **`android:adb-reverse`** if `adb` reconnects).

### Next.js on Windows + emulator

If you run **`npm run dev:android` in PowerShell on Windows** (project on `\\wsl$\...` or checked out on Windows), **`10.0.2.2:3000`** usually works. Set all three env vars to `http://10.0.2.2:3000`, then `npm run android:sync`.

### Physical device on Wi-Fi

Use your PC's **LAN** IP (e.g. `http://192.168.1.42:3000`) for `CAP_SERVER_URL`, `AUTH_URL`, and `NEXT_PUBLIC_APP_URL`. Run `npm run dev:android`. Allow port **3000** through the OS firewall if the phone cannot connect.

## Login redirect stuck on Capacitor?

Session cookies are **per origin**. `http://127.0.0.1:3000` and `http://localhost:3000` are **different** origins. If `AUTH_URL` / `NEXT_PUBLIC_APP_URL` use one host but the WebView loads the other, or if `callbackUrl` points at `localhost` while you browse on `127.0.0.1`, navigation after sign-in can drop cookies and keep you on `/login`. Use **one** host everywhere (see `.env.example`) and rely on the app’s post-login navigation, which keeps the path on the **current** origin.

## Align URLs with NextAuth

Set **`CAP_SERVER_URL`** when running **`npm run cap:sync`** (and before `cap run` / Android Studio builds) so the native project embeds the same value in `capacitor.config.json`.

Summary (must match exactly):

| Scenario | `CAP_SERVER_URL` / `AUTH_URL` / `NEXT_PUBLIC_APP_URL` |
|----------|------------------------------------------------------|
| WSL + emulator (Windows) + adb reverse | `http://127.0.0.1:3000` |
| Next on Windows + emulator | `http://10.0.2.2:3000` |
| Physical device on same Wi-Fi | `http://192.168.x.x:3000` |
| Production (SST deploy) | `https://your-domain` |

**Debug builds** allow cleartext HTTP (`android/app/src/debug/AndroidManifest.xml`). **Release** builds do not; use HTTPS for production.

## Commands

Convenience wrapper (loads `CAP_SERVER_URL` from `.env.local` / `.env`, or defaults to `http://10.0.2.2:3000`):

- `npm run dev:android` — Next dev bound to `0.0.0.0:3000` (use for phone/emulator)
- `npm run android:adb-reverse` — **WSL:** `adb reverse tcp:3000 tcp:3000` via Windows `adb` (pair with `127.0.0.1` URLs)
- `npm run android:sync` — `cap sync`
- `npm run android:build` — sync + `assembleDebug` (uses JDK 17/21 when available)
- `npm run android:run` — sync + `cap run android`
- `npm run android:open` — `cap open android`
- `npm run android:install:win` — **WSL only:** install the debug APK with **Windows** `adb`. Optional path: `npm run android:install:win -- /path/to.apk`

Manual flow:

```bash
npm run dev:android
export CAP_SERVER_URL=http://10.0.2.2:3000
npm run cap:sync
npm run cap:run:android
```

Or open in Android Studio: `npm run cap:open:android`.

## Node version

Capacitor **8** expects a current Node LTS (**22+** recommended). Match the version used in CI / your team when running `npx cap`.

## JVM for Gradle

If `./gradlew` fails with **Unsupported class file major version**, run Gradle with **JDK 17 or 21** (e.g. `JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64 ./gradlew assembleDebug`).
