import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/**
 * Sync columns shared by every offline-first table. Server writes set
 * `updatedAt = now()` and `rev = rev + 1`; clients propose writes with an
 * `assumedMasterState` and server resolves conflicts via last-write-wins on
 * `updatedAt`. `deletedAt` is the soft-delete tombstone — replicated like any
 * other update so offline devices learn about deletes.
 */
export const syncCols = {
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
  deletedAt: integer("deletedAt", { mode: "timestamp_ms" }),
  rev: integer("rev").notNull().default(1),
};

/**
 * Shared user row. better-auth owns the credential (stored in `ba_account`)
 * and the session (`ba_session`); the rest of the app just references
 * `users.id`.
 */
export const users = sqliteTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: integer("emailVerified", { mode: "boolean" }),
  image: text("image"),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
});

/** Personal access tokens for `/api/v1` Bearer auth (see `src/lib/pat-token.ts`). */
export const personalAccessTokens = sqliteTable(
  "personal_access_tokens",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    tokenHash: text("tokenHash").notNull().unique(),
    createdAt: integer("createdAt", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    lastUsedAt: integer("lastUsedAt", { mode: "timestamp_ms" }),
  },
  (t) => [index("personal_access_tokens_user_idx").on(t.userId)]
);

export const exercises = sqliteTable(
  "exercises",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId"),
    name: text("name").notNull(),
    muscleGroup: text("muscleGroup"),
    /** `reps` | `time` | `distance` — what each set logs (see `workout_sets`). */
    logKind: text("logKind").notNull().default("reps"),
    /** For `logKind === \"time\"`, default seconds per set when adding to a template. */
    defaultDurationSec: integer("defaultDurationSec"),
    /** For `logKind === \"distance\"`, default distance per set (in `distanceUnit`). */
    defaultDistance: real("defaultDistance"),
    /** `km`, `mi`, or `m` when logging distance per set. */
    distanceUnit: text("distanceUnit").notNull().default("km"),
    /** `lb` (default) or `kg` for default / logged working weight. */
    weightUnit: text("weightUnit").notNull().default("lb"),
    /**
     * When false (typical for cardio / distance), sessions omit load controls and
     * sets store weight 0. Rep-based exercises always behave as if true.
     */
    trackWeight: integer("trackWeight", { mode: "boolean" })
      .notNull()
      .default(true),
    isCustom: integer("isCustom", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("createdAt", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    ...syncCols,
  },
  (t) => [
    index("exercises_user_idx").on(t.userId),
    index("exercises_sync_idx").on(t.userId, t.updatedAt, t.id),
  ]
);

/**
 * User-defined **routine**: a labeled group of saved workouts (`workout_templates`),
 * e.g. a training split where each workout is a separate template.
 */
export const workoutRoutineGroups = sqliteTable(
  "workout_routine_groups",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    name: text("name").notNull(),
    /** Sort order among this user's routines (lower first). */
    sortOrder: integer("sortOrder").notNull().default(0),
    createdAt: integer("createdAt", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    ...syncCols,
  },
  (t) => [
    index("workout_routine_groups_user_idx").on(t.userId),
    index("workout_routine_groups_user_sort_idx").on(t.userId, t.sortOrder),
    index("workout_routine_groups_sync_idx").on(t.userId, t.updatedAt, t.id),
  ]
);

export const workoutTemplates = sqliteTable(
  "workout_templates",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    name: text("name").notNull(),
    notes: text("notes"),
    routineGroupId: text("routineGroupId").references(
      () => workoutRoutineGroups.id,
      { onDelete: "set null" }
    ),
    /** Order within `routineGroupId`; null when the template is not in a routine. */
    routineOrder: integer("routineOrder"),
    createdAt: integer("createdAt", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    ...syncCols,
  },
  (t) => [
    index("workout_templates_user_idx").on(t.userId),
    index("workout_templates_routine_group_idx").on(t.routineGroupId),
    index("workout_templates_sync_idx").on(t.userId, t.updatedAt, t.id),
  ]
);

export const workoutTemplateItems = sqliteTable(
  "workout_template_items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    templateId: text("templateId")
      .notNull()
      .references(() => workoutTemplates.id, { onDelete: "cascade" }),
    exerciseId: text("exerciseId")
      .notNull()
      .references(() => exercises.id, { onDelete: "cascade" }),
    order: integer("order").notNull(),
    targetSets: integer("targetSets").notNull().default(3),
    /** Rep-based lifts; null when using `targetDurationSec` only. */
    targetReps: integer("targetReps"),
    /** Timed sets (seconds per set); null for rep-based lifts. */
    targetDurationSec: integer("targetDurationSec"),
    /** Distance per set (in exercise `distanceUnit`); null unless logging by distance. */
    targetDistance: real("targetDistance"),
    defaultWeight: real("defaultWeight"),
    /** When set, overrides `exercises.weightUnit` for this template line. */
    weightUnit: text("weightUnit"),
    progressiveOverloadEnabled: integer("progressiveOverloadEnabled", {
      mode: "boolean",
    })
      .notNull()
      .default(false),
    /** Added to `defaultWeight` after each qualifying completed session (same unit as weight). */
    progressiveOverloadIncrement: real("progressiveOverloadIncrement"),
    progressiveOverloadRequireFullCompletion: integer(
      "progressiveOverloadRequireFullCompletion",
      { mode: "boolean" }
    )
      .notNull()
      .default(false),
    /**
     * Per–workout line: whether to show load and log weight on sets. Usually
     * matches the exercise; can differ for preset exercises in a template.
     */
    trackWeight: integer("trackWeight", { mode: "boolean" })
      .notNull()
      .default(true),
    /**
     * When the exercise logs by distance, optionally record stopwatch time
     * (`durationSec`) instead of distance for each set. Uses `targetDurationSec`
     * as the goal (and PO) when set.
     */
    logTimeForDistanceSets: integer("logTimeForDistanceSets", {
      mode: "boolean",
    })
      .notNull()
      .default(false),
    /** When true, the lift appears under the session Warmup tab instead of Workout. */
    isWarmup: integer("isWarmup", { mode: "boolean" })
      .notNull()
      .default(false),
    /**
     * Rest after each logged set for this exercise (seconds). Null or 0
     * disables the between-set countdown for this line in the active session.
     */
    restBetweenSetsSec: integer("restBetweenSetsSec"),
    ...syncCols,
  },
  (t) => [
    index("workout_template_items_template_idx").on(t.templateId),
    index("workout_template_items_exercise_idx").on(t.exerciseId),
    index("workout_template_items_sync_idx").on(t.userId, t.updatedAt, t.id),
  ]
);

