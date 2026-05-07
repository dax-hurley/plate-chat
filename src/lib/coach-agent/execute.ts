import { formatDayKey, mondayOfWeekContaining, parseDayKey } from "@/lib/date-key";
import { generateShoppingListForMealPlan } from "@/lib/ai-shopping-list";
import { jsonMealLibraryItem, jsonMealPlanBase } from "@/lib/meal-planning-api";
import { parseExerciseLogKind } from "@/lib/log-kind";
import { stripRecipeMarkdownImagesAndLinks } from "@/lib/recipe-markdown-strip";
import { scrapeUrlToMarkdown } from "@/lib/services/firecrawl-scrape";
import * as mealLibrary from "@/lib/services/meal-library";
import * as mealPlan from "@/lib/services/meal-plan";
import * as nutrition from "@/lib/services/nutrition";
import * as profile from "@/lib/services/profile";
import * as progress from "@/lib/services/progress";
import * as workouts from "@/lib/services/workouts";

import {
  coachApplyWeeklyMealPlanInputSchema,
  coachApplyWorkoutProgramInputSchema,
  coachNutritionDayPatchInputSchema,
  coachProfilePatchInputSchema,
  coachProgressPatchInputSchema,
  coachRecipeFromUrlInputSchema,
  coachScheduleWorkoutsInputSchema,
  coachShoppingListInputSchema,
  coachSnapshotInputSchema,
} from "./schemas";

function normName(s: string) {
  return s.trim().toLowerCase();
}

async function resolveTemplateId(
  userId: string,
  templateId: string | undefined,
  templateName: string | undefined
): Promise<string> {
  const tid = templateId?.trim();
  if (tid) {
    const t = await workouts.getTemplate(userId, tid);
    if (t) return t.id;
    throw new Error(`Workout template not found: ${tid}`);
  }
  const tname = templateName?.trim();
  if (tname) {
    const list = await workouts.listTemplates(userId);
    const found = list.find((x) => normName(x.name) === normName(tname));
    if (found) return found.id;
    throw new Error(`No saved workout named "${tname}"`);
  }
  throw new Error("Provide templateId or templateName");
}

export async function executeCoachSnapshot(
  userId: string,
  raw: unknown
): Promise<unknown> {
  const input = coachSnapshotInputSchema.parse(raw ?? {});
  const weekRaw = input.weekStartDayKey?.trim();
  const weekStart =
    weekRaw && parseDayKey(weekRaw)
      ? weekRaw
      : mondayOfWeekContaining(formatDayKey(new Date()));
  const maxT = input.maxTemplates ?? 15;

  const [profileBundle, vitalsMap, plan, templates, routineLib, active] =
    await Promise.all([
      profile.getProfileForUser(userId),
      progress.getLatestVitalMap(userId),
      mealPlan.getOrCreatePlanForWeek(userId, weekStart),
      workouts.listTemplates(userId),
      workouts.listWorkoutRoutinesLibrary(userId),
      workouts.getActiveSession(userId),
    ]);

  const vitals: Record<string, { value: number; dayKey: string }> = {};
  for (const [k, v] of vitalsMap) {
    if (k === "height_in") continue;
    vitals[k] = { value: v.value, dayKey: v.dayKey };
  }

  const mealPreview = plan ? jsonMealPlanBase(plan) : null;

  const tSlice = templates.slice(0, maxT).map((t) => ({
    id: t.id,
    name: t.name,
    exerciseCount: t.items?.length ?? 0,
  }));

  return {
    profile: profileBundle,
    vitalsLatest: vitals,
    mealPlanWeekStart: weekStart,
    mealPlan: mealPreview,
    savedWorkouts: tSlice,
    workoutRoutines: {
      groups: routineLib.groups.map((g) => ({
        id: g.id,
        name: g.name,
        templateIds: g.templates.map((x) => x.id),
      })),
      ungroupedTemplateIds: routineLib.ungrouped.map((x) => x.id),
    },
    activeWorkout: active
      ? {
          sessionId: active.id,
          dayKey: formatDayKey(active.startedAt),
          templateId: active.templateId,
          templateName: active.template?.name ?? null,
          startedAt: active.startedAt.toISOString(),
        }
      : null,
  };
}

