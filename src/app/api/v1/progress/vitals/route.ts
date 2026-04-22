import { json, resolvePatUserId, unauthorized } from "@/lib/api-pat";
import { parseDayKey } from "@/lib/date-key";
import * as progress from "@/lib/services/progress";
import { isAllowedVitalKey } from "@/lib/vitals-keys";

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
  const keysRaw = url.searchParams.get("keys")?.trim();
  const keys = keysRaw
    ? keysRaw
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean)
    : undefined;
  const rows = await progress.listVitalEntriesInRange(userId, from, to, keys);
  return json({
    from,
    to,
    entries: rows.map((r) => ({
      id: r.id,
      vitalKey: r.vitalKey,
      dayKey: r.dayKey,
      value: r.value,
      recordedAt: r.recordedAt.toISOString(),
    })),
  });
  
}

export async function POST(request: Request) {
  const userId = await resolvePatUserId(request);
  if (!userId) return unauthorized();
  let body: {
    dayKey?: string;
    entries?: { vitalKey: string; value: number }[];
  };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }
  const entries = body.entries;
  if (!Array.isArray(entries) || entries.length === 0) {
    return json({ error: "entries array required" }, { status: 400 });
  }
  const dayKey =
    body.dayKey?.trim() && parseDayKey(body.dayKey.trim())
      ? body.dayKey.trim()
      : undefined;
  const saved: unknown[] = [];
  for (const e of entries) {
    if (!e || typeof e.vitalKey !== "string" || !isAllowedVitalKey(e.vitalKey)) {
      return json({ error: `Invalid vitalKey: ${e?.vitalKey}` }, { status: 400 });
    }
    const v = Number(e.value);
    if (!Number.isFinite(v)) {
      return json({ error: "Each entry needs a numeric value" }, { status: 400 });
    }
    const row = await progress.upsertVitalEntry(userId, {
      vitalKey: e.vitalKey,
      value: v,
      dayKey,
    });
    saved.push({
      id: row.id,
      vitalKey: row.vitalKey,
      dayKey: row.dayKey,
      value: row.value,
      recordedAt: row.recordedAt.toISOString(),
    });
  }
  return json({ saved });
  
}
