import { json, resolvePatUserId, unauthorized } from "@/lib/api-pat";
import * as workouts from "@/lib/services/workouts";

export const runtime = "nodejs";

type ItemBody = {
  exerciseId?: string;
  targetSets?: number;
  targetReps?: number;
  targetDurationSec?: number | null;
  targetDistance?: number | null;
  defaultWeight?: number | null;
  weightUnit?: string | null;
  progressiveOverloadEnabled?: boolean;
  progressiveOverloadIncrement?: number | null;
  progressiveOverloadRequireFullCompletion?: boolean;
};

function normalizeWeightUnit(
  body: ItemBody
): "lb" | "kg" | null | undefined {
  const w = body.weightUnit;
  if (w === undefined) return undefined;
  if (w === null || w === "") return null;
  if (w === "kg" || w === "lb") return w;
  return null;
}

export async function POST(
  request: Request,
  ctx: { params: Promise<{ templateId: string }> }
) {
  const userId = await resolvePatUserId(request);
  if (!userId) return unauthorized();
    const { templateId } = await ctx.params;
    const tid = templateId?.trim();
    if (!tid) return json({ error: "templateId required" }, { status: 400 });

    let body: { items?: ItemBody[] };
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, { status: 400 });
    }
    const rawItems = body.items;
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return json({ error: "items must be a non-empty array" }, { status: 400 });
    }
    if (rawItems.length > 100) {
      return json({ error: "At most 100 items per request" }, { status: 400 });
    }

    const items: {
      exerciseId: string;
      targetSets?: number;
      targetReps?: number;
      targetDurationSec?: number | null;
      targetDistance?: number | null;
      defaultWeight?: number | null;
      weightUnit?: "lb" | "kg" | null;
      progressiveOverloadEnabled?: boolean;
      progressiveOverloadIncrement?: number | null;
      progressiveOverloadRequireFullCompletion?: boolean;
    }[] = [];
    for (const row of rawItems) {
      const exerciseId = row.exerciseId?.trim();
      if (!exerciseId) {
        return json({ error: "Each item requires exerciseId" }, { status: 400 });
      }
      const wu = normalizeWeightUnit(row);
      items.push({
        exerciseId,
        targetSets: row.targetSets,
        targetReps: row.targetReps,
        targetDurationSec:
          row.targetDurationSec === undefined
            ? undefined
            : row.targetDurationSec === null
              ? null
              : Number(row.targetDurationSec),
        targetDistance:
          row.targetDistance === undefined
            ? undefined
            : row.targetDistance === null
              ? null
              : Number(row.targetDistance),
        defaultWeight:
          row.defaultWeight === undefined
            ? undefined
            : row.defaultWeight === null
              ? null
              : Number(row.defaultWeight),
        weightUnit: wu,
        progressiveOverloadEnabled: row.progressiveOverloadEnabled,
        progressiveOverloadIncrement:
          row.progressiveOverloadIncrement === undefined
            ? undefined
            : row.progressiveOverloadIncrement === null
              ? null
              : Number(row.progressiveOverloadIncrement),
        progressiveOverloadRequireFullCompletion:
          row.progressiveOverloadRequireFullCompletion,
      });
    }

    try {
      const rows = await workouts.appendTemplateItemsBulk(userId, tid, items);
      return json({
        items: rows.map((row) => ({
          id: row.id,
          templateId: row.templateId,
          exerciseId: row.exerciseId,
          order: row.order,
          targetSets: row.targetSets,
          targetReps: row.targetReps,
          targetDurationSec: row.targetDurationSec,
          targetDistance: row.targetDistance,
          defaultWeight: row.defaultWeight,
          weightUnit: row.weightUnit,
          progressiveOverloadEnabled: row.progressiveOverloadEnabled,
          progressiveOverloadIncrement: row.progressiveOverloadIncrement,
          progressiveOverloadRequireFullCompletion:
            row.progressiveOverloadRequireFullCompletion,
        })),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not add exercises";
      return json({ error: msg }, { status: 400 });
    }
  
}
