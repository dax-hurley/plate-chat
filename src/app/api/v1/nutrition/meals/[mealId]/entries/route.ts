import { json, resolvePatUserId, unauthorized } from "@/lib/api-pat";
import * as nutrition from "@/lib/services/nutrition";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  ctx: { params: Promise<{ mealId: string }> }
) {
  const userId = await resolvePatUserId(request);
  if (!userId) return unauthorized();
  const { mealId } = await ctx.params;
  let body: {
    description?: string;
    calories?: number;
    proteinG?: number;
    carbsG?: number;
    fatG?: number;
  };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }
  try {
    const row = await nutrition.addMealEntry(userId, {
      mealId,
      description: body.description,
      calories: Number(body.calories ?? 0),
      proteinG: Number(body.proteinG ?? 0),
      carbsG: Number(body.carbsG ?? 0),
      fatG: Number(body.fatG ?? 0),
    });
    return json({ entry: row });
  } catch {
    return json({ error: "Could not add entry" }, { status: 400 });
  }
}
