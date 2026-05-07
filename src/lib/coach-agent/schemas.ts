import { z } from "zod";

export const vitalKeySchema = z.enum([
  "body_weight_lb",
  "body_fat_pct",
  "resting_hr",
  "sleep_hours",
  "waist_in",
  "blood_pressure_systolic",
  "blood_pressure_diastolic",
]);

/** One library recipe to create before slot assignments. */
export const coachRecipeUpsertSchema = z.object({
  name: z.string(),
  instructions: z.string().optional(),
  calories: z.number().optional(),
  proteinG: z.number().optional(),
  carbsG: z.number().optional(),
  fatG: z.number().optional(),
  ingredients: z.array(z.string()).optional(),
});

export const coachSnapshotInputSchema = z.object({
  weekStartDayKey: z
    .string()
    .optional()
    .describe("Monday YYYY-MM-DD for meal-plan slice; omit for current week"),
  maxTemplates: z
    .number()
    .int()
    .min(1)
    .max(40)
    .optional()
    .describe("Cap saved workouts listed (default 15)"),
});

export const coachMealPlanAssignmentSchema = z.object({
  dayIndex: z.number().int().min(0).max(6),
  slotIndex: z.number().int().min(0).max(50).optional(),
  libraryItemId: z.string().nullable().optional(),
  /** Resolve existing library meal by name (case-insensitive) after recipes are created */
  libraryItemName: z.string().optional(),
});

export const coachApplyWeeklyMealPlanInputSchema = z.object({
  weekStartDayKey: z.string().describe("Monday YYYY-MM-DD"),
  recipes: z.array(coachRecipeUpsertSchema).max(60).optional(),
  assignments: z.array(coachMealPlanAssignmentSchema).max(200),
});

const exerciseLineSchema = z.object({
  name: z.string().describe("Exercise name — preset or custom"),
  muscleGroup: z.string().optional(),
  logKind: z.enum(["reps", "time", "distance"]).optional(),
  targetSets: z.number().int().positive().optional(),
  targetReps: z.number().int().positive().optional(),
  targetDurationSec: z.number().int().positive().optional(),
  targetDistance: z.number().positive().optional(),
  defaultWeight: z.number().nullable().optional(),
  weightUnit: z.enum(["lb", "kg"]).nullable().optional(),
  isWarmup: z.boolean().optional(),
  restBetweenSetsSec: z.number().int().min(0).max(3600).optional(),
});

const workoutDraftSchema = z.object({
  name: z.string(),
  notes: z.string().optional(),
  exercises: z.array(exerciseLineSchema).min(1).max(80),
});

export const coachApplyWorkoutProgramInputSchema = z.object({
  programName: z.string().describe("Routine group name, e.g. Upper/Lower"),
  workouts: z.array(workoutDraftSchema).min(1).max(14),
});

const scheduleOnceSchema = z
  .object({
    templateId: z.string().optional(),
    templateName: z.string().optional(),
    dayKey: z.string(),
    notes: z.string().optional(),
  })
  .refine((o) => Boolean(o.templateId?.trim() || o.templateName?.trim()), {
    message: "Provide templateId or templateName",
  });

const recurringRuleSchema = z
  .object({
    templateId: z.string().optional(),
    templateName: z.string().optional(),
    byDay: z.array(z.number().int().min(0).max(6)).min(1),
    startDayKey: z.string(),
    untilDayKey: z.string().optional(),
    intervalWeeks: z.number().int().positive().optional(),
    notes: z.string().optional(),
  })
  .refine((o) => Boolean(o.templateId?.trim() || o.templateName?.trim()), {
    message: "Provide templateId or templateName",
  });

export const coachScheduleWorkoutsInputSchema = z.object({
  scheduleOnce: z.array(scheduleOnceSchema).max(60).optional(),
  recurringRules: z.array(recurringRuleSchema).max(8).optional(),
});

const goalPresetSchema = z.enum([
  "lose_weight",
  "gain_muscle",
  "build_strength",
  "custom",
]);

const profileSexSchema = z.enum([
  "male",
  "female",
  "transgender_man",
  "transgender_woman",
  "nonbinary",
  "other",
  "prefer_not_to_say",
]);

const activityLevelSchema = z.enum([
  "sedentary",
  "light",
  "moderate",
  "active",
  "very_active",
]);

export const coachProfilePatchInputSchema = z
  .object({
    name: z.string().nullable().optional(),
    heightIn: z.number().positive().nullable().optional(),
    sex: profileSexSchema.nullable().optional(),
    activityLevel: activityLevelSchema.nullable().optional(),
    ageYears: z.number().int().min(1).max(120).nullable().optional(),
    goalPreset: goalPresetSchema.nullable().optional(),
    fitnessGoals: z.string().nullable().optional(),
    preferences: z.string().nullable().optional(),
    goalCalories: z.number().int().min(0).max(50000).nullable().optional(),
    goalProteinG: z.number().min(0).max(1000).nullable().optional(),
    goalCarbsG: z.number().min(0).max(1000).nullable().optional(),
    goalFatG: z.number().min(0).max(1000).nullable().optional(),
  })
  .refine(
    (o) =>
      o.name !== undefined ||
      o.heightIn !== undefined ||
      o.sex !== undefined ||
      o.activityLevel !== undefined ||
      o.ageYears !== undefined ||
      o.goalPreset !== undefined ||
      o.fitnessGoals !== undefined ||
      o.preferences !== undefined ||
      o.goalCalories !== undefined ||
      o.goalProteinG !== undefined ||
      o.goalCarbsG !== undefined ||
      o.goalFatG !== undefined,
    { message: "Provide at least one field" }
  );

export const coachProgressPatchInputSchema = z.object({
  dayKey: z.string().optional().describe("YYYY-MM-DD; omit for today"),
  entries: z
    .array(
      z.object({
        vitalKey: vitalKeySchema,
        value: z.number(),
      })
    )
    .min(1)
    .max(24),
});

const mealEntrySchema = z.object({
  description: z.string().optional(),
  calories: z.number(),
  proteinG: z.number().optional(),
  carbsG: z.number().optional(),
  fatG: z.number().optional(),
});

const mealDraftSchema = z.object({
  name: z.string(),
  entries: z.array(mealEntrySchema).max(40),
});

export const coachNutritionDayPatchInputSchema = z.object({
  dayKey: z.string().describe("YYYY-MM-DD"),
  meals: z.array(mealDraftSchema).min(1).max(24),
});

export const coachRecipeFromUrlInputSchema = z.object({
  url: z
    .string()
    .min(1)
    .describe("Public http(s) recipe page URL the user shared"),
  /** If true (default), persist as a meal-library item using page title or first heading as name fallback */
  saveToLibrary: z.boolean().optional(),
  recipeName: z.string().optional().describe("Override display name when saving"),
});

export const coachShoppingListInputSchema = z.object({
  weekStartDayKey: z
    .string()
    .optional()
    .describe("Monday YYYY-MM-DD; omit for current week"),
});
