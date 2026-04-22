import { z } from "zod";

/** No tool arguments (MCP omits inputSchema for these). */
export const emptyInput = z.object({});

export const vitalKeySchema = z.enum([
  "body_weight_lb",
  "body_fat_pct",
  "resting_hr",
  "sleep_hours",
  "waist_in",
  "blood_pressure_systolic",
  "blood_pressure_diastolic",
]);

const createWorkoutTemplateInput = z.object({
  name: z.string().describe("Template name, e.g. Upper A"),
  notes: z.string().optional().describe("Optional notes"),
});

const createExerciseInput = z.object({
  name: z.string().describe("Exercise name, e.g. Bench press"),
  muscleGroup: z
    .string()
    .optional()
    .describe("Optional e.g. Chest, Back, Legs"),
  logKind: z
    .enum(["reps", "time", "distance"])
    .optional()
    .describe(
      "reps: weight × reps per set. time: duration per set. distance: distance per set (running, etc.)."
    ),
  defaultDurationSec: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("When logKind is time, default seconds per set (default 60)."),
  defaultDistance: z
    .number()
    .positive()
    .optional()
    .describe(
      "When logKind is distance, default distance per set in distanceUnit (defaults by unit)."
    ),
  distanceUnit: z
    .enum(["km", "mi", "m"])
    .optional()
    .describe("Unit for defaultDistance and logged sets when logKind is distance."),
  weightUnit: z
    .enum(["lb", "kg"])
    .optional()
    .describe("Unit for default and logged weights; default lb (imperial)."),
});

const addExerciseToTemplateInput = z.object({
  templateId: z.string().describe("Workout template UUID"),
  exerciseId: z
    .string()
    .describe(
      "Exercise id from list_exercises (preset or custom) or create_exercise"
    ),
  targetSets: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Default 3"),
  targetReps: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("For rep-based exercises (default 5)"),
  targetDurationSec: z
    .number()
    .int()
    .positive()
    .optional()
    .describe(
      "For timed exercises: seconds per set (defaults from exercise)"
    ),
  targetDistance: z
    .number()
    .positive()
    .optional()
    .describe(
      "For distance exercises: distance per set in the exercise's distance unit"
    ),
  defaultWeight: z
    .number()
    .nullable()
    .optional()
    .describe("Suggested working weight for this template; omit if unknown"),
  weightUnit: z
    .enum(["lb", "kg"])
    .nullable()
    .optional()
    .describe(
      "Unit for defaultWeight and session loads; null inherits exercise library default."
    ),
  progressiveOverloadEnabled: z.boolean().optional(),
  progressiveOverloadIncrement: z.number().positive().nullable().optional(),
  progressiveOverloadRequireFullCompletion: z.boolean().optional(),
});

const addExerciseToTemplateLineInput = addExerciseToTemplateInput.omit({
  templateId: true,
});

const bulkAddExercisesToTemplateInput = z.object({
  templateId: z.string().describe("Workout template UUID"),
  exercises: z
    .array(addExerciseToTemplateLineInput)
    .min(1)
    .max(100)
    .describe(
      "Exercises to append in list order (same fields as add_exercise_to_template per row, without templateId)."
    ),
});

const createWorkoutRoutineInput = z.object({
  name: z
    .string()
    .describe("Name for the routine group (e.g. Upper / lower, PPL)"),
});

const assignWorkoutToRoutineInput = z.object({
  templateId: z
    .string()
    .describe("Saved workout id from list_workout_templates"),
  routineGroupId: z
    .string()
    .nullable()
    .describe(
      "Routine group id from list_workout_routines; null removes the workout from all routines"
    ),
});

const renameWorkoutRoutineInput = z.object({
  routineGroupId: z.string().describe("Routine id from list_workout_routines"),
  name: z.string().describe("New display name"),
});

const deleteWorkoutRoutineInput = z.object({
  routineGroupId: z.string().describe("Routine group id to delete"),
});

const listWorkoutScheduleInput = z.object({
  month: z
    .string()
    .optional()
    .describe("YYYY-MM — if set, overrides from/to"),
  from: z.string().optional().describe("Start day YYYY-MM-DD"),
  to: z.string().optional().describe("End day YYYY-MM-DD inclusive"),
});

const scheduleWorkoutTemplateInput = z.object({
  templateId: z.string().describe("Workout template UUID"),
  dayKey: z.string().describe("YYYY-MM-DD"),
  notes: z.string().optional().describe("Optional note on the plan"),
});

