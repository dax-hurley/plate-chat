import { json, resolvePatUserId, unauthorized } from "@/lib/api-pat";
import * as progress from "@/lib/services/progress";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const userId = await resolvePatUserId(request);
  if (!userId) return unauthorized();
  const m = await progress.getLatestVitalMap(userId);
  const latest: Record<string, { value: number; dayKey: string }> = {};
  for (const [k, v] of m) {
    if (k === "height_in") continue;
    latest[k] = { value: v.value, dayKey: v.dayKey };
  }
  return json({ latest });
  
}
