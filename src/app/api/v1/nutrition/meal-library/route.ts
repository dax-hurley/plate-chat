import { json, resolvePatUserId, unauthorized } from "@/lib/api-pat";
import * as mealLibrary from "@/lib/services/meal-library";
import { jsonMealLibraryItem } from "@/lib/meal-planning-api";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const userId = await resolvePatUserId(request);
  if (!userId) return unauthorized();
  const url = new URL(request.url);
  const query = url.searchParams.get("query")?.trim();
  const items = await mealLibrary.listLibraryItems(userId, query);
  return json({ items: items.map((i) => jsonMealLibraryItem(i)) });
  
}

export async function POST(request: Request) {
  const userId = await resolvePatUserId(request);
  if (!userId) return unauthorized();
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
  const row = await mealLibrary.createLibraryItem(userId, {
    name,
    instructions: body.instructions?.trim() ?? "",
    calories: Number(body.calories ?? 0),
    proteinG: Number(body.proteinG ?? 0),
    carbsG: Number(body.carbsG ?? 0),
    fatG: Number(body.fatG ?? 0),
    ingredients,
  });
  if (!row) return json({ error: "Failed to create" }, { status: 500 });
  return json({ item: jsonMealLibraryItem(row) });
  
}