export const workoutSessions = sqliteTable(
  "workout_sessions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    templateId: text("templateId").references(() => workoutTemplates.id, {
      onDelete: "set null",
    }),
    startedAt: integer("startedAt", { mode: "timestamp_ms" }).notNull(),
    endedAt: integer("endedAt", { mode: "timestamp_ms" }),
    status: text("status").notNull().default("active"),
    ...syncCols,
  },
  (t) => [
    index("workout_sessions_user_idx").on(t.userId),
    index("workout_sessions_status_idx").on(t.userId, t.status),
    index("workout_sessions_sync_idx").on(t.userId, t.updatedAt, t.id),
  ]
);

export const workoutSets = sqliteTable(
  "workout_sets",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    sessionId: text("sessionId")
      .notNull()
      .references(() => workoutSessions.id, { onDelete: "cascade" }),
    exerciseId: text("exerciseId")
      .notNull()
      .references(() => exercises.id, { onDelete: "cascade" }),
    setIndex: integer("setIndex").notNull(),
    reps: integer("reps"),
    durationSec: integer("durationSec"),
    /** Logged distance for `logKind === \"distance\"` (exercise `distanceUnit`). */
    distance: real("distance"),
    weight: real("weight").notNull(),
    rpe: real("rpe"),
    completedAt: integer("completedAt", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    ...syncCols,
  },
  (t) => [
    index("workout_sets_session_idx").on(t.sessionId),
    index("workout_sets_session_exercise_idx").on(t.sessionId, t.exerciseId),
    index("workout_sets_sync_idx").on(t.userId, t.updatedAt, t.id),
  ]
);

/**
 * Per-session targets for an exercise in a workout (does not change template
 * `defaultWeight` / `targetDurationSec`).
 */
