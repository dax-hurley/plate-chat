import { json, resolvePatUserId, unauthorized } from "@/lib/api-pat";
import type { GoalPreset } from "@/lib/profile-goal-preset";
import * as profile from "@/lib/services/profile";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const userId = await resolvePatUserId(request);
  if (!userId) return unauthorized();
  const p = await profile.getProfileForUser(userId);
  return json(p);
  
}

export async function PATCH(request: Request) {
  const userId = await resolvePatUserId(request);
  if (!userId) return unauthorized();
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (body === null || typeof body !== "object") {
    return json({ error: "Expected JSON object" }, { status: 400 });
  }
  const o = body as Record<string, unknown>;
  const patch: Parameters<typeof profile.updateUserProfile>[1] = {};
  if ("name" in o) {
    if (o.name === null) {
      patch.name = null;
    } else if (typeof o.name === "string") {
      patch.name = o.name;
    } else {
      return json({ error: "name must be a string or null" }, { status: 400 });
    }
  }
  if ("heightIn" in o) {
    if (o.heightIn === null) {
      patch.heightIn = null;
    } else if (typeof o.heightIn === "number" && Number.isFinite(o.heightIn)) {
      patch.heightIn = o.heightIn;
    } else {
      return json(
        { error: "heightIn must be a finite number or null" },
        { status: 400 }
      );
    }
  }
  if ("goalPreset" in o) {
    if (o.goalPreset === null) {
      patch.goalPreset = null;
    } else if (
      typeof o.goalPreset === "string" &&
      ["lose_weight", "gain_muscle", "build_strength", "custom"].includes(
        o.goalPreset
      )
    ) {
      patch.goalPreset = o.goalPreset as GoalPreset;
    } else {
      return json(
        {
          error:
            "goalPreset must be lose_weight, gain_muscle, build_strength, custom, or null",
        },
        { status: 400 }
      );
    }
  }
  if ("fitnessGoals" in o) {
    patch.fitnessGoals =
      o.fitnessGoals === null
        ? null
        : typeof o.fitnessGoals === "string"
          ? o.fitnessGoals
          : undefined;
    if (
      o.fitnessGoals !== null &&
      o.fitnessGoals !== undefined &&
      typeof o.fitnessGoals !== "string"
    ) {
      return json(
        { error: "fitnessGoals must be a string or null" },
        { status: 400 }
      );
    }
  }
  if ("preferences" in o) {
    patch.preferences =
      o.preferences === null
        ? null
        : typeof o.preferences === "string"
          ? o.preferences
          : undefined;
    if (
      o.preferences !== null &&
      o.preferences !== undefined &&
      typeof o.preferences !== "string"
    ) {
      return json(
        { error: "preferences must be a string or null" },
        { status: 400 }
      );
    }
  }
  if ("goalCalories" in o) {
    const v = o.goalCalories;
    if (v === null) {
      patch.goalCalories = null;
    } else if (typeof v === "number" && Number.isFinite(v)) {
      const n = Math.round(v);
      if (n < 0 || n > 50000) {
        return json(
          { error: "goalCalories must be between 0 and 50000 or null" },
          { status: 400 }
        );
      }
      patch.goalCalories = n;
    } else {
      return json(
        { error: "goalCalories must be an integer, null, or omitted" },
        { status: 400 }
      );
    }
  }
  if ("goalProteinG" in o) {
    const v = o.goalProteinG;
    if (v === null) {
      patch.goalProteinG = null;
    } else if (typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1000) {
      patch.goalProteinG = v;
    } else {
      return json(
        { error: "goalProteinG must be a number 0–1000, null, or omitted" },
        { status: 400 }
      );
    }
  }
  if ("goalCarbsG" in o) {
    const v = o.goalCarbsG;
    if (v === null) {
      patch.goalCarbsG = null;
    } else if (typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1000) {
      patch.goalCarbsG = v;
    } else {
      return json(
        { error: "goalCarbsG must be a number 0–1000, null, or omitted" },
        { status: 400 }
      );
    }
  }
  if ("goalFatG" in o) {
    const v = o.goalFatG;
    if (v === null) {
      patch.goalFatG = null;
    } else if (typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1000) {
      patch.goalFatG = v;
    } else {
      return json(
        { error: "goalFatG must be a number 0–1000, null, or omitted" },
        { status: 400 }
      );
    }
  }

  if (
    patch.name === undefined &&
    patch.heightIn === undefined &&
    patch.goalPreset === undefined &&
    patch.fitnessGoals === undefined &&
    patch.preferences === undefined &&
    patch.goalCalories === undefined &&
    patch.goalProteinG === undefined &&
    patch.goalCarbsG === undefined &&
    patch.goalFatG === undefined
  ) {
    return json({ error: "No valid fields to update" }, { status: 400 });
  }
  const next = await profile.updateUserProfile(userId, patch);
  return json(next);
  
}
