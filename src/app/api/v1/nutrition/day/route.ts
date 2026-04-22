import { json, resolvePatUserId, unauthorized } from "@/lib/api-pat";
import { parseDayKey, formatDayKey } from "@/lib/date-key";
import * as nutrition from "@/lib/services/nutrition";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const userId = await resolvePatUserId(request);
  if (!userId) return unauthorized();
  const url = new URL(request.url);
  const raw = url.searchParams.get("date")?.trim();
  const dayKey =
    raw && parseDayKey(raw) ? raw : formatDayKey(new Date());
  const [meals, totals] = await Promise.all([
    nutrition.listMealsForDay(userId, dayKey),
    nutrition.getDailyTotals(userId, dayKey),
  ]);
  return json({
    date: dayKey,
    totals,
    meals: meals.map((m) => ({
      id: m.id,
      name: m.name,
      loggedAt: m.loggedAt,
      entries: m.entries.map((e) => ({
        id: e.id,
        description: e.description,
        calories: e.calories,
        proteinG: e.proteinG,
        carbsG: e.carbsG,
        fatG: e.fatG,
      })),
    })),
  });
  
}
