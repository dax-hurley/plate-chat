/**
 * Coach data tool identifiers — **no** DB / Node imports (safe for client bundles).
 * When adding a tool in `tools.ts`, add its name here (keep sorted alphabetically).
 */
export const COACH_AGENT_DATA_TOOL_NAMES = [
  "coach_apply_weekly_meal_plan",
  "coach_apply_workout_program",
  "coach_nutrition_day_patch",
  "coach_profile_patch",
  "coach_progress_patch",
  "coach_recipe_from_url",
  "coach_schedule_workouts",
  "coach_shopping_list",
  "coach_snapshot",
] as const;

export type CoachAgentDataToolName =
  (typeof COACH_AGENT_DATA_TOOL_NAMES)[number];

export function getCoachAgentDataToolNamesSorted(): string[] {
  return [...COACH_AGENT_DATA_TOOL_NAMES];
}
