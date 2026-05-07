import { tool, type ToolSet } from "ai";

import { APP_BRAND_NAME } from "@/lib/brand";
import { withCoachToolDebugLog } from "@/lib/coach-ai-debug";

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
import {
  executeCoachApplyWeeklyMealPlan,
  executeCoachApplyWorkoutProgram,
  executeCoachNutritionDayPatch,
  executeCoachProfilePatch,
  executeCoachProgressPatch,
  executeCoachRecipeFromUrl,
  executeCoachScheduleWorkouts,
  executeCoachShoppingList,
  executeCoachSnapshot,
} from "./execute";

/**
 * Composite data tools for the coach (no BM25 / tool-search).
 * Safe only on the server — imports execute paths that touch the DB.
 */
export function createCoachAgentTools(userId: string): ToolSet {
  return {
    coach_snapshot: tool({
      description: `Read a compact snapshot of the user's ${APP_BRAND_NAME} state: profile and macro targets, latest vitals (except height), current-week meal plan structure, saved workouts (capped), routine grouping, active workout session if any. Prefer this before asking the user for data you can load here.`,
      inputSchema: coachSnapshotInputSchema,
      execute: async (input) =>
        withCoachToolDebugLog(
          "coach_snapshot",
          { userId, input },
          () => executeCoachSnapshot(userId, input)
        ),
    }),
    coach_apply_weekly_meal_plan: tool({
      description: `Build or replace a full weekly meal plan in one call: optionally create many meal-library recipes, then assign each slot (Mon=0 … Sun=6) to a library item by id or by meal name. Use after coach_snapshot; align with the user's macro targets from the profile.`,
      inputSchema: coachApplyWeeklyMealPlanInputSchema,
      execute: async (input) =>
        withCoachToolDebugLog(
          "coach_apply_weekly_meal_plan",
          { userId, input },
          () => executeCoachApplyWeeklyMealPlan(userId, input)
        ),
    }),
    coach_apply_workout_program: tool({
      description: `Create a named workout routine with multiple saved workouts in one call. Each workout lists exercises by name (presets matched or custom exercises created). All templates are assigned to one new routine group. For calendar placement use coach_schedule_workouts afterward.`,
      inputSchema: coachApplyWorkoutProgramInputSchema,
      execute: async (input) =>
        withCoachToolDebugLog(
          "coach_apply_workout_program",
          { userId, input },
          () => executeCoachApplyWorkoutProgram(userId, input)
        ),
    }),
    coach_schedule_workouts: tool({
      description: `Schedule saved workouts on specific dates (one-time) and/or add recurring weekly rules. Reference templates by id or by exact saved workout name.`,
      inputSchema: coachScheduleWorkoutsInputSchema,
      execute: async (input) =>
        withCoachToolDebugLog(
          "coach_schedule_workouts",
          { userId, input },
          () => executeCoachScheduleWorkouts(userId, input)
        ),
    }),
    coach_profile_patch: tool({
      description: `Update the user's profile: name, height, demographics, activity, goals, preferences, daily calorie and macro targets. Call whenever the user asks you to remember something about them.`,
      inputSchema: coachProfilePatchInputSchema,
      execute: async (input) =>
        withCoachToolDebugLog(
          "coach_profile_patch",
          { userId, input },
          () => executeCoachProfilePatch(userId, input)
        ),
    }),
    coach_progress_patch: tool({
      description: `Log or update body metrics (weight, sleep, etc.) for one day.`,
      inputSchema: coachProgressPatchInputSchema,
      execute: async (input) =>
        withCoachToolDebugLog(
          "coach_progress_patch",
          { userId, input },
          () => executeCoachProgressPatch(userId, input)
        ),
    }),
    coach_nutrition_day_patch: tool({
      description: `Log structured meals and food entries for a single day in one call (batch alternative to many small logs).`,
      inputSchema: coachNutritionDayPatchInputSchema,
      execute: async (input) =>
        withCoachToolDebugLog(
          "coach_nutrition_day_patch",
          { userId, input },
          () => executeCoachNutritionDayPatch(userId, input)
        ),
    }),
    coach_recipe_from_url: tool({
      description: `Fetch recipe text from a public URL the user shared, optionally save it as a meal-library item (instructions filled with extracted markdown).`,
      inputSchema: coachRecipeFromUrlInputSchema,
      execute: async (input) =>
        withCoachToolDebugLog(
          "coach_recipe_from_url",
          { userId, input },
          () => executeCoachRecipeFromUrl(userId, input)
        ),
    }),
    coach_shopping_list: tool({
      description: `Generate the grocery shopping list for a meal-plan week (cost estimates when configured).`,
      inputSchema: coachShoppingListInputSchema,
      execute: async (input) =>
        withCoachToolDebugLog(
          "coach_shopping_list",
          { userId, input },
          () => executeCoachShoppingList(userId, input)
        ),
    }),
  };
}
