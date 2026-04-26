import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { userProfiles, userVitalEntries, users } from "@/db/schema";
import {
  parseActivityLevel,
  parseProfileSex,
  type ActivityLevel,
  type ProfileSex,
} from "@/lib/profile-demographics";
import {
  parseGoalPreset,
  type GoalPreset,
} from "@/lib/profile-goal-preset";

export type UserProfileBundle = {
  name: string | null;
  heightIn: number | null;
  sex: ProfileSex | null;
  activityLevel: ActivityLevel | null;
  ageYears: number | null;
  /** Null when onboarding has not been completed. */
  onboardingCompletedAt: Date | null;
  goalPreset: GoalPreset;
  fitnessGoals: string | null;
  preferences: string | null;
  /** Daily calorie target (kcal), if set */
  goalCalories: number | null;
  /** Daily macro targets in grams, if set */
  goalProteinG: number | null;
  goalCarbsG: number | null;
  goalFatG: number | null;
};

function normalizeMultiline(v: string | null): string | null {
  if (v === null) return null;
  const t = v.trim();
  return t === "" ? null : t;
}

export async function getProfileForUser(
  userId: string
): Promise<UserProfileBundle> {
  const u = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { name: true },
  });
  const p = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, userId),
  });
  return {
    name: u?.name ?? null,
    heightIn: p?.heightIn ?? null,
    sex: parseProfileSex(p?.sex ?? null),
    activityLevel: parseActivityLevel(p?.activityLevel ?? null),
    ageYears:
      p?.ageYears != null && Number.isFinite(p.ageYears) && p.ageYears > 0
        ? Math.round(p.ageYears)
        : null,
    onboardingCompletedAt: p?.onboardingCompletedAt ?? null,
    goalPreset: parseGoalPreset(p?.goalPreset),
    fitnessGoals: p?.fitnessGoals ?? null,
    preferences: p?.preferences ?? null,
    goalCalories:
      p?.goalCalories != null && Number.isFinite(p.goalCalories)
        ? Math.round(p.goalCalories)
        : null,
    goalProteinG:
      p?.goalProteinG != null && Number.isFinite(p.goalProteinG)
        ? p.goalProteinG
        : null,
    goalCarbsG:
      p?.goalCarbsG != null && Number.isFinite(p.goalCarbsG)
        ? p.goalCarbsG
        : null,
    goalFatG:
      p?.goalFatG != null && Number.isFinite(p.goalFatG) ? p.goalFatG : null,
  };
}

/** Height from profile, else legacy `height_in` vital (before height moved to profile). */
export async function getEffectiveHeightIn(
  userId: string
): Promise<number | null> {
  const p = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, userId),
  });
  if (p?.heightIn != null && Number.isFinite(p.heightIn) && p.heightIn > 0) {
    return p.heightIn;
  }
  const legacy = await db.query.userVitalEntries.findFirst({
    where: and(
      eq(userVitalEntries.userId, userId),
      eq(userVitalEntries.vitalKey, "height_in")
    ),
    orderBy: [desc(userVitalEntries.dayKey), desc(userVitalEntries.recordedAt)],
  });
  if (
    legacy?.value != null &&
    Number.isFinite(legacy.value) &&
    legacy.value > 0
  ) {
    return legacy.value;
  }
  return null;
}

