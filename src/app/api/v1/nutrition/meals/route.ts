import { json, resolvePatUserId, unauthorized } from "@/lib/api-pat";
import * as nutrition from "@/lib/services/nutrition";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const userId = await resolvePatUserId(request);
  if (!userId) return unauthorized();
  let body: { dayKey?: string; name?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }
  const dayKey = body.dayKey?.trim();
  const name = body.name?.trim();
  if (!dayKey || !name) {
    return json({ error: "dayKey and name required" }, { status: 400 });
  }
  const row = await nutrition.createMeal(userId, { dayKey, name });
  return json({ meal: row });
  
}
