import { createFileRoute } from "@tanstack/react-router";
import { authenticateBearer } from "@/server/auth/device-tokens";
import {
  generateShoppingListForMealPlan,
  resolveShoppingListForMealPlan,
} from "@/lib/ai-shopping-list";
import {
  formatDayKey,
  mondayOfWeekContaining,
  parseDayKey,
} from "@/lib/date-key";
import * as mealPlan from "@/lib/services/meal-plan";

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

function weekStartFromRequest(request: Request) {
  const url = new URL(request.url);
  const raw = url.searchParams.get("weekStart")?.trim();
  return raw && parseDayKey(raw)
    ? raw
    : mondayOfWeekContaining(formatDayKey(new Date()));
}

async function handleGet({ request }: { request: Request }): Promise<Response> {
  const claims = await authenticateBearer(request);
  if (!claims) return json({ error: "Unauthorized" }, { status: 401 });
  const weekStart = weekStartFromRequest(request);
  const plan = await mealPlan.getOrCreatePlanForWeek(claims.userId, weekStart);
  if (!plan) return json({ error: "Failed to load plan" }, { status: 500 });
  const shoppingList = await resolveShoppingListForMealPlan(plan);
  return json({ weekStartDayKey: plan.weekStartDayKey, shoppingList });
}

async function handlePost({ request }: { request: Request }): Promise<Response> {
  const claims = await authenticateBearer(request);
  if (!claims) return json({ error: "Unauthorized" }, { status: 401 });
  const weekStart = weekStartFromRequest(request);
  const plan = await mealPlan.getOrCreatePlanForWeek(claims.userId, weekStart);
  if (!plan) return json({ error: "Failed to load plan" }, { status: 500 });
  const shoppingList = await generateShoppingListForMealPlan(plan);
  return json({ weekStartDayKey: plan.weekStartDayKey, shoppingList });
}

export const Route = createFileRoute("/api/nutrition/meal-plan/shopping-list")({
  server: {
    handlers: {
      GET: handleGet,
      POST: handlePost,
    },
  },
});
