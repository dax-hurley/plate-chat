import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { formatDayKey } from "@/lib/date-key";
import * as profile from "@/lib/services/profile";
import { upsertVitalEntry } from "@/lib/services/progress";
import { authenticateBearer } from "@/server/auth/device-tokens";

const profileSexZ = z.enum([
  "male",
  "female",
  "transgender_man",
  "transgender_woman",
  "nonbinary",
  "other",
  "prefer_not_to_say",
]);
const activityZ = z.enum([
  "sedentary",
  "light",
  "moderate",
  "active",
  "very_active",
]);

const goalPresetZ = z.enum([
  "lose_weight",
  "gain_muscle",
  "build_strength",
  "custom",
]);

const patchBodySchema = z
  .object({
    name: z.string().nullable().optional(),
    heightIn: z.number().positive().nullable().optional(),
    sex: profileSexZ.nullable().optional(),
    activityLevel: activityZ.nullable().optional(),
    ageYears: z.number().int().min(1).max(120).nullable().optional(),
    goalPreset: goalPresetZ.optional(),
    /** When set, logs `body_weight_lb` for the given or current calendar day. */
    weightLb: z.number().positive().max(2000).optional(),
    dayKey: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    markOnboardingComplete: z.boolean().optional(),
  })
  .refine(
    (o) =>
      o.name !== undefined ||
      o.heightIn !== undefined ||
      o.sex !== undefined ||
      o.activityLevel !== undefined ||
      o.ageYears !== undefined ||
      o.weightLb !== undefined ||
      o.goalPreset !== undefined ||
      o.markOnboardingComplete === true,
    { message: "No profile fields" }
  );

function jsonForBundle(p: profile.UserProfileBundle) {
  return {
    name: p.name,
    heightIn: p.heightIn,
    sex: p.sex,
    activityLevel: p.activityLevel,
    ageYears: p.ageYears,
    onboardingCompletedAt: p.onboardingCompletedAt
      ? p.onboardingCompletedAt.getTime()
      : null,
    goalPreset: p.goalPreset,
    fitnessGoals: p.fitnessGoals,
    preferences: p.preferences,
    goalCalories: p.goalCalories,
    goalProteinG: p.goalProteinG,
    goalCarbsG: p.goalCarbsG,
    goalFatG: p.goalFatG,
  };
}

export const Route = createFileRoute("/api/user/profile")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const claims = await authenticateBearer(request);
        if (!claims) {
          return new Response("Unauthorized", { status: 401 });
        }
        const bundle = await profile.getProfileForUser(claims.userId);
        return Response.json(jsonForBundle(bundle));
      },
      PATCH: async ({ request }) => {
        const claims = await authenticateBearer(request);
        if (!claims) {
          return new Response("Unauthorized", { status: 401 });
        }
        const raw = await request.json().catch(() => null);
        const parsed = patchBodySchema.safeParse(raw);
        if (!parsed.success) {
          return new Response("Bad request", { status: 400 });
        }
        const b = parsed.data;
        const uid = claims.userId;
        if (b.weightLb !== undefined) {
          await upsertVitalEntry(uid, {
            vitalKey: "body_weight_lb",
            value: b.weightLb,
            dayKey: b.dayKey?.trim() || formatDayKey(),
          });
        }
        const onlyWeight =
          b.weightLb !== undefined &&
          b.name === undefined &&
          b.heightIn === undefined &&
          b.sex === undefined &&
          b.activityLevel === undefined &&
          b.ageYears === undefined &&
          b.goalPreset === undefined &&
          b.markOnboardingComplete !== true;
        if (onlyWeight) {
          const bundle = await profile.getProfileForUser(uid);
          return Response.json(jsonForBundle(bundle));
        }
        const bundle = await profile.updateUserProfile(uid, {
          name: b.name,
          heightIn: b.heightIn,
          sex: b.sex,
          activityLevel: b.activityLevel,
          ageYears: b.ageYears,
          goalPreset: b.goalPreset,
          onboardingCompletedAt:
            b.markOnboardingComplete === true ? new Date() : undefined,
        });
        return Response.json(jsonForBundle(bundle));
      },
    },
  },
});
