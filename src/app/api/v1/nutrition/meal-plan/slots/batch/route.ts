import { json, resolvePatUserId, unauthorized } from "@/lib/api-pat";
import { jsonMealPlan } from "@/lib/meal-planning-api";
import * as mealPlan from "@/lib/services/meal-plan";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const userId = await resolvePatUserId(request);
  if (!userId) return unauthorized();
  let body: {
    weekStartDayKey?: string;
    assignments?: {
      dayIndex: number;
      slotIndex?: number;
      libraryItemId?: string | null;
    }[];
  };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  const weekStartDayKey = body.weekStartDayKey?.trim();
  if (!weekStartDayKey) {
    return json({ error: "weekStartDayKey is required" }, { status: 400 });
  }
  if (!Array.isArray(body.assignments)) {
    return json({ error: "assignments must be an array" }, { status: 400 });
  }

  try {
    const plan = await mealPlan.setPlanSlotsBatch(userId, {
      weekStartDayKey,
      assignments: body.assignments.map((a) => ({
        dayIndex: a.dayIndex,
        ...(a.slotIndex !== undefined ? { slotIndex: a.slotIndex } : {}),
        libraryItemId:
          a.libraryItemId === null || a.libraryItemId === undefined
            ? null
            : String(a.libraryItemId).trim() || null,
      })),
    });
    if (!plan) return json({ error: "Failed to update" }, { status: 500 });
    return json(await jsonMealPlan(plan));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return json({ error: msg }, { status: 400 });
  }
  
}
