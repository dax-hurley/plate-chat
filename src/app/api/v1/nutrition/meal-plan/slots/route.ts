import { json, resolvePatUserId, unauthorized } from "@/lib/api-pat";
import { jsonMealPlan } from "@/lib/meal-planning-api";
import * as mealPlan from "@/lib/services/meal-plan";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const userId = await resolvePatUserId(request);
  if (!userId) return unauthorized();
  let body: {
    weekStartDayKey?: string;
    dayIndex?: number;
    slotIndex?: number;
    slotId?: string;
    libraryItemId?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  const libraryItemId =
    body.libraryItemId === null || body.libraryItemId === undefined
      ? null
      : String(body.libraryItemId).trim() || null;

  const slotId = body.slotId?.trim();
  if (slotId) {
    try {
      const plan = await mealPlan.setSlotLibraryItem(userId, {
        slotId,
        libraryItemId,
      });
      if (!plan) return json({ error: "Failed to update" }, { status: 500 });
      return json(await jsonMealPlan(plan));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error";
      return json({ error: msg }, { status: 400 });
    }
  }

  const weekStartDayKey = body.weekStartDayKey?.trim();
  if (!weekStartDayKey) {
    return json({ error: "weekStartDayKey or slotId is required" }, { status: 400 });
  }
  const dayIndex = body.dayIndex;
  if (typeof dayIndex !== "number" || !Number.isInteger(dayIndex)) {
    return json({ error: "dayIndex must be an integer 0–6" }, { status: 400 });
  }
  const slotIndex =
    typeof body.slotIndex === "number" && Number.isInteger(body.slotIndex)
      ? body.slotIndex
      : 0;

  try {
    const plan = await mealPlan.setPlanSlot(userId, {
      weekStartDayKey,
      dayIndex,
      slotIndex,
      libraryItemId,
    });
    if (!plan) return json({ error: "Failed to update" }, { status: 500 });
    return json(await jsonMealPlan(plan));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return json({ error: msg }, { status: 400 });
  }
  
}
