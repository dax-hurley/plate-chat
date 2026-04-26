import { APP_BRAND_NAME } from "@/lib/brand";
import { formatProfileForCoachPrompt } from "@/lib/coach-profile-context";
import type { UserProfileBundle } from "@/lib/services/profile";

export function buildOnboardingSystem(
  mode: "meal_plan" | "workout",
  weekStartDayKey: string
): string {
  const weekLine = `The meal-plan week to use (Monday) is **${weekStartDayKey}** (YYYY-MM-DD). Use this for get_meal_plan, set_meal_plan_slot, set_meal_plan_slots_batch, and create_meal_library_item.`;
  if (mode === "meal_plan") {
    return [
      "# Guided onboarding: first weekly meal plan",
      "You are helping a new user in a guided setup. Create a **full weekly meal plan** (Mon–Sun) that fits their selected interests and notes.",
      weekLine,
      "1. If needed, create meal-library recipes with `create_meal_library_item` (ingredients, macros, instructions). If the user shares a recipe URL, call `scrape_recipe_url` first, then save what you extract.",
      "2. Assign recipes to the week with `set_meal_plan_slots_batch` for efficiency (or single-slot tools). Aim for 3 main meals per day (breakfast/lunch/dinner) unless the user notes say otherwise; add snacks with extra slots if that matches their interest chips.",
      "3. Summarize in plain language what you created in 10 sentences or less. Do not be verbose. No markdown tables.",
      "Use tools; do not invent recipe ids — create library items first, then assign.",
    ].join("\n");
  }
  return [
    "# Guided onboarding: first workout",
    "You are helping a new user in a guided setup. Create **one saved workout template** (a routine they can start from the app) that matches their selected focus tags and free-text notes.",
    "1. `list_exercises` to find matching exercises, or `create_exercise` if needed for custom names.",
    "2. `create_workout_template` then `bulk_add_exercises_to_template` with sensible sets/reps/rest (use `restBetweenSetsSec` 60–120s for strength).",
    "3. Give the template a short, clear name. Summarize the workout briefly. No markdown tables.",
  ].join("\n");
}

export function buildOnboardingUserMessage(
  interestLabels: string[],
  freeTextNotes: string
): string {
  const lines = interestLabels.length
    ? `Selected interest tags: ${interestLabels.join(", ")}.`
    : "No interest tags selected.";
  const notes = freeTextNotes.trim()
    ? ` Additional notes: ${freeTextNotes.trim()}`
    : "";
  return `${lines}${notes} Please build this in the app using tools now.`;
}

const ONBOARDING_TOOL_SEARCH_LINE = `**App tools:** Most ${APP_BRAND_NAME} tools are loaded on demand. Use \`tool_search_tool_bm25\` (short queries like "meal plan slots", "create workout template", "meal library recipe") to find the right tool by name, then call it. Do not skip tools — the user expects data created in the app.`;

export function buildOnboardingContextBlock(
  profile: UserProfileBundle,
  mode: "meal_plan" | "workout",
  weekStartDayKey: string
): string {
  return [
    buildOnboardingSystem(mode, weekStartDayKey),
    "",
    ONBOARDING_TOOL_SEARCH_LINE,
    "",
    formatProfileForCoachPrompt(profile),
  ].join("\n");
}

/**
 * Shown in onboarding when the user is chatting to refine an existing week (after
 * the initial plan was generated).
 */
export const MEAL_PLAN_REFINEMENT_USER_PROMPT =
  "I'd like to adjust this week's meal plan. Please suggest a few specific ideas I could try (e.g. swapping which days have which meals, different recipes, or portions). Then help me apply changes in the app until the plan feels right to me.";

export function buildMealPlanRefinementContextAddendum(): string {
  return [
    "",
    "## Plan refinement (guided onboarding — meal plan already exists)",
    "The user has a week on the plan already. Do **not** rebuild the whole week unless they ask. Prefer targeted edits: suggest concrete swaps, use tools (`set_meal_plan_slot`, `set_meal_plan_slots_batch`, `create_meal_library_item`, etc.) when they agree, and keep back-and-forth messages concise.",
    `After your user-visible answer and any ${APP_BRAND_NAME} tools, call \`suggest_quick_replies\` **once** with 2–4 short tap-to-send follow-ups (e.g. next swap to try, confirm they're done, or ask for a different day). This matches the in-app chat UI.`,
    "When the user is **done** refining and ready to continue onboarding, call `onboarding_meal_refinement_complete` in that same turn (after your reply and any tools). The app will advance to the next step; the user does not have to find a continue button. If they are not done, do **not** call it.",
  ].join("\n");
}