export const workoutSessionExercisePrefs = sqliteTable(
  "workout_session_exercise_prefs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    sessionId: text("sessionId")
      .notNull()
      .references(() => workoutSessions.id, { onDelete: "cascade" }),
    exerciseId: text("exerciseId")
      .notNull()
      .references(() => exercises.id, { onDelete: "cascade" }),
    workingWeight: real("workingWeight"),
    workingDurationSec: integer("workingDurationSec"),
    /** Session override for target distance (same unit as exercise). */
    workingDistance: real("workingDistance"),
    ...syncCols,
  },
  (t) => [
    uniqueIndex("workout_session_exercise_prefs_session_ex_uq").on(
      t.sessionId,
      t.exerciseId
    ),
    index("workout_session_exercise_prefs_session_idx").on(t.sessionId),
    index("workout_session_exercise_prefs_sync_idx").on(
      t.userId,
      t.updatedAt,
      t.id
    ),
  ]
);

/** Planned workout from a template on a calendar day (YYYY-MM-DD). */
export const workoutScheduledItems = sqliteTable(
  "workout_scheduled_items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    templateId: text("templateId")
      .notNull()
      .references(() => workoutTemplates.id, { onDelete: "cascade" }),
    dayKey: text("dayKey").notNull(),
    notes: text("notes"),
    createdAt: integer("createdAt", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    ...syncCols,
  },
  (t) => [
    index("workout_scheduled_user_day_idx").on(t.userId, t.dayKey),
    index("workout_scheduled_template_idx").on(t.templateId),
    index("workout_scheduled_sync_idx").on(t.userId, t.updatedAt, t.id),
  ]
);

/** Weekly (or every N weeks) repeat of a template on selected weekdays (0=Sun..6=Sat). */
export const workoutRecurringRules = sqliteTable(
  "workout_recurring_rules",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    templateId: text("templateId")
      .notNull()
      .references(() => workoutTemplates.id, { onDelete: "cascade" }),
    intervalWeeks: integer("intervalWeeks").notNull().default(1),
    /** JSON number[] weekday 0–6 (Sun–Sat), e.g. "[1,3,5]" */
    byDay: text("byDay").notNull(),
    startDayKey: text("startDayKey").notNull(),
    untilDayKey: text("untilDayKey"),
    notes: text("notes"),
    createdAt: integer("createdAt", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    ...syncCols,
  },
  (t) => [
    index("workout_recurring_rules_user_idx").on(t.userId),
    index("workout_recurring_rules_sync_idx").on(t.userId, t.updatedAt, t.id),
  ]
);

/** Omit one generated occurrence of a recurring rule (like Google "this event only"). */
export const workoutRecurringSkips = sqliteTable(
  "workout_recurring_skips",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    ruleId: text("ruleId")
      .notNull()
      .references(() => workoutRecurringRules.id, { onDelete: "cascade" }),
    dayKey: text("dayKey").notNull(),
    ...syncCols,
  },
  (t) => [
    uniqueIndex("workout_recurring_skips_rule_day_uq").on(t.ruleId, t.dayKey),
    index("workout_recurring_skips_sync_idx").on(t.userId, t.updatedAt, t.id),
  ]
);

export const meals = sqliteTable(
  "meals",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    /** Calendar day for grouping (YYYY-MM-DD, server/local convention). */
    dayKey: text("dayKey").notNull(),
    loggedAt: integer("loggedAt", { mode: "timestamp_ms" }).notNull(),
    name: text("name").notNull(),
    /** Meal-library recipe id when logged via plan quick-add (plain id; library row may be deleted). */
    sourceLibraryItemId: text("sourceLibraryItemId"),
    ...syncCols,
  },
  (t) => [
    index("meals_user_logged_idx").on(t.userId, t.loggedAt),
    index("meals_user_day_idx").on(t.userId, t.dayKey),
    index("meals_source_library_idx").on(t.sourceLibraryItemId),
    index("meals_sync_idx").on(t.userId, t.updatedAt, t.id),
  ]
);

export const mealEntries = sqliteTable(
  "meal_entries",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    mealId: text("mealId")
      .notNull()
      .references(() => meals.id, { onDelete: "cascade" }),
    description: text("description").notNull().default(""),
    calories: integer("calories").notNull().default(0),
    proteinG: real("proteinG").notNull().default(0),
    carbsG: real("carbsG").notNull().default(0),
    fatG: real("fatG").notNull().default(0),
    ...syncCols,
  },
  (t) => [
    index("meal_entries_meal_idx").on(t.mealId),
    index("meal_entries_sync_idx").on(t.userId, t.updatedAt, t.id),
  ]
);

