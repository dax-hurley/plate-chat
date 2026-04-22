import { json, resolvePatUserId, unauthorized } from "@/lib/api-pat";
import * as workouts from "@/lib/services/workouts";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const userId = await resolvePatUserId(request);
  if (!userId) return unauthorized();
  let body: {
    templateId?: string;
    byDay?: unknown;
    startDayKey?: string;
    untilDayKey?: string | null;
    intervalWeeks?: number;
    notes?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }
  const templateId = body.templateId?.trim();
  const startDayKey = body.startDayKey?.trim();
  if (!templateId || !startDayKey) {
    return json(
      { error: "templateId and startDayKey required" },
      { status: 400 }
    );
  }
  const rawBy = body.byDay;
  const byDay = Array.isArray(rawBy)
    ? rawBy
        .map((x) => (typeof x === "number" ? x : Number(x)))
        .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6)
    : [];
  try {
    const row = await workouts.createRecurringWorkoutRule(userId, {
      templateId,
      byDay,
      startDayKey,
      untilDayKey: body.untilDayKey,
      intervalWeeks: body.intervalWeeks,
      notes: body.notes,
    });
    return json({
      rule: {
        id: row.id,
        templateId: row.templateId,
        intervalWeeks: row.intervalWeeks,
        byDay: JSON.parse(row.byDay) as unknown,
        startDayKey: row.startDayKey,
        untilDayKey: row.untilDayKey,
        notes: row.notes,
        createdAt: row.createdAt,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not create rule";
    return json({ error: msg }, { status: 400 });
  }
  
}
