import { formatMonthKey, monthDayKeyRange, parseDayKey } from "@/lib/date-key";
import { json, resolvePatUserId, unauthorized } from "@/lib/api-pat";
import * as workouts from "@/lib/services/workouts";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const userId = await resolvePatUserId(request);
  if (!userId) return unauthorized();
  const url = new URL(request.url);
  const fromRaw = url.searchParams.get("from")?.trim();
  const toRaw = url.searchParams.get("to")?.trim();
  const monthRaw = url.searchParams.get("month")?.trim();

  let from: string;
  let to: string;
  if (fromRaw && toRaw && parseDayKey(fromRaw) && parseDayKey(toRaw)) {
    from = fromRaw;
    to = toRaw;
    if (from > to) return json({ error: "from must be <= to" }, { status: 400 });
  } else if (monthRaw) {
    const range = monthDayKeyRange(monthRaw);
    if (!range) return json({ error: "Invalid month (use YYYY-MM)" }, { status: 400 });
    from = range.first;
    to = range.last;
  } else {
    const m = formatMonthKey(new Date());
    const range = monthDayKeyRange(m)!;
    from = range.first;
    to = range.last;
  }

  const [scheduled, sessions, planned, recurringRules] = await Promise.all([
    workouts.listScheduledInRange(userId, from, to),
    workouts.listSessionsStartedInDayRange(userId, from, to),
    workouts.listPlannedWorkoutsInRange(userId, from, to),
    workouts.listRecurringRules(userId),
  ]);

  return json({
    from,
    to,
    planned,
    recurringRules: recurringRules.map((r) => {
      let byDay: unknown = [];
      try {
        byDay = JSON.parse(r.byDay) as unknown;
      } catch {
        /* keep [] */
      }
      return {
      id: r.id,
      templateId: r.templateId,
      templateName: r.template.name,
      intervalWeeks: r.intervalWeeks,
      byDay,
      startDayKey: r.startDayKey,
      untilDayKey: r.untilDayKey,
      notes: r.notes,
      createdAt: r.createdAt,
    };
    }),
    scheduled: scheduled.map((s) => ({
      id: s.id,
      dayKey: s.dayKey,
      notes: s.notes,
      templateId: s.templateId,
      templateName: s.template.name,
      createdAt: s.createdAt,
    })),
    sessions: sessions.map((s) => ({
      id: s.id,
      dayKey: s.dayKey,
      status: s.status,
      startedAt: s.startedAt,
      endedAt: s.endedAt,
      templateId: s.templateId,
      templateName: s.template?.name ?? null,
    })),
  });
  
}

export async function POST(request: Request) {
  const userId = await resolvePatUserId(request);
  if (!userId) return unauthorized();
  let body: { templateId?: string; dayKey?: string; notes?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }
  const templateId = body.templateId?.trim();
  const dayKey = body.dayKey?.trim();
  if (!templateId || !dayKey) {
    return json({ error: "templateId and dayKey required" }, { status: 400 });
  }
  try {
    const row = await workouts.createScheduledWorkout(userId, {
      templateId,
      dayKey,
      notes: body.notes,
    });
    return json({
      scheduled: {
        id: row.id,
        dayKey: row.dayKey,
        notes: row.notes,
        templateId: row.templateId,
        createdAt: row.createdAt,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not schedule";
    return json({ error: msg }, { status: 400 });
  }
  
}
