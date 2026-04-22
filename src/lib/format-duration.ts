/** Compact display for workout timers (e.g. 90 → "1:30", 45 → "45s"). */
export function formatDurationSeconds(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m === 0) return `${r}s`;
  return `${m}:${r.toString().padStart(2, "0")}`;
}
