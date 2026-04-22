import { json, resolvePatUserId, unauthorized } from "@/lib/api-pat";
import * as workouts from "@/lib/services/workouts";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  ctx: { params: Promise<{ sessionId: string }> }
) {
  const userId = await resolvePatUserId(request);
  if (!userId) return unauthorized();
    const { sessionId } = await ctx.params;
    let body: {
      exerciseId?: string;
      setIndex?: number;
      reps?: number;
      durationSec?: number;
      distance?: number;
      weight?: number;
    };
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, { status: 400 });
    }
    const exerciseId = body.exerciseId?.trim();
    const setIndex = Number(body.setIndex);
    const reps = body.reps !== undefined ? Number(body.reps) : NaN;
    const durationSec =
      body.durationSec !== undefined ? Number(body.durationSec) : NaN;
    const distance =
      body.distance !== undefined ? Number(body.distance) : NaN;
    const weight = Number(body.weight);
    if (
      !exerciseId ||
      !Number.isFinite(setIndex) ||
      !Number.isFinite(weight) ||
      (!Number.isFinite(reps) &&
        !Number.isFinite(durationSec) &&
        !Number.isFinite(distance))
    ) {
      return json(
        {
          error:
            "exerciseId, setIndex, weight required; plus reps, durationSec, or distance",
        },
        { status: 400 }
      );
    }
    try {
      const row = await workouts.logSet(userId, {
        sessionId,
        exerciseId,
        setIndex: Math.round(setIndex),
        weight,
        reps: Number.isFinite(reps) ? Math.round(reps) : undefined,
        durationSec: Number.isFinite(durationSec)
          ? Math.round(durationSec)
          : undefined,
        distance: Number.isFinite(distance) ? distance : undefined,
      });
      return json({ set: row });
    } catch {
      return json({ error: "Could not log set" }, { status: 400 });
    }
  
}