const unscheduleWorkoutInput = z.object({
  scheduleId: z.string().describe("Scheduled row UUID"),
});

const createRecurringWorkoutScheduleInput = z.object({
  templateId: z.string().describe("Workout template UUID"),
  byDay: z
    .array(z.number().int().min(0).max(6))
    .describe("Weekdays to repeat on, e.g. [1,3,5] for Mon/Wed/Fri"),
  startDayKey: z.string().describe("First day the rule applies (YYYY-MM-DD)"),
  untilDayKey: z
    .string()
    .optional()
    .describe("Last day inclusive, YYYY-MM-DD; omit for no end"),
  intervalWeeks: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Repeat every N weeks (default 1)"),
  notes: z.string().optional(),
});

const deleteRecurringWorkoutScheduleInput = z.object({
  ruleId: z.string(),
});

const skipRecurringWorkoutDayInput = z.object({
  ruleId: z.string(),
  dayKey: z.string().describe("YYYY-MM-DD"),
});

const startWorkoutInput = z.object({
  templateId: z.string().describe("Workout template UUID"),
});

const logSetInput = z
  .object({
    sessionId: z.string(),
    exerciseId: z.string(),
    setIndex: z.number().int().positive(),
    weight: z.number(),
    reps: z.number().int().positive().optional(),
    durationSec: z.number().int().positive().optional(),
    weightUnit: z
      .enum(["lb", "kg"])
      .optional()
      .describe(
        "Optional documentation only: must match the exercise row in the active template."
      ),
  })
  .refine((v) => v.reps != null || v.durationSec != null, {
    message: "Provide reps or durationSec",
  });

const completeWorkoutInput = z.object({ sessionId: z.string() });

const getDailyNutritionInput = z.object({
  date: z.string().optional().describe("Day key e.g. 2026-04-06"),
});

const logMealInput = z.object({
  dayKey: z.string().describe("YYYY-MM-DD"),
  name: z.string().describe("e.g. Lunch"),
});

const logMealEntryInput = z.object({
  mealId: z.string(),
  description: z.string().optional(),
  calories: z.number(),
  proteinG: z.number().optional(),
  carbsG: z.number().optional(),
  fatG: z.number().optional(),
});

const listMealLibraryInput = z.object({
  query: z.string().optional().describe("Substring search; omit for full list"),
});

const getMealLibraryItemInput = z.object({ id: z.string() });

const createMealLibraryItemInput = z.object({
  name: z.string(),
  instructions: z.string().optional(),
  calories: z.number().optional(),
  proteinG: z.number().optional(),
  carbsG: z.number().optional(),
  fatG: z.number().optional(),
  ingredients: z.array(z.string()).optional(),
});

const updateMealLibraryItemInput = z.object({
  id: z.string(),
  name: z.string(),
  instructions: z.string().optional(),
  calories: z.number().optional(),
  proteinG: z.number().optional(),
  carbsG: z.number().optional(),
  fatG: z.number().optional(),
  ingredients: z.array(z.string()).optional(),
});

const deleteMealLibraryItemInput = z.object({ id: z.string() });

const getMealPlanInput = z.object({
  weekStart: z
    .string()
    .optional()
    .describe("Monday YYYY-MM-DD; omit for current week"),
});

/** Same week selector as get_meal_plan — shopping list only. */
const getMealPlanShoppingListInput = getMealPlanInput;

const setMealPlanSlotInput = z.object({
  weekStartDayKey: z.string().describe("Monday YYYY-MM-DD"),
  dayIndex: z.number().int().min(0).max(6),
  /** Which meal of the day: 0=breakfast, 1=lunch, 2=dinner by default; higher indexes are extra slots. Default 0. */
  slotIndex: z.number().int().min(0).max(50).optional(),
  libraryItemId: z.string().nullable().optional(),
});

const setMealPlanSlotsBatchInput = z.object({
  weekStartDayKey: z.string().describe("Monday YYYY-MM-DD for the week"),
  assignments: z
    .array(
      z.object({
        dayIndex: z.number().int().min(0).max(6),
        slotIndex: z.number().int().min(0).max(50).optional(),
        libraryItemId: z.string().nullable().optional(),
      })
    )
    .max(200)
    .describe(
      "Each object sets one slot for this week. Order is preserved; duplicate day+slot uses the last. Empty array only touches the plan row (rare)."
    ),
});

const getProgressExerciseWeightInput = z.object({
  exerciseId: z.string(),
  from: z.string().describe("YYYY-MM-DD"),
  to: z.string().describe("YYYY-MM-DD"),
});

