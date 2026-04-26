/**
 * Set `VITE_DEV_FORCE_OFFLINE=true` in `.env.local` while `npm run dev` is running
 * to simulate offline against a local backend. Otherwise the health probe to
 * `/api/health` succeeds and the app looks online even when you want to test
 * coach / header / meal-plan offline behavior.
 *
 * Only honored when `import.meta.env.DEV` is true (no effect in production builds).
 */
export function isDevForceOffline(): boolean {
  if (!import.meta.env.DEV) return false;
  const v = import.meta.env.VITE_DEV_FORCE_OFFLINE;
  if (v == null || v === "") return false;
  const s = String(v).toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "on";
}