/** Saved recipes for meal planning (distinct from daily `meals` log). */
export const mealLibraryItems = sqliteTable(
  "meal_library_items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    name: text("name").notNull(),
    instructions: text("instructions").notNull().default(""),
    calories: integer("calories").notNull().default(0),
    proteinG: real("proteinG").notNull().default(0),
    carbsG: real("carbsG").notNull().default(0),
    fatG: real("fatG").notNull().default(0),
    createdAt: integer("createdAt", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    ...syncCols,
  },
  (t) => [
    index("meal_library_items_user_idx").on(t.userId),
    index("meal_library_items_user_name_idx").on(t.userId, t.name),
    index("meal_library_items_sync_idx").on(t.userId, t.updatedAt, t.id),
  ]
);

export const mealLibraryIngredients = sqliteTable(
  "meal_library_ingredients",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    libraryItemId: text("libraryItemId")
      .notNull()
      .references(() => mealLibraryItems.id, { onDelete: "cascade" }),
    sortOrder: integer("sortOrder").notNull().default(0),
    /** One shopping-list line, e.g. "2 cups rolled oats". */
    line: text("line").notNull(),
    ...syncCols,
  },
  (t) => [
    index("meal_library_ingredients_item_idx").on(t.libraryItemId),
    index("meal_library_ingredients_sync_idx").on(t.userId, t.updatedAt, t.id),
  ]
);

/** One row per user + week (week starts Monday, `weekStartDayKey`). */
export const mealPlans = sqliteTable(
  "meal_plans",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    weekStartDayKey: text("weekStartDayKey").notNull(),
    createdAt: integer("createdAt", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    /** JSON array of retail-friendly lines; paired with `shoppingListSourceHash`. */
    aiShoppingListJson: text("aiShoppingListJson").notNull().default("[]"),
    /** SHA-256 of aggregated ingredient lines; invalidates AI list when recipes or slots change. */
    shoppingListSourceHash: text("shoppingListSourceHash"),
    ...syncCols,
  },
  (t) => [
    uniqueIndex("meal_plans_user_week_uq").on(t.userId, t.weekStartDayKey),
    index("meal_plans_sync_idx").on(t.userId, t.updatedAt, t.id),
  ]
);

export const mealPlanSlots = sqliteTable(
  "meal_plan_slots",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    planId: text("planId")
      .notNull()
      .references(() => mealPlans.id, { onDelete: "cascade" }),
    /** 0 = Monday .. 6 = Sunday */
    dayIndex: integer("dayIndex").notNull(),
    /** Order within the day (0 = first meal of the day). */
    slotIndex: integer("slotIndex").notNull().default(0),
    /** `meal` = breakfast/lunch(es)/dinner; `snack` = extra slots. */
    slotKind: text("slotKind").notNull().default("meal"),
    /** e.g. Breakfast, Lunch, Dinner, Snack — kept in sync for exports; UI derives from kind + order. */
    label: text("label").notNull().default("Meal"),
    libraryItemId: text("libraryItemId").references(() => mealLibraryItems.id, {
      onDelete: "set null",
    }),
    ...syncCols,
  },
  (t) => [
    uniqueIndex("meal_plan_slots_plan_day_slot_uq").on(
      t.planId,
      t.dayIndex,
      t.slotIndex
    ),
    index("meal_plan_slots_plan_idx").on(t.planId),
    index("meal_plan_slots_sync_idx").on(t.userId, t.updatedAt, t.id),
  ]
);

/**
 * One row per user + vitalKey + calendar day (YYYY-MM-DD). Same-day edits
 * replace the row for trend analysis.
 */
export const userVitalEntries = sqliteTable(
  "user_vital_entries",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    vitalKey: text("vitalKey").notNull(),
    dayKey: text("dayKey").notNull(),
    value: real("value").notNull(),
    recordedAt: integer("recordedAt", { mode: "timestamp_ms" }).notNull(),
    ...syncCols,
  },
  (t) => [
    uniqueIndex("user_vital_entries_user_key_day_uq").on(
      t.userId,
      t.vitalKey,
      t.dayKey
    ),
    index("user_vital_entries_user_day_idx").on(t.userId, t.dayKey),
    index("user_vital_entries_user_key_idx").on(t.userId, t.vitalKey),
    index("user_vital_entries_sync_idx").on(t.userId, t.updatedAt, t.id),
  ]
);

