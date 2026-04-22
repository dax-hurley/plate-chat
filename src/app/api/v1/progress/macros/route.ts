import { json, resolvePatUserId, unauthorized } from "@/lib/api-pat";
import { parseDayKey } from "@/lib/date-key";
import * as progress from "@/lib/services/progress";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const userId = await resolvePatUserId(request);
  if (!userId) return unauthorized();
  const url = new URL(request.url);
  const from = url.searchParams.get("from")?.trim() ?? "";
  const to = url.searchParams.get("to")?.trim() ?? "";
  if (!parseDayKey(from) || !parseDayKey(to)) {
    return json(
      { error: "from and to day keys (YYYY-MM-DD) are required" },
      { status: 400 }
    );
  }
  const series = await progress.getMacroTotalsByDay(userId, from, to);
  return json({ from, to, series });
  
}
