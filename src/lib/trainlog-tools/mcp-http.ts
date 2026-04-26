import {
  parseTrainlogToolInput,
  type TrainlogToolName,
} from "./definitions";

/** Same contract as the stdio MCP server’s `api()` helper (Bearer PAT to the app). */
export type McpApiFn = (
  method: string,
  path: string,
  body?: unknown
) => Promise<unknown>;

export async function runTrainlogToolMcp(
  name: TrainlogToolName,
  api: McpApiFn,
  rawInput: unknown
): Promise<unknown> {
  const input = parseTrainlogToolInput(name, rawInput);
  switch (name) {
    case "list_workout_templates":
      return api("GET", "/api/v1/workouts/templates");

    case "create_workout_template": {
      const { name: n, notes } = input as {
        name: string;
        notes?: string;
      };
      return api("POST", "/api/v1/workouts/templates", {
        name: n,
        notes,
      });
    }

    case "update_workout_template": {
      const { templateId, name, notes } = input as {
        templateId: string;
        name?: string;
        notes?: string | null;
      };
      return api(
        "PATCH",
        `/api/v1/workouts/templates/${encodeURIComponent(String(templateId))}`,
        { name, notes }
      );
    }

    case "list_exercises":
      return api("GET", "/api/v1/workouts/exercises");

    case "create_exercise": {
      const {
        name: exerciseName,
        muscleGroup,
        logKind,
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
      return api("POST", "/api/v1/workouts/exercises", {
        name: exerciseName,
        muscleGroup,
        logKind,
        defaultDurationSec,
        defaultDistance,
        distanceUnit,
        weightUnit,
      });
    }

    case "add_exercise_to_template": {
      const {
        templateId,
        exerciseId,
        targetSets,
        targetReps,
        targetDurationSec,
        targetDistance,
        defaultWeight,
        weightUnit,
        progressiveOverloadEnabled,
        progressiveOverloadIncrement,
        progressiveOverloadRequireFullCompletion,
        isWarmup,
        restBetweenSetsSec,
      } = input as Record<string, unknown>;
      return api(
        "POST",
        `/api/v1/workouts/templates/${encodeURIComponent(String(templateId))}/items`,
        {
          exerciseId,
          targetSets,
          targetReps,
          targetDurationSec,
          targetDistance,
          defaultWeight,
          weightUnit,
          progressiveOverloadEnabled,
          progressiveOverloadIncrement,
          progressiveOverloadRequireFullCompletion,
          isWarmup,
          restBetweenSetsSec,
        }
      );
    }

    case "bulk_add_exercises_to_template": {
      const { templateId, exercises } = input as {
        templateId: string;
        exercises: unknown[];
      };
      return api(
        "POST",
        `/api/v1/workouts/templates/${encodeURIComponent(String(templateId))}/items/bulk`,
        { items: exercises }
      );
    }

    case "list_workout_routines":
      return api("GET", "/api/v1/workouts/routine-groups");

    case "create_workout_routine": {
      const { name } = input as { name: string };
      return api("POST", "/api/v1/workouts/routine-groups", { name });
    }

    case "assign_workout_to_routine": {
      const { templateId, routineGroupId } = input as {
        templateId: string;
        routineGroupId: string | null;
      };
      return api(
        "PATCH",
        `/api/v1/workouts/templates/${encodeURIComponent(String(templateId))}/routine-group`,
        { routineGroupId }
      );
    }

    case "rename_workout_routine": {
      const { routineGroupId, name } = input as {
        routineGroupId: string;
        name: string;
      };
      return api(
        "PATCH",
        `/api/v1/workouts/routine-groups/${encodeURIComponent(routineGroupId)}`,
        { name }
      );
    }

    case "delete_workout_routine": {
      const { routineGroupId } = input as { routineGroupId: string };
      return api(
        "DELETE",
        `/api/v1/workouts/routine-groups/${encodeURIComponent(routineGroupId)}`
      );
    }

    case "list_workout_schedule": {
      const { month, from, to } = input as {
        month?: string;
        from?: string;
        to?: string;
      };
      const params = new URLSearchParams();
      if (month) params.set("month", month);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const q = params.toString();
      return api("GET", `/api/v1/workouts/schedule${q ? `?${q}` : ""}`);
    }

    case "schedule_workout_template": {
      const { templateId, dayKey, notes } = input as {
        templateId: string;
        dayKey: string;
        notes?: string;
      };
      return api("POST", "/api/v1/workouts/schedule", {
        templateId,
        dayKey,
        notes,
      });
    }

    case "unschedule_workout": {
      const { scheduleId } = input as { scheduleId: string };
      return api(
        "DELETE",
        `/api/v1/workouts/schedule/${encodeURIComponent(scheduleId)}`
      );
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
      return api("POST", "/api/v1/workouts/schedule/recurring", {
        templateId: inp.templateId,
        byDay: inp.byDay,
        startDayKey: inp.startDayKey,
        untilDayKey: inp.untilDayKey,
        intervalWeeks: inp.intervalWeeks,
        notes: inp.notes,
      });
    }

    case "delete_recurring_workout_schedule": {
      const { ruleId } = input as { ruleId: string };
      return api(
        "DELETE",
        `/api/v1/workouts/schedule/recurring/${encodeURIComponent(ruleId)}`
      );
    }

    case "skip_recurring_workout_day": {
      const { ruleId, dayKey } = input as { ruleId: string; dayKey: string };
      return api(
        "POST",
        `/api/v1/workouts/schedule/recurring/${encodeURIComponent(ruleId)}/skip`,
        { dayKey }
      );
    }

    case "get_active_workout":
      return api("GET", "/api/v1/workouts/active");

    case "start_workout": {
      const { templateId } = input as { templateId: string };
      return api("POST", "/api/v1/workouts/sessions", { templateId });
    }

    case "log_set": {
      const {
        sessionId,
        exerciseId,
        setIndex,
        reps,
        durationSec,
        weight,
      } = input as {
        sessionId: string;
        exerciseId: string;
        setIndex: number;
        reps?: number;
        durationSec?: number;
        weight: number;
      };
      return api("POST", `/api/v1/workouts/sessions/${sessionId}/sets`, {
        exerciseId,
        setIndex,
        reps,
        durationSec,
        weight,
      });
    }

    case "complete_workout": {
      const { sessionId } = input as { sessionId: string };
      return api("POST", `/api/v1/workouts/sessions/${sessionId}/complete`);
    }

    case "get_progress_exercise_weight": {
      const { exerciseId, from, to } = input as {
        exerciseId: string;
        from: string;
        to: string;
      };
      return api(
        "GET",
        `/api/v1/progress/exercise-weight?exerciseId=${encodeURIComponent(
          exerciseId
        )}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
      );
    }

    case "get_progress_macros": {
      const { from, to } = input as { from: string; to: string };
      return api(
        "GET",
        `/api/v1/progress/macros?from=${encodeURIComponent(
          from
        )}&to=${encodeURIComponent(to)}`
      );
    }

    case "get_progress_weight_bmi": {
      const { from, to } = input as { from: string; to: string };
      return api(
        "GET",
        `/api/v1/progress/weight-bmi?from=${encodeURIComponent(
          from
        )}&to=${encodeURIComponent(to)}`
      );
    }

    case "get_progress_vitals_latest":
      return api("GET", "/api/v1/progress/vitals/latest");

    case "get_progress_vitals_log": {
      const { from, to, keys } = input as {
        from: string;
        to: string;
        keys?: string;
      };
      const q =
        keys && keys.trim().length > 0
          ? `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(
              to
            )}&keys=${encodeURIComponent(keys.trim())}`
          : `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
      return api("GET", `/api/v1/progress/vitals${q}`);
    }

    case "upsert_progress_vitals": {
      const { dayKey, entries } = input as {
        dayKey?: string;
        entries: { vitalKey: string; value: number }[];
      };
      return api("POST", "/api/v1/progress/vitals", { dayKey, entries });
    }

    case "get_user_profile":
      return api("GET", "/api/v1/profile");

    case "update_user_profile": {
      const {
        name,
        heightIn,
        goalPreset,
        fitnessGoals,
        preferences,
        goalCalories,
        goalProteinG,
        goalCarbsG,
        goalFatG,
      } = input as {
        name?: string | null;
        heightIn?: number | null;
        goalPreset?: string | null;
        fitnessGoals?: string | null;
        preferences?: string | null;
        goalCalories?: number | null;
        goalProteinG?: number | null;
        goalCarbsG?: number | null;
        goalFatG?: number | null;
      };
      return api("PATCH", "/api/v1/profile", {
        name,
        heightIn,
        goalPreset,
        fitnessGoals,
        preferences,
        goalCalories,
        goalProteinG,
        goalCarbsG,
        goalFatG,
      });
    }

    case "get_daily_nutrition": {
      const { date } = input as { date?: string };
      const q = date ? `?date=${encodeURIComponent(date)}` : "";
      return api("GET", `/api/v1/nutrition/day${q}`);
    }

    case "log_meal": {
      const { dayKey, name } = input as { dayKey: string; name: string };
      return api("POST", "/api/v1/nutrition/meals", { dayKey, name });
    }

    case "log_meal_entry": {
      const { mealId, description, calories, proteinG, carbsG, fatG } =
        input as {
          mealId: string;
          description?: string;
          calories: number;
          proteinG?: number;
          carbsG?: number;
          fatG?: number;
        };
      return api("POST", `/api/v1/nutrition/meals/${mealId}/entries`, {
        description,
        calories,
        proteinG: proteinG ?? 0,
        carbsG: carbsG ?? 0,
        fatG: fatG ?? 0,
      });
    }

    case "scrape_recipe_url": {
      const { url } = input as { url: string };
      return api("POST", "/api/v1/nutrition/import-recipe-url", { url });
    }

    case "list_meal_library": {
      const { query } = input as { query?: string };
      const q =
        query && query.trim().length > 0
          ? `?query=${encodeURIComponent(query.trim())}`
          : "";
      return api("GET", `/api/v1/nutrition/meal-library${q}`);
    }

    case "get_meal_library_item": {
      const { id } = input as { id: string };
      return api(
        "GET",
        `/api/v1/nutrition/meal-library/${encodeURIComponent(id)}`
      );
    }

    case "create_meal_library_item": {
      const {
        name: mealName,
        instructions,
        calories,
        proteinG,
        carbsG,
        fatG,
        ingredients,
      } = input as {
        name: string;
        instructions?: string;
        calories?: number;
        proteinG?: number;
        carbsG?: number;
        fatG?: number;
        ingredients?: string[];
      };
      return api("POST", "/api/v1/nutrition/meal-library", {
        name: mealName,
        instructions,
        calories,
        proteinG,
        carbsG,
        fatG,
        ingredients,
      });
    }

    case "update_meal_library_item": {
      const {
        id,
        name: mealName,
        instructions,
        calories,
        proteinG,
        carbsG,
        fatG,
        ingredients,
      } = input as {
        id: string;
        name: string;
        instructions?: string;
        calories?: number;
        proteinG?: number;
        carbsG?: number;
        fatG?: number;
        ingredients?: string[];
      };
      return api(
        "PATCH",
        `/api/v1/nutrition/meal-library/${encodeURIComponent(id)}`,
        {
          name: mealName,
          instructions,
          calories,
          proteinG,
          carbsG,
          fatG,
          ingredients,
        }
      );
    }

    case "delete_meal_library_item": {
      const { id } = input as { id: string };
      return api(
        "DELETE",
        `/api/v1/nutrition/meal-library/${encodeURIComponent(id)}`
      );
    }

    case "get_meal_plan": {
      const { weekStart } = input as { weekStart?: string };
      const q = weekStart?.trim()
        ? `?weekStart=${encodeURIComponent(weekStart.trim())}`
        : "";
      return api("GET", `/api/v1/nutrition/meal-plan${q}`);
    }

    case "get_meal_plan_shopping_list": {
      const { weekStart } = input as { weekStart?: string };
      const q = weekStart?.trim()
        ? `?weekStart=${encodeURIComponent(weekStart.trim())}`
        : "";
      return api("POST", `/api/v1/nutrition/meal-plan/shopping-list${q}`);
    }

    case "set_meal_plan_slot": {
      const { weekStartDayKey, dayIndex, slotIndex, libraryItemId } = input as {
        weekStartDayKey: string;
        dayIndex: number;
        slotIndex?: number;
        libraryItemId?: string | null;
      };
      return api("POST", "/api/v1/nutrition/meal-plan/slots", {
        weekStartDayKey,
        dayIndex,
        ...(slotIndex !== undefined ? { slotIndex } : {}),
        libraryItemId: libraryItemId ?? null,
      });
    }

    case "set_meal_plan_slots_batch": {
      const { weekStartDayKey, assignments } = input as {
        weekStartDayKey: string;
        assignments: {
          dayIndex: number;
          slotIndex?: number;
          libraryItemId?: string | null;
        }[];
      };
      return api("POST", "/api/v1/nutrition/meal-plan/slots/batch", {
        weekStartDayKey,
        assignments: assignments.map((a) => ({
          dayIndex: a.dayIndex,
          ...(a.slotIndex !== undefined ? { slotIndex: a.slotIndex } : {}),
          libraryItemId: a.libraryItemId ?? null,
        })),
      });
    }

    default: {
      const _exhaustive: never = name;
      return _exhaustive;
    }
  }
}