/** PlateChat profile: height, goals, preferences (name lives on `users`). */
export const userProfiles = sqliteTable("user_profiles", {
  userId: text("userId").primaryKey(),
  heightIn: real("heightIn"),
  /** Profile sex value (snake_case; see `PROFILE_SEX_VALUES` in profile-demographics). */
  sex: text("sex"),
  /** `sedentary` | `light` | `moderate` | `active` | `very_active` */
  activityLevel: text("activityLevel"),
  /** Approximate age in years (optional). */
  ageYears: integer("ageYears"),
  /** When the user completed in-app onboarding; null = not completed. */
  onboardingCompletedAt: integer("onboardingCompletedAt", { mode: "timestamp_ms" }),
  /** Primary goal tab: lose_weight | gain_muscle | build_strength | custom */
  goalPreset: text("goalPreset").notNull().default("custom"),
  fitnessGoals: text("fitnessGoals"),
  preferences: text("preferences"),
  /** Daily nutrition targets (optional; null = not set). */
  goalCalories: integer("goalCalories"),
  goalProteinG: real("goalProteinG"),
  goalCarbsG: real("goalCarbsG"),
  goalFatG: real("goalFatG"),
  ...syncCols,
});

/** AI coach chat threads; `messages` stores JSON-encoded `UIMessage[]`. */
export const coachConversations = sqliteTable(
  "coach_conversations",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    title: text("title").notNull().default("New chat"),
    messages: text("messages").notNull().default("[]"),
    createdAt: integer("createdAt", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    ...syncCols,
  },
  (t) => [
    index("coach_conversations_user_idx").on(t.userId),
    index("coach_conversations_user_updated_idx").on(t.userId, t.updatedAt),
    index("coach_conversations_sync_idx").on(t.userId, t.updatedAt, t.id),
  ]
);

export const userProfilesRelations = relations(userProfiles, () => ({}));

export const userVitalEntriesRelations = relations(userVitalEntries, () => ({}));

export const coachConversationsRelations = relations(
  coachConversations,
  () => ({})
);

export const exercisesRelations = relations(exercises, ({ many }) => ({
  templateItems: many(workoutTemplateItems),
  workoutSets: many(workoutSets),
  sessionExercisePrefs: many(workoutSessionExercisePrefs),
}));

export const workoutRoutineGroupsRelations = relations(
  workoutRoutineGroups,
  ({ many }) => ({
    templates: many(workoutTemplates),
  })
);

export const workoutTemplatesRelations = relations(
  workoutTemplates,
  ({ one, many }) => ({
    routineGroup: one(workoutRoutineGroups, {
      fields: [workoutTemplates.routineGroupId],
      references: [workoutRoutineGroups.id],
    }),
    items: many(workoutTemplateItems),
    sessions: many(workoutSessions),
    scheduledItems: many(workoutScheduledItems),
    recurringRules: many(workoutRecurringRules),
  })
);

export const workoutRecurringRulesRelations = relations(
  workoutRecurringRules,
  ({ one, many }) => ({
    template: one(workoutTemplates, {
      fields: [workoutRecurringRules.templateId],
      references: [workoutTemplates.id],
    }),
    skips: many(workoutRecurringSkips),
  })
);

export const workoutRecurringSkipsRelations = relations(
  workoutRecurringSkips,
  ({ one }) => ({
    rule: one(workoutRecurringRules, {
      fields: [workoutRecurringSkips.ruleId],
      references: [workoutRecurringRules.id],
    }),
  })
);

export const workoutScheduledItemsRelations = relations(
  workoutScheduledItems,
  ({ one }) => ({
    template: one(workoutTemplates, {
      fields: [workoutScheduledItems.templateId],
      references: [workoutTemplates.id],
    }),
  })
);

export const workoutTemplateItemsRelations = relations(
  workoutTemplateItems,
  ({ one }) => ({
    template: one(workoutTemplates, {
      fields: [workoutTemplateItems.templateId],
      references: [workoutTemplates.id],
    }),
    exercise: one(exercises, {
      fields: [workoutTemplateItems.exerciseId],
      references: [exercises.id],
    }),
  })
);

