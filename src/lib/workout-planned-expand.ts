/**
 * Expand `workoutRecurringRules` into concrete per-day planned entries within a
 * `[fromKey, toKey]` window (inclusive, dayKeys), then merge with one-off scheduled
 * entries to produce a single timeline the calendar / agenda uses.
 *
 * A recurring rule recurs on a set of weekdays (`byDay`, JS dow: 0 Sun..6 Sat) every
 * `intervalWeeks` weeks, starting at `startDayKey`. If `untilDayKey` is set, it
 * recurs through that day (inclusive). Skipped occurrences live in
 * `workoutRecurringSkips (ruleId, dayKey)`.
 */

import {
  addDaysKey,
  dayKeysDistance,
  eachDayKeyInRange,
  parseDayKey,
} from "@/lib/date-key";

export type PlannedWorkoutOnce = {
  source: "once";
  scheduleId: string;
  dayKey: string;
  templateId: string;
  templateName: string;
  notes: string | null;
};

export type PlannedWorkoutRecurring = {
  source: "recurring";
  instanceKey: string;
  ruleId: string;
  dayKey: string;
  templateId: string;
  templateName: string;
  notes: string | null;
  intervalWeeks: number;
  startDayKey: string;
  untilDayKey: string | null;
};

export type PlannedWorkoutEntry = PlannedWorkoutOnce | PlannedWorkoutRecurring;

export type RecurringRuleInput = {
  id: string;
  startDayKey: string;
  untilDayKey: string | null;
  /** JSON-encoded number[] of JS weekday indices (0 Sun..6 Sat). */
  byDay: string;
  intervalWeeks: number;
  templateId: string;
  templateName: string;
  notes: string | null;
};

export type RecurringSkipInput = {
  ruleId: string;
  dayKey: string;
};

function parseByDay(raw: string): Set<number> {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    const out = new Set<number>();
    for (const v of parsed) {
      const n = typeof v === "number" ? v : Number(v);
      if (Number.isInteger(n) && n >= 0 && n <= 6) out.add(n);
    }
    return out;
  } catch {
    return new Set();
  }
}

export function expandRecurringPlannedFromRules(
  rules: RecurringRuleInput[],
  skips: RecurringSkipInput[],
  fromKey: string,
  toKey: string
): PlannedWorkoutRecurring[] {
  if (fromKey > toKey) return [];
  const skipSet = new Set(skips.map((s) => `${s.ruleId}|${s.dayKey}`));
  const out: PlannedWorkoutRecurring[] = [];

  for (const rule of rules) {
    const dows = parseByDay(rule.byDay);
    if (dows.size === 0) continue;
    const interval = Math.max(1, rule.intervalWeeks | 0);
    const rangeStart = fromKey < rule.startDayKey ? rule.startDayKey : fromKey;
    const rangeEnd =
      rule.untilDayKey && rule.untilDayKey < toKey ? rule.untilDayKey : toKey;
    if (rangeStart > rangeEnd) continue;

    eachDayKeyInRange(rangeStart, rangeEnd, (dayKey) => {
      const d = parseDayKey(dayKey);
      if (!d) return;
      if (!dows.has(d.getDay())) return;
      if (interval > 1) {
        const distance = dayKeysDistance(rule.startDayKey, dayKey);
        if (distance === null || distance < 0) return;
        const weeksSince = Math.floor(distance / 7);
        if (weeksSince % interval !== 0) return;
      }
      if (skipSet.has(`${rule.id}|${dayKey}`)) return;
      out.push({
        source: "recurring",
        instanceKey: `${rule.id}|${dayKey}`,
        ruleId: rule.id,
        dayKey,
        templateId: rule.templateId,
        templateName: rule.templateName,
        notes: rule.notes,
        intervalWeeks: interval,
        startDayKey: rule.startDayKey,
        untilDayKey: rule.untilDayKey,
      });
    });
  }

  return out;
}

/**
 * Merge one-off scheduled entries with expanded recurring entries. If both a once and a
 * recurring entry exist for the same dayKey + templateId, the once entry wins and the
 * recurring one is suppressed (the once row is what the user explicitly scheduled).
 */
export function mergePlannedOnceAndRecurring(
  once: PlannedWorkoutOnce[],
  recurring: PlannedWorkoutRecurring[]
): PlannedWorkoutEntry[] {
  const onceKeys = new Set(once.map((o) => `${o.dayKey}|${o.templateId}`));
  const filteredRecurring = recurring.filter(
    (r) => !onceKeys.has(`${r.dayKey}|${r.templateId}`)
  );
  const merged: PlannedWorkoutEntry[] = [...once, ...filteredRecurring];
  merged.sort((a, b) => {
    if (a.dayKey !== b.dayKey) return a.dayKey < b.dayKey ? -1 : 1;
    return a.templateName.localeCompare(b.templateName);
  });
  // Ensure addDaysKey import is used somewhere so tree-shaking doesn't complain
  void addDaysKey;
  return merged;
}
