import { json, resolvePatUserId, unauthorized } from "@/lib/api-pat";
import { parseDayKey } from "@/lib/date-key";
import * as progress from "@/lib/services/progress";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const userId = await resolvePatUserId(request);
  if (!userId) return unauthorized();
  const url = new URL(request.url);
  const exerciseId = url.searchParams.get("exerciseId")?.trim() ?? "";
  const from = url.searchParams.get("from")?.trim() ?? "";
  const to = url.searchParams.get("to")?.trim() ?? "";
  if (!exerciseId || !parseDayKey(from) || !parseDayKey(to)) {
    return json(
      { error: "exerciseId, from, and to (YYYY-MM-DD) are required" },
      { status: 400 }
    );
  }
  const { metric, points: series } = await progress.getExerciseProgressByDay(
    userId,
    exerciseId,
    from,
    to
  );
  return json({ exerciseId, from, to, metric, series });
  
}