export const workoutSessionExercisePrefsRelations = relations(
  workoutSessionExercisePrefs,
  ({ one }) => ({
    session: one(workoutSessions, {
      fields: [workoutSessionExercisePrefs.sessionId],
      references: [workoutSessions.id],
    }),
    exercise: one(exercises, {
      fields: [workoutSessionExercisePrefs.exerciseId],
      references: [exercises.id],
    }),
  })
);

export const workoutSessionsRelations = relations(
  workoutSessions,
  ({ one, many }) => ({
    template: one(workoutTemplates, {
      fields: [workoutSessions.templateId],
      references: [workoutTemplates.id],
    }),
    sets: many(workoutSets),
    exercisePrefs: many(workoutSessionExercisePrefs),
  })
);

export const workoutSetsRelations = relations(workoutSets, ({ one }) => ({
  session: one(workoutSessions, {
    fields: [workoutSets.sessionId],
    references: [workoutSessions.id],
  }),
  exercise: one(exercises, {
    fields: [workoutSets.exerciseId],
    references: [exercises.id],
  }),
}));

export const mealsRelations = relations(meals, ({ many }) => ({
  entries: many(mealEntries),
}));

export const mealEntriesRelations = relations(mealEntries, ({ one }) => ({
  meal: one(meals, { fields: [mealEntries.mealId], references: [meals.id] }),
}));

export const mealLibraryItemsRelations = relations(
  mealLibraryItems,
  ({ many }) => ({
    ingredients: many(mealLibraryIngredients),
    planSlots: many(mealPlanSlots),
  })
);

export const mealLibraryIngredientsRelations = relations(
  mealLibraryIngredients,
  ({ one }) => ({
    libraryItem: one(mealLibraryItems, {
      fields: [mealLibraryIngredients.libraryItemId],
      references: [mealLibraryItems.id],
    }),
  })
);

export const mealPlansRelations = relations(mealPlans, ({ many }) => ({
  slots: many(mealPlanSlots),
}));

export const mealPlanSlotsRelations = relations(mealPlanSlots, ({ one }) => ({
  plan: one(mealPlans, {
    fields: [mealPlanSlots.planId],
    references: [mealPlans.id],
  }),
  libraryItem: one(mealLibraryItems, {
    fields: [mealPlanSlots.libraryItemId],
    references: [mealLibraryItems.id],
  }),
}));

/**
 * Long-lived per-device auth. On initial online login the client exchanges a
 * better-auth session for an access+refresh pair (see `src/server/auth/*`).
 * Sync API takes the access token as Bearer, refresh token rotates it.
 */
export const deviceTokens = sqliteTable(
  "device_tokens",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    deviceName: text("deviceName").notNull().default(""),
    /** SHA-256 of the refresh token; never store the raw value. */
    refreshTokenHash: text("refreshTokenHash").notNull().unique(),
    accessExpiresAt: integer("accessExpiresAt", {
      mode: "timestamp_ms",
    }).notNull(),
    refreshExpiresAt: integer("refreshExpiresAt", {
      mode: "timestamp_ms",
    }).notNull(),
    revokedAt: integer("revokedAt", { mode: "timestamp_ms" }),
    createdAt: integer("createdAt", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    lastSeenAt: integer("lastSeenAt", { mode: "timestamp_ms" }),
  },
  (t) => [index("device_tokens_user_idx").on(t.userId)]
);

/* ----------------------------------------------------------------------
 * better-auth schema
 *
 * New parallel tables used by better-auth (parallel to legacy NextAuth
 * `account` / `session` / etc.). At cutover we delete the old NextAuth
 * tables; better-auth's `baUser` aliases the existing `user` row so
 * passwords & user IDs stay stable.
 * -------------------------------------------------------------------- */

export const baSessions = sqliteTable(
  "ba_session",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: integer("expiresAt", { mode: "timestamp_ms" }).notNull(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [index("ba_session_user_idx").on(t.userId)]
);

export const baAccounts = sqliteTable(
  "ba_account",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    idToken: text("idToken"),
    accessTokenExpiresAt: integer("accessTokenExpiresAt", {
      mode: "timestamp_ms",
    }),
    refreshTokenExpiresAt: integer("refreshTokenExpiresAt", {
      mode: "timestamp_ms",
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [index("ba_account_user_idx").on(t.userId)]
);

export const baVerifications = sqliteTable("ba_verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expiresAt", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
});
