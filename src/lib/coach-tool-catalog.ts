import { APP_BRAND_NAME } from "@/lib/brand";
import { getCoachAgentDataToolNamesSorted } from "@/lib/coach-agent/tool-names";

/** Every coach data tool name, sorted (for system prompt overview). */
export function getCoachAgentToolNamesSorted(): string[] {
  return getCoachAgentDataToolNamesSorted();
}

/**
 * Short system section: tool names only. Full argument schemas are supplied with each request.
 */
export function getCoachToolCatalogSystemSection(): string {
  const names = getCoachAgentToolNamesSorted();
  return [
    `Tool catalog: call ${APP_BRAND_NAME} coach tools by name when you need them (see names below). Prefer the fewest calls—batch with coach_apply_weekly_meal_plan and coach_apply_workout_program when building full weeks or programs.`,
    `${APP_BRAND_NAME} coach data tool names: ${names.join(", ")}.`,
  ].join("\n\n");
}
