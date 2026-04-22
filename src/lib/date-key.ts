/** Local calendar day for nutrition grouping (YYYY-MM-DD). */
export function formatDayKey(d: Date = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDayKey(key: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function addDaysKey(key: string, delta: number): string {
  const d = parseDayKey(key);
  if (!d) return key;
  d.setDate(d.getDate() + delta);
  return formatDayKey(d);
}

/** Monday (local) of the week that contains `dayKey` (ISO week-style start). */
export function mondayOfWeekContaining(dayKey: string): string {
  const d = parseDayKey(dayKey);
  if (!d) return dayKey;
  const dow = d.getDay(); // 0 Sun .. 6 Sat
  const delta = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + delta);
  return formatDayKey(d);
}

/** Inclusive range; `visitor` runs in chronological order. */
export function eachDayKeyInRange(
  fromKey: string,
  toKey: string,
  visitor: (dayKey: string) => void
) {
  if (fromKey > toKey) return;
  let k = fromKey;
  for (;;) {
    visitor(k);
    if (k === toKey) break;
    k = addDaysKey(k, 1);
  }
}

/** Whole-day difference (local calendar dates). */
export function dayKeysDistance(fromKey: string, toKey: string): number | null {
  const a = parseDayKey(fromKey);
  const b = parseDayKey(toKey);
  if (!a || !b) return null;
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

/** Calendar month key (YYYY-MM) for month views. */
export function formatMonthKey(d: Date = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function parseMonthKey(
  key: string
): { year: number; month: number } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(key.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (!Number.isFinite(year) || month < 1 || month > 12) return null;
  return { year, month };
}

export function prevMonthKey(monthKey: string): string {
  const p = parseMonthKey(monthKey);
  if (!p) return monthKey;
  const d = new Date(p.year, p.month - 2, 1);
  return formatMonthKey(d);
}

export function nextMonthKey(monthKey: string): string {
  const p = parseMonthKey(monthKey);
  if (!p) return monthKey;
  const d = new Date(p.year, p.month, 1);
  return formatMonthKey(d);
}

/** First and last YYYY-MM-DD inside a calendar month (local). */
export function monthDayKeyRange(monthKey: string): { first: string; last: string } | null {
  const p = parseMonthKey(monthKey);
  if (!p) return null;
  const first = formatDayKey(new Date(p.year, p.month - 1, 1));
  const lastDay = new Date(p.year, p.month, 0).getDate();
  const last = formatDayKey(new Date(p.year, p.month - 1, lastDay));
  return { first, last };
}

/** Local [startMs, endExclusiveMs) spanning from `fromKey` 00:00 through end of `toKey`. */
export function localDayRangeBoundsMs(
  fromKey: string,
  toKey: string
): { startMs: number; endExclusiveMs: number } | null {
  const from = parseDayKey(fromKey);
  const to = parseDayKey(toKey);
  if (!from || !to) return null;
  const end = new Date(to);
  end.setDate(end.getDate() + 1);
  end.setHours(0, 0, 0, 0);
  return { startMs: from.getTime(), endExclusiveMs: end.getTime() };
}

export type CalendarCell = { dayKey: string; inMonth: boolean };

/** Six Sun–Sat weeks covering `monthKey` (local), including adjacent-month padding days. */
export function calendarMonthGrid(monthKey: string): CalendarCell[][] | null {
  const p = parseMonthKey(monthKey);
  if (!p) return null;
  const year = p.year;
  const mi = p.month - 1;
  const firstDow = new Date(year, mi, 1).getDay();
  const cur = new Date(year, mi, 1 - firstDow);
  const flat: CalendarCell[] = [];
  for (let i = 0; i < 42; i++) {
    flat.push({
      dayKey: formatDayKey(cur),
      inMonth: cur.getMonth() === mi && cur.getFullYear() === year,
    });
    cur.setDate(cur.getDate() + 1);
  }
  const weeks: CalendarCell[][] = [];
  for (let w = 0; w < 6; w++) {
    weeks.push(flat.slice(w * 7, w * 7 + 7));
  }
  return weeks;
}
