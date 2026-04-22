import { json, resolvePatUserId, unauthorized } from "@/lib/api-pat";
import { formatDayKey, mondayOfWeekContaining, parseDayKey } from "@/lib/date-key";
import { jsonMealPlan } from "@/lib/meal-planning-api";
import * as mealPlan from "@/lib/services/meal-plan";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const userId = await resolvePatUserId(request);
  if (!userId) return unauthorized();
  const url = new URL(request.url);
  const raw = url.searchParams.get("weekStart")?.trim();
  const weekStart =
    raw && parseDayKey(raw)
      ? raw
      : mondayOfWeekContaining(formatDayKey(new Date()));
  const plan = await mealPlan.getOrCreatePlanForWeek(userId, weekStart);
  if (!plan) return json({ error: "Failed to load plan" }, { status: 500 });
  return json(await jsonMealPlan(plan));
  
}