export async function executeCoachApplyWeeklyMealPlan(
  userId: string,
  raw: unknown
): Promise<unknown> {
  const input = coachApplyWeeklyMealPlanInputSchema.parse(raw ?? {});
  const weekStart = input.weekStartDayKey.trim();
  if (!parseDayKey(weekStart)) throw new Error("Invalid weekStartDayKey");

  const nameToId = new Map<string, string>();

  const recipeRows = await Promise.all(
    (input.recipes ?? []).map((r) =>
      mealLibrary.createLibraryItem(userId, {
        name: r.name.trim(),
        instructions: r.instructions?.trim() ?? "",
        calories: r.calories ?? 0,
        proteinG: r.proteinG ?? 0,
        carbsG: r.carbsG ?? 0,
        fatG: r.fatG ?? 0,
        ingredients: (r.ingredients ?? []).map((line) => ({ line: String(line) })),
      })
    )
  );
  for (const row of recipeRows) {
    if (row) nameToId.set(normName(row.name), row.id);
  }

  const allLib = await mealLibrary.listLibraryItems(userId);
  const libByNorm = new Map<string, string>();
  for (const item of allLib) {
    libByNorm.set(normName(item.name), item.id);
  }

  const resolveLibId = (
    libraryItemId?: string | null,
    libraryItemName?: string
  ): string | null => {
    if (libraryItemId != null && libraryItemId !== "") {
      return libraryItemId.trim();
    }
    if (libraryItemName?.trim()) {
      const byRecipe = nameToId.get(normName(libraryItemName));
      if (byRecipe) return byRecipe;
      const fromLib = libByNorm.get(normName(libraryItemName));
      if (fromLib) return fromLib;
      throw new Error(`Unknown meal library item: "${libraryItemName}"`);
    }
    return null;
  };

  const assignments = input.assignments.map((a) => {
    const libraryItemId = resolveLibId(a.libraryItemId, a.libraryItemName);
    return {
      dayIndex: a.dayIndex,
      ...(a.slotIndex !== undefined ? { slotIndex: a.slotIndex } : {}),
      libraryItemId,
    };
  });

  const plan = await mealPlan.setPlanSlotsBatch(userId, {
    weekStartDayKey: weekStart,
    assignments,
  });
  if (!plan) return { error: "failed" as const };
  return await jsonMealPlanBase(plan);
}

export async function executeCoachApplyWorkoutProgram(
  userId: string,
  raw: unknown
): Promise<unknown> {
  const input = coachApplyWorkoutProgramInputSchema.parse(raw ?? {});
  const group = await workouts.createRoutineGroup(userId, {
    name: input.programName.trim(),
  });

  const catalog = await workouts.listUserExercises(userId);
  const idByNormName = new Map<string, string>();
  for (const e of catalog) {
    idByNormName.set(normName(e.name), e.id);
  }

  const firstMissingSpecByNorm = new Map<
    string,
    (typeof input.workouts)[number]["exercises"][number]
  >();
  for (const w of input.workouts) {
    for (const ex of w.exercises) {
      const k = normName(ex.name);
      if (!idByNormName.has(k) && !firstMissingSpecByNorm.has(k)) {
        firstMissingSpecByNorm.set(k, ex);
      }
    }
  }

  await Promise.all(
    [...firstMissingSpecByNorm.entries()].map(async ([k, ex]) => {
      const lk = parseExerciseLogKind(ex.logKind);
      const row = await workouts.createExercise(userId, {
        name: ex.name.trim(),
        muscleGroup: ex.muscleGroup?.trim(),
        logKind: lk,
        defaultDurationSec: lk === "time" ? 60 : null,
        defaultDistance: null,
        distanceUnit: undefined,
        weightUnit: ex.weightUnit ?? "lb",
      });
      idByNormName.set(k, row.id);
    })
  );

  const prepared = await Promise.all(
    input.workouts.map(async (w) => {
      const tmpl = await workouts.createTemplate(userId, {
        name: w.name.trim(),
        notes: w.notes?.trim(),
      });

      const lines = w.exercises.map((ex) => {
        const exerciseId = idByNormName.get(normName(ex.name));
        if (!exerciseId) {
          throw new Error(`Unresolved exercise: "${ex.name}"`);
        }
        return {
          exerciseId,
          targetSets: ex.targetSets,
          targetReps: ex.targetReps,
          targetDurationSec: ex.targetDurationSec,
          targetDistance: ex.targetDistance,
          defaultWeight: ex.defaultWeight,
          weightUnit: ex.weightUnit,
          isWarmup: ex.isWarmup,
          restBetweenSetsSec: ex.restBetweenSetsSec,
        };
      });

      await workouts.appendTemplateItemsBulk(userId, tmpl.id, lines);
      return { tmpl, lines };
    })
  );

  const created: {
    templateId: string;
    name: string;
    exerciseIds: string[];
  }[] = [];

  for (const p of prepared) {
    await workouts.setTemplateRoutineGroup(userId, p.tmpl.id, group.id);
    created.push({
      templateId: p.tmpl.id,
      name: p.tmpl.name,
      exerciseIds: p.lines.map((l) => l.exerciseId),
    });
  }

  return {
    routineGroupId: group.id,
    routineName: group.name,
    workouts: created,
  };
}

