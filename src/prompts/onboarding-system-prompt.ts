import { APP_BRAND_NAME } from "@/lib/brand";
import { formatProfileForCoachPrompt } from "@/lib/coach-profile-context";
import type { UserProfileBundle } from "@/lib/services/profile";

export function buildOnboardingSystem(
  mode: "meal_plan" | "workout",
  weekStartDayKey: string
): string {
  const weekLine = `The meal-plan week to use (Monday) is **${weekStartDayKey}** (YYYY-MM-DD). Pass this as \`weekStartDayKey\` to \`coach_apply_weekly_meal_plan\`, \`coach_snapshot\`, and \`coach_shopping_list\` when relevant.`;
  if (mode === "meal_plan") {
    return [
      "# Guided onboarding: first weekly meal plan",
      "You are helping a new user in guided setup. Create a **full weekly meal plan** (Mon–Sun) that fits their selected interests and notes.",
      weekLine,
      "1. Call \`coach_snapshot\` if you need profile macro targets.",
      "2. Use \`coach_recipe_from_url\` if they shared a recipe URL; otherwise define recipes inline inside \`coach_apply_weekly_meal_plan\` → \`recipes\`.",
      "3. Assign the whole week in **one** \`coach_apply_weekly_meal_plan\` call: \`recipes\` (as needed) + \`assignments\` for each slot (dayIndex 0=Mon … 6=Sun; slotIndex 0=breakfast, 1=lunch, 2=dinner unless notes say otherwise).",
      "4. Summarize briefly what you created. No markdown tables.",
      "If you ask the user to confirm before applying tools, summarize the **entire week** and get **one** agreement—never confirm Monday, then Tuesday, then Wednesday, etc.",
      "Use tools; do not invent library item ids — create recipes in the same apply call or from URLs first.",
    ].join("\n");
  }
  return [
    "# Guided onboarding: first workout program",
    "You are helping a new user in guided setup. Create **one or more saved workouts** grouped into a program (routine) that matches their selected focus tags and notes.",
    "1. Call \`coach_snapshot\` if useful for context.",
    "2. Use \`coach_apply_workout_program\` with \`programName\` and a \`workouts\` array (each with \`name\`, optional \`notes\`, and \`exercises\` lines: name, sets/reps/rest as appropriate). Prefer 60–120s rest for main strength lifts unless notes say otherwise.",
    "3. Optionally use \`coach_schedule_workouts\` if they should appear on specific days.",
    "4. Summarize briefly. No markdown tables.",
    "If you need user confirmation before applying, present the **full program** (all days/workouts) and confirm **in a single turn**—do not confirm one day at a time.",
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

export function buildOnboardingToolsReminder(): string {
  return `**${APP_BRAND_NAME} tools:** Use the registered coach data tools (\`coach_snapshot\`, \`coach_apply_weekly_meal_plan\`, \`coach_apply_workout_program\`, etc.). Do not skip tools — the user expects data created in the app.`;
}

/** Onboarding instructions + tools line (no profile) — safe to prompt-cache per session. */
export function buildOnboardingCachableStem(
  mode: "meal_plan" | "workout",
  weekStartDayKey: string
): string {
  return [
    buildOnboardingSystem(mode, weekStartDayKey),
    "",
    buildOnboardingToolsReminder(),
  ].join("\n");
}

export function buildOnboardingContextBlock(
  profile: UserProfileBundle,
  mode: "meal_plan" | "workout",
  weekStartDayKey: string
): string {
  return [
    buildOnboardingCachableStem(mode, weekStartDayKey),
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
    "The user has a week on the plan already. Do **not** rebuild the whole week unless they ask. Prefer targeted edits: suggest concrete swaps, then use \`coach_apply_weekly_meal_plan\` with only the \`assignments\` you need (and optional \`recipes\` for new items). Keep messages concise. If you need confirmation before changing multiple days, summarize **all** proposed changes and confirm **once**—not day-by-day.",
    `After your user-visible answer and any ${APP_BRAND_NAME} tools, call \`suggest_quick_replies\` **once** with 2–4 short tap-to-send follow-ups.`,
    "When the user is **done** refining and ready to continue onboarding, call `onboarding_meal_refinement_complete` in that same turn (after your reply and any tools). The app will advance to the next step. If they are not done, do **not** call it.",
  ].join("\n");
}