export async function updateUserProfile(
  userId: string,
  patch: {
    name?: string | null;
    heightIn?: number | null;
    sex?: ProfileSex | string | null;
    activityLevel?: ActivityLevel | string | null;
    ageYears?: number | null;
    onboardingCompletedAt?: Date | null;
    /** API/MCP may send string; normalized with `parseGoalPreset`. */
    goalPreset?: GoalPreset | string | null;
    fitnessGoals?: string | null;
    preferences?: string | null;
    goalCalories?: number | null;
    goalProteinG?: number | null;
    goalCarbsG?: number | null;
    goalFatG?: number | null;
  }
): Promise<UserProfileBundle> {
  if (patch.name !== undefined) {
    const n = patch.name;
    await db
      .update(users)
      .set({
        name:
          n === null || (typeof n === "string" && n.trim() === "")
            ? null
            : n.trim(),
      })
      .where(eq(users.id, userId));
  }

  const hasProfileFields =
    patch.heightIn !== undefined ||
    patch.sex !== undefined ||
    patch.activityLevel !== undefined ||
    patch.ageYears !== undefined ||
    patch.onboardingCompletedAt !== undefined ||
    patch.goalPreset !== undefined ||
    patch.fitnessGoals !== undefined ||
    patch.preferences !== undefined ||
    patch.goalCalories !== undefined ||
    patch.goalProteinG !== undefined ||
    patch.goalCarbsG !== undefined ||
    patch.goalFatG !== undefined;
  if (!hasProfileFields) {
    return getProfileForUser(userId);
  }

  const existing = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, userId),
  });

  const heightIn =
    patch.heightIn !== undefined ? patch.heightIn : (existing?.heightIn ?? null);
  const sex =
    patch.sex !== undefined
      ? parseProfileSex(
          typeof patch.sex === "string" ? patch.sex : String(patch.sex ?? "")
        )
      : parseProfileSex(existing?.sex ?? null);
  const activityLevel =
    patch.activityLevel !== undefined
      ? parseActivityLevel(
          typeof patch.activityLevel === "string"
            ? patch.activityLevel
            : String(patch.activityLevel ?? "")
        )
      : parseActivityLevel(existing?.activityLevel ?? null);
  const ageYears =
    patch.ageYears !== undefined
      ? patch.ageYears != null && Number.isFinite(patch.ageYears) && patch.ageYears > 0
        ? Math.min(120, Math.max(1, Math.round(patch.ageYears)))
        : null
      : existing?.ageYears != null && Number.isFinite(existing.ageYears)
        ? Math.round(existing.ageYears)
        : null;
  const onboardingCompletedAt =
    patch.onboardingCompletedAt !== undefined
      ? patch.onboardingCompletedAt
      : (existing?.onboardingCompletedAt ?? null);
  const goalPreset =
    patch.goalPreset !== undefined
      ? parseGoalPreset(patch.goalPreset)
      : parseGoalPreset(existing?.goalPreset);
  const fitnessGoals =
    patch.fitnessGoals !== undefined
      ? normalizeMultiline(patch.fitnessGoals)
      : (existing?.fitnessGoals ?? null);
  const preferences =
    patch.preferences !== undefined
      ? normalizeMultiline(patch.preferences)
      : (existing?.preferences ?? null);

  const goalCalories =
    patch.goalCalories !== undefined
      ? patch.goalCalories
      : (existing?.goalCalories ?? null);
  const goalProteinG =
    patch.goalProteinG !== undefined
      ? patch.goalProteinG
      : (existing?.goalProteinG ?? null);
  const goalCarbsG =
    patch.goalCarbsG !== undefined
      ? patch.goalCarbsG
      : (existing?.goalCarbsG ?? null);
  const goalFatG =
    patch.goalFatG !== undefined
      ? patch.goalFatG
      : (existing?.goalFatG ?? null);

  if (existing) {
    const now = new Date();
    await db
      .update(userProfiles)
      .set({
        heightIn,
        sex,
        activityLevel,
        ageYears,
        onboardingCompletedAt,
        goalPreset,
        fitnessGoals,
        preferences,
        goalCalories,
        goalProteinG,
        goalCarbsG,
        goalFatG,
        updatedAt: now,
        rev: (existing.rev ?? 0) + 1,
      })
      .where(eq(userProfiles.userId, userId));
  } else {
    await db.insert(userProfiles).values({
      userId,
      heightIn,
      sex,
      activityLevel,
      ageYears,
      onboardingCompletedAt,
      goalPreset,
      fitnessGoals,
      preferences,
      goalCalories,
      goalProteinG,
      goalCarbsG,
      goalFatG,
    });
  }

  return getProfileForUser(userId);
}