export async function executeCoachScheduleWorkouts(
  userId: string,
  raw: unknown
): Promise<unknown> {
  const input = coachScheduleWorkoutsInputSchema.parse(raw ?? {});
  const onceOut = await Promise.all(
    (input.scheduleOnce ?? []).map(async (s) => {
      const templateId = await resolveTemplateId(
        userId,
        s.templateId,
        s.templateName
      );
      const row = await workouts.createScheduledWorkout(userId, {
        templateId,
        dayKey: s.dayKey.trim(),
        notes: s.notes?.trim(),
      });
      return {
        id: row.id,
        dayKey: row.dayKey,
        templateId: row.templateId,
      };
    })
  );

  const recurOut = await Promise.all(
    (input.recurringRules ?? []).map(async (r) => {
      const templateId = await resolveTemplateId(
        userId,
        r.templateId,
        r.templateName
      );
      const row = await workouts.createRecurringWorkoutRule(userId, {
        templateId,
        byDay: r.byDay,
        startDayKey: r.startDayKey.trim(),
        untilDayKey: r.untilDayKey?.trim(),
        intervalWeeks: r.intervalWeeks,
        notes: r.notes?.trim(),
      });
      return { id: row.id, templateId: row.templateId };
    })
  );

  return { scheduled: onceOut, recurringRules: recurOut };
}

export async function executeCoachProfilePatch(
  userId: string,
  raw: unknown
): Promise<unknown> {
  const input = coachProfilePatchInputSchema.parse(raw ?? {});
  return profile.updateUserProfile(userId, input);
}

export async function executeCoachProgressPatch(
  userId: string,
  raw: unknown
): Promise<unknown> {
  const input = coachProgressPatchInputSchema.parse(raw ?? {});
  const saved = await Promise.all(
    input.entries.map(async (e) => {
      const row = await progress.upsertVitalEntry(userId, {
        vitalKey: e.vitalKey,
        value: e.value,
        dayKey: input.dayKey?.trim(),
      });
      return {
        id: row.id,
        vitalKey: row.vitalKey,
        dayKey: row.dayKey,
        value: row.value,
        recordedAt: row.recordedAt.toISOString(),
      };
    })
  );
  return { saved };
}

export async function executeCoachNutritionDayPatch(
  userId: string,
  raw: unknown
): Promise<unknown> {
  const input = coachNutritionDayPatchInputSchema.parse(raw ?? {});
  const dayKey = input.dayKey.trim();
  if (!parseDayKey(dayKey)) throw new Error("Invalid dayKey");

  const meals = await Promise.all(
    input.meals.map(async (m) => {
      const meal = await nutrition.createMeal(userId, {
        dayKey,
        name: m.name.trim(),
      });
      await Promise.all(
        m.entries.map((e) =>
          nutrition.addMealEntry(userId, {
            mealId: meal.id,
            description: e.description,
            calories: e.calories,
            proteinG: e.proteinG ?? 0,
            carbsG: e.carbsG ?? 0,
            fatG: e.fatG ?? 0,
          })
        )
      );
      return {
        mealId: meal.id,
        name: meal.name,
        entryCount: m.entries.length,
      };
    })
  );
  return { dayKey, meals };
}

export async function executeCoachRecipeFromUrl(
  userId: string,
  raw: unknown
): Promise<unknown> {
  const input = coachRecipeFromUrlInputSchema.parse(raw ?? {});
  const result = await scrapeUrlToMarkdown(input.url);
  if (!result.ok) {
    return {
      error: result.error,
      ...(result.status !== undefined ? { httpStatus: result.status } : {}),
    };
  }
  const markdown = stripRecipeMarkdownImagesAndLinks(result.markdown);
  const save = input.saveToLibrary !== false;
  if (!save) {
    return {
      sourceUrl: result.sourceUrl,
      markdown,
      pageTitle: result.title,
      truncated: result.truncated,
      saved: false as const,
    };
  }
  const baseName =
    input.recipeName?.trim() ||
    result.title?.trim() ||
    "Imported recipe";
  const row = await mealLibrary.createLibraryItem(userId, {
    name: baseName.slice(0, 200),
    instructions: markdown.slice(0, 50_000),
    calories: 0,
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
    ingredients: [],
  });
  if (!row) return { error: "save_failed" as const };
  return {
    sourceUrl: result.sourceUrl,
    pageTitle: result.title,
    truncated: result.truncated,
    saved: true as const,
    item: jsonMealLibraryItem(row),
  };
}

export async function executeCoachShoppingList(
  userId: string,
  raw: unknown
): Promise<unknown> {
  const input = coachShoppingListInputSchema.parse(raw ?? {});
  const rawWeek = input.weekStartDayKey?.trim();
  const week =
    rawWeek && parseDayKey(rawWeek) ? rawWeek : mondayOfWeekContaining(formatDayKey());
  const plan = await mealPlan.getOrCreatePlanForWeek(userId, week);
  if (!plan) return { error: "failed" as const };
  const shoppingList = await generateShoppingListForMealPlan(plan);
  return {
    weekStartDayKey: plan.weekStartDayKey,
    shoppingList,
  };
}

/** Exported for tests / tooling */
export type CoachAgentToolName =
  | "coach_snapshot"
  | "coach_apply_weekly_meal_plan"
  | "coach_apply_workout_program"
  | "coach_schedule_workouts"
  | "coach_profile_patch"
  | "coach_progress_patch"
  | "coach_nutrition_day_patch"
  | "coach_recipe_from_url"
  | "coach_shopping_list";