const getProgressMacrosInput = z.object({
  from: z.string().describe("YYYY-MM-DD"),
  to: z.string().describe("YYYY-MM-DD"),
});

const getProgressWeightBmiInput = z.object({
  from: z.string().describe("YYYY-MM-DD"),
  to: z.string().describe("YYYY-MM-DD"),
});

const getProgressVitalsLogInput = z.object({
  from: z.string().describe("YYYY-MM-DD"),
  to: z.string().describe("YYYY-MM-DD"),
  keys: z
    .string()
    .optional()
    .describe("Comma-separated vital keys, e.g. body_weight_lb,resting_hr"),
});

const upsertProgressVitalsInput = z.object({
  dayKey: z
    .string()
    .optional()
    .describe("YYYY-MM-DD; omit for today"),
  entries: z
    .array(
      z.object({
        vitalKey: vitalKeySchema,
        value: z.number(),
      })
    )
    .min(1),
});

const goalPresetSchema = z.enum([
  "lose_weight",
  "gain_muscle",
  "build_strength",
  "custom",
]);

const updateUserProfileInput = z
  .object({
    name: z
      .string()
      .nullable()
      .optional()
      .describe("Display name"),
    heightIn: z
      .number()
      .positive()
      .nullable()
      .optional()
      .describe("Height in inches"),
    goalPreset: goalPresetSchema
      .nullable()
      .optional()
      .describe(
        "Exactly one of: lose_weight | gain_muscle | build_strength | custom (snake_case only; no other strings)"
      ),
    fitnessGoals: z
      .string()
      .nullable()
      .optional()
      .describe(
        "When goalPreset is custom: full goal text. Otherwise: additional goals beyond the preset"
      ),
    preferences: z
      .string()
      .nullable()
      .optional()
      .describe("Food preferences, gym equipment, constraints"),
    goalCalories: z
      .number()
      .int()
      .min(0)
      .max(50000)
      .nullable()
      .optional()
      .describe("Daily calorie target (kcal). Null clears."),
    goalProteinG: z
      .number()
      .min(0)
      .max(1000)
      .nullable()
      .optional()
      .describe("Daily protein target in grams. Null clears."),
    goalCarbsG: z
      .number()
      .min(0)
      .max(1000)
      .nullable()
      .optional()
      .describe("Daily carbs target in grams. Null clears."),
    goalFatG: z
      .number()
      .min(0)
      .max(1000)
      .nullable()
      .optional()
      .describe("Daily fat target in grams. Null clears."),
  })
  .refine(
    (o) =>
      o.name !== undefined ||
      o.heightIn !== undefined ||
      o.goalPreset !== undefined ||
      o.fitnessGoals !== undefined ||
      o.preferences !== undefined ||
      o.goalCalories !== undefined ||
      o.goalProteinG !== undefined ||
      o.goalCarbsG !== undefined ||
      o.goalFatG !== undefined,
    { message: "Provide at least one field" }
  );

