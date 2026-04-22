/**
 * When `AUTH_URL` / `NEXT_PUBLIC_APP_URL` are unset in development, Next.js config
 * falls back to this origin so Capacitor + `adb reverse` (127.0.0.1) matches Auth.js
 * without extra `.env.local` entries. Override in `.env.local` if you use `localhost`
 * in the desktop browser only.
 */
export const DEV_DEFAULT_APP_ORIGIN = "http://127.0.0.1:3000";
