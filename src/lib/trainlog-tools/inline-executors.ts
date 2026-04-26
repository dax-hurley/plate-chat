import {
  formatDayKey,
  formatMonthKey,
  mondayOfWeekContaining,
  monthDayKeyRange,
  parseDayKey,
} from "@/lib/date-key";
import { generateShoppingListForMealPlan } from "@/lib/ai-shopping-list";
import { jsonMealLibraryItem, jsonMealPlan } from "@/lib/meal-planning-api";
import * as mealLibrary from "@/lib/services/meal-library";
import * as mealPlan from "@/lib/services/meal-plan";
import * as nutrition from "@/lib/services/nutrition";
import * as profile from "@/lib/services/profile";
import * as progress from "@/lib/services/progress";
import * as workouts from "@/lib/services/workouts";

import { parseExerciseLogKind } from "@/lib/log-kind";
import { stripRecipeMarkdownImagesAndLinks } from "@/lib/recipe-markdown-strip";
import { scrapeUrlToMarkdown } from "@/lib/services/firecrawl-scrape";

import {
  parseTrainlogToolInput,
  type TrainlogToolName,
} from "./definitions";

export async function runTrainlogToolInline(
  name: TrainlogToolName,
  userId: string,
  rawInput: unknown
): Promise<unknown> {
  const input = parseTrainlogToolInput(name, rawInput);
  switch (name) {
    case "list_workout_templates":
      return workouts.listTemplates(userId);

    case "create_workout_template": {
      const { name: n, notes } = input as {
        name: string;
        notes?: string;
      };
      const row = await workouts.createTemplate(userId, {
        name: n.trim(),
        notes: notes?.trim(),
      });
      return {
        id: row.id,
        name: row.name,
        notes: row.notes,
      };
    }

    case "update_workout_template": {
      const { templateId, name, notes } = input as {
        templateId: string;
        name?: string;
        notes?: string | null;
      };
      const row = await workouts.updateWorkoutTemplate(
        userId,
        templateId.trim(),
        { name, notes }
      );
      return {
        id: row.id,
        name: row.name,
        notes: row.notes,
      };
    }

    case "list_exercises": {
      const list = await workouts.listUserExercises(userId);
      return list.map((e) => ({
        id: e.id,
        name: e.name,
        muscleGroup: e.muscleGroup,
        isPreset: e.userId == null,
        logKind: e.logKind ?? "reps",
        defaultDurationSec: e.defaultDurationSec,
        defaultDistance: e.defaultDistance,
        distanceUnit: e.distanceUnit ?? "km",
        weightUnit: e.weightUnit ?? "lb",
      }));
    }

    case "create_exercise": {
      const {
        name: exerciseName,
        muscleGroup,
        logKind: logKindRaw,
        defaultDurationSec,
        defaultDistance,
        distanceUnit,
        weightUnit,
      } = input as {
        name: string;
        muscleGroup?: string;
        logKind?: "reps" | "time" | "distance";
        defaultDurationSec?: number;
        defaultDistance?: number;
        distanceUnit?: "km" | "mi" | "m";
        weightUnit?: "lb" | "kg";
      };
      const lk = parseExerciseLogKind(logKindRaw);
      const row = await workouts.createExercise(userId, {
        name: exerciseName.trim(),
        muscleGroup: muscleGroup?.trim(),
        logKind: lk,
        defaultDurationSec:
          lk === "time" ? (defaultDurationSec ?? 60) : null,
        defaultDistance: lk === "distance" ? defaultDistance : null,
        distanceUnit: lk === "distance" ? distanceUnit : undefined,
        weightUnit: weightUnit ?? "lb",
      });
      return {
        id: row.id,
        name: row.name,
        muscleGroup: row.muscleGroup,
        logKind: row.logKind,
        defaultDurationSec: row.defaultDurationSec,
        defaultDistance: row.defaultDistance,
        distanceUnit: row.distanceUnit ?? "km",
        weightUnit: row.weightUnit ?? "lb",
      };
    }

    case "add_exercise_to_template": {
      const i = input as {
        templateId: string;
        exerciseId: string;
        targetSets?: number;
        targetReps?: number;
        targetDurationSec?: number;
        targetDistance?: number;
        defaultWeight?: number | null;
        weightUnit?: "lb" | "kg" | null;
        progressiveOverloadEnabled?: boolean;
        progressiveOverloadIncrement?: number | null;
        progressiveOverloadRequireFullCompletion?: boolean;
        isWarmup?: boolean;
        restBetweenSetsSec?: number;
      };
      const row = await workouts.appendTemplateItem(userId, {
        templateId: i.templateId.trim(),
        exerciseId: i.exerciseId.trim(),
        targetSets: i.targetSets,
        targetReps: i.targetReps,
        targetDurationSec: i.targetDurationSec,
        targetDistance: i.targetDistance,
        defaultWeight: i.defaultWeight,
        weightUnit: i.weightUnit,
        progressiveOverloadEnabled: i.progressiveOverloadEnabled,
        progressiveOverloadIncrement: i.progressiveOverloadIncrement,
        progressiveOverloadRequireFullCompletion:
          i.progressiveOverloadRequireFullCompletion,
        isWarmup: i.isWarmup,
        restBetweenSetsSec: i.restBetweenSetsSec,
      });
      return {
        itemId: row.id,
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
        isWarmup: row.isWarmup,
        restBetweenSetsSec: row.restBetweenSetsSec,
      };
    }

    case "bulk_add_exercises_to_template": {
      const { templateId, exercises } = input as {
        templateId: string;
        exercises: Array<{
          exerciseId: string;
          targetSets?: number;
          targetReps?: number;
          targetDurationSec?: number;
          targetDistance?: number;
          defaultWeight?: number | null;
          weightUnit?: "lb" | "kg" | null;
          progressiveOverloadEnabled?: boolean;
          progressiveOverloadIncrement?: number | null;
          progressiveOverloadRequireFullCompletion?: boolean;
          isWarmup?: boolean;
          restBetweenSetsSec?: number;
        }>;
      };
      const rows = await workouts.appendTemplateItemsBulk(
        userId,
        templateId.trim(),
        exercises.map((i) => ({
          exerciseId: i.exerciseId,
          targetSets: i.targetSets,
          targetReps: i.targetReps,
          targetDurationSec: i.targetDurationSec,
          targetDistance: i.targetDistance,
          defaultWeight: i.defaultWeight,
          weightUnit: i.weightUnit,
          progressiveOverloadEnabled: i.progressiveOverloadEnabled,
          progressiveOverloadIncrement: i.progressiveOverloadIncrement,
          progressiveOverloadRequireFullCompletion:
            i.progressiveOverloadRequireFullCompletion,
          isWarmup: i.isWarmup,
          restBetweenSetsSec: i.restBetweenSetsSec,
        }))
      );
      return {
        items: rows.map((row) => ({
          itemId: row.id,
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
          isWarmup: row.isWarmup,
          restBetweenSetsSec: row.restBetweenSetsSec,
        })),
      };
    }

    case "list_workout_routines": {
      const lib = await workouts.listWorkoutRoutinesLibrary(userId);
      return {
        groups: lib.groups.map((g) => ({
          id: g.id,
          name: g.name,
          sortOrder: g.sortOrder,
          createdAt: g.createdAt.toISOString(),
          templates: g.templates.map((t) => ({
            id: t.id,
            name: t.name,
            routineOrder: t.routineOrder ?? null,
          })),
        })),
        ungrouped: lib.ungrouped.map((t) => ({
          id: t.id,
          name: t.name,
        })),
      };
    }

    case "create_workout_routine": {
      const { name } = input as { name: string };
      const row = await workouts.createRoutineGroup(userId, {
        name: name.trim(),
      });
      return {
        id: row.id,
        name: row.name,
        sortOrder: row.sortOrder,
        createdAt: row.createdAt.toISOString(),
      };
    }

    case "assign_workout_to_routine": {
      const { templateId, routineGroupId } = input as {
        templateId: string;
        routineGroupId: string | null;
      };
      await workouts.setTemplateRoutineGroup(
        userId,
        templateId.trim(),
        routineGroupId
      );
      const t = await workouts.getTemplate(userId, templateId.trim());
      return {
        templateId: templateId.trim(),
        routineGroupId: t?.routineGroupId ?? null,
        routineOrder: t?.routineOrder ?? null,
      };
    }

    case "rename_workout_routine": {
      const { routineGroupId, name } = input as {
        routineGroupId: string;
        name: string;
      };
      const row = await workouts.renameRoutineGroup(
        userId,
        routineGroupId.trim(),
        name.trim()
      );
      return {
        id: row.id,
        name: row.name,
        sortOrder: row.sortOrder,
      };
    }

    case "delete_workout_routine": {
      const { routineGroupId } = input as { routineGroupId: string };
      await workouts.deleteRoutineGroup(userId, routineGroupId.trim());
      return { ok: true as const, routineGroupId: routineGroupId.trim() };
    }

    case "list_workout_schedule": {
      const inp = input as {
        month?: string;
        from?: string;
        to?: string;
      };
      let from: string;
      let to: string;
      const m = inp.month?.trim();
      if (m) {
        const range = monthDayKeyRange(m);
        if (!range) throw new Error("Invalid month (YYYY-MM)");
        from = range.first;
        to = range.last;
      } else if (inp.from?.trim() && inp.to?.trim()) {
        const f = inp.from.trim();
        const t = inp.to.trim();
        if (!parseDayKey(f) || !parseDayKey(t))
          throw new Error("Invalid from/to day keys");
        if (f > t) throw new Error("from must be <= to");
        from = f;
        to = t;
      } else {
        const range = monthDayKeyRange(formatMonthKey(new Date()))!;
        from = range.first;
        to = range.last;
      }
      const [scheduled, sessions, planned, recurringRules] =
        await Promise.all([
          workouts.listScheduledInRange(userId, from, to),
          workouts.listSessionsStartedInDayRange(userId, from, to),
          workouts.listPlannedWorkoutsInRange(userId, from, to),
          workouts.listRecurringRules(userId),
        ]);
      return {
        from,
        to,
        planned,
        recurringRules: recurringRules.map((r) => {
          let byDay: unknown = [];
          try {
            byDay = JSON.parse(r.byDay) as unknown;
          } catch {
            /* keep [] */
          }
          return {
            id: r.id,
            templateId: r.templateId,
            templateName: r.template.name,
            intervalWeeks: r.intervalWeeks,
            byDay,
            startDayKey: r.startDayKey,
            untilDayKey: r.untilDayKey,
            notes: r.notes,
            createdAt: r.createdAt,
          };
        }),
        scheduled: scheduled.map((s) => ({
          id: s.id,
          dayKey: s.dayKey,
          notes: s.notes,
          templateId: s.templateId,
          templateName: s.template.name,
          createdAt: s.createdAt,
        })),
        sessions: sessions.map((s) => ({
          id: s.id,
          dayKey: s.dayKey,
          status: s.status,
          startedAt: s.startedAt,
          endedAt: s.endedAt,
          templateId: s.templateId,
          templateName: s.template?.name ?? null,
        })),
      };
    }

    case "schedule_workout_template": {
      const { templateId, dayKey, notes } = input as {
        templateId: string;
        dayKey: string;
        notes?: string;
      };
      const row = await workouts.createScheduledWorkout(userId, {
        templateId: templateId.trim(),
        dayKey: dayKey.trim(),
        notes: notes?.trim(),
      });
      return {
        id: row.id,
        dayKey: row.dayKey,
        notes: row.notes,
        templateId: row.templateId,
        createdAt: row.createdAt,
      };
    }

    case "unschedule_workout": {
      const { scheduleId } = input as { scheduleId: string };
      await workouts.deleteScheduledWorkout(userId, scheduleId.trim());
      return { ok: true as const, id: scheduleId.trim() };
    }

    case "create_recurring_workout_schedule": {
      const inp = input as {
        templateId: string;
        byDay: number[];
        startDayKey: string;
        untilDayKey?: string;
        intervalWeeks?: number;
        notes?: string;
      };
      const row = await workouts.createRecurringWorkoutRule(userId, {
        templateId: inp.templateId.trim(),
        byDay: inp.byDay,
        startDayKey: inp.startDayKey.trim(),
        untilDayKey: inp.untilDayKey?.trim(),
        intervalWeeks: inp.intervalWeeks,
        notes: inp.notes?.trim(),
      });
      return {
        id: row.id,
        templateId: row.templateId,
        intervalWeeks: row.intervalWeeks,
        byDay: JSON.parse(row.byDay) as unknown,
        startDayKey: row.startDayKey,
        untilDayKey: row.untilDayKey,
        notes: row.notes,
      };
    }

    case "delete_recurring_workout_schedule": {
      const { ruleId } = input as { ruleId: string };
      await workouts.deleteRecurringWorkoutRule(userId, ruleId.trim());
      return { ok: true as const, ruleId: ruleId.trim() };
    }

    case "skip_recurring_workout_day": {
      const { ruleId, dayKey } = input as { ruleId: string; dayKey: string };
      await workouts.skipRecurringOccurrence(
        userId,
        ruleId.trim(),
        dayKey.trim()
      );
      return {
        ok: true as const,
        ruleId: ruleId.trim(),
        dayKey: dayKey.trim(),
      };
    }

    case "get_active_workout": {
      const session = await workouts.getActiveSession(userId);
      return session ?? { active: false };
    }

    case "start_workout": {
      const { templateId } = input as { templateId: string };
      const result = await workouts.startWorkoutFromTemplate(
        userId,
        templateId.trim()
      );
      return {
        sessionId: result.session.id,
        resumed: result.kind === "existing",
      };
    }

    case "log_set": {
      const row = await workouts.upsertWorkoutSet(
        userId,
        input as Parameters<typeof workouts.upsertWorkoutSet>[1]
      );
      return row ?? { deleted: true };
    }

    case "complete_workout": {
      const { sessionId } = input as { sessionId: string };
      await workouts.completeWorkout(userId, sessionId.trim());
      return { ok: true, sessionId: sessionId.trim() };
    }

    case "get_progress_exercise_weight": {
      const { exerciseId, from, to } = input as {
        exerciseId: string;
        from: string;
        to: string;
      };
      const { metric, points: series } = await progress.getExerciseProgressByDay(
        userId,
        exerciseId.trim(),
        from.trim(),
        to.trim()
      );
      return {
        exerciseId: exerciseId.trim(),
        from: from.trim(),
        to: to.trim(),
        metric,
        series,
      };
    }

    case "get_progress_macros": {
      const { from, to } = input as { from: string; to: string };
      const series = await progress.getMacroTotalsByDay(
        userId,
        from.trim(),
        to.trim()
      );
      return { from: from.trim(), to: to.trim(), series };
    }

    case "get_progress_weight_bmi": {
      const { from, to } = input as { from: string; to: string };
      const data = await progress.getWeightAndBmiSeries(
        userId,
        from.trim(),
        to.trim()
      );
      return { from: from.trim(), to: to.trim(), ...data };
    }

    case "get_progress_vitals_latest": {
      const m = await progress.getLatestVitalMap(userId);
      const latest: Record<string, { value: number; dayKey: string }> = {};
      for (const [k, v] of m) {
        if (k === "height_in") continue;
        latest[k] = { value: v.value, dayKey: v.dayKey };
      }
      return { latest };
    }

    case "get_progress_vitals_log": {
      const { from, to, keys } = input as {
        from: string;
        to: string;
        keys?: string;
      };
      const fromK = from.trim();
      const toK = to.trim();
      if (!parseDayKey(fromK) || !parseDayKey(toK)) {
        return { error: "from and to must be valid YYYY-MM-DD day keys" };
      }
      const keysArr = keys?.trim()
        ? keys
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean)
        : undefined;
      const rows = await progress.listVitalEntriesInRange(
        userId,
        fromK,
        toK,
        keysArr
      );
      return {
        from: fromK,
        to: toK,
        entries: rows.map((r) => ({
          id: r.id,
          vitalKey: r.vitalKey,
          dayKey: r.dayKey,
          value: r.value,
          recordedAt: r.recordedAt.toISOString(),
        })),
      };
    }

    case "upsert_progress_vitals": {
      const { dayKey, entries } = input as {
        dayKey?: string;
        entries: { vitalKey: string; value: number }[];
      };
      const saved: {
        id: string;
        vitalKey: string;
        dayKey: string;
        value: number;
        recordedAt: string;
      }[] = [];
      for (const e of entries) {
        const row = await progress.upsertVitalEntry(userId, {
          vitalKey: e.vitalKey,
          value: e.value,
          dayKey: dayKey?.trim(),
        });
        saved.push({
          id: row.id,
          vitalKey: row.vitalKey,
          dayKey: row.dayKey,
          value: row.value,
          recordedAt: row.recordedAt.toISOString(),
        });
      }
      return { saved };
    }

    case "get_user_profile": {
      return profile.getProfileForUser(userId);
    }

    case "update_user_profile": {
      const p = input as {
        name?: string | null;
        heightIn?: number | null;
        sex?: string | null;
        activityLevel?: string | null;
        ageYears?: number | null;
        goalPreset?: string | null;
        fitnessGoals?: string | null;
        preferences?: string | null;
        goalCalories?: number | null;
        goalProteinG?: number | null;
        goalCarbsG?: number | null;
        goalFatG?: number | null;
      };
      return profile.updateUserProfile(userId, p);
    }

    case "get_daily_nutrition": {
      const { date } = input as { date?: string };
      const raw = date?.trim();
      const dayKey =
        raw && parseDayKey(raw) ? raw : formatDayKey(new Date());
      const [meals, totals] = await Promise.all([
        nutrition.listMealsForDay(userId, dayKey),
        nutrition.getDailyTotals(userId, dayKey),
      ]);
      return {
        date: dayKey,
        totals,
        meals: meals.map((m) => ({
          id: m.id,
          name: m.name,
          loggedAt: m.loggedAt,
          entries: m.entries.map((e) => ({
            id: e.id,
            description: e.description,
            calories: e.calories,
            proteinG: e.proteinG,
            carbsG: e.carbsG,
            fatG: e.fatG,
          })),
        })),
      };
    }

    case "log_meal": {
      const { dayKey, name: mealName } = input as {
        dayKey: string;
        name: string;
      };
      return nutrition.createMeal(userId, {
        dayKey: dayKey.trim(),
        name: mealName.trim(),
      });
    }

    case "log_meal_entry": {
      const inp = input as {
        mealId: string;
        description?: string;
        calories: number;
        proteinG?: number;
        carbsG?: number;
        fatG?: number;
      };
      return nutrition.addMealEntry(userId, {
        mealId: inp.mealId,
        description: inp.description,
        calories: inp.calories,
        proteinG: inp.proteinG ?? 0,
        carbsG: inp.carbsG ?? 0,
        fatG: inp.fatG ?? 0,
      });
    }

    case "scrape_recipe_url": {
      const { url } = input as { url: string };
      const result = await scrapeUrlToMarkdown(url);
      if (!result.ok) {
        return {
          error: result.error,
          ...(result.status !== undefined ? { httpStatus: result.status } : {}),
        };
      }
      return {
        sourceUrl: result.sourceUrl,
        markdown: stripRecipeMarkdownImagesAndLinks(result.markdown),
        pageTitle: result.title,
        truncated: result.truncated,
      };
    }

    case "list_meal_library": {
      const { query } = input as { query?: string };
      const items = await mealLibrary.listLibraryItems(userId, query?.trim());
      return { items: items.map((i) => jsonMealLibraryItem(i)) };
    }

    case "get_meal_library_item": {
      const { id } = input as { id: string };
      const item = await mealLibrary.getLibraryItem(userId, id.trim());
      if (!item) return { error: "not_found" as const };
      return { item: jsonMealLibraryItem(item) };
    }

    case "create_meal_library_item": {
      const inp = input as {
        name: string;
        instructions?: string;
        calories?: number;
        proteinG?: number;
        carbsG?: number;
        fatG?: number;
        ingredients?: string[];
      };
      const row = await mealLibrary.createLibraryItem(userId, {
        name: inp.name.trim(),
        instructions: inp.instructions?.trim() ?? "",
        calories: inp.calories ?? 0,
        proteinG: inp.proteinG ?? 0,
        carbsG: inp.carbsG ?? 0,
        fatG: inp.fatG ?? 0,
        ingredients: (inp.ingredients ?? []).map((line) => ({
          line: String(line),
        })),
      });
      if (!row) return { error: "failed" as const };
      return { item: jsonMealLibraryItem(row) };
    }

    case "update_meal_library_item": {
      const inp = input as {
        id: string;
        name: string;
        instructions?: string;
        calories?: number;
        proteinG?: number;
        carbsG?: number;
        fatG?: number;
        ingredients?: string[];
      };
      const row = await mealLibrary.updateLibraryItem(userId, inp.id.trim(), {
        name: inp.name.trim(),
        instructions: inp.instructions?.trim() ?? "",
        calories: inp.calories ?? 0,
        proteinG: inp.proteinG ?? 0,
        carbsG: inp.carbsG ?? 0,
        fatG: inp.fatG ?? 0,
        ingredients: (inp.ingredients ?? []).map((line) => ({
          line: String(line),
        })),
      });
      if (!row) return { error: "not_found" as const };
      return { item: jsonMealLibraryItem(row) };
    }

    case "delete_meal_library_item": {
      const { id } = input as { id: string };
      const existing = await mealLibrary.getLibraryItem(userId, id.trim());
      if (!existing) return { ok: false as const, error: "not_found" as const };
      await mealLibrary.deleteLibraryItem(userId, id.trim());
      return { ok: true as const };
    }

    case "get_meal_plan": {
      const { weekStart } = input as { weekStart?: string };
      const raw = weekStart?.trim();
      const week =
        raw && parseDayKey(raw) ? raw : mondayOfWeekContaining(formatDayKey());
      const plan = await mealPlan.getOrCreatePlanForWeek(userId, week);
      if (!plan) return { error: "failed" as const };
      return await jsonMealPlan(plan);
    }

    case "get_meal_plan_shopping_list": {
      const { weekStart } = input as { weekStart?: string };
      const raw = weekStart?.trim();
      const week =
        raw && parseDayKey(raw) ? raw : mondayOfWeekContaining(formatDayKey());
      const plan = await mealPlan.getOrCreatePlanForWeek(userId, week);
      if (!plan) return { error: "failed" as const };
      const shoppingList = await generateShoppingListForMealPlan(plan);
      return {
        weekStartDayKey: plan.weekStartDayKey,
        shoppingList,
      };
    }

    case "set_meal_plan_slot": {
      try {
        const inp = input as {
          weekStartDayKey: string;
          dayIndex: number;
          slotIndex?: number;
          libraryItemId?: string | null;
        };
        const plan = await mealPlan.setPlanSlot(userId, {
          weekStartDayKey: inp.weekStartDayKey.trim(),
          dayIndex: inp.dayIndex,
          slotIndex: inp.slotIndex,
          libraryItemId: inp.libraryItemId ?? null,
        });
        if (!plan) return { error: "failed" as const };
        return await jsonMealPlan(plan);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Error";
        return { error: message };
      }
    }

    case "set_meal_plan_slots_batch": {
      try {
        const inp = input as {
          weekStartDayKey: string;
          assignments: {
            dayIndex: number;
            slotIndex?: number;
            libraryItemId?: string | null;
          }[];
        };
        const plan = await mealPlan.setPlanSlotsBatch(userId, {
          weekStartDayKey: inp.weekStartDayKey.trim(),
          assignments: inp.assignments.map((a) => ({
            dayIndex: a.dayIndex,
            ...(a.slotIndex !== undefined ? { slotIndex: a.slotIndex } : {}),
            libraryItemId: a.libraryItemId ?? null,
          })),
        });
        if (!plan) return { error: "failed" as const };
        return await jsonMealPlan(plan);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Error";
        return { error: message };
      }
    }

    default: {
      const _exhaustive: never = name;
      return _exhaustive;
    }
  }
}
