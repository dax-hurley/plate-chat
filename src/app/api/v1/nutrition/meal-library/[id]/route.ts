import { json, resolvePatUserId, unauthorized } from "@/lib/api-pat";
import * as mealLibrary from "@/lib/services/meal-library";
import { jsonMealLibraryItem } from "@/lib/meal-planning-api";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const userId = await resolvePatUserId(request);
  if (!userId) return unauthorized();
  const { id } = await ctx.params;
  const item = await mealLibrary.getLibraryItem(userId, id);
  if (!item) return json({ error: "Not found" }, { status: 404 });
  return json({ item: jsonMealLibraryItem(item) });
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const userId = await resolvePatUserId(request);
  if (!userId) return unauthorized();
    const { id } = await ctx.params;
    let body: {
      name?: string;
      instructions?: string;
      calories?: number;
      proteinG?: number;
      carbsG?: number;
      fatG?: number;
      ingredients?: string[];
    };
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, { status: 400 });
    }
    const name = body.name?.trim();
    if (!name) return json({ error: "name is required" }, { status: 400 });
    const ingredients = Array.isArray(body.ingredients)
      ? body.ingredients.map((l) => ({ line: String(l) }))
      : [];
    const row = await mealLibrary.updateLibraryItem(userId, id, {
      name,
      instructions: body.instructions?.trim() ?? "",
      calories: Number(body.calories ?? 0),
      proteinG: Number(body.proteinG ?? 0),
      carbsG: Number(body.carbsG ?? 0),
      fatG: Number(body.fatG ?? 0),
      ingredients,
    });
    if (!row) return json({ error: "Not found" }, { status: 404 });
    return json({ item: jsonMealLibraryItem(row) });
  
}

export async function DELETE(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const userId = await resolvePatUserId(request);
  if (!userId) return unauthorized();
  const { id } = await ctx.params;
  const existing = await mealLibrary.getLibraryItem(userId, id);
  if (!existing) return json({ error: "Not found" }, { status: 404 });
  await mealLibrary.deleteLibraryItem(userId, id);
  return json({ ok: true });
}