export const TRAINLOG_TOOL_DEFINITIONS = [
  {
    name: "list_workout_templates" as const,
    description:
      "List saved workout templates with exercises and set/rep targets.",
    completionText: "Loaded your workout templates",
    errorText: "Couldn't load workout templates",
    inputSchema: emptyInput,
  },
  {
    name: "create_workout_template" as const,
    description:
      "Create a new empty workout template (saved routine). Add lifts with bulk_add_exercises_to_template or add_exercise_to_template, then start_workout when ready.",
    completionText: "Created workout template",
    errorText: "Couldn't create workout template",
    inputSchema: createWorkoutTemplateInput,
  },
  {
    name: "list_exercises" as const,
    description:
      "List exercises available to the user: built-in presets plus custom lifts. Use before add_exercise_to_template to reuse an id, or create_exercise for something not in the list.",
    completionText: "Loaded exercises",
    errorText: "Couldn't load exercises",
    inputSchema: emptyInput,
  },
  {
    name: "create_exercise" as const,
    description:
      "Create a custom exercise in the user's library, then add it to a template with add_exercise_to_template.",
    completionText: "Created exercise",
    errorText: "Couldn't create exercise",
    inputSchema: createExerciseInput,
  },
  {
    name: "add_exercise_to_template" as const,
    description:
      "Append an exercise to a workout template (end of the list). Use list_exercises or create_exercise for exerciseId.",
    completionText: "Added exercise to template",
    errorText: "Couldn't add exercise to template",
    inputSchema: addExerciseToTemplateInput,
  },
  {
    name: "bulk_add_exercises_to_template" as const,
    description:
      "Append multiple exercises to a workout template in one call (same order as the array). Prefer over many add_exercise_to_template calls when building a full routine.",
    completionText: "Added exercises to template",
    errorText: "Couldn't add exercises to template",
    inputSchema: bulkAddExercisesToTemplateInput,
  },
  {
    name: "list_workout_routines" as const,
    description:
      "List routine groups and which saved workouts (templates) belong to each. Also lists workouts not in any routine (`ungrouped`). Use before assign_workout_to_routine or create_workout_routine.",
    completionText: "Loaded workout routines",
    errorText: "Couldn't load workout routines",
    inputSchema: emptyInput,
  },
  {
    name: "create_workout_routine" as const,
    description:
      "Create a named routine group (empty until you assign workouts with assign_workout_to_routine).",
    completionText: "Created workout routine",
    errorText: "Couldn't create workout routine",
    inputSchema: createWorkoutRoutineInput,
  },
  {
    name: "assign_workout_to_routine" as const,
    description:
      "Put a saved workout template into a routine group, or remove it from routines (routineGroupId null). Appends to the end of that routine’s order.",
    completionText: "Updated workout routine assignment",
    errorText: "Couldn't assign workout to routine",
    inputSchema: assignWorkoutToRoutineInput,
  },
  {
    name: "rename_workout_routine" as const,
    description: "Rename a routine group (does not change workout templates).",
    completionText: "Renamed workout routine",
    errorText: "Couldn't rename workout routine",
    inputSchema: renameWorkoutRoutineInput,
  },
  {
    name: "delete_workout_routine" as const,
    description:
      "Delete a routine group. Workouts remain in the library ungrouped (not deleted).",
    completionText: "Deleted workout routine",
    errorText: "Couldn't delete workout routine",
    inputSchema: deleteWorkoutRoutineInput,
  },
  {
    name: "list_workout_schedule" as const,
    description:
      "List planned workouts (one-off + weekly repeats), recurring rule definitions, one-off rows, and sessions in a range. Pass `month` (YYYY-MM) or `from` and `to` (YYYY-MM-DD). Defaults to the current calendar month.",
    completionText: "Loaded workout calendar",
    errorText: "Couldn't load workout calendar",
    inputSchema: listWorkoutScheduleInput,
  },
  {
    name: "schedule_workout_template" as const,
    description:
      "Plan a saved workout template on a calendar day (YYYY-MM-DD). Does not start the session; use start_workout when ready.",
    completionText: "Scheduled workout",
    errorText: "Couldn't schedule workout",
    inputSchema: scheduleWorkoutTemplateInput,
  },
  {
    name: "unschedule_workout" as const,
    description:
      "Remove a planned workout from the calendar. Use list_workout_schedule for ids.",
    completionText: "Removed planned workout",
    errorText: "Couldn't remove planned workout",
    inputSchema: unscheduleWorkoutInput,
  },
  {
    name: "create_recurring_workout_schedule" as const,
    description:
      "Create a Google Calendar–style weekly repeat: template on selected weekdays (0=Sun..6=Sat), optional end date, repeat every N weeks (default 1).",
    completionText: "Created repeating workout schedule",
    errorText: "Couldn't create repeating schedule",
    inputSchema: createRecurringWorkoutScheduleInput,
  },
  {
    name: "delete_recurring_workout_schedule" as const,
    description:
      "Delete an entire repeating schedule (rule id from list_workout_schedule.recurringRules).",
    completionText: "Deleted repeating schedule",
    errorText: "Couldn't delete repeating schedule",
    inputSchema: deleteRecurringWorkoutScheduleInput,
  },
  {
    name: "skip_recurring_workout_day" as const,
    description:
      "Skip one generated occurrence of a repeating schedule (like deleting a single Google Calendar instance).",
    completionText: "Skipped that workout day",
    errorText: "Couldn't skip workout day",
    inputSchema: skipRecurringWorkoutDayInput,
  },
  {
    name: "get_active_workout" as const,
    description: "Get the current active workout session, if any.",
    completionText: "Checked active workout",
    errorText: "Couldn't read active workout",
    inputSchema: emptyInput,
  },
  {
    name: "start_workout" as const,
    description:
      "Start a workout from a template id (or resume if one is already active).",
    completionText: "Started workout",
    errorText: "Couldn't start workout",
    inputSchema: startWorkoutInput,
  },
  {
    name: "log_set" as const,
    description:
      "Log or update one set for an active session. Use reps for rep-based lifts; durationSec for timed/cardio (no reps). Weight is in the template line's unit (lb or kg).",
    completionText: "Logged set",
    errorText: "Couldn't log set",
    inputSchema: logSetInput,
  },
  {
    name: "complete_workout" as const,
    description:
      "Mark a workout session as completed. Exercises with progressive overload on the template may auto-increase default load, target time, or target distance.",
    completionText: "Completed workout",
    errorText: "Couldn't complete workout",
    inputSchema: completeWorkoutInput,
  },
  {
    name: "get_progress_exercise_weight" as const,
    description:
      "Per-day best logged value for one exercise over completed workouts (inclusive day range). Metric depends on exercise type: max load (reps), longest hold in seconds (time), or best distance / time (distance). Response includes `metric` and `series`.",
    completionText: "Loaded exercise progress",
    errorText: "Couldn't load exercise progress",
    inputSchema: getProgressExerciseWeightInput,
  },
  {
    name: "get_progress_macros" as const,
    description:
      "Daily nutrition totals (calories, protein, carbs, fat) for each day in an inclusive range.",
    completionText: "Loaded macro progress",
    errorText: "Couldn't load macro progress",
    inputSchema: getProgressMacrosInput,
  },
  {
    name: "get_progress_weight_bmi" as const,
    description:
      "Weight (lb) and BMI series from vitals. BMI uses the user’s profile height (inches), or legacy height from older data. `latestHeightIn` is that effective height.",
    completionText: "Loaded weight and BMI progress",
    errorText: "Couldn't load weight and BMI progress",
    inputSchema: getProgressWeightBmiInput,
  },
  {
    name: "get_progress_vitals_latest" as const,
    description:
      "Read the user’s most recent logged value for each vital (weight, body fat %, resting HR, sleep, waist, blood pressure — not height). For height, goals, and preferences use get_user_profile. Body weight is pounds (body_weight_lb).",
    completionText: "Loaded latest vitals",
    errorText: "Couldn't load latest vitals",
    inputSchema: emptyInput,
  },
  {
    name: "get_progress_vitals_log" as const,
    description:
      "List vital readings between two calendar days (inclusive). Use for history or trends; for “what is my weight now?” prefer get_progress_vitals_latest. Optional keys filter (comma-separated) limits which metrics are returned.",
    completionText: "Loaded vitals history",
    errorText: "Couldn't load vitals history",
    inputSchema: getProgressVitalsLogInput,
  },
  {
    name: "upsert_progress_vitals" as const,
    description:
      "Save one or more vital readings for a calendar day (defaults to today). Same day + same metric replaces the previous value.",
    completionText: "Saved vitals",
    errorText: "Couldn't save vitals",
    inputSchema: upsertProgressVitalsInput,
  },
  {
    name: "get_user_profile" as const,
    description:
      "Read the user’s profile: name, height (inches), goalPreset (always one of lose_weight, gain_muscle, build_strength, custom), fitnessGoals text, preferences, and optional daily macro targets (goalCalories kcal; goalProteinG, goalCarbsG, goalFatG in grams). goalPreset is the API token for the primary goal tab; fitnessGoals is the full goal when preset is custom, otherwise additional goals. Height is not in vitals.",
    completionText: "Loaded profile",
    errorText: "Couldn't load profile",
    inputSchema: emptyInput,
  },
  {
    name: "update_user_profile" as const,
    description:
      "Update profile fields. goalPreset must be exactly one of these four strings (snake_case): lose_weight, gain_muscle, build_strength, custom — no synonyms. When custom, fitnessGoals is the full goal; otherwise it is extra detail beyond the preset. Daily macro goals: goalCalories (kcal), goalProteinG / goalCarbsG / goalFatG (grams). Omit a field to leave it unchanged; null clears text, height, or a macro target.",
    completionText: "Updated profile",
    errorText: "Couldn't update profile",
    inputSchema: updateUserProfileInput,
  },
  {
    name: "get_daily_nutrition" as const,
    description:
      "Get meals and macro totals for a calendar day (YYYY-MM-DD). Omit date for today.",
    completionText: "Loaded daily nutrition",
    errorText: "Couldn't load daily nutrition",
    inputSchema: getDailyNutritionInput,
  },
  {
    name: "log_meal" as const,
    description:
      "Create a meal bucket for a day (then add entries with log_meal_entry).",
    completionText: "Created meal",
    errorText: "Couldn't create meal",
    inputSchema: logMealInput,
  },
  {
    name: "log_meal_entry" as const,
    description: "Add a food line with calories and macros to a meal.",
    completionText: "Logged food entry",
    errorText: "Couldn't log food entry",
    inputSchema: logMealEntryInput,
  },
  {
    name: "list_meal_library" as const,
    description:
      "Search saved meal-library recipes (ingredients, instructions, macros). Matches name, instructions, and ingredient lines.",
    completionText: "Searched meal library",
    errorText: "Couldn't search meal library",
    inputSchema: listMealLibraryInput,
  },
  {
    name: "get_meal_library_item" as const,
    description: "Get one meal-library recipe by id.",
    completionText: "Loaded meal recipe",
    errorText: "Couldn't load meal recipe",
    inputSchema: getMealLibraryItemInput,
  },
  {
    name: "create_meal_library_item" as const,
    description:
      "Create a meal-library recipe (ingredient lines, instructions, macros).",
    completionText: "Saved meal recipe",
    errorText: "Couldn't save meal recipe",
    inputSchema: createMealLibraryItemInput,
  },
  {
    name: "update_meal_library_item" as const,
    description: "Update a meal-library recipe (replaces ingredient list).",
    completionText: "Updated meal recipe",
    errorText: "Couldn't update meal recipe",
    inputSchema: updateMealLibraryItemInput,
  },
  {
    name: "delete_meal_library_item" as const,
    description:
      "Delete a meal-library recipe. Clears weekly plan slots that referenced it.",
    completionText: "Deleted meal recipe",
    errorText: "Couldn't delete meal recipe",
    inputSchema: deleteMealLibraryItemInput,
  },
  {
    name: "get_meal_plan" as const,
    description:
      "Weekly meal plan (Mon–Sun) from the library plus a shopping list (AI: store sections, rough USD estimates, total when configured; otherwise merged ingredient lines). Uses Monday weekStart YYYY-MM-DD; defaults to this week. Creates empty slots if missing.",
    completionText: "Loaded meal plan",
    errorText: "Couldn't load meal plan",
    inputSchema: getMealPlanInput,
  },
  {
    name: "get_meal_plan_shopping_list" as const,
    description:
      "Weekly grocery shopping list for the meal plan: calling this tool runs generation when AI is configured (sections, per-line estimated USD, totalEstimatedUsd). If AI is unavailable, returns merged ingredient lines without prices (aiGenerated false). Same weekStart as get_meal_plan (Monday YYYY-MM-DD; omit for current week). Prefer this over get_meal_plan when the user only asks about groceries, cost, or what to buy.",
    completionText: "Loaded shopping list",
    errorText: "Couldn't load shopping list",
    inputSchema: getMealPlanShoppingListInput,
  },
  {
    name: "set_meal_plan_slot" as const,
    description:
      "Set or clear which library meal is assigned to a single slot. dayIndex 0=Monday … 6=Sunday. slotIndex selects the meal within that day (0=breakfast, 1=lunch, 2=dinner by default; omit slotIndex for breakfast). Prefer set_meal_plan_slots_batch when assigning many slots in the same week.",
    completionText: "Updated meal plan slot",
    errorText: "Couldn't update meal plan slot",
    inputSchema: setMealPlanSlotInput,
  },
  {
    name: "set_meal_plan_slots_batch" as const,
    description:
      "Assign library meals to many weekly plan slots in one call (same weekStartDayKey). Each assignment is { dayIndex, slotIndex?, libraryItemId } — same rules as set_meal_plan_slot. Use when building or replacing a full week to avoid dozens of tool calls.",
    completionText: "Updated meal plan slots",
    errorText: "Couldn't update meal plan slots",
    inputSchema: setMealPlanSlotsBatchInput,
  },
] as const;

export type TrainlogToolName = (typeof TRAINLOG_TOOL_DEFINITIONS)[number]["name"];

const defByName = Object.fromEntries(
  TRAINLOG_TOOL_DEFINITIONS.map((d) => [d.name, d])
) as {
  [K in TrainlogToolName]: (typeof TRAINLOG_TOOL_DEFINITIONS)[number] & {
    name: K;
  };
};

export function isEmptyToolInputSchema(s: z.ZodTypeAny): boolean {
  return s === emptyInput;
}

export function parseTrainlogToolInput(
  name: TrainlogToolName,
  raw: unknown
): unknown {
  const def = defByName[name];
  return def.inputSchema.parse(raw ?? {});
}

export function getTrainlogToolDefinition(name: TrainlogToolName) {
  return defByName[name];
}
