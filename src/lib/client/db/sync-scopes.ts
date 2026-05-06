import type { CollectionName } from "@/shared/schemas/collections";

/** Workouts section (templates, sessions, schedules, catalog). */
export const WORKOUT_SECTION_SYNC_SCOPE: readonly CollectionName[] = [
  "exercises",
  "workoutRoutineGroups",
  "workoutTemplates",
  "workoutTemplateItems",
  "workoutSessions",
  "workoutSets",
  "workoutSessionExercisePrefs",
  "workoutScheduledItems",
  "workoutRecurringRules",
  "workoutRecurringSkips",
];

/** Daily log + recipe library collections. */
export const NUTRITION_SECTION_SYNC_SCOPE: readonly CollectionName[] = [
  "meals",
  "mealEntries",
  "mealLibraryItems",
  "mealLibraryIngredients",
];

/** Meal plan week views (combined with nutrition layout subscription). */
export const MEAL_PLAN_SYNC_SCOPE: readonly CollectionName[] = [
  "mealPlans",
  "mealPlanSlots",
];

/** Hydrate Dexie before dashboard after onboarding (matches subscribed `/app` scope + profile). */
export const POST_ONBOARDING_PULL_SCOPE: readonly CollectionName[] = [
  "userProfiles",
  ...WORKOUT_SECTION_SYNC_SCOPE,
  ...NUTRITION_SECTION_SYNC_SCOPE,
  ...MEAL_PLAN_SYNC_SCOPE,
];

/** Progress / vitals route. */
export const PROGRESS_SYNC_SCOPE: readonly CollectionName[] = [
  "userVitalEntries",
];
