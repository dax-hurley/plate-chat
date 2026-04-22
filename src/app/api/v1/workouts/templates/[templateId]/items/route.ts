import { json, resolvePatUserId, unauthorized } from "@/lib/api-pat";
import * as workouts from "@/lib/services/workouts";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  ctx: { params: Promise<{ templateId: string }> }
) {
  const userId = await resolvePatUserId(request);
  if (!userId) return unauthorized();
    const { templateId } = await ctx.params;
    const tid = templateId?.trim();
    if (!tid) return json({ error: "templateId required" }, { status: 400 });

    let body: {
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
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, { status: 400 });
    }
    const exerciseId = body.exerciseId?.trim();
    if (!exerciseId) return json({ error: "exerciseId required" }, { status: 400 });

    try {
      const wu =
        body.weightUnit === undefined
          ? undefined
          : body.weightUnit === null || body.weightUnit === ""
            ? null
            : body.weightUnit === "kg" || body.weightUnit === "lb"
              ? body.weightUnit
              : null;
      const row = await workouts.appendTemplateItem(userId, {
        templateId: tid,
        exerciseId,
        targetSets: body.targetSets,
        targetReps: body.targetReps,
        targetDurationSec:
          body.targetDurationSec === undefined
            ? undefined
            : body.targetDurationSec === null
              ? null
              : Number(body.targetDurationSec),
        targetDistance:
          body.targetDistance === undefined
            ? undefined
            : body.targetDistance === null
              ? null
              : Number(body.targetDistance),
        defaultWeight:
          body.defaultWeight === undefined
            ? undefined
            : body.defaultWeight === null
              ? null
              : Number(body.defaultWeight),
        weightUnit: wu,
        progressiveOverloadEnabled: body.progressiveOverloadEnabled,
        progressiveOverloadIncrement:
          body.progressiveOverloadIncrement === undefined
            ? undefined
            : body.progressiveOverloadIncrement === null
              ? null
              : Number(body.progressiveOverloadIncrement),
        progressiveOverloadRequireFullCompletion:
          body.progressiveOverloadRequireFullCompletion,
      });
      return json({
        item: {
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
        },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not add exercise";
      return json({ error: msg }, { status: 400 });
    }
  
}
