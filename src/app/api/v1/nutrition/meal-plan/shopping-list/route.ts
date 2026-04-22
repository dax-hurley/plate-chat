import {
  generateShoppingListForMealPlan,
  resolveShoppingListForMealPlan,
} from "@/lib/ai-shopping-list";
import { json, resolvePatUserId, unauthorized } from "@/lib/api-pat";
import { formatDayKey, mondayOfWeekContaining, parseDayKey } from "@/lib/date-key";
import * as mealPlan from "@/lib/services/meal-plan";

export const runtime = "nodejs";
export const maxDuration = 60;

function weekStartFromRequest(request: Request) {
  const url = new URL(request.url);
  const raw = url.searchParams.get("weekStart")?.trim();
  return raw && parseDayKey(raw)
    ? raw
    : mondayOfWeekContaining(formatDayKey(new Date()));
}

export async function GET(request: Request) {
  const userId = await resolvePatUserId(request);
  if (!userId) return unauthorized();
  const weekStart = weekStartFromRequest(request);
  const plan = await mealPlan.getOrCreatePlanForWeek(userId, weekStart);
  if (!plan) return json({ error: "Failed to load plan" }, { status: 500 });
  const shoppingList = await resolveShoppingListForMealPlan(plan);
  return json({
    weekStartDayKey: plan.weekStartDayKey,
    shoppingList,
  });
  
}

/** Runs AI shopping list generation (explicit trigger for API / MCP clients). */
export async function POST(request: Request) {
  const userId = await resolvePatUserId(request);
  if (!userId) return unauthorized();
  const weekStart = weekStartFromRequest(request);
  const plan = await mealPlan.getOrCreatePlanForWeek(userId, weekStart);
  if (!plan) return json({ error: "Failed to load plan" }, { status: 500 });
  const shoppingList = await generateShoppingListForMealPlan(plan);
  return json({
    weekStartDayKey: plan.weekStartDayKey,
    shoppingList,
  });
  
}
