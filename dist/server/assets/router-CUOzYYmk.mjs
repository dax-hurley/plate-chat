import { jsx, jsxs } from "react/jsx-runtime";
import { createRootRoute, HeadContent, Outlet, Scripts, createFileRoute, lazyRouteComponent, redirect, createRouter as createRouter$1 } from "@tanstack/react-router";
import { useState, useEffect, useMemo, createContext, useContext } from "react";
import Dexie from "dexie";
import { Capacitor } from "@capacitor/core";
import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { sql, relations, eq, desc, and, asc, gte, lte, inArray, lt, isNull, or, gt, like, ne } from "drizzle-orm";
import { sqliteTable, integer, real, text, uniqueIndex, index } from "drizzle-orm/sqlite-core";
import { ThemeProvider, useTheme } from "next-themes";
import { Toaster as Toaster$1 } from "sonner";
import { Loader2Icon, OctagonXIcon, TriangleAlertIcon, InfoIcon, CircleCheckIcon } from "lucide-react";
import * as z from "zod";
import { z as z$1 } from "zod";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { jwtVerify, SignJWT, decodeProtectedHeader, jwtDecrypt, calculateJwkThumbprint, base64url, EncryptJWT } from "jose";
import { anthropic } from "@ai-sdk/anthropic";
import { tool, generateText, convertToModelMessages, isToolUIPart, streamText, stepCountIs, asSchema } from "ai";
import { createHash } from "node:crypto";
import { getAuthTables } from "@better-auth/core/db";
import { env, isProduction, isTest, isDevelopment, logger, shouldPublishLog, createLogger } from "@better-auth/core/env";
import { BetterAuthError, APIError, BASE_ERROR_CODES } from "@better-auth/core/error";
import { createKyselyAdapter, getKyselyDatabaseType } from "@better-auth/kysely-adapter";
import { initGetModelName, initGetFieldName } from "@better-auth/core/db/adapter";
import { sql as sql$1 } from "kysely";
import { hashPassword, verifyPassword as verifyPassword$2 } from "@better-auth/utils/password";
import { hkdf } from "@noble/hashes/hkdf.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { filterOutputFields } from "@better-auth/core/utils/db";
import { safeJSONParse } from "@better-auth/core/utils/json";
import { base64Url } from "@better-auth/utils/base64";
import { binary } from "@better-auth/utils/binary";
import { createHMAC } from "@better-auth/utils/hmac";
import { isValidIP, normalizeIP, createRateLimitKey } from "@better-auth/core/utils/ip";
import { createHash as createHash$1 } from "@better-auth/utils/hash";
import { defineRequestState, getCurrentAuthContext, getCurrentAdapter, queueAfterTransactionHook, runWithTransaction, hasRequestState, runWithRequestState, runWithEndpointContext, getBetterAuthVersion, runWithAdapter } from "@better-auth/core/context";
import { withSpan, ATTR_CONTEXT, ATTR_DB_COLLECTION_NAME, ATTR_HOOK_TYPE, ATTR_OPERATION_ID, ATTR_HTTP_ROUTE, ATTR_HTTP_RESPONSE_STATUS_CODE } from "@better-auth/core/instrumentation";
import { generateId } from "@better-auth/core/utils/id";
import defu$1, { defu, createDefu } from "defu";
import { isLoopbackHost } from "@better-auth/core/utils/host";
import { isAPIError } from "@better-auth/core/utils/is-api-error";
import { normalizePathname } from "@better-auth/core/utils/url";
import { createAuthMiddleware, createAuthEndpoint } from "@better-auth/core/api";
import { deprecate } from "@better-auth/core/utils/deprecate";
import { createRandomStringGenerator } from "@better-auth/utils/random";
import "@better-auth/utils";
import { xchacha20poly1305 } from "@noble/ciphers/chacha.js";
import { utf8ToBytes, bytesToHex, managedNonce, hexToBytes } from "@noble/ciphers/utils.js";
import { SocialProviderListEnum, socialProviders } from "@better-auth/core/social-providers";
import { JWTExpired } from "jose/errors";
import { toResponse, kAPIErrorHeaderSymbol, createRouter } from "better-call";
import { createTelemetry } from "@better-auth/telemetry";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
const APP_BRAND_NAME = "PlateChat";
class TrainlogDB extends Dexie {
  constructor() {
    super("trainlog");
    this.version(1).stores({
      exercises: "id, userId, name, _dirty",
      workoutRoutineGroups: "id, userId, sortOrder, _dirty",
      workoutTemplates: "id, userId, createdAt, _dirty",
      workoutTemplateItems: "id, templateId, [templateId+order], _dirty",
      workoutSessions: "id, [userId+status+startedAt], _dirty",
      workoutSets: "id, sessionId, [sessionId+setIndex], _dirty",
      workoutSessionExercisePrefs: "id, [sessionId+exerciseId], _dirty",
      workoutScheduledItems: "id, [userId+dayKey], _dirty",
      workoutRecurringRules: "id, userId, _dirty",
      workoutRecurringSkips: "id, [ruleId+dayKey], _dirty",
      meals: "id, [userId+dayKey+loggedAt], _dirty",
      mealEntries: "id, mealId, _dirty",
      mealLibraryItems: "id, [userId+name], _dirty",
      mealLibraryIngredients: "id, [libraryItemId+sortOrder], _dirty",
      mealPlans: "id, [userId+weekStartDayKey], _dirty",
      mealPlanSlots: "id, [planId+dayIndex+slotIndex], _dirty",
      userProfiles: "userId, _dirty",
      userVitalEntries: "id, [userId+vitalKey+dayKey], [userId+vitalKey], [userId+dayKey], _dirty",
      coachConversations: "id, [userId+updatedAt], _dirty",
      _sync: "name"
    });
  }
}
let instance = null;
function getDb() {
  if (!instance) instance = new TrainlogDB();
  return instance;
}
async function resetDb() {
  const db2 = getDb();
  await db2.delete();
  instance = null;
}
function isDevForceOffline() {
  return false;
}
const KEY = "trainlog.device-tokens";
let preferencesCache;
async function getPreferences() {
  if (preferencesCache !== void 0) return preferencesCache;
  if (!Capacitor.isNativePlatform()) {
    preferencesCache = null;
    return null;
  }
  try {
    const mod = await import("@capacitor/preferences");
    preferencesCache = mod.Preferences;
  } catch {
    preferencesCache = null;
  }
  return preferencesCache;
}
async function saveTokens(bundle) {
  const serialized = JSON.stringify(bundle);
  const prefs = await getPreferences();
  if (prefs) {
    await prefs.set({ key: KEY, value: serialized });
    return;
  }
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(KEY, serialized);
  }
}
async function loadTokens() {
  const prefs = await getPreferences();
  let raw = null;
  if (prefs) {
    raw = (await prefs.get({ key: KEY })).value;
  } else if (typeof localStorage !== "undefined") {
    raw = localStorage.getItem(KEY);
  }
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
async function clearTokens() {
  const prefs = await getPreferences();
  if (prefs) {
    await prefs.remove({ key: KEY });
  } else if (typeof localStorage !== "undefined") {
    localStorage.removeItem(KEY);
  }
}
function isEffectivelyOnline() {
  if (isDevForceOffline()) return false;
  return typeof navigator === "undefined" || navigator.onLine;
}
let refreshInFlight = null;
async function refreshOnce() {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    if (!isEffectivelyOnline()) {
      return null;
    }
    const existing = await loadTokens();
    if (!existing) return null;
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: existing.refreshToken })
      });
      if (!res.ok) {
        if (res.status === 401) await clearTokens();
        return null;
      }
      const data = await res.json();
      const bundle = { ...existing, ...data };
      await saveTokens(bundle);
      return bundle;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}
async function authFetch(input, init2 = {}) {
  const headers = new Headers(init2.headers);
  let tokens = await loadTokens();
  if (tokens) {
    if (tokens.accessExpiresAt - 3e4 < Date.now()) {
      if (isEffectivelyOnline()) {
        tokens = await refreshOnce() ?? tokens;
      }
    }
    headers.set("Authorization", `Bearer ${tokens.accessToken}`);
  }
  const res = await fetch(input, { ...init2, headers });
  if (res.status !== 401) return res;
  if (!isEffectivelyOnline()) {
    return res;
  }
  const rotated = await refreshOnce();
  if (!rotated) return res;
  const retryHeaders = new Headers(init2.headers);
  retryHeaders.set("Authorization", `Bearer ${rotated.accessToken}`);
  return fetch(input, { ...init2, headers: retryHeaders });
}
const syncCols = {
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull().default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
  deletedAt: integer("deletedAt", { mode: "timestamp_ms" }),
  rev: integer("rev").notNull().default(1)
};
const users = sqliteTable("user", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: integer("emailVerified", { mode: "boolean" }),
  image: text("image"),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull().default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
});
const personalAccessTokens = sqliteTable(
  "personal_access_tokens",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    tokenHash: text("tokenHash").notNull().unique(),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    lastUsedAt: integer("lastUsedAt", { mode: "timestamp_ms" })
  },
  (t) => [index("personal_access_tokens_user_idx").on(t.userId)]
);
const exercises = sqliteTable(
  "exercises",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
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
    trackWeight: integer("trackWeight", { mode: "boolean" }).notNull().default(true),
    isCustom: integer("isCustom", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    ...syncCols
  },
  (t) => [
    index("exercises_user_idx").on(t.userId),
    index("exercises_sync_idx").on(t.userId, t.updatedAt, t.id)
  ]
);
const workoutRoutineGroups = sqliteTable(
  "workout_routine_groups",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    name: text("name").notNull(),
    /** Sort order among this user's routines (lower first). */
    sortOrder: integer("sortOrder").notNull().default(0),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    ...syncCols
  },
  (t) => [
    index("workout_routine_groups_user_idx").on(t.userId),
    index("workout_routine_groups_user_sort_idx").on(t.userId, t.sortOrder),
    index("workout_routine_groups_sync_idx").on(t.userId, t.updatedAt, t.id)
  ]
);
const workoutTemplates = sqliteTable(
  "workout_templates",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    name: text("name").notNull(),
    notes: text("notes"),
    routineGroupId: text("routineGroupId").references(
      () => workoutRoutineGroups.id,
      { onDelete: "set null" }
    ),
    /** Order within `routineGroupId`; null when the template is not in a routine. */
    routineOrder: integer("routineOrder"),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    ...syncCols
  },
  (t) => [
    index("workout_templates_user_idx").on(t.userId),
    index("workout_templates_routine_group_idx").on(t.routineGroupId),
    index("workout_templates_sync_idx").on(t.userId, t.updatedAt, t.id)
  ]
);
const workoutTemplateItems = sqliteTable(
  "workout_template_items",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    templateId: text("templateId").notNull().references(() => workoutTemplates.id, { onDelete: "cascade" }),
    exerciseId: text("exerciseId").notNull().references(() => exercises.id, { onDelete: "cascade" }),
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
      mode: "boolean"
    }).notNull().default(false),
    /** Added to `defaultWeight` after each qualifying completed session (same unit as weight). */
    progressiveOverloadIncrement: real("progressiveOverloadIncrement"),
    progressiveOverloadRequireFullCompletion: integer(
      "progressiveOverloadRequireFullCompletion",
      { mode: "boolean" }
    ).notNull().default(false),
    /**
     * Per–workout line: whether to show load and log weight on sets. Usually
     * matches the exercise; can differ for preset exercises in a template.
     */
    trackWeight: integer("trackWeight", { mode: "boolean" }).notNull().default(true),
    /**
     * When the exercise logs by distance, optionally record stopwatch time
     * (`durationSec`) instead of distance for each set. Uses `targetDurationSec`
     * as the goal (and PO) when set.
     */
    logTimeForDistanceSets: integer("logTimeForDistanceSets", {
      mode: "boolean"
    }).notNull().default(false),
    /** When true, the lift appears under the session Warmup tab instead of Workout. */
    isWarmup: integer("isWarmup", { mode: "boolean" }).notNull().default(false),
    /**
     * Rest after each logged set for this exercise (seconds). Null or 0
     * disables the between-set countdown for this line in the active session.
     */
    restBetweenSetsSec: integer("restBetweenSetsSec"),
    ...syncCols
  },
  (t) => [
    index("workout_template_items_template_idx").on(t.templateId),
    index("workout_template_items_exercise_idx").on(t.exerciseId),
    index("workout_template_items_sync_idx").on(t.userId, t.updatedAt, t.id)
  ]
);
const workoutSessions = sqliteTable(
  "workout_sessions",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    templateId: text("templateId").references(() => workoutTemplates.id, {
      onDelete: "set null"
    }),
    startedAt: integer("startedAt", { mode: "timestamp_ms" }).notNull(),
    endedAt: integer("endedAt", { mode: "timestamp_ms" }),
    status: text("status").notNull().default("active"),
    ...syncCols
  },
  (t) => [
    index("workout_sessions_user_idx").on(t.userId),
    index("workout_sessions_status_idx").on(t.userId, t.status),
    index("workout_sessions_sync_idx").on(t.userId, t.updatedAt, t.id)
  ]
);
const workoutSets = sqliteTable(
  "workout_sets",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    sessionId: text("sessionId").notNull().references(() => workoutSessions.id, { onDelete: "cascade" }),
    exerciseId: text("exerciseId").notNull().references(() => exercises.id, { onDelete: "cascade" }),
    setIndex: integer("setIndex").notNull(),
    reps: integer("reps"),
    durationSec: integer("durationSec"),
    /** Logged distance for `logKind === \"distance\"` (exercise `distanceUnit`). */
    distance: real("distance"),
    weight: real("weight").notNull(),
    rpe: real("rpe"),
    completedAt: integer("completedAt", { mode: "timestamp_ms" }).notNull().default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    ...syncCols
  },
  (t) => [
    index("workout_sets_session_idx").on(t.sessionId),
    index("workout_sets_session_exercise_idx").on(t.sessionId, t.exerciseId),
    index("workout_sets_sync_idx").on(t.userId, t.updatedAt, t.id)
  ]
);
const workoutSessionExercisePrefs = sqliteTable(
  "workout_session_exercise_prefs",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    sessionId: text("sessionId").notNull().references(() => workoutSessions.id, { onDelete: "cascade" }),
    exerciseId: text("exerciseId").notNull().references(() => exercises.id, { onDelete: "cascade" }),
    workingWeight: real("workingWeight"),
    workingDurationSec: integer("workingDurationSec"),
    /** Session override for target distance (same unit as exercise). */
    workingDistance: real("workingDistance"),
    ...syncCols
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
    )
  ]
);
const workoutScheduledItems = sqliteTable(
  "workout_scheduled_items",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    templateId: text("templateId").notNull().references(() => workoutTemplates.id, { onDelete: "cascade" }),
    dayKey: text("dayKey").notNull(),
    notes: text("notes"),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    ...syncCols
  },
  (t) => [
    index("workout_scheduled_user_day_idx").on(t.userId, t.dayKey),
    index("workout_scheduled_template_idx").on(t.templateId),
    index("workout_scheduled_sync_idx").on(t.userId, t.updatedAt, t.id)
  ]
);
const workoutRecurringRules = sqliteTable(
  "workout_recurring_rules",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    templateId: text("templateId").notNull().references(() => workoutTemplates.id, { onDelete: "cascade" }),
    intervalWeeks: integer("intervalWeeks").notNull().default(1),
    /** JSON number[] weekday 0–6 (Sun–Sat), e.g. "[1,3,5]" */
    byDay: text("byDay").notNull(),
    startDayKey: text("startDayKey").notNull(),
    untilDayKey: text("untilDayKey"),
    notes: text("notes"),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    ...syncCols
  },
  (t) => [
    index("workout_recurring_rules_user_idx").on(t.userId),
    index("workout_recurring_rules_sync_idx").on(t.userId, t.updatedAt, t.id)
  ]
);
const workoutRecurringSkips = sqliteTable(
  "workout_recurring_skips",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    ruleId: text("ruleId").notNull().references(() => workoutRecurringRules.id, { onDelete: "cascade" }),
    dayKey: text("dayKey").notNull(),
    ...syncCols
  },
  (t) => [
    uniqueIndex("workout_recurring_skips_rule_day_uq").on(t.ruleId, t.dayKey),
    index("workout_recurring_skips_sync_idx").on(t.userId, t.updatedAt, t.id)
  ]
);
const meals = sqliteTable(
  "meals",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    /** Calendar day for grouping (YYYY-MM-DD, server/local convention). */
    dayKey: text("dayKey").notNull(),
    loggedAt: integer("loggedAt", { mode: "timestamp_ms" }).notNull(),
    name: text("name").notNull(),
    /** Meal-library recipe id when logged via plan quick-add (plain id; library row may be deleted). */
    sourceLibraryItemId: text("sourceLibraryItemId"),
    ...syncCols
  },
  (t) => [
    index("meals_user_logged_idx").on(t.userId, t.loggedAt),
    index("meals_user_day_idx").on(t.userId, t.dayKey),
    index("meals_source_library_idx").on(t.sourceLibraryItemId),
    index("meals_sync_idx").on(t.userId, t.updatedAt, t.id)
  ]
);
const mealEntries = sqliteTable(
  "meal_entries",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    mealId: text("mealId").notNull().references(() => meals.id, { onDelete: "cascade" }),
    description: text("description").notNull().default(""),
    calories: integer("calories").notNull().default(0),
    proteinG: real("proteinG").notNull().default(0),
    carbsG: real("carbsG").notNull().default(0),
    fatG: real("fatG").notNull().default(0),
    ...syncCols
  },
  (t) => [
    index("meal_entries_meal_idx").on(t.mealId),
    index("meal_entries_sync_idx").on(t.userId, t.updatedAt, t.id)
  ]
);
const mealLibraryItems = sqliteTable(
  "meal_library_items",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    name: text("name").notNull(),
    instructions: text("instructions").notNull().default(""),
    calories: integer("calories").notNull().default(0),
    proteinG: real("proteinG").notNull().default(0),
    carbsG: real("carbsG").notNull().default(0),
    fatG: real("fatG").notNull().default(0),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    ...syncCols
  },
  (t) => [
    index("meal_library_items_user_idx").on(t.userId),
    index("meal_library_items_user_name_idx").on(t.userId, t.name),
    index("meal_library_items_sync_idx").on(t.userId, t.updatedAt, t.id)
  ]
);
const mealLibraryIngredients = sqliteTable(
  "meal_library_ingredients",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    libraryItemId: text("libraryItemId").notNull().references(() => mealLibraryItems.id, { onDelete: "cascade" }),
    sortOrder: integer("sortOrder").notNull().default(0),
    /** One shopping-list line, e.g. "2 cups rolled oats". */
    line: text("line").notNull(),
    ...syncCols
  },
  (t) => [
    index("meal_library_ingredients_item_idx").on(t.libraryItemId),
    index("meal_library_ingredients_sync_idx").on(t.userId, t.updatedAt, t.id)
  ]
);
const mealPlans = sqliteTable(
  "meal_plans",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    weekStartDayKey: text("weekStartDayKey").notNull(),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    /** JSON array of retail-friendly lines; paired with `shoppingListSourceHash`. */
    aiShoppingListJson: text("aiShoppingListJson").notNull().default("[]"),
    /** SHA-256 of aggregated ingredient lines; invalidates AI list when recipes or slots change. */
    shoppingListSourceHash: text("shoppingListSourceHash"),
    ...syncCols
  },
  (t) => [
    uniqueIndex("meal_plans_user_week_uq").on(t.userId, t.weekStartDayKey),
    index("meal_plans_sync_idx").on(t.userId, t.updatedAt, t.id)
  ]
);
const mealPlanSlots = sqliteTable(
  "meal_plan_slots",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    planId: text("planId").notNull().references(() => mealPlans.id, { onDelete: "cascade" }),
    /** 0 = Monday .. 6 = Sunday */
    dayIndex: integer("dayIndex").notNull(),
    /** Order within the day (0 = first meal of the day). */
    slotIndex: integer("slotIndex").notNull().default(0),
    /** `meal` = breakfast/lunch(es)/dinner; `snack` = extra slots. */
    slotKind: text("slotKind").notNull().default("meal"),
    /** e.g. Breakfast, Lunch, Dinner, Snack — kept in sync for exports; UI derives from kind + order. */
    label: text("label").notNull().default("Meal"),
    libraryItemId: text("libraryItemId").references(() => mealLibraryItems.id, {
      onDelete: "set null"
    }),
    ...syncCols
  },
  (t) => [
    uniqueIndex("meal_plan_slots_plan_day_slot_uq").on(
      t.planId,
      t.dayIndex,
      t.slotIndex
    ),
    index("meal_plan_slots_plan_idx").on(t.planId),
    index("meal_plan_slots_sync_idx").on(t.userId, t.updatedAt, t.id)
  ]
);
const userVitalEntries = sqliteTable(
  "user_vital_entries",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    vitalKey: text("vitalKey").notNull(),
    dayKey: text("dayKey").notNull(),
    value: real("value").notNull(),
    recordedAt: integer("recordedAt", { mode: "timestamp_ms" }).notNull(),
    ...syncCols
  },
  (t) => [
    uniqueIndex("user_vital_entries_user_key_day_uq").on(
      t.userId,
      t.vitalKey,
      t.dayKey
    ),
    index("user_vital_entries_user_day_idx").on(t.userId, t.dayKey),
    index("user_vital_entries_user_key_idx").on(t.userId, t.vitalKey),
    index("user_vital_entries_sync_idx").on(t.userId, t.updatedAt, t.id)
  ]
);
const userProfiles = sqliteTable("user_profiles", {
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
  ...syncCols
});
const coachConversations = sqliteTable(
  "coach_conversations",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    title: text("title").notNull().default("New chat"),
    messages: text("messages").notNull().default("[]"),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    ...syncCols
  },
  (t) => [
    index("coach_conversations_user_idx").on(t.userId),
    index("coach_conversations_user_updated_idx").on(t.userId, t.updatedAt),
    index("coach_conversations_sync_idx").on(t.userId, t.updatedAt, t.id)
  ]
);
const userProfilesRelations = relations(userProfiles, () => ({}));
const userVitalEntriesRelations = relations(userVitalEntries, () => ({}));
const coachConversationsRelations = relations(
  coachConversations,
  () => ({})
);
const exercisesRelations = relations(exercises, ({ many }) => ({
  templateItems: many(workoutTemplateItems),
  workoutSets: many(workoutSets),
  sessionExercisePrefs: many(workoutSessionExercisePrefs)
}));
const workoutRoutineGroupsRelations = relations(
  workoutRoutineGroups,
  ({ many }) => ({
    templates: many(workoutTemplates)
  })
);
const workoutTemplatesRelations = relations(
  workoutTemplates,
  ({ one, many }) => ({
    routineGroup: one(workoutRoutineGroups, {
      fields: [workoutTemplates.routineGroupId],
      references: [workoutRoutineGroups.id]
    }),
    items: many(workoutTemplateItems),
    sessions: many(workoutSessions),
    scheduledItems: many(workoutScheduledItems),
    recurringRules: many(workoutRecurringRules)
  })
);
const workoutRecurringRulesRelations = relations(
  workoutRecurringRules,
  ({ one, many }) => ({
    template: one(workoutTemplates, {
      fields: [workoutRecurringRules.templateId],
      references: [workoutTemplates.id]
    }),
    skips: many(workoutRecurringSkips)
  })
);
const workoutRecurringSkipsRelations = relations(
  workoutRecurringSkips,
  ({ one }) => ({
    rule: one(workoutRecurringRules, {
      fields: [workoutRecurringSkips.ruleId],
      references: [workoutRecurringRules.id]
    })
  })
);
const workoutScheduledItemsRelations = relations(
  workoutScheduledItems,
  ({ one }) => ({
    template: one(workoutTemplates, {
      fields: [workoutScheduledItems.templateId],
      references: [workoutTemplates.id]
    })
  })
);
const workoutTemplateItemsRelations = relations(
  workoutTemplateItems,
  ({ one }) => ({
    template: one(workoutTemplates, {
      fields: [workoutTemplateItems.templateId],
      references: [workoutTemplates.id]
    }),
    exercise: one(exercises, {
      fields: [workoutTemplateItems.exerciseId],
      references: [exercises.id]
    })
  })
);
const workoutSessionExercisePrefsRelations = relations(
  workoutSessionExercisePrefs,
  ({ one }) => ({
    session: one(workoutSessions, {
      fields: [workoutSessionExercisePrefs.sessionId],
      references: [workoutSessions.id]
    }),
    exercise: one(exercises, {
      fields: [workoutSessionExercisePrefs.exerciseId],
      references: [exercises.id]
    })
  })
);
const workoutSessionsRelations = relations(
  workoutSessions,
  ({ one, many }) => ({
    template: one(workoutTemplates, {
      fields: [workoutSessions.templateId],
      references: [workoutTemplates.id]
    }),
    sets: many(workoutSets),
    exercisePrefs: many(workoutSessionExercisePrefs)
  })
);
const workoutSetsRelations = relations(workoutSets, ({ one }) => ({
  session: one(workoutSessions, {
    fields: [workoutSets.sessionId],
    references: [workoutSessions.id]
  }),
  exercise: one(exercises, {
    fields: [workoutSets.exerciseId],
    references: [exercises.id]
  })
}));
const mealsRelations = relations(meals, ({ many }) => ({
  entries: many(mealEntries)
}));
const mealEntriesRelations = relations(mealEntries, ({ one }) => ({
  meal: one(meals, { fields: [mealEntries.mealId], references: [meals.id] })
}));
const mealLibraryItemsRelations = relations(
  mealLibraryItems,
  ({ many }) => ({
    ingredients: many(mealLibraryIngredients),
    planSlots: many(mealPlanSlots)
  })
);
const mealLibraryIngredientsRelations = relations(
  mealLibraryIngredients,
  ({ one }) => ({
    libraryItem: one(mealLibraryItems, {
      fields: [mealLibraryIngredients.libraryItemId],
      references: [mealLibraryItems.id]
    })
  })
);
const mealPlansRelations = relations(mealPlans, ({ many }) => ({
  slots: many(mealPlanSlots)
}));
const mealPlanSlotsRelations = relations(mealPlanSlots, ({ one }) => ({
  plan: one(mealPlans, {
    fields: [mealPlanSlots.planId],
    references: [mealPlans.id]
  }),
  libraryItem: one(mealLibraryItems, {
    fields: [mealPlanSlots.libraryItemId],
    references: [mealLibraryItems.id]
  })
}));
const deviceTokens = sqliteTable(
  "device_tokens",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    deviceName: text("deviceName").notNull().default(""),
    /** SHA-256 of the refresh token; never store the raw value. */
    refreshTokenHash: text("refreshTokenHash").notNull().unique(),
    accessExpiresAt: integer("accessExpiresAt", {
      mode: "timestamp_ms"
    }).notNull(),
    refreshExpiresAt: integer("refreshExpiresAt", {
      mode: "timestamp_ms"
    }).notNull(),
    revokedAt: integer("revokedAt", { mode: "timestamp_ms" }),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    lastSeenAt: integer("lastSeenAt", { mode: "timestamp_ms" })
  },
  (t) => [index("device_tokens_user_idx").on(t.userId)]
);
const baSessions = sqliteTable(
  "ba_session",
  {
    id: text("id").primaryKey(),
    userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: integer("expiresAt", { mode: "timestamp_ms" }).notNull(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull()
  },
  (t) => [index("ba_session_user_idx").on(t.userId)]
);
const baAccounts = sqliteTable(
  "ba_account",
  {
    id: text("id").primaryKey(),
    userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    idToken: text("idToken"),
    accessTokenExpiresAt: integer("accessTokenExpiresAt", {
      mode: "timestamp_ms"
    }),
    refreshTokenExpiresAt: integer("refreshTokenExpiresAt", {
      mode: "timestamp_ms"
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull()
  },
  (t) => [index("ba_account_user_idx").on(t.userId)]
);
const baVerifications = sqliteTable("ba_verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expiresAt", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull()
});
const schema$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  baAccounts,
  baSessions,
  baVerifications,
  coachConversations,
  coachConversationsRelations,
  deviceTokens,
  exercises,
  exercisesRelations,
  mealEntries,
  mealEntriesRelations,
  mealLibraryIngredients,
  mealLibraryIngredientsRelations,
  mealLibraryItems,
  mealLibraryItemsRelations,
  mealPlanSlots,
  mealPlanSlotsRelations,
  mealPlans,
  mealPlansRelations,
  meals,
  mealsRelations,
  personalAccessTokens,
  syncCols,
  userProfiles,
  userProfilesRelations,
  userVitalEntries,
  userVitalEntriesRelations,
  users,
  workoutRecurringRules,
  workoutRecurringRulesRelations,
  workoutRecurringSkips,
  workoutRecurringSkipsRelations,
  workoutRoutineGroups,
  workoutRoutineGroupsRelations,
  workoutScheduledItems,
  workoutScheduledItemsRelations,
  workoutSessionExercisePrefs,
  workoutSessionExercisePrefsRelations,
  workoutSessions,
  workoutSessionsRelations,
  workoutSets,
  workoutSetsRelations,
  workoutTemplateItems,
  workoutTemplateItemsRelations,
  workoutTemplates,
  workoutTemplatesRelations
}, Symbol.toStringTag, { value: "Module" }));
function entity(table) {
  const select = createSelectSchema(table);
  const insert = createInsertSchema(table);
  return {
    table,
    /** For push payload validation — omits server-owned sync columns. */
    clientWrite: insert.omit({
      updatedAt: true,
      rev: true
    }),
    row: select
  };
}
const collections = {
  exercises: entity(exercises),
  workoutRoutineGroups: entity(workoutRoutineGroups),
  workoutTemplates: entity(workoutTemplates),
  workoutTemplateItems: entity(workoutTemplateItems),
  workoutSessions: entity(workoutSessions),
  workoutSets: entity(workoutSets),
  workoutSessionExercisePrefs: entity(workoutSessionExercisePrefs),
  workoutScheduledItems: entity(workoutScheduledItems),
  workoutRecurringRules: entity(workoutRecurringRules),
  workoutRecurringSkips: entity(workoutRecurringSkips),
  meals: entity(meals),
  mealEntries: entity(mealEntries),
  mealLibraryItems: entity(mealLibraryItems),
  mealLibraryIngredients: entity(mealLibraryIngredients),
  mealPlans: entity(mealPlans),
  mealPlanSlots: entity(mealPlanSlots),
  userProfiles: entity(userProfiles),
  userVitalEntries: entity(userVitalEntries),
  coachConversations: entity(coachConversations)
};
const collectionNames = Object.keys(collections);
const primaryKeyByCollection = {
  exercises: "id",
  workoutRoutineGroups: "id",
  workoutTemplates: "id",
  workoutTemplateItems: "id",
  workoutSessions: "id",
  workoutSets: "id",
  workoutSessionExercisePrefs: "id",
  workoutScheduledItems: "id",
  workoutRecurringRules: "id",
  workoutRecurringSkips: "id",
  meals: "id",
  mealEntries: "id",
  mealLibraryItems: "id",
  mealLibraryIngredients: "id",
  mealPlans: "id",
  mealPlanSlots: "id",
  userProfiles: "userId",
  userVitalEntries: "id",
  coachConversations: "id"
};
const pullOnlyCollections = /* @__PURE__ */ new Set([
  "coachConversations"
]);
const collectionParents = {
  workoutTemplateItems: ["workoutTemplates", "exercises"],
  workoutSets: ["workoutSessions", "exercises"],
  workoutSessionExercisePrefs: ["workoutSessions", "exercises"],
  workoutScheduledItems: ["workoutTemplates"],
  workoutRecurringSkips: ["workoutRecurringRules"],
  mealEntries: ["meals"],
  mealLibraryIngredients: ["mealLibraryItems"],
  mealPlanSlots: ["mealPlans", "mealLibraryItems"],
  workoutTemplates: ["workoutRoutineGroups"]
};
const POLL_MS = 3e4;
const PULL_PAGE = 200;
const PUSH_BATCH = 50;
let started = false;
let cycleInFlight = null;
let heartbeat = null;
const syncStateListeners = /* @__PURE__ */ new Set();
function notifySyncStateChanged() {
  for (const l of syncStateListeners) l();
}
function getSyncingSnapshot() {
  return cycleInFlight != null;
}
function subscribeSyncing(onChange) {
  syncStateListeners.add(onChange);
  return () => syncStateListeners.delete(onChange);
}
function triggerSync() {
  runCycle().catch((err) => {
  });
}
function triggerSyncWhenDocumentVisible() {
  if (typeof document === "undefined") return;
  if (document.visibilityState === "visible") triggerSync();
}
function triggerSyncOnPageShow(ev) {
  if (ev.persisted) triggerSync();
}
async function pullSyncCollectionFromScratch(name) {
  if (pullOnlyCollections.has(name)) return;
  const db2 = getDb();
  await db2._sync.delete(name);
  await pullCollection(db2, name);
}
async function pullSyncCollections(names) {
  const db2 = getDb();
  for (const name of names) {
    if (pullOnlyCollections.has(name)) continue;
    await pullCollection(db2, name);
  }
}
function startSyncRunner() {
  if (started) return;
  started = true;
  heartbeat = setInterval(triggerSync, POLL_MS);
  if (typeof window !== "undefined") {
    window.addEventListener("online", triggerSync);
    window.addEventListener("focus", triggerSync);
    window.addEventListener("pageshow", triggerSyncOnPageShow);
    document.addEventListener("visibilitychange", triggerSyncWhenDocumentVisible);
  }
  triggerSync();
}
function stopSyncRunner() {
  if (!started) return;
  started = false;
  if (heartbeat) clearInterval(heartbeat);
  heartbeat = null;
  if (typeof window !== "undefined") {
    window.removeEventListener("online", triggerSync);
    window.removeEventListener("focus", triggerSync);
    window.removeEventListener("pageshow", triggerSyncOnPageShow);
    document.removeEventListener(
      "visibilitychange",
      triggerSyncWhenDocumentVisible
    );
  }
}
async function runCycle() {
  if (cycleInFlight) return cycleInFlight;
  cycleInFlight = (async () => {
    try {
      if (isDevForceOffline()) return;
      const db2 = getDb();
      const pushFailed = /* @__PURE__ */ new Set();
      for (const name of collectionNames) {
        const parents = collectionParents[name];
        if (parents?.some((p) => pushFailed.has(p))) {
          continue;
        }
        const outcome = await pushCollection(db2, name);
        if (outcome === "failed") pushFailed.add(name);
      }
      for (const name of collectionNames) {
        await pullCollection(db2, name);
      }
    } finally {
      cycleInFlight = null;
      notifySyncStateChanged();
    }
  })();
  notifySyncStateChanged();
  return cycleInFlight;
}
async function loadCheckpoint(db2, name) {
  const row = await db2._sync.get(name);
  return row ? { updatedAt: row.updatedAt, id: row.id } : { updatedAt: 0, id: "" };
}
async function saveCheckpoint(db2, name, cp) {
  await db2._sync.put({ name, updatedAt: cp.updatedAt, id: cp.id });
}
function tableOf(db2, name) {
  return db2[name];
}
async function pullCollection(db2, name) {
  const pk = primaryKeyByCollection[name];
  const table = tableOf(db2, name);
  for (; ; ) {
    const cp = await loadCheckpoint(db2, name);
    const params = new URLSearchParams({
      limit: String(PULL_PAGE),
      updatedAt: String(cp.updatedAt),
      id: cp.id
    });
    const res = await authFetch(`/api/sync/${name}?${params}`);
    if (!res.ok) {
      return;
    }
    const body = await res.json();
    if (body.documents.length === 0) return;
    await db2.transaction("rw", table, async () => {
      for (const incoming of body.documents) {
        await mergeIncoming(table, incoming, pk);
      }
    });
    await saveCheckpoint(db2, name, body.checkpoint);
    if (body.documents.length < PULL_PAGE) return;
  }
}
async function mergeIncoming(table, incoming, pk) {
  const key = String(incoming[pk]);
  const local = await table.get(key);
  const pulled = { ...incoming, _dirty: 0 };
  if (!local) {
    await table.put(pulled);
    return;
  }
  if (local._dirty === 1 && local.updatedAt > pulled.updatedAt) return;
  await table.put(pulled);
}
async function pushCollection(db2, name) {
  if (pullOnlyCollections.has(name)) return "no_dirty";
  const pk = primaryKeyByCollection[name];
  const table = tableOf(db2, name);
  const dirty = await table.where("_dirty").equals(1).toArray();
  if (dirty.length === 0) return "no_dirty";
  for (let i = 0; i < dirty.length; i += PUSH_BATCH) {
    const chunk = dirty.slice(i, i + PUSH_BATCH);
    const payload = chunk.map((row) => ({
      newDocumentState: stripClientMeta(row)
    }));
    const res = await authFetch(`/api/sync/${name}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      return "failed";
    }
    const body = await res.json();
    await db2.transaction("rw", table, async () => {
      for (const row of [...body.applied, ...body.conflicts]) {
        await mergeIncoming(table, row, pk);
      }
    });
  }
  return "ok";
}
function stripClientMeta(row) {
  const { _dirty, ...rest } = row;
  return rest;
}
const DbContext = createContext({ db: null, ready: false });
function DbProvider({ children }) {
  const [db2, setDb] = useState(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const inst = getDb();
      await inst.open();
      if (cancelled) return;
      setDb(inst);
      startSyncRunner();
      triggerSync();
    })();
    return () => {
      cancelled = true;
      stopSyncRunner();
    };
  }, []);
  const value = useMemo(() => ({ db: db2, ready: db2 !== null }), [db2]);
  return /* @__PURE__ */ jsx(DbContext.Provider, { value, children });
}
function useDb() {
  return useContext(DbContext);
}
function Providers({ children }) {
  return /* @__PURE__ */ jsx(
    ThemeProvider,
    {
      attribute: "class",
      defaultTheme: "system",
      enableSystem: true,
      disableTransitionOnChange: true,
      children
    }
  );
}
const Toaster = ({ ...props }) => {
  const { theme = "system" } = useTheme();
  return /* @__PURE__ */ jsx(
    Toaster$1,
    {
      theme,
      className: "toaster group",
      icons: {
        success: /* @__PURE__ */ jsx(CircleCheckIcon, { className: "size-4" }),
        info: /* @__PURE__ */ jsx(InfoIcon, { className: "size-4" }),
        warning: /* @__PURE__ */ jsx(TriangleAlertIcon, { className: "size-4" }),
        error: /* @__PURE__ */ jsx(OctagonXIcon, { className: "size-4" }),
        loading: /* @__PURE__ */ jsx(Loader2Icon, { className: "size-4 animate-spin" })
      },
      style: {
        "--normal-bg": "var(--popover)",
        "--normal-text": "var(--popover-foreground)",
        "--normal-border": "var(--border)",
        "--border-radius": "var(--radius)"
      },
      toastOptions: {
        classNames: {
          toast: "cn-toast"
        }
      },
      ...props
    }
  );
};
const Route$z = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
      },
      { title: `${APP_BRAND_NAME} — workouts & nutrition` },
      {
        name: "description",
        content: "Log workouts and meals from the gym floor"
      },
      {
        name: "theme-color",
        content: "#0f766e",
        media: "(prefers-color-scheme: light)"
      },
      {
        name: "theme-color",
        content: "#1e1e22",
        media: "(prefers-color-scheme: dark)"
      }
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous"
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap"
      },
      { rel: "manifest", href: "/manifest.webmanifest" }
    ]
  }),
  shellComponent: RootShell
});
function RootShell() {
  return /* @__PURE__ */ jsxs("html", { lang: "en", className: "h-full", suppressHydrationWarning: true, children: [
    /* @__PURE__ */ jsx("head", { children: /* @__PURE__ */ jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxs("body", { className: "flex min-h-dvh flex-col", children: [
      /* @__PURE__ */ jsxs(Providers, { children: [
        /* @__PURE__ */ jsx(DbProvider, { children: /* @__PURE__ */ jsx(Outlet, {}) }),
        /* @__PURE__ */ jsx(Toaster, { richColors: true, position: "top-center" })
      ] }),
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
const $$splitComponentImporter$k = () => import("./register-Cxmg1n72.mjs");
const Route$y = createFileRoute("/register")({
  component: lazyRouteComponent($$splitComponentImporter$k, "component")
});
const $$splitComponentImporter$j = () => import("./login-BMyXjvAJ.mjs");
const searchSchema$3 = z$1.object({
  callbackUrl: z$1.string().optional()
});
const Route$x = createFileRoute("/login")({
  validateSearch: searchSchema$3,
  component: lazyRouteComponent($$splitComponentImporter$j, "component")
});
function onboardingCacheKey(userId) {
  return `tl_onb_done_${userId}`;
}
const $$splitComponentImporter$i = () => import("./route-C1Xa4tM2.mjs");
const Route$w = createFileRoute("/app")({
  component: lazyRouteComponent($$splitComponentImporter$i, "component"),
  beforeLoad: async ({
    location
  }) => {
    if (typeof window === "undefined") return;
    const tokens = await loadTokens();
    if (!tokens) throw redirect({
      to: "/login"
    });
    if (location.pathname.includes("/onboarding")) return;
    if (sessionStorage.getItem(onboardingCacheKey(tokens.userId)) === "1") {
      return;
    }
    let profile;
    try {
      const res = await authFetch("/api/user/profile");
      if (!res.ok) return;
      profile = await res.json();
    } catch {
      return;
    }
    if (profile.onboardingCompletedAt == null) {
      throw redirect({
        to: "/app/onboarding"
      });
    }
    sessionStorage.setItem(onboardingCacheKey(tokens.userId), "1");
  }
});
const $$splitComponentImporter$h = () => import("./index-Bc-hqag7.mjs");
const Route$v = createFileRoute("/")({
  component: lazyRouteComponent($$splitComponentImporter$h, "component")
});
const $$splitComponentImporter$g = () => import("./index-Bt3uXVuE.mjs");
const Route$u = createFileRoute("/app/")({
  component: lazyRouteComponent($$splitComponentImporter$g, "component")
});
const $$splitComponentImporter$f = () => import("./progress-CSCD_ymo.mjs");
const Route$t = createFileRoute("/app/progress")({
  component: lazyRouteComponent($$splitComponentImporter$f, "component")
});
const $$splitComponentImporter$e = () => import("./profile-A7ynGOQD.mjs");
const Route$s = createFileRoute("/app/profile")({
  component: lazyRouteComponent($$splitComponentImporter$e, "component")
});
const $$splitComponentImporter$d = () => import("./onboarding-BK2S7NAf.mjs");
const Route$r = createFileRoute("/app/onboarding")({
  component: lazyRouteComponent($$splitComponentImporter$d, "component"),
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const tokens = await loadTokens();
    if (!tokens) throw redirect({
      to: "/login"
    });
  }
});
const $$splitComponentImporter$c = () => import("./calendar-DkUrExYz.mjs");
const Route$q = createFileRoute("/app/calendar")({
  component: lazyRouteComponent($$splitComponentImporter$c, "component")
});
const Route$p = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => new Response(null, { status: 204 })
    }
  }
});
const $$splitComponentImporter$b = () => import("./route-q6OV-9ML.mjs");
const Route$o = createFileRoute("/app/workouts")({
  component: lazyRouteComponent($$splitComponentImporter$b, "component")
});
const $$splitComponentImporter$a = () => import("./route-BB3FoL4H.mjs");
const Route$n = createFileRoute("/app/nutrition")({
  component: lazyRouteComponent($$splitComponentImporter$a, "component")
});
const $$splitComponentImporter$9 = () => import("./route-BFsOu0JM.mjs");
const Route$m = createFileRoute("/app/coach")({
  component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
const $$splitComponentImporter$8 = () => import("./index-QmWaNyAj.mjs");
const Route$l = createFileRoute("/app/workouts/")({
  component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
const $$splitComponentImporter$7 = () => import("./index-DkK06BBK.mjs");
const Route$k = createFileRoute("/app/nutrition/")({
  component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
const $$splitComponentImporter$6 = () => import("./index-D1H45Z-G.mjs");
const searchSchema$2 = z$1.object({
  prompt: z$1.string().optional()
});
const Route$j = createFileRoute("/app/coach/")({
  validateSearch: searchSchema$2,
  component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
const $$splitComponentImporter$5 = () => import("./new-CSf9dTsq.mjs");
const Route$i = createFileRoute("/app/workouts/new")({
  component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
const $$splitComponentImporter$4 = () => import("./calendar-1ULlvSsw.mjs");
const Route$h = createFileRoute("/app/workouts/calendar")({
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
const $$splitComponentImporter$3 = () => import("./_id-mxABUVlg.mjs");
const Route$g = createFileRoute("/app/workouts/$id")({
  component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
const $$splitComponentImporter$2 = () => import("./plan-CqSitzPA.mjs");
const searchSchema$1 = z$1.object({
  week: z$1.string().optional()
});
const Route$f = createFileRoute("/app/nutrition/plan")({
  validateSearch: searchSchema$1,
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
const $$splitComponentImporter$1 = () => import("./library-CL5gCCgR.mjs");
const searchSchema = z$1.object({
  q: z$1.string().optional()
});
const Route$e = createFileRoute("/app/nutrition/library")({
  validateSearch: searchSchema,
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
function formatDayKey(d = /* @__PURE__ */ new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function parseDayKey(key) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}
function addDaysKey(key, delta) {
  const d = parseDayKey(key);
  if (!d) return key;
  d.setDate(d.getDate() + delta);
  return formatDayKey(d);
}
function mondayOfWeekContaining(dayKey) {
  const d = parseDayKey(dayKey);
  if (!d) return dayKey;
  const dow = d.getDay();
  const delta = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + delta);
  return formatDayKey(d);
}
function eachDayKeyInRange(fromKey, toKey, visitor) {
  if (fromKey > toKey) return;
  let k = fromKey;
  for (; ; ) {
    visitor(k);
    if (k === toKey) break;
    k = addDaysKey(k, 1);
  }
}
function dayKeysDistance(fromKey, toKey) {
  const a = parseDayKey(fromKey);
  const b = parseDayKey(toKey);
  if (!a || !b) return null;
  return Math.round((b.getTime() - a.getTime()) / 864e5);
}
function formatMonthKey(d = /* @__PURE__ */ new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}
function parseMonthKey(key) {
  const m = /^(\d{4})-(\d{2})$/.exec(key.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (!Number.isFinite(year) || month < 1 || month > 12) return null;
  return { year, month };
}
function prevMonthKey(monthKey) {
  const p = parseMonthKey(monthKey);
  if (!p) return monthKey;
  const d = new Date(p.year, p.month - 2, 1);
  return formatMonthKey(d);
}
function nextMonthKey(monthKey) {
  const p = parseMonthKey(monthKey);
  if (!p) return monthKey;
  const d = new Date(p.year, p.month, 1);
  return formatMonthKey(d);
}
function monthDayKeyRange(monthKey) {
  const p = parseMonthKey(monthKey);
  if (!p) return null;
  const first = formatDayKey(new Date(p.year, p.month - 1, 1));
  const lastDay = new Date(p.year, p.month, 0).getDate();
  const last = formatDayKey(new Date(p.year, p.month - 1, lastDay));
  return { first, last };
}
function localDayRangeBoundsMs(fromKey, toKey) {
  const from = parseDayKey(fromKey);
  const to = parseDayKey(toKey);
  if (!from || !to) return null;
  const end = new Date(to);
  end.setDate(end.getDate() + 1);
  end.setHours(0, 0, 0, 0);
  return { startMs: from.getTime(), endExclusiveMs: end.getTime() };
}
function calendarMonthGrid(monthKey) {
  const p = parseMonthKey(monthKey);
  if (!p) return null;
  const year = p.year;
  const mi = p.month - 1;
  const firstDow = new Date(year, mi, 1).getDay();
  const cur = new Date(year, mi, 1 - firstDow);
  const flat = [];
  for (let i = 0; i < 42; i++) {
    flat.push({
      dayKey: formatDayKey(cur),
      inMonth: cur.getMonth() === mi && cur.getFullYear() === year
    });
    cur.setDate(cur.getDate() + 1);
  }
  const weeks = [];
  for (let w = 0; w < 6; w++) {
    weeks.push(flat.slice(w * 7, w * 7 + 7));
  }
  return weeks;
}
const url = process.env.DATABASE_URL ?? "file:./data/local.db";
const libsqlClient = createClient({
  url,
  authToken: process.env.DATABASE_AUTH_TOKEN
});
const db = drizzle(libsqlClient, { schema: schema$1 });
const PROFILE_SEX_VALUES = [
  "male",
  "female",
  "transgender_man",
  "transgender_woman",
  "nonbinary",
  "other",
  "prefer_not_to_say"
];
const PROFILE_SEX_FOR_COACH = {
  male: "man",
  female: "woman",
  transgender_man: "transgender man",
  transgender_woman: "transgender woman",
  nonbinary: "nonbinary",
  other: "other (catch-all)",
  prefer_not_to_say: "prefer not to say"
};
function formatProfileSexForCoach(s) {
  if (s == null) return "(not set)";
  return PROFILE_SEX_FOR_COACH[s];
}
const ACTIVITY_LEVEL_VALUES = [
  "sedentary",
  "light",
  "moderate",
  "active",
  "very_active"
];
function parseProfileSex(v) {
  if (v == null || v === "") return null;
  return PROFILE_SEX_VALUES.includes(v) ? v : null;
}
function parseActivityLevel(v) {
  if (v == null || v === "") return null;
  return ACTIVITY_LEVEL_VALUES.includes(v) ? v : null;
}
const GOAL_PRESET_VALUES = [
  "lose_weight",
  "gain_muscle",
  "build_strength",
  "custom"
];
function isGoalPreset(s) {
  return s != null && GOAL_PRESET_VALUES.includes(s);
}
function parseGoalPreset(s) {
  return isGoalPreset(s) ? s : "custom";
}
function goalPresetLabel(p) {
  switch (p) {
    case "lose_weight":
      return "Lose Weight";
    case "gain_muscle":
      return "Gain Muscle";
    case "build_strength":
      return "Build Strength";
    case "custom":
      return "Custom";
  }
}
function goalPresetValidValuesForAi() {
  const pairs = GOAL_PRESET_VALUES.map(
    (v) => `${v} (${goalPresetLabel(v)})`
  ).join(", ");
  return `goalPreset must be exactly one of these four snake_case strings: ${pairs}. Do not use synonyms, display names, or alternate spellings.`;
}
function normalizeMultiline(v) {
  if (v === null) return null;
  const t = v.trim();
  return t === "" ? null : t;
}
async function getProfileForUser(userId) {
  const u = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { name: true }
  });
  const p = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, userId)
  });
  return {
    name: u?.name ?? null,
    heightIn: p?.heightIn ?? null,
    sex: parseProfileSex(p?.sex ?? null),
    activityLevel: parseActivityLevel(p?.activityLevel ?? null),
    ageYears: p?.ageYears != null && Number.isFinite(p.ageYears) && p.ageYears > 0 ? Math.round(p.ageYears) : null,
    onboardingCompletedAt: p?.onboardingCompletedAt ?? null,
    goalPreset: parseGoalPreset(p?.goalPreset),
    fitnessGoals: p?.fitnessGoals ?? null,
    preferences: p?.preferences ?? null,
    goalCalories: p?.goalCalories != null && Number.isFinite(p.goalCalories) ? Math.round(p.goalCalories) : null,
    goalProteinG: p?.goalProteinG != null && Number.isFinite(p.goalProteinG) ? p.goalProteinG : null,
    goalCarbsG: p?.goalCarbsG != null && Number.isFinite(p.goalCarbsG) ? p.goalCarbsG : null,
    goalFatG: p?.goalFatG != null && Number.isFinite(p.goalFatG) ? p.goalFatG : null
  };
}
async function getEffectiveHeightIn(userId) {
  const p = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, userId)
  });
  if (p?.heightIn != null && Number.isFinite(p.heightIn) && p.heightIn > 0) {
    return p.heightIn;
  }
  const legacy = await db.query.userVitalEntries.findFirst({
    where: and(
      eq(userVitalEntries.userId, userId),
      eq(userVitalEntries.vitalKey, "height_in")
    ),
    orderBy: [desc(userVitalEntries.dayKey), desc(userVitalEntries.recordedAt)]
  });
  if (legacy?.value != null && Number.isFinite(legacy.value) && legacy.value > 0) {
    return legacy.value;
  }
  return null;
}
async function updateUserProfile(userId, patch) {
  if (patch.name !== void 0) {
    const n = patch.name;
    await db.update(users).set({
      name: n === null || typeof n === "string" && n.trim() === "" ? null : n.trim()
    }).where(eq(users.id, userId));
  }
  const hasProfileFields = patch.heightIn !== void 0 || patch.sex !== void 0 || patch.activityLevel !== void 0 || patch.ageYears !== void 0 || patch.onboardingCompletedAt !== void 0 || patch.goalPreset !== void 0 || patch.fitnessGoals !== void 0 || patch.preferences !== void 0 || patch.goalCalories !== void 0 || patch.goalProteinG !== void 0 || patch.goalCarbsG !== void 0 || patch.goalFatG !== void 0;
  if (!hasProfileFields) {
    return getProfileForUser(userId);
  }
  const existing = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, userId)
  });
  const heightIn = patch.heightIn !== void 0 ? patch.heightIn : existing?.heightIn ?? null;
  const sex = patch.sex !== void 0 ? parseProfileSex(
    typeof patch.sex === "string" ? patch.sex : String(patch.sex ?? "")
  ) : parseProfileSex(existing?.sex ?? null);
  const activityLevel = patch.activityLevel !== void 0 ? parseActivityLevel(
    typeof patch.activityLevel === "string" ? patch.activityLevel : String(patch.activityLevel ?? "")
  ) : parseActivityLevel(existing?.activityLevel ?? null);
  const ageYears = patch.ageYears !== void 0 ? patch.ageYears != null && Number.isFinite(patch.ageYears) && patch.ageYears > 0 ? Math.min(120, Math.max(1, Math.round(patch.ageYears))) : null : existing?.ageYears != null && Number.isFinite(existing.ageYears) ? Math.round(existing.ageYears) : null;
  const onboardingCompletedAt = patch.onboardingCompletedAt !== void 0 ? patch.onboardingCompletedAt : existing?.onboardingCompletedAt ?? null;
  const goalPreset = patch.goalPreset !== void 0 ? parseGoalPreset(patch.goalPreset) : parseGoalPreset(existing?.goalPreset);
  const fitnessGoals = patch.fitnessGoals !== void 0 ? normalizeMultiline(patch.fitnessGoals) : existing?.fitnessGoals ?? null;
  const preferences = patch.preferences !== void 0 ? normalizeMultiline(patch.preferences) : existing?.preferences ?? null;
  const goalCalories = patch.goalCalories !== void 0 ? patch.goalCalories : existing?.goalCalories ?? null;
  const goalProteinG = patch.goalProteinG !== void 0 ? patch.goalProteinG : existing?.goalProteinG ?? null;
  const goalCarbsG = patch.goalCarbsG !== void 0 ? patch.goalCarbsG : existing?.goalCarbsG ?? null;
  const goalFatG = patch.goalFatG !== void 0 ? patch.goalFatG : existing?.goalFatG ?? null;
  if (existing) {
    const now2 = /* @__PURE__ */ new Date();
    await db.update(userProfiles).set({
      heightIn,
      sex,
      activityLevel,
      ageYears,
      onboardingCompletedAt,
      goalPreset,
      fitnessGoals,
      preferences,
      goalCalories,
      goalProteinG,
      goalCarbsG,
      goalFatG,
      updatedAt: now2,
      rev: (existing.rev ?? 0) + 1
    }).where(eq(userProfiles.userId, userId));
  } else {
    await db.insert(userProfiles).values({
      userId,
      heightIn,
      sex,
      activityLevel,
      ageYears,
      onboardingCompletedAt,
      goalPreset,
      fitnessGoals,
      preferences,
      goalCalories,
      goalProteinG,
      goalCarbsG,
      goalFatG
    });
  }
  return getProfileForUser(userId);
}
function bmiFromLbIn(weightLb, heightIn) {
  if (!Number.isFinite(weightLb) || !Number.isFinite(heightIn) || heightIn <= 0 || weightLb <= 0) {
    return null;
  }
  return 703 * weightLb / (heightIn * heightIn);
}
function bmiCategory(bmi) {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}
function parseExerciseLogKind(raw) {
  if (raw === "time") return "time";
  if (raw === "distance") return "distance";
  return "reps";
}
async function listMealsForDay(userId, dayKey) {
  return db.query.meals.findMany({
    where: and(eq(meals.userId, userId), eq(meals.dayKey, dayKey)),
    orderBy: [asc(meals.loggedAt)],
    with: { entries: true }
  });
}
async function getDailyTotals(userId, dayKey) {
  const list = await listMealsForDay(userId, dayKey);
  let calories = 0;
  let proteinG = 0;
  let carbsG = 0;
  let fatG = 0;
  for (const meal of list) {
    for (const e of meal.entries) {
      calories += e.calories;
      proteinG += e.proteinG;
      carbsG += e.carbsG;
      fatG += e.fatG;
    }
  }
  return { calories, proteinG, carbsG, fatG };
}
async function createMeal(userId, input) {
  const now2 = input.loggedAt ?? /* @__PURE__ */ new Date();
  const [row] = await db.insert(meals).values({
    userId,
    dayKey: input.dayKey,
    name: input.name.trim(),
    loggedAt: now2,
    sourceLibraryItemId: input.sourceLibraryItemId ?? null
  }).returning();
  return row;
}
async function addMealEntry(userId, input) {
  const meal = await db.query.meals.findFirst({
    where: and(eq(meals.id, input.mealId), eq(meals.userId, userId))
  });
  if (!meal) throw new Error("Meal not found");
  const [row] = await db.insert(mealEntries).values({
    mealId: input.mealId,
    description: input.description?.trim() ?? "",
    calories: Math.round(input.calories),
    proteinG: input.proteinG,
    carbsG: input.carbsG,
    fatG: input.fatG
  }).returning();
  return row;
}
const VITAL_KEYS = [
  "body_weight_lb",
  "body_fat_pct",
  "resting_hr",
  "sleep_hours",
  "waist_in",
  "blood_pressure_systolic",
  "blood_pressure_diastolic"
];
const LABELS = {
  body_weight_lb: "Body weight (lb)",
  body_fat_pct: "Body fat (%)",
  resting_hr: "Resting heart rate (bpm)",
  sleep_hours: "Sleep (hours)",
  waist_in: "Waist (in)",
  blood_pressure_systolic: "Blood pressure — systolic",
  blood_pressure_diastolic: "Blood pressure — diastolic"
};
function vitalKeyLabel(key) {
  if (VITAL_KEYS.includes(key)) {
    return LABELS[key];
  }
  if (key === "height_in") {
    return "Height (in) — legacy";
  }
  return key;
}
function isAllowedVitalKey(key) {
  return VITAL_KEYS.includes(key);
}
function aggregateExerciseDayValue(logKind, sets) {
  if (sets.length === 0) return null;
  if (logKind === "time") {
    const durs = sets.map((x) => x.durationSec).filter((x) => x != null && Number.isFinite(x));
    if (durs.length === 0) return null;
    return Math.max(...durs);
  }
  if (logKind === "distance") {
    const dists = sets.map((x) => x.distance).filter((x) => x != null && Number.isFinite(x));
    if (dists.length > 0) return Math.max(...dists);
    const durs = sets.map((x) => x.durationSec).filter((x) => x != null && Number.isFinite(x));
    if (durs.length === 0) return null;
    return Math.max(...durs);
  }
  return Math.max(...sets.map((x) => x.weight));
}
async function getExerciseProgressByDay(userId, exerciseId, fromDayKey, toDayKey) {
  const ex = await db.query.exercises.findFirst({
    where: eq(exercises.id, exerciseId),
    columns: { logKind: true }
  });
  const lk = parseExerciseLogKind(ex?.logKind);
  const metric = lk === "time" ? "duration_sec" : lk === "distance" ? "distance" : "weight";
  const bounds = localDayRangeBoundsMs(fromDayKey, toDayKey);
  if (!bounds) return { metric, points: [] };
  const rows = await db.query.workoutSessions.findMany({
    where: and(
      eq(workoutSessions.userId, userId),
      eq(workoutSessions.status, "completed"),
      gte(workoutSessions.startedAt, new Date(bounds.startMs)),
      lt(workoutSessions.startedAt, new Date(bounds.endExclusiveMs))
    ),
    with: { sets: true }
  });
  const map2 = /* @__PURE__ */ new Map();
  for (const s of rows) {
    const dk = formatDayKey(new Date(s.startedAt));
    const sets = s.sets.filter((x) => x.exerciseId === exerciseId);
    const v = aggregateExerciseDayValue(lk, sets);
    if (v == null) continue;
    map2.set(dk, Math.max(map2.get(dk) ?? 0, v));
  }
  const points = [...map2.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([dayKey, value]) => ({ dayKey, value }));
  return { metric, points };
}
async function getMacroTotalsByDay(userId, fromDayKey, toDayKey) {
  if (!parseDayKey(fromDayKey) || !parseDayKey(toDayKey)) return [];
  const out = [];
  const days = [];
  eachDayKeyInRange(fromDayKey, toDayKey, (k) => days.push(k));
  for (const dayKey of days) {
    const t = await getDailyTotals(userId, dayKey);
    out.push({ dayKey, ...t });
  }
  return out;
}
async function listVitalEntriesInRange(userId, fromDayKey, toDayKey, keys) {
  const cond = [
    eq(userVitalEntries.userId, userId),
    gte(userVitalEntries.dayKey, fromDayKey),
    lte(userVitalEntries.dayKey, toDayKey)
  ];
  if (keys?.length) {
    const allowed = keys.filter(isAllowedVitalKey);
    if (allowed.length === 0) return [];
    cond.push(inArray(userVitalEntries.vitalKey, allowed));
  }
  return db.query.userVitalEntries.findMany({
    where: and(...cond),
    orderBy: [asc(userVitalEntries.dayKey), asc(userVitalEntries.vitalKey)]
  });
}
async function getLatestVitalMap(userId) {
  const rows = await db.select({
    vitalKey: userVitalEntries.vitalKey,
    dayKey: userVitalEntries.dayKey,
    value: userVitalEntries.value,
    recordedAt: userVitalEntries.recordedAt
  }).from(userVitalEntries).where(eq(userVitalEntries.userId, userId));
  const best = /* @__PURE__ */ new Map();
  for (const r of rows) {
    const cur = best.get(r.vitalKey);
    if (!cur || r.dayKey > cur.dayKey || r.dayKey === cur.dayKey && r.recordedAt > cur.recordedAt) {
      best.set(r.vitalKey, {
        dayKey: r.dayKey,
        value: r.value,
        recordedAt: r.recordedAt
      });
    }
  }
  return best;
}
async function upsertVitalEntry(userId, input) {
  if (!isAllowedVitalKey(input.vitalKey)) throw new Error("Invalid vital key");
  const dayKey = input.dayKey?.trim() && parseDayKey(input.dayKey.trim()) ? input.dayKey.trim() : formatDayKey();
  const v = Number(input.value);
  if (!Number.isFinite(v)) throw new Error("Invalid value");
  const now2 = /* @__PURE__ */ new Date();
  await db.delete(userVitalEntries).where(
    and(
      eq(userVitalEntries.userId, userId),
      eq(userVitalEntries.vitalKey, input.vitalKey),
      eq(userVitalEntries.dayKey, dayKey)
    )
  );
  const [row] = await db.insert(userVitalEntries).values({
    userId,
    vitalKey: input.vitalKey,
    dayKey,
    value: v,
    recordedAt: now2
  }).returning();
  return row;
}
async function getWeightAndBmiSeries(userId, fromDayKey, toDayKey) {
  const height = await getEffectiveHeightIn(userId);
  const vitals = await listVitalEntriesInRange(
    userId,
    fromDayKey,
    toDayKey,
    ["body_weight_lb"]
  );
  const weight = vitals.filter((r) => r.vitalKey === "body_weight_lb").map((r) => ({ dayKey: r.dayKey, value: r.value })).sort((a, b) => a.dayKey.localeCompare(b.dayKey));
  const bmi = [];
  if (height != null) {
    for (const w of weight) {
      const b = bmiFromLbIn(w.value, height);
      if (b != null) {
        bmi.push({ dayKey: w.dayKey, value: Math.round(b * 10) / 10 });
      }
    }
  }
  return { weight, bmi, latestHeightIn: height };
}
const ACCESS_TTL_MS = 60 * 60 * 1e3;
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1e3;
function secretKey() {
  const raw = process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET ?? "dev-insecure-secret-change-me";
  return new TextEncoder().encode(raw);
}
function randomToken(bytes = 32) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  let s = "";
  for (const b of arr) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function sha256Hex(input) {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input)
  );
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function mintAccessToken(userId, deviceId) {
  const expiresAt = Date.now() + ACCESS_TTL_MS;
  const jwt = await new SignJWT({ userId, deviceId }).setProtectedHeader({ alg: "HS256" }).setSubject(userId).setIssuedAt().setExpirationTime(Math.floor(expiresAt / 1e3)).sign(secretKey());
  return { token: jwt, expiresAt };
}
async function issueDeviceTokens(userId, deviceName) {
  const id = crypto.randomUUID();
  const refreshToken2 = randomToken();
  const refreshTokenHash = await sha256Hex(refreshToken2);
  const now2 = Date.now();
  const accessExpiresAt = now2 + ACCESS_TTL_MS;
  const refreshExpiresAt = now2 + REFRESH_TTL_MS;
  await db.insert(deviceTokens).values({
    id,
    userId,
    deviceName,
    refreshTokenHash,
    accessExpiresAt: new Date(accessExpiresAt),
    refreshExpiresAt: new Date(refreshExpiresAt),
    lastSeenAt: new Date(now2)
  });
  const access = await mintAccessToken(userId, id);
  return {
    accessToken: access.token,
    accessExpiresAt: access.expiresAt,
    refreshToken: refreshToken2,
    refreshExpiresAt,
    deviceId: id
  };
}
async function rotateRefreshToken(refreshToken2) {
  const hash = await sha256Hex(refreshToken2);
  const [row] = await db.select().from(deviceTokens).where(and(eq(deviceTokens.refreshTokenHash, hash), isNull(deviceTokens.revokedAt))).limit(1);
  if (!row) return null;
  if (row.refreshExpiresAt.getTime() < Date.now()) return null;
  const nextRefresh = randomToken();
  const nextHash = await sha256Hex(nextRefresh);
  const now2 = Date.now();
  const accessExpiresAt = now2 + ACCESS_TTL_MS;
  const refreshExpiresAt = now2 + REFRESH_TTL_MS;
  await db.update(deviceTokens).set({
    refreshTokenHash: nextHash,
    accessExpiresAt: new Date(accessExpiresAt),
    refreshExpiresAt: new Date(refreshExpiresAt),
    lastSeenAt: new Date(now2)
  }).where(eq(deviceTokens.id, row.id));
  const access = await mintAccessToken(row.userId, row.id);
  return {
    accessToken: access.token,
    accessExpiresAt: access.expiresAt,
    refreshToken: nextRefresh,
    refreshExpiresAt,
    deviceId: row.id
  };
}
async function verifyAccessToken(token) {
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      algorithms: ["HS256"]
    });
    const userId = payload.userId;
    const deviceId = payload.deviceId;
    if (typeof userId !== "string" || typeof deviceId !== "string") {
      return null;
    }
    return { userId, deviceId };
  } catch {
    return null;
  }
}
async function authenticateBearer(req) {
  const header = req.headers.get("authorization");
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) return null;
  return verifyAccessToken(token);
}
const profileSexZ = z$1.enum([
  "male",
  "female",
  "transgender_man",
  "transgender_woman",
  "nonbinary",
  "other",
  "prefer_not_to_say"
]);
const activityZ = z$1.enum([
  "sedentary",
  "light",
  "moderate",
  "active",
  "very_active"
]);
const goalPresetZ = z$1.enum([
  "lose_weight",
  "gain_muscle",
  "build_strength",
  "custom"
]);
const patchBodySchema = z$1.object({
  name: z$1.string().nullable().optional(),
  heightIn: z$1.number().positive().nullable().optional(),
  sex: profileSexZ.nullable().optional(),
  activityLevel: activityZ.nullable().optional(),
  ageYears: z$1.number().int().min(1).max(120).nullable().optional(),
  goalPreset: goalPresetZ.optional(),
  /** When set, logs `body_weight_lb` for the given or current calendar day. */
  weightLb: z$1.number().positive().max(2e3).optional(),
  dayKey: z$1.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  markOnboardingComplete: z$1.boolean().optional()
}).refine(
  (o) => o.name !== void 0 || o.heightIn !== void 0 || o.sex !== void 0 || o.activityLevel !== void 0 || o.ageYears !== void 0 || o.weightLb !== void 0 || o.goalPreset !== void 0 || o.markOnboardingComplete === true,
  { message: "No profile fields" }
);
function jsonForBundle(p) {
  return {
    name: p.name,
    heightIn: p.heightIn,
    sex: p.sex,
    activityLevel: p.activityLevel,
    ageYears: p.ageYears,
    onboardingCompletedAt: p.onboardingCompletedAt ? p.onboardingCompletedAt.getTime() : null,
    goalPreset: p.goalPreset,
    fitnessGoals: p.fitnessGoals,
    preferences: p.preferences,
    goalCalories: p.goalCalories,
    goalProteinG: p.goalProteinG,
    goalCarbsG: p.goalCarbsG,
    goalFatG: p.goalFatG
  };
}
const Route$d = createFileRoute("/api/user/profile")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const claims = await authenticateBearer(request);
        if (!claims) {
          return new Response("Unauthorized", { status: 401 });
        }
        const bundle = await getProfileForUser(claims.userId);
        return Response.json(jsonForBundle(bundle));
      },
      PATCH: async ({ request }) => {
        const claims = await authenticateBearer(request);
        if (!claims) {
          return new Response("Unauthorized", { status: 401 });
        }
        const raw = await request.json().catch(() => null);
        const parsed = patchBodySchema.safeParse(raw);
        if (!parsed.success) {
          return new Response("Bad request", { status: 400 });
        }
        const b = parsed.data;
        const uid = claims.userId;
        if (b.weightLb !== void 0) {
          await upsertVitalEntry(uid, {
            vitalKey: "body_weight_lb",
            value: b.weightLb,
            dayKey: b.dayKey?.trim() || formatDayKey()
          });
        }
        const onlyWeight = b.weightLb !== void 0 && b.name === void 0 && b.heightIn === void 0 && b.sex === void 0 && b.activityLevel === void 0 && b.ageYears === void 0 && b.goalPreset === void 0 && b.markOnboardingComplete !== true;
        if (onlyWeight) {
          const bundle2 = await getProfileForUser(uid);
          return Response.json(jsonForBundle(bundle2));
        }
        const bundle = await updateUserProfile(uid, {
          name: b.name,
          heightIn: b.heightIn,
          sex: b.sex,
          activityLevel: b.activityLevel,
          ageYears: b.ageYears,
          goalPreset: b.goalPreset,
          onboardingCompletedAt: b.markOnboardingComplete === true ? /* @__PURE__ */ new Date() : void 0
        });
        return Response.json(jsonForBundle(bundle));
      }
    }
  }
});
const pullIncludesGlobalUserIdRows = /* @__PURE__ */ new Set([
  "exercises"
]);
const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 1e3;
function isForeignKeyViolation(err) {
  if (err == null || typeof err !== "object") return false;
  const o = err;
  if (o.extendedCode === "SQLITE_CONSTRAINT_FOREIGNKEY") return true;
  if (o.code === "SQLITE_CONSTRAINT_FOREIGNKEY") return true;
  const msg = String(o.message ?? "");
  if (/FOREIGN KEY constraint failed/i.test(msg)) return true;
  const cause = o.cause;
  if (cause) return isForeignKeyViolation(cause);
  return false;
}
function tableFor(name) {
  return collections[name].table;
}
function pkColumn(name) {
  return primaryKeyByCollection[name];
}
function col(table, name) {
  const c = table[name];
  if (!c) throw new Error(`Column ${name} not on table`);
  return c;
}
function toMs(v) {
  if (v instanceof Date) return v.getTime();
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v);
  return 0;
}
function serializeRow(row) {
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    out[k] = v instanceof Date ? v.getTime() : v;
  }
  if (out.deletedAt === void 0) out.deletedAt = null;
  return out;
}
function deserializeRow(row, table) {
  const out = {};
  const cols = table[/* @__PURE__ */ Symbol.for("drizzle:Columns")];
  for (const [k, v] of Object.entries(row)) {
    const def = cols?.[k];
    const isTimestamp = def && (def.columnType === "SQLiteTimestamp" || def.dataType === "date");
    if (isTimestamp && typeof v === "number") {
      out[k] = new Date(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}
async function handlePull(name, userId, cursor, limit) {
  const table = tableFor(name);
  const pk = pkColumn(name);
  const n = Math.min(Math.max(limit || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const userIdCol = table.userId;
  const updatedAtCol = col(table, "updatedAt");
  const idCol = col(table, pk);
  const afterCursor = cursor ? or(
    gt(updatedAtCol, new Date(cursor.updatedAt)),
    and(
      eq(updatedAtCol, new Date(cursor.updatedAt)),
      gt(idCol, cursor.id)
    )
  ) : void 0;
  const where = userIdCol ? (() => {
    const ownership = pullIncludesGlobalUserIdRows.has(name) ? or(isNull(userIdCol), eq(userIdCol, userId)) : eq(userIdCol, userId);
    return afterCursor ? and(ownership, afterCursor) : ownership;
  })() : afterCursor;
  const rows = await db.select().from(table).where(where).orderBy(asc(updatedAtCol), asc(idCol)).limit(n);
  const documents = rows.map((r) => serializeRow(r));
  const last = rows[rows.length - 1];
  const checkpoint = last ? { updatedAt: toMs(last.updatedAt), id: String(last[pk]) } : cursor ?? { updatedAt: 0, id: "" };
  return { documents, checkpoint };
}
async function handlePush(name, userId, rows) {
  if (pullOnlyCollections.has(name)) {
    return { applied: [], conflicts: [] };
  }
  const table = tableFor(name);
  const pk = pkColumn(name);
  const clientWriteSchema = collections[name].clientWrite;
  const idCol = col(table, pk);
  const applied = [];
  const conflicts = [];
  await db.transaction(async (tx) => {
    for (const { newDocumentState } of rows) {
      const parsed = clientWriteSchema.safeParse({
        ...newDocumentState,
        userId
      });
      if (!parsed.success) {
        conflicts.push({
          ...newDocumentState,
          _syncError: parsed.error.issues.map((i) => i.message).join(", ")
        });
        continue;
      }
      const candidateId = String(newDocumentState[pk] ?? "");
      if (!candidateId) {
        conflicts.push({ ...newDocumentState, _syncError: "missing pk" });
        continue;
      }
      await tx.transaction(async (innerTx) => {
        let [existing] = await innerTx.select().from(table).where(eq(idCol, candidateId)).limit(1);
        if (!existing && name === "mealPlanSlots") {
          const planId = String(newDocumentState.planId ?? "");
          const dayIndex = newDocumentState.dayIndex;
          const slotIndex = newDocumentState.slotIndex;
          if (planId && typeof dayIndex === "number" && Number.isFinite(dayIndex) && typeof slotIndex === "number" && Number.isFinite(slotIndex)) {
            const [byPos] = await innerTx.select().from(table).where(
              and(
                eq(col(table, "userId"), userId),
                eq(col(table, "planId"), planId),
                eq(col(table, "dayIndex"), dayIndex),
                eq(col(table, "slotIndex"), slotIndex)
              )
            ).limit(1);
            if (byPos) existing = byPos;
          }
        }
        if (existing) {
          if ((existing.userId ?? null) !== null && existing.userId !== userId) {
            conflicts.push({ ...newDocumentState, _syncError: "forbidden" });
            return;
          }
          const existingUpdatedAt = toMs(existing.updatedAt);
          const incomingUpdatedAt = toMs(
            newDocumentState.updatedAt ?? 0
          );
          if (incomingUpdatedAt <= existingUpdatedAt) {
            conflicts.push(serializeRow(existing));
            return;
          }
        }
        const nextRev = Math.max(
          Number(newDocumentState.rev ?? 0),
          Number(existing?.rev ?? 0)
        ) + 1;
        const payload = deserializeRow(
          {
            ...newDocumentState,
            userId,
            [pk]: candidateId,
            rev: nextRev
          },
          table
        );
        try {
          if (existing) {
            const existingId = String(existing[pk]);
            if (existingId !== candidateId) {
              await innerTx.delete(table).where(eq(idCol, existingId));
              await innerTx.insert(table).values(payload);
            } else {
              await innerTx.update(table).set(payload).where(eq(idCol, candidateId));
            }
          } else {
            await innerTx.insert(table).values(payload);
          }
        } catch (err) {
          if (isForeignKeyViolation(err)) {
            conflicts.push({
              ...newDocumentState,
              _syncError: "foreign key: referenced row is missing on the server (sync parents first or retry)"
            });
            return;
          }
          throw err;
        }
        const [written] = await innerTx.select().from(table).where(eq(idCol, candidateId)).limit(1);
        if (written) applied.push(serializeRow(written));
      });
    }
  });
  return { applied, conflicts };
}
function sanitizeCollection(raw) {
  return collections[raw] ? raw : null;
}
async function handleSyncRequest(request, rawCollection, userId) {
  const name = sanitizeCollection(rawCollection);
  if (!name) {
    return new Response("Unknown collection", { status: 404 });
  }
  if (request.method === "GET") {
    const url2 = new URL(request.url);
    const cursor = (() => {
      const u = url2.searchParams.get("updatedAt");
      const i = url2.searchParams.get("id");
      if (u === null || i === null) return null;
      return { updatedAt: Number(u), id: i };
    })();
    const limit = Number(url2.searchParams.get("limit") ?? DEFAULT_LIMIT);
    const result = await handlePull(name, userId, cursor, limit);
    return Response.json(result);
  }
  if (request.method === "POST") {
    const body = await request.json();
    const rows = Array.isArray(body) ? body : body?.rows;
    if (!Array.isArray(rows)) {
      return new Response("Bad request", { status: 400 });
    }
    const result = await handlePush(name, userId, rows);
    return Response.json(result);
  }
  return new Response("Method not allowed", { status: 405 });
}
async function handle({
  request,
  params
}) {
  const claims = await authenticateBearer(request);
  if (!claims) return new Response("Unauthorized", { status: 401 });
  return handleSyncRequest(request, params.collection, claims.userId);
}
const Route$c = createFileRoute("/api/sync/$collection")({
  server: {
    handlers: {
      GET: handle,
      POST: handle
    }
  }
});
function formatProfileForCoachPrompt(p) {
  const goalsLine = p.goalPreset === "custom" ? `Goals (custom): ${p.fitnessGoals?.trim() ? p.fitnessGoals.trim() : "(not set)"}` : `Additional goals (beyond ${goalPresetLabel(p.goalPreset)}): ${p.fitnessGoals?.trim() ? p.fitnessGoals.trim() : "(not set)"}`;
  return [
    "## User profile (authoritative)",
    "Use get_user_profile and update_user_profile when you need to read or change this data.",
    goalPresetValidValuesForAi(),
    `- Name: ${p.name?.trim() ? p.name.trim() : "(not set)"}`,
    `- Height (in): ${p.heightIn != null && Number.isFinite(p.heightIn) ? String(p.heightIn) : "(not set)"}`,
    `- Sex: ${formatProfileSexForCoach(p.sex)}`,
    `- Activity level: ${p.activityLevel ?? "(not set)"}`,
    `- Age (years): ${p.ageYears != null ? String(p.ageYears) : "(not set)"}`,
    `- Primary fitness goal (preset): ${goalPresetLabel(p.goalPreset)}`,
    `- ${goalsLine}`,
    `- Preferences (food, equipment, etc.): ${p.preferences?.trim() ? p.preferences.trim() : "(not set)"}`,
    `- Daily macro targets: calories ${p.goalCalories != null ? `${p.goalCalories} kcal` : "(not set)"}; protein ${p.goalProteinG != null ? `${p.goalProteinG} g` : "(not set)"}; carbs ${p.goalCarbsG != null ? `${p.goalCarbsG} g` : "(not set)"}; fat ${p.goalFatG != null ? `${p.goalFatG} g` : "(not set)"}`
  ].join("\n");
}
function buildOnboardingSystem(mode, weekStartDayKey) {
  const weekLine = `The meal-plan week to use (Monday) is **${weekStartDayKey}** (YYYY-MM-DD). Use this for get_meal_plan, set_meal_plan_slot, set_meal_plan_slots_batch, and create_meal_library_item.`;
  if (mode === "meal_plan") {
    return [
      "# Guided onboarding: first weekly meal plan",
      "You are helping a new user in a guided setup. Create a **full weekly meal plan** (Mon–Sun) that fits their selected interests and notes.",
      weekLine,
      "1. If needed, create meal-library recipes with `create_meal_library_item` (ingredients, macros, instructions). If the user shares a recipe URL, call `scrape_recipe_url` first, then save what you extract.",
      "2. Assign recipes to the week with `set_meal_plan_slots_batch` for efficiency (or single-slot tools). Aim for 3 main meals per day (breakfast/lunch/dinner) unless the user notes say otherwise; add snacks with extra slots if that matches their interest chips.",
      "3. Summarize in plain language what you created in 10 sentences or less. Do not be verbose. No markdown tables.",
      "Use tools; do not invent recipe ids — create library items first, then assign."
    ].join("\n");
  }
  return [
    "# Guided onboarding: first workout",
    "You are helping a new user in a guided setup. Create **one saved workout template** (a routine they can start from the app) that matches their selected focus tags and free-text notes.",
    "1. `list_exercises` to find matching exercises, or `create_exercise` if needed for custom names.",
    "2. `create_workout_template` then `bulk_add_exercises_to_template` with sensible sets/reps/rest (use `restBetweenSetsSec` 60–120s for strength).",
    "3. Give the template a short, clear name. Summarize the workout briefly. No markdown tables."
  ].join("\n");
}
function buildOnboardingUserMessage(interestLabels, freeTextNotes) {
  const lines = interestLabels.length ? `Selected interest tags: ${interestLabels.join(", ")}.` : "No interest tags selected.";
  const notes = freeTextNotes.trim() ? ` Additional notes: ${freeTextNotes.trim()}` : "";
  return `${lines}${notes} Please build this in the app using tools now.`;
}
const ONBOARDING_TOOL_SEARCH_LINE = `**App tools:** Most ${APP_BRAND_NAME} tools are loaded on demand. Use \`tool_search_tool_bm25\` (short queries like "meal plan slots", "create workout template", "meal library recipe") to find the right tool by name, then call it. Do not skip tools — the user expects data created in the app.`;
function buildOnboardingContextBlock(profile, mode, weekStartDayKey) {
  return [
    buildOnboardingSystem(mode, weekStartDayKey),
    "",
    ONBOARDING_TOOL_SEARCH_LINE,
    "",
    formatProfileForCoachPrompt(profile)
  ].join("\n");
}
const MEAL_PLAN_REFINEMENT_USER_PROMPT = "I'd like to adjust this week's meal plan. Please suggest a few specific ideas I could try (e.g. swapping which days have which meals, different recipes, or portions). Then help me apply changes in the app until the plan feels right to me.";
function buildMealPlanRefinementContextAddendum() {
  return [
    "",
    "## Plan refinement (guided onboarding — meal plan already exists)",
    "The user has a week on the plan already. Do **not** rebuild the whole week unless they ask. Prefer targeted edits: suggest concrete swaps, use tools (`set_meal_plan_slot`, `set_meal_plan_slots_batch`, `create_meal_library_item`, etc.) when they agree, and keep back-and-forth messages concise.",
    `After your user-visible answer and any ${APP_BRAND_NAME} tools, call \`suggest_quick_replies\` **once** with 2–4 short tap-to-send follow-ups (e.g. next swap to try, confirm they're done, or ask for a different day). This matches the in-app chat UI.`,
    "When the user is **done** refining and ready to continue onboarding, call `onboarding_meal_refinement_complete` in that same turn (after your reply and any tools). The app will advance to the next step; the user does not have to find a continue button. If they are not done, do **not** call it."
  ].join("\n");
}
const emptyInput = z$1.object({});
const vitalKeySchema = z$1.enum([
  "body_weight_lb",
  "body_fat_pct",
  "resting_hr",
  "sleep_hours",
  "waist_in",
  "blood_pressure_systolic",
  "blood_pressure_diastolic"
]);
const createWorkoutTemplateInput = z$1.object({
  name: z$1.string().describe("Template name, e.g. Upper A"),
  notes: z$1.string().optional().describe("Optional notes")
});
const updateWorkoutTemplateInput = z$1.object({
  templateId: z$1.string().describe("Workout template UUID from list_workout_templates"),
  name: z$1.string().optional().describe("New display name"),
  notes: z$1.string().nullable().optional().describe("Notes; null clears")
}).refine(
  (o) => o.name !== void 0 || o.notes !== void 0,
  { message: "Provide at least one of name, notes" }
);
const createExerciseInput = z$1.object({
  name: z$1.string().describe("Exercise name, e.g. Bench press"),
  muscleGroup: z$1.string().optional().describe("Optional e.g. Chest, Back, Legs"),
  logKind: z$1.enum(["reps", "time", "distance"]).optional().describe(
    "reps: weight × reps per set. time: duration per set. distance: distance per set (running, etc.)."
  ),
  defaultDurationSec: z$1.number().int().positive().optional().describe("When logKind is time, default seconds per set (default 60)."),
  defaultDistance: z$1.number().positive().optional().describe(
    "When logKind is distance, default distance per set in distanceUnit (defaults by unit)."
  ),
  distanceUnit: z$1.enum(["km", "mi", "m"]).optional().describe("Unit for defaultDistance and logged sets when logKind is distance."),
  weightUnit: z$1.enum(["lb", "kg"]).optional().describe("Unit for default and logged weights; default lb (imperial).")
});
const addExerciseToTemplateInput = z$1.object({
  templateId: z$1.string().describe("Workout template UUID"),
  exerciseId: z$1.string().describe(
    "Exercise id from list_exercises (preset or custom) or create_exercise"
  ),
  targetSets: z$1.number().int().positive().optional().describe("Default 3"),
  targetReps: z$1.number().int().positive().optional().describe("For rep-based exercises (default 5)"),
  targetDurationSec: z$1.number().int().positive().optional().describe(
    "For timed exercises: seconds per set (defaults from exercise)"
  ),
  targetDistance: z$1.number().positive().optional().describe(
    "For distance exercises: distance per set in the exercise's distance unit"
  ),
  defaultWeight: z$1.number().nullable().optional().describe("Suggested working weight for this template; omit if unknown"),
  weightUnit: z$1.enum(["lb", "kg"]).nullable().optional().describe(
    "Unit for defaultWeight and session loads; null inherits exercise library default."
  ),
  progressiveOverloadEnabled: z$1.boolean().optional(),
  progressiveOverloadIncrement: z$1.number().positive().nullable().optional(),
  progressiveOverloadRequireFullCompletion: z$1.boolean().optional(),
  isWarmup: z$1.boolean().optional().describe(
    "When true, the lift appears under the session Warmup tab instead of the main workout list."
  ),
  restBetweenSetsSec: z$1.number().int().min(0).max(3600).optional().describe(
    "Rest in seconds after each logged set for this line; omit or 0 = no rest countdown in live sessions."
  )
});
const addExerciseToTemplateLineInput = addExerciseToTemplateInput.omit({
  templateId: true
});
const bulkAddExercisesToTemplateInput = z$1.object({
  templateId: z$1.string().describe("Workout template UUID"),
  exercises: z$1.array(addExerciseToTemplateLineInput).min(1).max(100).describe(
    "Exercises to append in list order (same fields as add_exercise_to_template per row, without templateId)."
  )
});
const createWorkoutRoutineInput = z$1.object({
  name: z$1.string().describe("Name for the routine group (e.g. Upper / lower, PPL)")
});
const assignWorkoutToRoutineInput = z$1.object({
  templateId: z$1.string().describe("Saved workout id from list_workout_templates"),
  routineGroupId: z$1.string().nullable().describe(
    "Routine group id from list_workout_routines; null removes the workout from all routines"
  )
});
const renameWorkoutRoutineInput = z$1.object({
  routineGroupId: z$1.string().describe("Routine id from list_workout_routines"),
  name: z$1.string().describe("New display name")
});
const deleteWorkoutRoutineInput = z$1.object({
  routineGroupId: z$1.string().describe("Routine group id to delete")
});
const listWorkoutScheduleInput = z$1.object({
  month: z$1.string().optional().describe("YYYY-MM — if set, overrides from/to"),
  from: z$1.string().optional().describe("Start day YYYY-MM-DD"),
  to: z$1.string().optional().describe("End day YYYY-MM-DD inclusive")
});
const scheduleWorkoutTemplateInput = z$1.object({
  templateId: z$1.string().describe("Workout template UUID"),
  dayKey: z$1.string().describe("YYYY-MM-DD"),
  notes: z$1.string().optional().describe("Optional note on the plan")
});
const unscheduleWorkoutInput = z$1.object({
  scheduleId: z$1.string().describe("Scheduled row UUID")
});
const createRecurringWorkoutScheduleInput = z$1.object({
  templateId: z$1.string().describe("Workout template UUID"),
  byDay: z$1.array(z$1.number().int().min(0).max(6)).describe("Weekdays to repeat on, e.g. [1,3,5] for Mon/Wed/Fri"),
  startDayKey: z$1.string().describe("First day the rule applies (YYYY-MM-DD)"),
  untilDayKey: z$1.string().optional().describe("Last day inclusive, YYYY-MM-DD; omit for no end"),
  intervalWeeks: z$1.number().int().positive().optional().describe("Repeat every N weeks (default 1)"),
  notes: z$1.string().optional()
});
const deleteRecurringWorkoutScheduleInput = z$1.object({
  ruleId: z$1.string()
});
const skipRecurringWorkoutDayInput = z$1.object({
  ruleId: z$1.string(),
  dayKey: z$1.string().describe("YYYY-MM-DD")
});
const startWorkoutInput = z$1.object({
  templateId: z$1.string().describe("Workout template UUID")
});
const logSetInput = z$1.object({
  sessionId: z$1.string(),
  exerciseId: z$1.string(),
  setIndex: z$1.number().int().positive(),
  weight: z$1.number(),
  reps: z$1.number().int().positive().optional(),
  durationSec: z$1.number().int().positive().optional(),
  weightUnit: z$1.enum(["lb", "kg"]).optional().describe(
    "Optional documentation only: must match the exercise row in the active template."
  )
}).refine((v) => v.reps != null || v.durationSec != null, {
  message: "Provide reps or durationSec"
});
const completeWorkoutInput = z$1.object({ sessionId: z$1.string() });
const getDailyNutritionInput = z$1.object({
  date: z$1.string().optional().describe("Day key e.g. 2026-04-06")
});
const logMealInput = z$1.object({
  dayKey: z$1.string().describe("YYYY-MM-DD"),
  name: z$1.string().describe("e.g. Lunch")
});
const logMealEntryInput = z$1.object({
  mealId: z$1.string(),
  description: z$1.string().optional(),
  calories: z$1.number(),
  proteinG: z$1.number().optional(),
  carbsG: z$1.number().optional(),
  fatG: z$1.number().optional()
});
const scrapeRecipeUrlInput = z$1.object({
  url: z$1.string().describe(
    "Public http(s) recipe page URL the user shared. Must be a normal web link (not file: or internal hosts)."
  )
});
const listMealLibraryInput = z$1.object({
  query: z$1.string().optional().describe("Substring search; omit for full list")
});
const getMealLibraryItemInput = z$1.object({ id: z$1.string() });
const createMealLibraryItemInput = z$1.object({
  name: z$1.string(),
  instructions: z$1.string().optional(),
  calories: z$1.number().optional(),
  proteinG: z$1.number().optional(),
  carbsG: z$1.number().optional(),
  fatG: z$1.number().optional(),
  ingredients: z$1.array(z$1.string()).optional()
});
const updateMealLibraryItemInput = z$1.object({
  id: z$1.string(),
  name: z$1.string(),
  instructions: z$1.string().optional(),
  calories: z$1.number().optional(),
  proteinG: z$1.number().optional(),
  carbsG: z$1.number().optional(),
  fatG: z$1.number().optional(),
  ingredients: z$1.array(z$1.string()).optional()
});
const deleteMealLibraryItemInput = z$1.object({ id: z$1.string() });
const getMealPlanInput = z$1.object({
  weekStart: z$1.string().optional().describe("Monday YYYY-MM-DD; omit for current week")
});
const getMealPlanShoppingListInput = getMealPlanInput;
const setMealPlanSlotInput = z$1.object({
  weekStartDayKey: z$1.string().describe("Monday YYYY-MM-DD"),
  dayIndex: z$1.number().int().min(0).max(6),
  /** Which meal of the day: 0=breakfast, 1=lunch, 2=dinner by default; higher indexes are extra slots. Default 0. */
  slotIndex: z$1.number().int().min(0).max(50).optional(),
  libraryItemId: z$1.string().nullable().optional()
});
const setMealPlanSlotsBatchInput = z$1.object({
  weekStartDayKey: z$1.string().describe("Monday YYYY-MM-DD for the week"),
  assignments: z$1.array(
    z$1.object({
      dayIndex: z$1.number().int().min(0).max(6),
      slotIndex: z$1.number().int().min(0).max(50).optional(),
      libraryItemId: z$1.string().nullable().optional()
    })
  ).max(200).describe(
    "Each object sets one slot for this week. Order is preserved; duplicate day+slot uses the last. Empty array only touches the plan row (rare)."
  )
});
const getProgressExerciseWeightInput = z$1.object({
  exerciseId: z$1.string(),
  from: z$1.string().describe("YYYY-MM-DD"),
  to: z$1.string().describe("YYYY-MM-DD")
});
const getProgressMacrosInput = z$1.object({
  from: z$1.string().describe("YYYY-MM-DD"),
  to: z$1.string().describe("YYYY-MM-DD")
});
const getProgressWeightBmiInput = z$1.object({
  from: z$1.string().describe("YYYY-MM-DD"),
  to: z$1.string().describe("YYYY-MM-DD")
});
const getProgressVitalsLogInput = z$1.object({
  from: z$1.string().describe("YYYY-MM-DD"),
  to: z$1.string().describe("YYYY-MM-DD"),
  keys: z$1.string().optional().describe("Comma-separated vital keys, e.g. body_weight_lb,resting_hr")
});
const upsertProgressVitalsInput = z$1.object({
  dayKey: z$1.string().optional().describe("YYYY-MM-DD; omit for today"),
  entries: z$1.array(
    z$1.object({
      vitalKey: vitalKeySchema,
      value: z$1.number()
    })
  ).min(1)
});
const goalPresetSchema = z$1.enum([
  "lose_weight",
  "gain_muscle",
  "build_strength",
  "custom"
]);
const profileSexSchema = z$1.enum([
  "male",
  "female",
  "transgender_man",
  "transgender_woman",
  "nonbinary",
  "other",
  "prefer_not_to_say"
]);
const activityLevelSchema = z$1.enum([
  "sedentary",
  "light",
  "moderate",
  "active",
  "very_active"
]);
const updateUserProfileInput = z$1.object({
  name: z$1.string().nullable().optional().describe("Display name"),
  heightIn: z$1.number().positive().nullable().optional().describe("Height in inches"),
  sex: profileSexSchema.nullable().optional().describe(
    "User sex: male, female, transgender_man, transgender_woman, nonbinary, other, prefer_not_to_say (snake_case only)"
  ),
  activityLevel: activityLevelSchema.nullable().optional().describe(
    "Usual activity: sedentary, light, moderate, active, very_active"
  ),
  ageYears: z$1.number().int().min(1).max(120).nullable().optional().describe("Age in years"),
  goalPreset: goalPresetSchema.nullable().optional().describe(
    "Exactly one of: lose_weight | gain_muscle | build_strength | custom (snake_case only; no other strings)"
  ),
  fitnessGoals: z$1.string().nullable().optional().describe(
    "When goalPreset is custom: full goal text. Otherwise: additional goals beyond the preset"
  ),
  preferences: z$1.string().nullable().optional().describe("Food preferences, gym equipment, constraints"),
  goalCalories: z$1.number().int().min(0).max(5e4).nullable().optional().describe("Daily calorie target (kcal). Null clears."),
  goalProteinG: z$1.number().min(0).max(1e3).nullable().optional().describe("Daily protein target in grams. Null clears."),
  goalCarbsG: z$1.number().min(0).max(1e3).nullable().optional().describe("Daily carbs target in grams. Null clears."),
  goalFatG: z$1.number().min(0).max(1e3).nullable().optional().describe("Daily fat target in grams. Null clears.")
}).refine(
  (o) => o.name !== void 0 || o.heightIn !== void 0 || o.sex !== void 0 || o.activityLevel !== void 0 || o.ageYears !== void 0 || o.goalPreset !== void 0 || o.fitnessGoals !== void 0 || o.preferences !== void 0 || o.goalCalories !== void 0 || o.goalProteinG !== void 0 || o.goalCarbsG !== void 0 || o.goalFatG !== void 0,
  { message: "Provide at least one field" }
);
const TRAINLOG_TOOL_DEFINITIONS = [
  {
    name: "list_workout_templates",
    description: "List saved workout templates with exercises, set/rep targets, and per-line restBetweenSetsSec for the live session timer after each set.",
    completionText: "Loaded your workout templates",
    errorText: "Couldn't load workout templates",
    inputSchema: emptyInput
  },
  {
    name: "create_workout_template",
    description: "Create a new empty workout template (saved routine). Add lifts with bulk_add_exercises_to_template or add_exercise_to_template (optional restBetweenSetsSec per line), then start_workout when ready.",
    completionText: "Created workout template",
    errorText: "Couldn't create workout template",
    inputSchema: createWorkoutTemplateInput
  },
  {
    name: "update_workout_template",
    description: "Update a saved workout’s name and/or notes. Per-exercise rest is set on template lines (add_exercise_to_template, etc.). Use list_workout_templates for templateId.",
    completionText: "Updated workout template",
    errorText: "Couldn't update workout template",
    inputSchema: updateWorkoutTemplateInput
  },
  {
    name: "list_exercises",
    description: "List exercises available to the user: built-in presets plus custom lifts. Use before add_exercise_to_template to reuse an id, or create_exercise for something not in the list.",
    completionText: "Loaded exercises",
    errorText: "Couldn't load exercises",
    inputSchema: emptyInput
  },
  {
    name: "create_exercise",
    description: "Create a custom exercise in the user's library, then add it to a template with add_exercise_to_template.",
    completionText: "Created exercise",
    errorText: "Couldn't create exercise",
    inputSchema: createExerciseInput
  },
  {
    name: "add_exercise_to_template",
    description: "Append an exercise to a workout template (end of the list). Use list_exercises or create_exercise for exerciseId.",
    completionText: "Added exercise to template",
    errorText: "Couldn't add exercise to template",
    inputSchema: addExerciseToTemplateInput
  },
  {
    name: "bulk_add_exercises_to_template",
    description: "Append multiple exercises to a workout template in one call (same order as the array). Prefer over many add_exercise_to_template calls when building a full routine.",
    completionText: "Added exercises to template",
    errorText: "Couldn't add exercises to template",
    inputSchema: bulkAddExercisesToTemplateInput
  },
  {
    name: "list_workout_routines",
    description: "List routine groups and which saved workouts (templates) belong to each. Also lists workouts not in any routine (`ungrouped`). Use before assign_workout_to_routine or create_workout_routine.",
    completionText: "Loaded workout routines",
    errorText: "Couldn't load workout routines",
    inputSchema: emptyInput
  },
  {
    name: "create_workout_routine",
    description: "Create a named routine group (empty until you assign workouts with assign_workout_to_routine).",
    completionText: "Created workout routine",
    errorText: "Couldn't create workout routine",
    inputSchema: createWorkoutRoutineInput
  },
  {
    name: "assign_workout_to_routine",
    description: "Put a saved workout template into a routine group, or remove it from routines (routineGroupId null). Appends to the end of that routine’s order.",
    completionText: "Updated workout routine assignment",
    errorText: "Couldn't assign workout to routine",
    inputSchema: assignWorkoutToRoutineInput
  },
  {
    name: "rename_workout_routine",
    description: "Rename a routine group (does not change workout templates).",
    completionText: "Renamed workout routine",
    errorText: "Couldn't rename workout routine",
    inputSchema: renameWorkoutRoutineInput
  },
  {
    name: "delete_workout_routine",
    description: "Delete a routine group. Workouts remain in the library ungrouped (not deleted).",
    completionText: "Deleted workout routine",
    errorText: "Couldn't delete workout routine",
    inputSchema: deleteWorkoutRoutineInput
  },
  {
    name: "list_workout_schedule",
    description: "List planned workouts (one-off + weekly repeats), recurring rule definitions, one-off rows, and sessions in a range. Pass `month` (YYYY-MM) or `from` and `to` (YYYY-MM-DD). Defaults to the current calendar month.",
    completionText: "Loaded workout calendar",
    errorText: "Couldn't load workout calendar",
    inputSchema: listWorkoutScheduleInput
  },
  {
    name: "schedule_workout_template",
    description: "Plan a saved workout template on a calendar day (YYYY-MM-DD). Does not start the session; use start_workout when ready.",
    completionText: "Scheduled workout",
    errorText: "Couldn't schedule workout",
    inputSchema: scheduleWorkoutTemplateInput
  },
  {
    name: "unschedule_workout",
    description: "Remove a planned workout from the calendar. Use list_workout_schedule for ids.",
    completionText: "Removed planned workout",
    errorText: "Couldn't remove planned workout",
    inputSchema: unscheduleWorkoutInput
  },
  {
    name: "create_recurring_workout_schedule",
    description: "Create a Google Calendar–style weekly repeat: template on selected weekdays (0=Sun..6=Sat), optional end date, repeat every N weeks (default 1).",
    completionText: "Created repeating workout schedule",
    errorText: "Couldn't create repeating schedule",
    inputSchema: createRecurringWorkoutScheduleInput
  },
  {
    name: "delete_recurring_workout_schedule",
    description: "Delete an entire repeating schedule (rule id from list_workout_schedule.recurringRules).",
    completionText: "Deleted repeating schedule",
    errorText: "Couldn't delete repeating schedule",
    inputSchema: deleteRecurringWorkoutScheduleInput
  },
  {
    name: "skip_recurring_workout_day",
    description: "Skip one generated occurrence of a repeating schedule (like deleting a single Google Calendar instance).",
    completionText: "Skipped that workout day",
    errorText: "Couldn't skip workout day",
    inputSchema: skipRecurringWorkoutDayInput
  },
  {
    name: "get_active_workout",
    description: "Get the current active workout session, if any.",
    completionText: "Checked active workout",
    errorText: "Couldn't read active workout",
    inputSchema: emptyInput
  },
  {
    name: "start_workout",
    description: "Start a workout from a template id (or resume if one is already active).",
    completionText: "Started workout",
    errorText: "Couldn't start workout",
    inputSchema: startWorkoutInput
  },
  {
    name: "log_set",
    description: "Log or update one set for an active session. Use reps for rep-based lifts; durationSec for timed/cardio (no reps). Weight is in the template line's unit (lb or kg).",
    completionText: "Logged set",
    errorText: "Couldn't log set",
    inputSchema: logSetInput
  },
  {
    name: "complete_workout",
    description: "Mark a workout session as completed. Exercises with progressive overload on the template may auto-increase default load, target time, or target distance.",
    completionText: "Completed workout",
    errorText: "Couldn't complete workout",
    inputSchema: completeWorkoutInput
  },
  {
    name: "get_progress_exercise_weight",
    description: "Per-day best logged value for one exercise over completed workouts (inclusive day range). Metric depends on exercise type: max load (reps), longest hold in seconds (time), or best distance / time (distance). Response includes `metric` and `series`.",
    completionText: "Loaded exercise progress",
    errorText: "Couldn't load exercise progress",
    inputSchema: getProgressExerciseWeightInput
  },
  {
    name: "get_progress_macros",
    description: "Daily nutrition totals (calories, protein, carbs, fat) for each day in an inclusive range.",
    completionText: "Loaded macro progress",
    errorText: "Couldn't load macro progress",
    inputSchema: getProgressMacrosInput
  },
  {
    name: "get_progress_weight_bmi",
    description: "Weight (lb) and BMI series from vitals. BMI uses the user’s profile height (inches), or legacy height from older data. `latestHeightIn` is that effective height.",
    completionText: "Loaded weight and BMI progress",
    errorText: "Couldn't load weight and BMI progress",
    inputSchema: getProgressWeightBmiInput
  },
  {
    name: "get_progress_vitals_latest",
    description: "Read the user’s most recent logged value for each vital (weight, body fat %, resting HR, sleep, waist, blood pressure — not height). For height, goals, and preferences use get_user_profile. Body weight is pounds (body_weight_lb).",
    completionText: "Loaded latest vitals",
    errorText: "Couldn't load latest vitals",
    inputSchema: emptyInput
  },
  {
    name: "get_progress_vitals_log",
    description: "List vital readings between two calendar days (inclusive). Use for history or trends; for “what is my weight now?” prefer get_progress_vitals_latest. Optional keys filter (comma-separated) limits which metrics are returned.",
    completionText: "Loaded vitals history",
    errorText: "Couldn't load vitals history",
    inputSchema: getProgressVitalsLogInput
  },
  {
    name: "upsert_progress_vitals",
    description: "Save one or more vital readings for a calendar day (defaults to today). Same day + same metric replaces the previous value.",
    completionText: "Saved vitals",
    errorText: "Couldn't save vitals",
    inputSchema: upsertProgressVitalsInput
  },
  {
    name: "get_user_profile",
    description: "Read the user’s profile: name, height (inches), goalPreset (always one of lose_weight, gain_muscle, build_strength, custom), fitnessGoals text, preferences, and optional daily macro targets (goalCalories kcal; goalProteinG, goalCarbsG, goalFatG in grams). goalPreset is the API token for the primary goal tab; fitnessGoals is the full goal when preset is custom, otherwise additional goals. Height is not in vitals.",
    completionText: "Loaded profile",
    errorText: "Couldn't load profile",
    inputSchema: emptyInput
  },
  {
    name: "update_user_profile",
    description: "Update profile fields. goalPreset must be exactly one of these four strings (snake_case): lose_weight, gain_muscle, build_strength, custom — no synonyms. When custom, fitnessGoals is the full goal; otherwise it is extra detail beyond the preset. Daily macro goals: goalCalories (kcal), goalProteinG / goalCarbsG / goalFatG (grams). Omit a field to leave it unchanged; null clears text, height, or a macro target.",
    completionText: "Updated profile",
    errorText: "Couldn't update profile",
    inputSchema: updateUserProfileInput
  },
  {
    name: "get_daily_nutrition",
    description: "Get meals and macro totals for a calendar day (YYYY-MM-DD). Omit date for today.",
    completionText: "Loaded daily nutrition",
    errorText: "Couldn't load daily nutrition",
    inputSchema: getDailyNutritionInput
  },
  {
    name: "log_meal",
    description: "Create a meal bucket for a day (then add entries with log_meal_entry).",
    completionText: "Created meal",
    errorText: "Couldn't create meal",
    inputSchema: logMealInput
  },
  {
    name: "log_meal_entry",
    description: "Add a food line with calories and macros to a meal.",
    completionText: "Logged food entry",
    errorText: "Couldn't log food entry",
    inputSchema: logMealEntryInput
  },
  {
    name: "scrape_recipe_url",
    description: "Load a recipe web page and return clean markdown from Firecrawl (ingredients and steps are usually readable). Use when the user shares a recipe URL; then map the markdown into create_meal_library_item (name, ingredient lines, instructions, macros—estimate macros only when the page states them). If the page is paywalled or empty, say so and ask for paste or another link.",
    completionText: "Fetched recipe page",
    errorText: "Couldn't fetch recipe page",
    inputSchema: scrapeRecipeUrlInput
  },
  {
    name: "list_meal_library",
    description: "Search saved meal-library recipes (ingredients, instructions, macros). Matches name, instructions, and ingredient lines.",
    completionText: "Searched recipe library",
    errorText: "Couldn't search recipe library",
    inputSchema: listMealLibraryInput
  },
  {
    name: "get_meal_library_item",
    description: "Get one meal-library recipe by id.",
    completionText: "Loaded meal recipe",
    errorText: "Couldn't load meal recipe",
    inputSchema: getMealLibraryItemInput
  },
  {
    name: "create_meal_library_item",
    description: "Create a meal-library recipe (ingredient lines, instructions, macros).",
    completionText: "Saved meal recipe",
    errorText: "Couldn't save meal recipe",
    inputSchema: createMealLibraryItemInput
  },
  {
    name: "update_meal_library_item",
    description: "Update a meal-library recipe (replaces ingredient list).",
    completionText: "Updated meal recipe",
    errorText: "Couldn't update meal recipe",
    inputSchema: updateMealLibraryItemInput
  },
  {
    name: "delete_meal_library_item",
    description: "Delete a meal-library recipe. Clears weekly plan slots that referenced it.",
    completionText: "Deleted meal recipe",
    errorText: "Couldn't delete meal recipe",
    inputSchema: deleteMealLibraryItemInput
  },
  {
    name: "get_meal_plan",
    description: "Weekly meal plan (Mon–Sun) from the library plus a shopping list (AI: store sections, rough USD estimates, total when configured; otherwise merged ingredient lines). Uses Monday weekStart YYYY-MM-DD; defaults to this week. Creates empty slots if missing.",
    completionText: "Loaded meal plan",
    errorText: "Couldn't load meal plan",
    inputSchema: getMealPlanInput
  },
  {
    name: "get_meal_plan_shopping_list",
    description: "Weekly grocery shopping list for the meal plan: calling this tool runs generation when AI is configured (sections, per-line estimated USD, totalEstimatedUsd). If AI is unavailable, returns merged ingredient lines without prices (aiGenerated false). Same weekStart as get_meal_plan (Monday YYYY-MM-DD; omit for current week). Prefer this over get_meal_plan when the user only asks about groceries, cost, or what to buy.",
    completionText: "Loaded shopping list",
    errorText: "Couldn't load shopping list",
    inputSchema: getMealPlanShoppingListInput
  },
  {
    name: "set_meal_plan_slot",
    description: "Set or clear which library meal is assigned to a single slot. dayIndex 0=Monday … 6=Sunday. slotIndex selects the meal within that day (0=breakfast, 1=lunch, 2=dinner by default; omit slotIndex for breakfast). Prefer set_meal_plan_slots_batch when assigning many slots in the same week.",
    completionText: "Updated meal plan slot",
    errorText: "Couldn't update meal plan slot",
    inputSchema: setMealPlanSlotInput
  },
  {
    name: "set_meal_plan_slots_batch",
    description: "Assign library meals to many weekly plan slots in one call (same weekStartDayKey). Each assignment is { dayIndex, slotIndex?, libraryItemId } — same rules as set_meal_plan_slot. Use when building or replacing a full week to avoid dozens of tool calls.",
    completionText: "Updated meal plan slots",
    errorText: "Couldn't update meal plan slots",
    inputSchema: setMealPlanSlotsBatchInput
  }
];
const defByName = Object.fromEntries(
  TRAINLOG_TOOL_DEFINITIONS.map((d) => [d.name, d])
);
function parseTrainlogToolInput(name, raw) {
  const def = defByName[name];
  return def.inputSchema.parse(raw ?? {});
}
function getTrainlogToolNamesSorted() {
  return TRAINLOG_TOOL_DEFINITIONS.map((d) => d.name).sort(
    (a, b) => a.localeCompare(b)
  );
}
function getCoachToolCatalogSystemSection() {
  const names = getTrainlogToolNamesSorted();
  return [
    `Tool catalog: ${APP_BRAND_NAME} data tools are registered with deferred loading. Before calling a data tool, use \`tool_search_tool_bm25\` with a short natural-language query (e.g. "meal plan shopping list", "log a set") so the full definition is available. \`suggest_quick_replies\` is always loaded.`,
    `${APP_BRAND_NAME} data tool names: ${names.join(", ")}.`
  ].join("\n\n");
}
function getCoachCachableSystemPrefix() {
  return `You are Coach Miles a knowledgeable, supportive AI fitness coach for the ${APP_BRAND_NAME} app.

You are personable and friendly. Your refer to the user by name as appropriate, but not when its unnatural.

You help users plan training, understand programming, recover well, and stay consistent. Be concise and practical.

You are an AI and can make mistakes or misunderstand context. When your answer could affect health, safety, injury risk, medication, or major training or nutrition decisions, encourage the user to double-check and to consult a qualified professional when appropriate. Never present yourself as a substitute for a doctor, dietitian, or physical therapist.

You can read and update the user's ${APP_BRAND_NAME} data using tools — the same operations as the ${APP_BRAND_NAME} MCP server (workout templates including creating templates and adding exercises, listing/creating exercises, active workouts, logging sets, completing workouts, progress vitals including latest weight, nutrition days, logged meals and meal entries, the recipe library with recipes and shopping ingredients, \`scrape_recipe_url\` to load recipe text from a normal web URL the user shares (then save with \`create_meal_library_item\`), weekly meal plans, \`get_meal_plan_shopping_list\` to generate or load the grocery list with section grouping and estimated costs, and \`get_user_profile\` / \`update_user_profile\` for name, height, goals, preferences, and daily macro targets (calories and protein/carbs/fat in grams)). Prefer tools over guessing when the user asks about their actual logged data or wants changes reflected in the app.

Update the user's profile using the \`update_user_profile\` tool whenever the user tells you to remember something or shares information about their height, weight, goals, preferences, or daily macro targets, any other profile data when it changes, or any other information that you need to remember. Also use this tool to update the preferences and goals sections of the user's profile when the user expresses preferences or when they share information about themselves.

${getCoachToolCatalogSystemSection()}

Avoid sharing too many technical details about tools or overexplaining how you are using the tools. You should discuss the end result of the tool call and not the process of calling the tool.

You should approach requests in a goal-oriented manner, for example if the user asks to create a new workout template, you should ask the user what their fitness goals are and make suggestions for exercises to include based on the user's fitness goals and scientific principles rather than directly asking the user what exercises they want to include.

When you ask the user for information ask them for one piece of information at a time in a multi-step conversation. Don't ask for multiple pieces of information at once.

Workouts:
- Avoid referring to workouts as templates, that's an internal name, call them workouts instead.
- Workouts can be grouped together to form a workout routine, if the user asks to create more than one workout for the same goal, it should be added to a workout routine.
- When creating a workout make sure the following details are addressed:
  - Workout schedule.
  - Rest time between sets per exercise, if relevant.
  - Progressive overload, if relevant.
  - Warm-up, if relevant.
  - You are allowed to make assumptions and suggestions, just go over them and confirm with the user before creating or updating the workout.

Never invent workout or nutrition records. If a tool fails, explain briefly and suggest what the user can do next.

Use imperial-friendly language when discussing weights if the user does, but follow whatever units they use.

Quick replies: After you finish your user-visible answer (and after any data tools), you can call \`suggest_quick_replies\` as the last step. \`suggestions\` is an array of objects \`{ text, emoji? }\`: keep \`text\` plain (max ~8 words, no emojis inside the string). Set \`emoji\` on each row to one Unicode icon that fits that chip (the UI prefixes it); vary emojis when chips differ in topic (e.g. 💪 strength, 🍽️ nutrition, 📈 progress). If you listed concrete choices in prose, mirror them in \`text\`.

If you have a list of choices or suggestions for the user to choose from ALWAYS use quick replies to present them to the user, otherwise use quick replies as appropriate.

Always use tools to get the information you need before asking the user for it.

When creating meal plans, try to find ways to re-use ingredients across meals to reduce the number of ingredients you need to purchase and save the user money. After recipes exist in the recipe library, use \`set_meal_plan_slots_batch\` to assign the whole week in one tool call instead of many \`set_meal_plan_slot\` calls.

Also always reference the user's target macros when creating meal plans.

For body weight and other vitals: call get_progress_vitals_latest first (it returns the most recent logged value per metric). Height, fitness goals, and preferences are in the user profile (see below and get_user_profile). Use get_progress_vitals_log only when you need history across dates. App weight is stored in pounds (body_weight_lb). Ask the user only when those tools return no usable data for what you need.

If the user makes a request not related to training, nutrition, or fitness make a joke about it and then get back to the topic of training, nutrition, or fitness.

${goalPresetValidValuesForAi()}`;
}
function getCoachSystemDateLine() {
  return `The current date is ${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.`;
}
const quickReplySuggestionsSchema = z$1.object({
  suggestions: z$1.array(
    z$1.object({
      text: z$1.string().describe(
        "Plain tap-to-send line (max ~8 words, no emojis inside this string)."
      ),
      emoji: z$1.string().optional().describe(
        "One Unicode emoji for this chip (e.g. 💪 🍽️). Prefer setting on every row; vary when topics differ."
      )
    })
  ).min(1).describe(
    "1–8 short tap-to-send phrases (max ~8 words each, no numbering inside a string)."
  )
});
const suggestQuickRepliesTool = tool({
  description: `Emit tap-ready follow-up prompts for this turn. Call exactly once per coach reply, after your user-visible answer (and after any ${APP_BRAND_NAME} data tools). Each element of \`suggestions\` is \`{ text, emoji? }\`: keep \`text\` emoji-free; set \`emoji\` on each row when possible (the UI prefixes each chip). Do not describe this tool in prose to the user.`,
  inputSchema: quickReplySuggestionsSchema,
  providerOptions: {
    anthropic: { cacheControl: { type: "ephemeral" } }
  },
  execute: async ({ suggestions }) => {
    const cleaned = suggestions.map((s) => ({
      text: s.text.trim(),
      em: typeof s.emoji === "string" ? s.emoji.trim().slice(0, 8) : ""
    })).filter((s) => s.text.length > 0).slice(0, 8);
    const seed = cleaned.find((s) => s.em.length > 0)?.em ?? "";
    return {
      ok: true,
      count: cleaned.length,
      emoji: seed.length > 0 ? seed : "💬",
      suggestions: cleaned.map((s) => s.text)
    };
  }
});
const ONBOARDING_MEAL_REFINEMENT_COMPLETE_TOOL = "onboarding_meal_refinement_complete";
const onboardingMealRefinementCompleteTool = tool({
  description: "Call **once** when the user is finished adjusting this week’s meal plan and ready to move on in setup. Use when they express satisfaction, say they are done, want to continue, or equivalent—**after** your brief acknowledgment, and only after any meal-plan data tools. Do **not** call while they still want changes or you still owe edits. Do not mention this tool to the user.",
  inputSchema: z$1.object({}),
  execute: async () => ({ ok: true, proceed: true })
});
const SHOPPING_LIST_SECTIONS = [
  "Produce",
  "Meat & seafood",
  "Dairy & eggs",
  "Bakery",
  "Frozen",
  "Pantry",
  "Canned goods",
  "Condiments & oils",
  "Spices & seasonings",
  "Beverages",
  "Snacks & misc",
  "Non-food / household",
  "Other"
];
const SECTION_BY_LOWER = new Map(
  SHOPPING_LIST_SECTIONS.map((s) => [s.toLowerCase(), s])
);
function normalizeShoppingSection(raw) {
  const t = raw.trim();
  if (!t) return "Other";
  const exact = SECTION_BY_LOWER.get(t.toLowerCase());
  if (exact) return exact;
  return "Other";
}
function groupItemsBySectionOrder(items) {
  const buckets = /* @__PURE__ */ new Map();
  for (const item of items) {
    const sec2 = normalizeShoppingSection(item.section);
    if (!buckets.has(sec2)) buckets.set(sec2, []);
    buckets.get(sec2).push(item);
  }
  const out = [];
  for (const sec2 of SHOPPING_LIST_SECTIONS) {
    const arr = buckets.get(sec2);
    if (arr && arr.length > 0) out.push({ section: sec2, items: arr });
  }
  return out;
}
function buildShoppingListFormatPrompt(weekStartDayKey, rawBlock, sectionList) {
  return `You format grocery lists for real-world shopping (US supermarkets, typical package sizes, rough mid-range prices).

WEEK STARTING (Monday): ${weekStartDayKey}

RAW RECIPE INGREDIENT LINES (the × count is how many planned meals use that line):
${rawBlock}

Produce a shopping list with:
- Practical purchase units (e.g. pasta as a box, oil as a bottle).
- Merge overlapping needs into one line where appropriate.
- Assign EVERY line to exactly one section from this list (use the label verbatim):
${sectionList}

For each purchase line, estimate a typical US retail price in USD for that package (positive number, two decimals ok). This is a rough ballpark, not exact.

Return ONLY valid JSON with this shape (no markdown):
{"items":[{"label":"string","section":"Produce","estimatedCostUsd":3.49},...]}`;
}
const LUNCH_ORD = [
  "1st",
  "2nd",
  "3rd",
  "4th",
  "5th",
  "6th",
  "7th",
  "8th",
  "9th",
  "10th"
];
function labelForMealSlot(mealIndex, mealCount) {
  if (mealCount <= 0) return "Meal";
  if (mealCount === 1) return "Dinner";
  if (mealCount === 2) {
    return mealIndex === 0 ? "Breakfast" : "Dinner";
  }
  if (mealCount === 3) {
    return ["Breakfast", "Lunch", "Dinner"][mealIndex] ?? "Meal";
  }
  if (mealIndex === 0) return "Breakfast";
  if (mealIndex === mealCount - 1) return "Dinner";
  const midIndex = mealIndex - 1;
  if (midIndex === 0) return "Lunch";
  if (midIndex >= 1 && midIndex < LUNCH_ORD.length) {
    return `${LUNCH_ORD[midIndex]} Lunch`;
  }
  return `Meal ${mealIndex + 1}`;
}
function labelForSnackSlot(snackIndex) {
  return snackIndex === 0 ? "Snack" : `Snack ${snackIndex + 1}`;
}
function computeMealPlanSlotLabels(slots) {
  const byDay = /* @__PURE__ */ new Map();
  for (const s of slots) {
    if (!byDay.has(s.dayIndex)) byDay.set(s.dayIndex, []);
    byDay.get(s.dayIndex).push(s);
  }
  const out = /* @__PURE__ */ new Map();
  for (const [, daySlots] of byDay) {
    const sorted = [...daySlots].sort((a, b) => a.slotIndex - b.slotIndex);
    const meals2 = [];
    const snacks = [];
    for (const s of sorted) {
      const kind = effectiveSlotKind(s);
      if (kind === "snack") snacks.push(s);
      else meals2.push(s);
    }
    meals2.forEach((s, i) => {
      out.set(s.id, labelForMealSlot(i, meals2.length));
    });
    snacks.forEach((s, i) => {
      out.set(s.id, labelForSnackSlot(i));
    });
  }
  return out;
}
function effectiveSlotKind(s) {
  if (s.slotKind === "snack") return "snack";
  if (s.slotKind === "meal") return "meal";
  return /^Snack\b/i.test(s.label.trim()) ? "snack" : "meal";
}
const DEFAULT_SLOTS_PER_DAY = 3;
const DEFAULT_MEAL_LABELS = ["Breakfast", "Lunch", "Dinner"];
function shoppingListFromPlan(plan) {
  const items = plan.slots.map((s) => s.libraryItem).filter((x) => x != null);
  return aggregateShoppingList(
    items.map((i) => ({ ingredients: i.ingredients }))
  );
}
function aggregateShoppingList(libraryItems) {
  const counts = /* @__PURE__ */ new Map();
  for (const item of libraryItems) {
    for (const ing of item.ingredients) {
      const line = ing.line.trim();
      if (!line) continue;
      counts.set(line, (counts.get(line) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries()).sort(([a], [b]) => a.localeCompare(b, void 0, { sensitivity: "base" })).map(([line, count]) => ({ line, count }));
}
function bumpMealPlanSlot(set, currentRev) {
  return {
    ...set,
    updatedAt: /* @__PURE__ */ new Date(),
    rev: (currentRev || 0) + 1
  };
}
async function persistSlotLabelsForDay(dbh, planId, dayIndex) {
  const slots = await dbh.query.mealPlanSlots.findMany({
    where: and(
      eq(mealPlanSlots.planId, planId),
      eq(mealPlanSlots.dayIndex, dayIndex)
    )
  });
  const map2 = computeMealPlanSlotLabels(slots);
  for (const s of slots) {
    const label = map2.get(s.id);
    if (label && label !== s.label) {
      await dbh.update(mealPlanSlots).set(bumpMealPlanSlot({ label }, s.rev ?? 0)).where(eq(mealPlanSlots.id, s.id));
    }
  }
}
async function getPlanForWeek(userId, weekStartDayKey) {
  return db.query.mealPlans.findFirst({
    where: and(
      eq(mealPlans.userId, userId),
      eq(mealPlans.weekStartDayKey, weekStartDayKey)
    ),
    with: {
      slots: {
        orderBy: [asc(mealPlanSlots.dayIndex), asc(mealPlanSlots.slotIndex)],
        with: {
          libraryItem: {
            with: {
              ingredients: {
                orderBy: (ing, { asc: a }) => [a(ing.sortOrder)]
              }
            }
          }
        }
      }
    }
  });
}
async function getOrCreatePlanForWeek(userId, weekStartDayKey) {
  let plan = await getPlanForWeek(userId, weekStartDayKey);
  if (plan) {
    await ensureDefaultSlotsForPlan(userId, plan.id);
    plan = await getPlanForWeek(userId, weekStartDayKey);
    return plan;
  }
  const now2 = /* @__PURE__ */ new Date();
  const [inserted] = await db.insert(mealPlans).values({
    userId,
    weekStartDayKey,
    updatedAt: now2
  }).returning();
  await insertDefaultWeekSlots(userId, inserted.id);
  return getPlanForWeek(userId, weekStartDayKey);
}
function insertDefaultWeekSlots(userId, planId) {
  const rows = [];
  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    for (let slotIndex = 0; slotIndex < DEFAULT_SLOTS_PER_DAY; slotIndex++) {
      rows.push({
        userId,
        planId,
        dayIndex,
        slotIndex,
        slotKind: "meal",
        label: DEFAULT_MEAL_LABELS[slotIndex] ?? `Meal ${slotIndex + 1}`,
        libraryItemId: null
      });
    }
  }
  return db.insert(mealPlanSlots).values(rows);
}
async function ensureDefaultSlotsForPlan(userId, planId) {
  const existing = await db.query.mealPlanSlots.findMany({
    where: eq(mealPlanSlots.planId, planId)
  });
  const byDay = /* @__PURE__ */ new Map();
  for (const s of existing) {
    if (!byDay.has(s.dayIndex)) byDay.set(s.dayIndex, /* @__PURE__ */ new Set());
    byDay.get(s.dayIndex).add(s.slotIndex);
  }
  const missing = [];
  for (let d = 0; d < 7; d++) {
    const have = byDay.get(d) ?? /* @__PURE__ */ new Set();
    for (let si = 0; si < DEFAULT_SLOTS_PER_DAY; si++) {
      if (!have.has(si)) {
        missing.push({
          userId,
          planId,
          dayIndex: d,
          slotIndex: si,
          slotKind: "meal",
          label: DEFAULT_MEAL_LABELS[si] ?? `Meal ${si + 1}`,
          libraryItemId: null
        });
      }
    }
  }
  if (missing.length > 0) await db.insert(mealPlanSlots).values(missing);
  await db.update(mealPlanSlots).set({
    label: DEFAULT_MEAL_LABELS[0],
    updatedAt: /* @__PURE__ */ new Date(),
    rev: sql`(COALESCE(${mealPlanSlots.rev}, 0) + 1)`
  }).where(
    and(
      eq(mealPlanSlots.planId, planId),
      eq(mealPlanSlots.slotIndex, 0),
      eq(mealPlanSlots.label, "Meal")
    )
  );
  await db.update(mealPlanSlots).set({
    slotKind: "snack",
    updatedAt: /* @__PURE__ */ new Date(),
    rev: sql`(COALESCE(${mealPlanSlots.rev}, 0) + 1)`
  }).where(
    and(
      eq(mealPlanSlots.planId, planId),
      like(mealPlanSlots.label, "Snack%")
    )
  );
  for (let d = 0; d < 7; d++) {
    await persistSlotLabelsForDay(db, planId, d);
  }
}
async function setSlotLibraryItem(userId, input) {
  const slot = await db.query.mealPlanSlots.findFirst({
    where: eq(mealPlanSlots.id, input.slotId),
    with: { plan: true }
  });
  if (!slot || slot.plan.userId !== userId) throw new Error("Slot not found");
  if (input.libraryItemId) {
    const item = await db.query.mealLibraryItems.findFirst({
      where: and(
        eq(mealLibraryItems.id, input.libraryItemId),
        eq(mealLibraryItems.userId, userId)
      )
    });
    if (!item) throw new Error("Library meal not found");
  }
  const now2 = /* @__PURE__ */ new Date();
  await db.update(mealPlanSlots).set(
    bumpMealPlanSlot(
      { libraryItemId: input.libraryItemId },
      slot.rev ?? 0
    )
  ).where(eq(mealPlanSlots.id, input.slotId));
  await db.update(mealPlans).set({ updatedAt: now2 }).where(eq(mealPlans.id, slot.planId));
  return getPlanForWeek(userId, slot.plan.weekStartDayKey);
}
async function setPlanSlot(userId, input) {
  if (input.dayIndex < 0 || input.dayIndex > 6) {
    throw new Error("dayIndex must be 0–6");
  }
  const slotIndex = input.slotIndex ?? 0;
  if (slotIndex < 0 || slotIndex > 50) throw new Error("slotIndex out of range");
  const plan = await getOrCreatePlanForWeek(userId, input.weekStartDayKey);
  if (!plan) throw new Error("Plan not found");
  const slot = plan.slots.find(
    (s) => s.dayIndex === input.dayIndex && s.slotIndex === slotIndex
  );
  if (!slot) throw new Error("Slot not found");
  return setSlotLibraryItem(userId, {
    slotId: slot.id,
    libraryItemId: input.libraryItemId
  });
}
async function setPlanSlotsBatch(userId, input) {
  const weekStartDayKey = input.weekStartDayKey.trim();
  const plan = await getOrCreatePlanForWeek(userId, weekStartDayKey);
  if (!plan) throw new Error("Plan not found");
  if (input.assignments.length === 0) {
    return plan;
  }
  const slotByKey = /* @__PURE__ */ new Map();
  for (const s of plan.slots) {
    slotByKey.set(`${s.dayIndex}:${s.slotIndex}`, s);
  }
  const resolved = [];
  for (const a of input.assignments) {
    if (a.dayIndex < 0 || a.dayIndex > 6) {
      throw new Error("dayIndex must be 0–6");
    }
    const slotIndex = a.slotIndex ?? 0;
    if (slotIndex < 0 || slotIndex > 50) throw new Error("slotIndex out of range");
    const slot = slotByKey.get(`${a.dayIndex}:${slotIndex}`);
    if (!slot) throw new Error("Slot not found");
    resolved.push({
      slotId: slot.id,
      libraryItemId: a.libraryItemId
    });
  }
  const libraryIds = [
    ...new Set(
      resolved.map((r) => r.libraryItemId).filter((id) => id != null && id !== "")
    )
  ];
  await db.transaction(async (tx) => {
    if (libraryIds.length > 0) {
      const found = await tx.query.mealLibraryItems.findMany({
        where: and(
          eq(mealLibraryItems.userId, userId),
          inArray(mealLibraryItems.id, libraryIds)
        )
      });
      if (found.length !== libraryIds.length) {
        throw new Error("Library meal not found");
      }
    }
    const now2 = /* @__PURE__ */ new Date();
    for (const r of resolved) {
      const slotRow = plan.slots.find((s) => s.id === r.slotId);
      await tx.update(mealPlanSlots).set(
        bumpMealPlanSlot(
          { libraryItemId: r.libraryItemId },
          slotRow?.rev ?? 0
        )
      ).where(eq(mealPlanSlots.id, r.slotId));
    }
    await tx.update(mealPlans).set({ updatedAt: now2 }).where(eq(mealPlans.id, plan.id));
  });
  return getPlanForWeek(userId, weekStartDayKey);
}
const SHOPPING_LIST_AI_VERSION = 3;
function roundUsd(n) {
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100) / 100;
}
function normalizeLabel(line) {
  return line.replace(/^\[[A-Za-z][^\]]{0,39}\]\s*/, "").trim();
}
function hashAggregatedShoppingList(raw) {
  return createHash("sha256").update(`v${SHOPPING_LIST_AI_VERSION}:${JSON.stringify(raw)}`).digest("hex");
}
function parseStoredShoppingListJson(s) {
  if (s == null || s === "") return null;
  try {
    const v = JSON.parse(s);
    if (!Array.isArray(v)) return null;
    if (v.length === 0) return [];
    if (typeof v[0] === "string") return null;
    const out = [];
    for (const el of v) {
      if (!el || typeof el !== "object") continue;
      const o = el;
      const label = typeof o.label === "string" ? normalizeLabel(o.label) : "";
      const section = typeof o.section === "string" ? o.section : "Other";
      const c = o.estimatedCostUsd;
      const estimatedCostUsd = typeof c === "number" && Number.isFinite(c) ? roundUsd(c) : 0;
      if (label) out.push({ label, section, estimatedCostUsd });
    }
    return out;
  } catch {
    return null;
  }
}
function aggregateLinesForFallback(raw) {
  return raw.map(
    (r) => r.count > 1 ? `${r.count}× ${r.line}` : r.line
  );
}
function buildFallbackView(raw) {
  const lines = aggregateLinesForFallback(raw);
  return {
    aiGenerated: false,
    bySection: lines.length > 0 ? [
      {
        section: "Ingredients",
        items: lines.map((label) => ({
          label,
          estimatedCostUsd: null
        }))
      }
    ] : [],
    totalEstimatedUsd: null
  };
}
function buildViewFromAiItems(items, rawIngredientLines) {
  const cleaned = items.map((i) => ({
    ...i,
    label: normalizeLabel(i.label)
  })).filter((i) => i.label.length > 0);
  if (cleaned.length === 0) {
    return {
      aiGenerated: false,
      bySection: [],
      totalEstimatedUsd: null
    };
  }
  const grouped = groupItemsBySectionOrder(cleaned);
  const bySection = grouped.map(({ section, items: rows }) => ({
    section,
    items: rows.map(({ label, estimatedCostUsd }) => ({
      label,
      estimatedCostUsd
    }))
  }));
  let total = 0;
  for (const row of cleaned) {
    total += row.estimatedCostUsd;
  }
  return {
    aiGenerated: rawIngredientLines > 0,
    bySection,
    totalEstimatedUsd: roundUsd(total)
  };
}
async function generateStructuredShoppingList(raw, weekStartDayKey) {
  if (raw.length === 0) return [];
  const modelId = process.env.ANTHROPIC_QUICK_MODEL?.trim() || process.env.ANTHROPIC_MODEL?.trim() || "claude-haiku-4-5";
  const rawBlock = aggregateLinesForFallback(raw).join("\n");
  const sectionList = SHOPPING_LIST_SECTIONS.map((s) => `- "${s}"`).join("\n");
  const prompt = buildShoppingListFormatPrompt(
    weekStartDayKey,
    rawBlock,
    sectionList
  );
  const { text: text2 } = await generateText({
    model: anthropic(modelId),
    prompt,
    maxOutputTokens: 4096
  });
  const trimmed = text2.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const parsed = JSON.parse(trimmed);
  const items = parsed.items;
  if (!Array.isArray(items)) return [];
  const out = [];
  for (const el of items) {
    if (!el || typeof el !== "object") continue;
    const o = el;
    const label = typeof o.label === "string" ? normalizeLabel(o.label) : "";
    const section = typeof o.section === "string" ? o.section : "Other";
    const c = o.estimatedCostUsd;
    const estimatedCostUsd = typeof c === "number" && Number.isFinite(c) ? roundUsd(c) : 0;
    if (label) out.push({ label, section, estimatedCostUsd });
  }
  return out;
}
async function resolveShoppingListForMealPlan(plan) {
  const raw = shoppingListFromPlan(plan);
  const hash = hashAggregatedShoppingList(raw);
  const storedHash = plan.shoppingListSourceHash ?? null;
  const storedParsed = parseStoredShoppingListJson(plan.aiShoppingListJson);
  const cacheOk = storedHash === hash && storedParsed !== null && !(raw.length > 0 && storedParsed.length === 0);
  if (cacheOk) {
    return buildViewFromAiItems(storedParsed, raw.length);
  }
  if (raw.length === 0) {
    await db.update(mealPlans).set({
      aiShoppingListJson: "[]",
      shoppingListSourceHash: hash
    }).where(eq(mealPlans.id, plan.id));
    return {
      aiGenerated: false,
      bySection: [],
      totalEstimatedUsd: null
    };
  }
  const fallbackWithNotice = (notice) => ({
    ...buildFallbackView(raw),
    aiNotice: notice
  });
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn(
      "[ai-shopping-list] ANTHROPIC_API_KEY not set; using merged lines only"
    );
    return fallbackWithNotice(
      "AI formatting isn’t available. Showing merged ingredient lines."
    );
  }
  return {
    aiGenerated: false,
    awaitingAiGeneration: true,
    mealPlanUpdatedSinceShoppingList: storedHash != null && storedHash !== hash,
    bySection: [],
    totalEstimatedUsd: null
  };
}
async function generateShoppingListForMealPlan(plan) {
  const raw = shoppingListFromPlan(plan);
  const hash = hashAggregatedShoppingList(raw);
  if (raw.length === 0) {
    await db.update(mealPlans).set({
      aiShoppingListJson: "[]",
      shoppingListSourceHash: hash
    }).where(eq(mealPlans.id, plan.id));
    return {
      aiGenerated: false,
      bySection: [],
      totalEstimatedUsd: null
    };
  }
  const fallbackWithNotice = (notice) => ({
    ...buildFallbackView(raw),
    aiNotice: notice
  });
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn(
      "[ai-shopping-list] ANTHROPIC_API_KEY not set; using merged lines only"
    );
    return fallbackWithNotice(
      "AI formatting isn’t available. Showing merged ingredient lines."
    );
  }
  try {
    const items = await generateStructuredShoppingList(raw, plan.weekStartDayKey);
    const preview = buildViewFromAiItems(items, raw.length);
    const lineCount = preview.bySection.reduce(
      (acc, s) => acc + s.items.length,
      0
    );
    if (items.length === 0 || lineCount === 0) {
      return fallbackWithNotice(
        "Couldn’t parse the AI shopping list. Showing merged ingredient lines instead."
      );
    }
    await db.update(mealPlans).set({
      aiShoppingListJson: JSON.stringify(items),
      shoppingListSourceHash: hash
    }).where(eq(mealPlans.id, plan.id));
    return preview;
  } catch (err) {
    console.error("[ai-shopping-list] generation failed:", err);
    return fallbackWithNotice(
      "Couldn’t generate the AI shopping list. Showing merged ingredient lines instead."
    );
  }
}
function jsonMealPlanBase(plan) {
  const labelById = computeMealPlanSlotLabels(plan.slots);
  return {
    id: plan.id,
    weekStartDayKey: plan.weekStartDayKey,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
    slots: plan.slots.map((s) => ({
      id: s.id,
      dayIndex: s.dayIndex,
      slotIndex: s.slotIndex,
      slotKind: s.slotKind === "snack" ? "snack" : "meal",
      label: labelById.get(s.id) ?? s.label,
      libraryItemId: s.libraryItemId,
      libraryItem: s.libraryItem ? jsonMealLibraryItem({
        ...s.libraryItem,
        ingredients: s.libraryItem.ingredients ?? []
      }) : null
    }))
  };
}
function jsonMealLibraryItem(item) {
  return {
    id: item.id,
    name: item.name,
    instructions: item.instructions,
    calories: item.calories,
    proteinG: item.proteinG,
    carbsG: item.carbsG,
    fatG: item.fatG,
    ingredients: item.ingredients.map((i) => ({
      id: i.id,
      sortOrder: i.sortOrder,
      line: i.line
    }))
  };
}
async function jsonMealPlan(plan) {
  const shoppingList = await resolveShoppingListForMealPlan(plan);
  return {
    ...jsonMealPlanBase(plan),
    shoppingList
  };
}
function escapeLikePattern(s) {
  return s.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}
async function listLibraryItems(userId, query) {
  const q = query?.trim();
  if (!q) {
    return db.query.mealLibraryItems.findMany({
      where: eq(mealLibraryItems.userId, userId),
      orderBy: [desc(mealLibraryItems.updatedAt)],
      with: {
        ingredients: {
          orderBy: [asc(mealLibraryIngredients.sortOrder)]
        }
      }
    });
  }
  const pattern = `%${escapeLikePattern(q)}%`;
  const ingRows = await db.selectDistinct({ libraryItemId: mealLibraryIngredients.libraryItemId }).from(mealLibraryIngredients).innerJoin(
    mealLibraryItems,
    eq(mealLibraryItems.id, mealLibraryIngredients.libraryItemId)
  ).where(
    and(
      eq(mealLibraryItems.userId, userId),
      like(mealLibraryIngredients.line, pattern)
    )
  );
  const ingIds = ingRows.map((r) => r.libraryItemId).filter(Boolean);
  const matches = or(
    like(mealLibraryItems.name, pattern),
    like(mealLibraryItems.instructions, pattern),
    ...ingIds.length ? [inArray(mealLibraryItems.id, ingIds)] : []
  );
  return db.query.mealLibraryItems.findMany({
    where: and(eq(mealLibraryItems.userId, userId), matches),
    orderBy: [desc(mealLibraryItems.updatedAt)],
    with: {
      ingredients: {
        orderBy: [asc(mealLibraryIngredients.sortOrder)]
      }
    }
  });
}
async function getLibraryItem(userId, id) {
  return db.query.mealLibraryItems.findFirst({
    where: and(eq(mealLibraryItems.id, id), eq(mealLibraryItems.userId, userId)),
    with: {
      ingredients: {
        orderBy: [asc(mealLibraryIngredients.sortOrder)]
      }
    }
  });
}
async function createLibraryItem(userId, input) {
  const now2 = /* @__PURE__ */ new Date();
  const [row] = await db.insert(mealLibraryItems).values({
    userId,
    name: input.name.trim(),
    instructions: input.instructions.trim(),
    calories: Math.round(input.calories),
    proteinG: input.proteinG,
    carbsG: input.carbsG,
    fatG: input.fatG,
    updatedAt: now2
  }).returning();
  const lines = input.ingredients.map((i) => i.line.trim()).filter((l) => l.length > 0);
  if (lines.length > 0) {
    await db.insert(mealLibraryIngredients).values(
      lines.map((line, sortOrder) => ({
        userId,
        libraryItemId: row.id,
        sortOrder,
        line
      }))
    );
  }
  return getLibraryItem(userId, row.id);
}
async function updateLibraryItem(userId, id, input) {
  const existing = await getLibraryItem(userId, id);
  if (!existing) return null;
  const now2 = /* @__PURE__ */ new Date();
  await db.update(mealLibraryItems).set({
    name: input.name.trim(),
    instructions: input.instructions.trim(),
    calories: Math.round(input.calories),
    proteinG: input.proteinG,
    carbsG: input.carbsG,
    fatG: input.fatG,
    updatedAt: now2
  }).where(and(eq(mealLibraryItems.id, id), eq(mealLibraryItems.userId, userId)));
  await db.delete(mealLibraryIngredients).where(eq(mealLibraryIngredients.libraryItemId, id));
  const lines = input.ingredients.map((i) => i.line.trim()).filter((l) => l.length > 0);
  if (lines.length > 0) {
    await db.insert(mealLibraryIngredients).values(
      lines.map((line, sortOrder) => ({
        userId,
        libraryItemId: id,
        sortOrder,
        line
      }))
    );
  }
  return getLibraryItem(userId, id);
}
async function deleteLibraryItem(userId, id) {
  await db.delete(mealLibraryItems).where(and(eq(mealLibraryItems.id, id), eq(mealLibraryItems.userId, userId)));
}
function parseDistanceUnit(raw) {
  if (raw === "mi" || raw === "m") return raw;
  return "km";
}
function sessionDistanceStep(unit) {
  if (unit === "m") return 10;
  if (unit === "mi") return 0.05;
  return 0.1;
}
function minPositiveDistance(unit) {
  if (unit === "m") return 1;
  return 0.01;
}
function roundDistance(n, unit) {
  const v = Math.max(0, n);
  if (unit === "m") return Math.round(v);
  return Math.round(v * 1e3) / 1e3;
}
function formatDistanceAmount(n, unit) {
  const r = roundDistance(n, unit);
  if (unit === "m") return `${r} m`;
  const s = Math.abs(r - Math.round(r)) < 1e-9 ? String(Math.round(r)) : r.toFixed(2).replace(/\.?0+$/, "");
  return `${s} ${unit}`;
}
const SESSION_DURATION_STEP_SEC = 5;
function roundWorkingWeight(n) {
  return Math.round(Math.max(0, n) * 2) / 2;
}
function baseWeightForSessionAdjust(pref, templateDefault, setsForExercise) {
  if (pref?.workingWeight != null && Number.isFinite(pref.workingWeight)) {
    return roundWorkingWeight(pref.workingWeight);
  }
  if (templateDefault != null && Number.isFinite(templateDefault)) {
    return roundWorkingWeight(templateDefault);
  }
  if (setsForExercise.length === 0) return 0;
  const last = [...setsForExercise].sort((a, b) => b.setIndex - a.setIndex)[0];
  return roundWorkingWeight(last?.weight ?? 0);
}
function effectiveTemplateWeightForSession(pref, templateDefault) {
  if (pref?.workingWeight != null && Number.isFinite(pref.workingWeight)) {
    return roundWorkingWeight(pref.workingWeight);
  }
  if (templateDefault != null && Number.isFinite(templateDefault)) {
    return roundWorkingWeight(templateDefault);
  }
  return null;
}
function effectiveTargetDurationSecForSession(pref, item) {
  if (pref?.workingDurationSec != null && Number.isFinite(pref.workingDurationSec) && pref.workingDurationSec >= 1) {
    return Math.round(pref.workingDurationSec);
  }
  return Math.max(
    1,
    Math.round(
      item.targetDurationSec ?? item.exercise.defaultDurationSec ?? 60
    )
  );
}
function effectiveTargetDistanceForSession(pref, item) {
  const unit = parseDistanceUnit(item.exercise.distanceUnit);
  if (pref?.workingDistance != null && Number.isFinite(pref.workingDistance) && pref.workingDistance > 0) {
    return roundDistance(pref.workingDistance, unit);
  }
  const fallback = item.targetDistance ?? item.exercise.defaultDistance ?? (unit === "m" ? 400 : 1);
  return roundDistance(
    Math.max(unit === "m" ? 1 : 0.01, Number(fallback)),
    unit
  );
}
function getNextOpenSetIndex(targetSets, existingSetIndices) {
  const logged = new Set(existingSetIndices);
  for (let i = 1; i <= targetSets; i++) {
    if (!logged.has(i)) return i;
  }
  return null;
}
function suggestedWeightForSet(defaultWeight, setsForExercise, setIndex) {
  const lower = setsForExercise.filter((s) => s.setIndex < setIndex).sort((a, b) => b.setIndex - a.setIndex)[0];
  if (lower && Number.isFinite(lower.weight)) return lower.weight;
  if (defaultWeight != null && Number.isFinite(defaultWeight)) {
    return roundWorkingWeight(defaultWeight);
  }
  return 0;
}
function parseByDay(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return /* @__PURE__ */ new Set();
    const out = /* @__PURE__ */ new Set();
    for (const v of parsed) {
      const n = typeof v === "number" ? v : Number(v);
      if (Number.isInteger(n) && n >= 0 && n <= 6) out.add(n);
    }
    return out;
  } catch {
    return /* @__PURE__ */ new Set();
  }
}
function expandRecurringPlannedFromRules(rules, skips, fromKey, toKey) {
  if (fromKey > toKey) return [];
  const skipSet = new Set(skips.map((s) => `${s.ruleId}|${s.dayKey}`));
  const out = [];
  for (const rule of rules) {
    const dows = parseByDay(rule.byDay);
    if (dows.size === 0) continue;
    const interval = Math.max(1, rule.intervalWeeks | 0);
    const rangeStart = fromKey < rule.startDayKey ? rule.startDayKey : fromKey;
    const rangeEnd = rule.untilDayKey && rule.untilDayKey < toKey ? rule.untilDayKey : toKey;
    if (rangeStart > rangeEnd) continue;
    eachDayKeyInRange(rangeStart, rangeEnd, (dayKey) => {
      const d = parseDayKey(dayKey);
      if (!d) return;
      if (!dows.has(d.getDay())) return;
      if (interval > 1) {
        const distance = dayKeysDistance(rule.startDayKey, dayKey);
        if (distance === null || distance < 0) return;
        const weeksSince = Math.floor(distance / 7);
        if (weeksSince % interval !== 0) return;
      }
      if (skipSet.has(`${rule.id}|${dayKey}`)) return;
      out.push({
        source: "recurring",
        instanceKey: `${rule.id}|${dayKey}`,
        ruleId: rule.id,
        dayKey,
        templateId: rule.templateId,
        templateName: rule.templateName,
        notes: rule.notes,
        intervalWeeks: interval,
        startDayKey: rule.startDayKey,
        untilDayKey: rule.untilDayKey
      });
    });
  }
  return out;
}
function mergePlannedOnceAndRecurring(once, recurring) {
  const onceKeys = new Set(once.map((o) => `${o.dayKey}|${o.templateId}`));
  const filteredRecurring = recurring.filter(
    (r) => !onceKeys.has(`${r.dayKey}|${r.templateId}`)
  );
  const merged = [...once, ...filteredRecurring];
  merged.sort((a, b) => {
    if (a.dayKey !== b.dayKey) return a.dayKey < b.dayKey ? -1 : 1;
    return a.templateName.localeCompare(b.templateName);
  });
  return merged;
}
const PRESET_EXERCISES = [
  { id: "pre00000001", name: "Barbell bench press", muscleGroup: "Chest" },
  { id: "pre00000002", name: "Dumbbell bench press", muscleGroup: "Chest" },
  { id: "pre00000003", name: "Incline barbell bench press", muscleGroup: "Chest" },
  { id: "pre00000004", name: "Incline dumbbell bench press", muscleGroup: "Chest" },
  { id: "pre00000005", name: "Decline bench press", muscleGroup: "Chest" },
  { id: "pre00000006", name: "Chest fly (machine)", muscleGroup: "Chest" },
  { id: "pre00000007", name: "Cable crossover", muscleGroup: "Chest" },
  { id: "pre00000008", name: "Push-up", muscleGroup: "Chest" },
  { id: "pre00000009", name: "Dips (chest lean)", muscleGroup: "Chest" },
  { id: "pre00000010", name: "Deadlift (conventional)", muscleGroup: "Back" },
  { id: "pre00000011", name: "Romanian deadlift", muscleGroup: "Back" },
  { id: "pre00000012", name: "Barbell row", muscleGroup: "Back" },
  { id: "pre00000013", name: "Pendlay row", muscleGroup: "Back" },
  { id: "pre00000014", name: "Single-arm dumbbell row", muscleGroup: "Back" },
  { id: "pre00000015", name: "Lat pulldown", muscleGroup: "Back" },
  { id: "pre00000016", name: "Pull-up", muscleGroup: "Back" },
  { id: "pre00000017", name: "Chin-up", muscleGroup: "Back" },
  { id: "pre00000018", name: "Seated cable row", muscleGroup: "Back" },
  { id: "pre00000019", name: "Face pull", muscleGroup: "Back" },
  { id: "pre00000020", name: "Straight-arm pulldown", muscleGroup: "Back" },
  { id: "pre00000021", name: "Back extension (hyperextension)", muscleGroup: "Back" },
  { id: "pre00000022", name: "Overhead press (barbell)", muscleGroup: "Shoulders" },
  { id: "pre00000023", name: "Dumbbell shoulder press", muscleGroup: "Shoulders" },
  { id: "pre00000024", name: "Arnold press", muscleGroup: "Shoulders" },
  { id: "pre00000025", name: "Lateral raise", muscleGroup: "Shoulders" },
  { id: "pre00000026", name: "Front raise", muscleGroup: "Shoulders" },
  { id: "pre00000027", name: "Rear delt fly", muscleGroup: "Shoulders" },
  { id: "pre00000028", name: "Upright row", muscleGroup: "Shoulders" },
  { id: "pre00000029", name: "Shrugs", muscleGroup: "Shoulders" },
  { id: "pre00000030", name: "Barbell curl", muscleGroup: "Biceps" },
  { id: "pre00000031", name: "Dumbbell curl", muscleGroup: "Biceps" },
  { id: "pre00000032", name: "Hammer curl", muscleGroup: "Biceps" },
  { id: "pre00000033", name: "Preacher curl", muscleGroup: "Biceps" },
  { id: "pre00000034", name: "Cable curl", muscleGroup: "Biceps" },
  { id: "pre00000035", name: "Triceps pushdown (cable)", muscleGroup: "Triceps" },
  { id: "pre00000036", name: "Skull crusher", muscleGroup: "Triceps" },
  { id: "pre00000037", name: "Overhead triceps extension", muscleGroup: "Triceps" },
  { id: "pre00000038", name: "Close-grip bench press", muscleGroup: "Triceps" },
  { id: "pre00000039", name: "Bench dip", muscleGroup: "Triceps" },
  { id: "pre00000040", name: "Back squat", muscleGroup: "Legs" },
  { id: "pre00000041", name: "Front squat", muscleGroup: "Legs" },
  { id: "pre00000042", name: "Goblet squat", muscleGroup: "Legs" },
  { id: "pre00000043", name: "Leg press", muscleGroup: "Legs" },
  { id: "pre00000044", name: "Leg extension", muscleGroup: "Legs" },
  { id: "pre00000045", name: "Leg curl (lying)", muscleGroup: "Legs" },
  { id: "pre00000046", name: "Leg curl (seated)", muscleGroup: "Legs" },
  { id: "pre00000047", name: "Walking lunge", muscleGroup: "Legs" },
  { id: "pre00000048", name: "Bulgarian split squat", muscleGroup: "Legs" },
  { id: "pre00000049", name: "Calf raise (standing)", muscleGroup: "Legs" },
  { id: "pre00000050", name: "Calf raise (seated)", muscleGroup: "Legs" },
  { id: "pre00000051", name: "Hip thrust", muscleGroup: "Glutes" },
  { id: "pre00000052", name: "Glute bridge", muscleGroup: "Glutes" },
  { id: "pre00000053", name: "Cable kickback", muscleGroup: "Glutes" },
  {
    id: "pre00000054",
    name: "Plank",
    muscleGroup: "Core",
    logKind: "time",
    defaultDurationSec: 60
  },
  { id: "pre00000055", name: "Hanging leg raise", muscleGroup: "Core" },
  { id: "pre00000056", name: "Cable crunch", muscleGroup: "Core" },
  { id: "pre00000057", name: "Ab wheel rollout", muscleGroup: "Core" },
  { id: "pre00000058", name: "Russian twist", muscleGroup: "Core" },
  {
    id: "pre00000059",
    name: "Rowing machine",
    muscleGroup: "Cardio",
    logKind: "time",
    defaultDurationSec: 120
  },
  {
    id: "pre00000060",
    name: "Assault bike (AirBike)",
    muscleGroup: "Cardio",
    logKind: "time",
    defaultDurationSec: 60
  },
  {
    id: "pre00000061",
    name: "Treadmill run",
    muscleGroup: "Cardio",
    logKind: "time",
    defaultDurationSec: 600
  },
  {
    id: "pre00000062",
    name: "Jump rope",
    muscleGroup: "Cardio",
    logKind: "time",
    defaultDurationSec: 90
  },
  {
    id: "pre00000067",
    name: "Elliptical",
    muscleGroup: "Cardio",
    logKind: "time",
    defaultDurationSec: 300
  },
  {
    id: "pre00000068",
    name: "Stair climber (StepMill)",
    muscleGroup: "Cardio",
    logKind: "time",
    defaultDurationSec: 300
  },
  {
    id: "pre00000069",
    name: "Stationary bike",
    muscleGroup: "Cardio",
    logKind: "time",
    defaultDurationSec: 600
  },
  {
    id: "pre00000070",
    name: "Indoor cycling (spin)",
    muscleGroup: "Cardio",
    logKind: "time",
    defaultDurationSec: 2700
  },
  {
    id: "pre00000071",
    name: "Swimming",
    muscleGroup: "Cardio",
    logKind: "time",
    defaultDurationSec: 600
  },
  {
    id: "pre00000072",
    name: "SkiErg",
    muscleGroup: "Cardio",
    logKind: "time",
    defaultDurationSec: 90
  },
  {
    id: "pre00000073",
    name: "VersaClimber",
    muscleGroup: "Cardio",
    logKind: "time",
    defaultDurationSec: 180
  },
  {
    id: "pre00000074",
    name: "Treadmill walk",
    muscleGroup: "Cardio",
    logKind: "time",
    defaultDurationSec: 900
  },
  {
    id: "pre00000075",
    name: "Battle ropes",
    muscleGroup: "Cardio",
    logKind: "time",
    defaultDurationSec: 30
  },
  {
    id: "pre00000076",
    name: "Heavy bag",
    muscleGroup: "Cardio",
    logKind: "time",
    defaultDurationSec: 180
  },
  {
    id: "pre00000077",
    name: "Shadow boxing",
    muscleGroup: "Cardio",
    logKind: "time",
    defaultDurationSec: 120
  },
  {
    id: "pre00000078",
    name: "Jacob's ladder",
    muscleGroup: "Cardio",
    logKind: "time",
    defaultDurationSec: 120
  },
  {
    id: "pre00000079",
    name: "Arc trainer",
    muscleGroup: "Cardio",
    logKind: "time",
    defaultDurationSec: 300
  },
  { id: "pre00000063", name: "Farmer's carry", muscleGroup: "Full body" },
  { id: "pre00000064", name: "Kettlebell swing", muscleGroup: "Full body" },
  { id: "pre00000065", name: "Clean and jerk", muscleGroup: "Full body" },
  { id: "pre00000066", name: "Snatch", muscleGroup: "Full body" }
];
function exerciseLoggedAllTargetSlots(targetSets, setsForExercise) {
  if (setsForExercise.length < targetSets) return false;
  const seen = /* @__PURE__ */ new Set();
  for (const s of setsForExercise) {
    if (s.setIndex >= 1 && s.setIndex <= targetSets) seen.add(s.setIndex);
  }
  for (let i = 1; i <= targetSets; i++) {
    if (!seen.has(i)) return false;
  }
  return true;
}
function exerciseMeetsRepAndDurationTargets(item, pref, setsForExercise) {
  const lk = item.exercise.logKind ?? "reps";
  const timeMode = lk === "time";
  const distanceMode = lk === "distance";
  const byIdx = new Map(setsForExercise.map((s) => [s.setIndex, s]));
  for (let i = 1; i <= item.targetSets; i++) {
    const row = byIdx.get(i);
    if (!row) return false;
    if (timeMode) {
      const need = effectiveTargetDurationSecForSession(pref, item);
      if (row.durationSec == null || !Number.isFinite(row.durationSec) || row.durationSec < need) {
        return false;
      }
    } else if (distanceMode) {
      if (item.logTimeForDistanceSets) {
        const need = effectiveTargetDurationSecForSession(pref, item);
        if (row.durationSec == null || !Number.isFinite(row.durationSec) || row.durationSec < need) {
          return false;
        }
      } else {
        const need = effectiveTargetDistanceForSession(pref, item);
        if (row.distance == null || !Number.isFinite(row.distance) || row.distance < need) {
          return false;
        }
      }
    } else {
      const need = Math.max(1, item.targetReps ?? 5);
      if (row.reps == null || !Number.isFinite(row.reps) || row.reps < need) {
        return false;
      }
    }
  }
  return true;
}
function shouldBumpProgressiveOverload(args) {
  if (!args.enabled) return false;
  const inc = args.increment;
  if (inc == null || !Number.isFinite(inc) || inc <= 0) return false;
  if (!exerciseLoggedAllTargetSlots(
    args.item.targetSets,
    args.setsForExercise
  )) {
    return false;
  }
  if (args.requireFullCompletion) {
    return exerciseMeetsRepAndDurationTargets(
      args.item,
      args.pref,
      args.setsForExercise
    );
  }
  return true;
}
function bumpedDefaultWeight(current, increment) {
  return roundWorkingWeight((current ?? 0) + increment);
}
function bumpedTargetDurationSec(current, increment) {
  const base = Math.max(1, Math.round(Number(current ?? 60)));
  const inc = Number(increment);
  if (!Number.isFinite(inc)) return base;
  return Math.max(1, Math.round(base + inc));
}
function parseWeightUnit(raw) {
  if (raw === "kg") return "kg";
  return "lb";
}
function resolveTemplateItemWeightUnit(item) {
  return parseWeightUnit(item.weightUnit ?? item.exercise.weightUnit);
}
function sessionWeightStep(unit) {
  return unit === "kg" ? 1 : 2.5;
}
function formatLoadNumber(n) {
  const r = Math.round(Math.max(0, n) * 2) / 2;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}
async function listTemplates(userId) {
  return db.query.workoutTemplates.findMany({
    where: eq(workoutTemplates.userId, userId),
    orderBy: [desc(workoutTemplates.createdAt)],
    with: {
      items: {
        orderBy: [asc(workoutTemplateItems.order)],
        with: { exercise: true }
      }
    }
  });
}
const templateWithItemsQuery = {
  items: {
    orderBy: [asc(workoutTemplateItems.order)],
    with: { exercise: true }
  }
};
async function listWorkoutRoutinesLibrary(userId) {
  const groups = await db.query.workoutRoutineGroups.findMany({
    where: eq(workoutRoutineGroups.userId, userId),
    orderBy: [asc(workoutRoutineGroups.sortOrder), asc(workoutRoutineGroups.createdAt)],
    with: {
      templates: {
        orderBy: [
          asc(workoutTemplates.routineOrder),
          asc(workoutTemplates.createdAt)
        ],
        with: templateWithItemsQuery
      }
    }
  });
  const ungrouped = await db.query.workoutTemplates.findMany({
    where: and(
      eq(workoutTemplates.userId, userId),
      isNull(workoutTemplates.routineGroupId)
    ),
    orderBy: [asc(workoutTemplates.createdAt)],
    with: templateWithItemsQuery
  });
  return { groups, ungrouped };
}
async function createRoutineGroup(userId, input) {
  const name = input.name.trim();
  if (!name) throw new Error("Name required");
  const [maxRow] = await db.select({ sortOrder: workoutRoutineGroups.sortOrder }).from(workoutRoutineGroups).where(eq(workoutRoutineGroups.userId, userId)).orderBy(desc(workoutRoutineGroups.sortOrder)).limit(1);
  const nextSort = (maxRow?.sortOrder ?? -1) + 1;
  const [row] = await db.insert(workoutRoutineGroups).values({
    userId,
    name,
    sortOrder: nextSort
  }).returning();
  return row;
}
async function renameRoutineGroup(userId, routineGroupId, name) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Name required");
  const [row] = await db.update(workoutRoutineGroups).set({ name: trimmed }).where(
    and(
      eq(workoutRoutineGroups.id, routineGroupId),
      eq(workoutRoutineGroups.userId, userId)
    )
  ).returning();
  if (!row) throw new Error("Routine not found");
  return row;
}
async function deleteRoutineGroup(userId, routineGroupId) {
  await db.delete(workoutRoutineGroups).where(
    and(
      eq(workoutRoutineGroups.id, routineGroupId),
      eq(workoutRoutineGroups.userId, userId)
    )
  );
}
async function setTemplateRoutineGroup(userId, templateId, routineGroupId) {
  const t = await getTemplate(userId, templateId);
  if (!t) throw new Error("Template not found");
  if (routineGroupId === null) {
    await db.update(workoutTemplates).set({ routineGroupId: null, routineOrder: null }).where(
      and(eq(workoutTemplates.id, templateId), eq(workoutTemplates.userId, userId))
    );
    return;
  }
  const g = await db.query.workoutRoutineGroups.findFirst({
    where: and(
      eq(workoutRoutineGroups.id, routineGroupId),
      eq(workoutRoutineGroups.userId, userId)
    )
  });
  if (!g) throw new Error("Routine not found");
  const siblings = await db.query.workoutTemplates.findMany({
    where: and(
      eq(workoutTemplates.userId, userId),
      eq(workoutTemplates.routineGroupId, routineGroupId),
      ne(workoutTemplates.id, templateId)
    )
  });
  const maxOrder = siblings.reduce(
    (m, x) => Math.max(m, x.routineOrder ?? 0),
    -1
  );
  await db.update(workoutTemplates).set({
    routineGroupId,
    routineOrder: maxOrder + 1
  }).where(
    and(eq(workoutTemplates.id, templateId), eq(workoutTemplates.userId, userId))
  );
}
async function getTemplate(userId, templateId) {
  const t = await db.query.workoutTemplates.findFirst({
    where: and(
      eq(workoutTemplates.id, templateId),
      eq(workoutTemplates.userId, userId)
    ),
    with: {
      items: {
        orderBy: [asc(workoutTemplateItems.order)],
        with: { exercise: true }
      }
    }
  });
  return t ?? null;
}
async function createExercise(userId, input) {
  const logKind = parseExerciseLogKind(input.logKind);
  const trackWeight = logKind === "reps" ? true : input.trackWeight !== void 0 ? Boolean(input.trackWeight) : false;
  const defaultDurationSec = logKind === "time" ? Math.max(1, Math.round(input.defaultDurationSec ?? 60)) : null;
  const dUnit = parseDistanceUnit(
    input.distanceUnit === void 0 || input.distanceUnit === null ? "km" : String(input.distanceUnit)
  );
  const defaultDistance = logKind === "distance" ? roundDistance(
    Math.max(
      minPositiveDistance(dUnit),
      Number(input.defaultDistance ?? (dUnit === "m" ? 400 : 1))
    ),
    dUnit
  ) : null;
  const weightUnit = parseWeightUnit(
    input.weightUnit === void 0 || input.weightUnit === null ? "lb" : String(input.weightUnit)
  );
  const [row] = await db.insert(exercises).values({
    userId,
    name: input.name.trim(),
    muscleGroup: input.muscleGroup?.trim() || null,
    logKind,
    defaultDurationSec,
    defaultDistance,
    distanceUnit: logKind === "distance" ? dUnit : "km",
    weightUnit,
    trackWeight,
    isCustom: true
  }).returning();
  return row;
}
function normalizeRestBetweenSetsSec(v) {
  if (v == null || !Number.isFinite(v)) return null;
  const n = Math.round(Number(v));
  if (n <= 0) return null;
  return Math.min(n, 3600);
}
async function createTemplate(userId, input) {
  const [row] = await db.insert(workoutTemplates).values({
    userId,
    name: input.name.trim(),
    notes: input.notes?.trim() || null
  }).returning();
  return row;
}
async function updateWorkoutTemplate(userId, templateId, input) {
  const t = await getTemplate(userId, templateId);
  if (!t) throw new Error("Template not found");
  const set = {};
  if (input.name !== void 0) {
    const n = input.name.trim();
    if (!n) throw new Error("Name required");
    set.name = n;
  }
  if (input.notes !== void 0) {
    set.notes = input.notes === null || String(input.notes).trim() === "" ? null : String(input.notes).trim();
  }
  if (Object.keys(set).length === 0) return t;
  await db.update(workoutTemplates).set(set).where(
    and(
      eq(workoutTemplates.id, templateId),
      eq(workoutTemplates.userId, userId)
    )
  );
  const next = await getTemplate(userId, templateId);
  if (!next) throw new Error("Template not found");
  return next;
}
async function addTemplateItem(userId, input) {
  const t = await getTemplate(userId, input.templateId);
  if (!t) throw new Error("Template not found");
  const ex = await db.query.exercises.findFirst({
    where: and(
      eq(exercises.id, input.exerciseId),
      or(eq(exercises.userId, userId), isNull(exercises.userId))
    )
  });
  if (!ex) throw new Error("Exercise not found");
  const lk = parseExerciseLogKind(ex.logKind);
  const isTime = lk === "time";
  const isDistance = lk === "distance";
  const logTimeFD = isDistance && Boolean(input.logTimeForDistanceSets);
  const dUnit = parseDistanceUnit(ex.distanceUnit);
  const targetReps = isTime || isDistance ? null : Math.max(1, Math.round(input.targetReps ?? 5));
  const targetDurationSec = isTime ? Math.max(
    1,
    Math.round(
      input.targetDurationSec ?? ex.defaultDurationSec ?? 60
    )
  ) : isDistance && logTimeFD ? Math.max(
    1,
    Math.round(
      input.targetDurationSec ?? ex.defaultDurationSec ?? 60
    )
  ) : null;
  const targetDistance = isDistance && !logTimeFD ? roundDistance(
    Math.max(
      minPositiveDistance(dUnit),
      Number(
        input.targetDistance ?? ex.defaultDistance ?? (dUnit === "m" ? 400 : 1)
      )
    ),
    dUnit
  ) : null;
  const itemWeightUnit = input.weightUnit === void 0 ? null : input.weightUnit === null || String(input.weightUnit).trim() === "" ? null : parseWeightUnit(String(input.weightUnit));
  const lineTrackWeight = input.trackWeight !== void 0 ? Boolean(input.trackWeight) : ex.trackWeight;
  const [row] = await db.insert(workoutTemplateItems).values({
    userId,
    templateId: input.templateId,
    exerciseId: input.exerciseId,
    order: input.order,
    targetSets: input.targetSets ?? 3,
    targetReps,
    targetDurationSec,
    targetDistance,
    defaultWeight: input.defaultWeight ?? null,
    weightUnit: itemWeightUnit,
    trackWeight: lineTrackWeight,
    progressiveOverloadEnabled: input.progressiveOverloadEnabled ?? false,
    progressiveOverloadIncrement: input.progressiveOverloadIncrement === void 0 ? null : input.progressiveOverloadIncrement === null || !Number.isFinite(input.progressiveOverloadIncrement) ? null : Number(input.progressiveOverloadIncrement),
    progressiveOverloadRequireFullCompletion: input.progressiveOverloadRequireFullCompletion ?? false,
    logTimeForDistanceSets: logTimeFD,
    isWarmup: input.isWarmup ?? false,
    restBetweenSetsSec: normalizeRestBetweenSetsSec(
      input.restBetweenSetsSec
    )
  }).returning();
  return row;
}
async function appendTemplateItem(userId, input) {
  const t = await getTemplate(userId, input.templateId);
  if (!t) throw new Error("Template not found");
  const nextOrder = t.items.reduce((m, i) => Math.max(m, i.order), -1) + 1;
  return addTemplateItem(userId, {
    templateId: input.templateId,
    exerciseId: input.exerciseId,
    order: nextOrder,
    targetSets: input.targetSets,
    targetReps: input.targetReps,
    targetDurationSec: input.targetDurationSec,
    targetDistance: input.targetDistance,
    defaultWeight: input.defaultWeight,
    weightUnit: input.weightUnit,
    progressiveOverloadEnabled: input.progressiveOverloadEnabled,
    progressiveOverloadIncrement: input.progressiveOverloadIncrement,
    progressiveOverloadRequireFullCompletion: input.progressiveOverloadRequireFullCompletion,
    trackWeight: input.trackWeight,
    logTimeForDistanceSets: input.logTimeForDistanceSets,
    isWarmup: input.isWarmup,
    restBetweenSetsSec: input.restBetweenSetsSec
  });
}
async function appendTemplateItemsBulk(userId, templateId, items) {
  const tid = templateId.trim();
  const out = [];
  for (const i of items) {
    const row = await appendTemplateItem(userId, {
      templateId: tid,
      exerciseId: i.exerciseId.trim(),
      targetSets: i.targetSets,
      targetReps: i.targetReps,
      targetDurationSec: i.targetDurationSec,
      targetDistance: i.targetDistance,
      defaultWeight: i.defaultWeight,
      weightUnit: i.weightUnit,
      progressiveOverloadEnabled: i.progressiveOverloadEnabled,
      progressiveOverloadIncrement: i.progressiveOverloadIncrement,
      progressiveOverloadRequireFullCompletion: i.progressiveOverloadRequireFullCompletion,
      trackWeight: i.trackWeight,
      logTimeForDistanceSets: i.logTimeForDistanceSets,
      isWarmup: i.isWarmup,
      restBetweenSetsSec: i.restBetweenSetsSec
    });
    out.push(row);
  }
  return out;
}
async function getActiveSession(userId) {
  return db.query.workoutSessions.findFirst({
    where: and(
      eq(workoutSessions.userId, userId),
      eq(workoutSessions.status, "active")
    ),
    orderBy: [desc(workoutSessions.startedAt)],
    with: {
      template: {
        with: {
          items: {
            orderBy: [asc(workoutTemplateItems.order)],
            with: { exercise: true }
          }
        }
      },
      sets: true,
      exercisePrefs: true
    }
  });
}
async function startWorkoutFromTemplate(userId, templateId) {
  const existing = await getActiveSession(userId);
  if (existing) {
    return { kind: "existing", session: existing };
  }
  const t = await getTemplate(userId, templateId);
  if (!t) throw new Error("Template not found");
  const now2 = /* @__PURE__ */ new Date();
  const [session] = await db.insert(workoutSessions).values({
    userId,
    templateId,
    startedAt: now2,
    status: "active"
  }).returning();
  return { kind: "new", session };
}
async function getSession$1(userId, sessionId) {
  const s = await db.query.workoutSessions.findFirst({
    where: and(
      eq(workoutSessions.id, sessionId),
      eq(workoutSessions.userId, userId)
    ),
    with: {
      template: {
        with: {
          items: {
            orderBy: [asc(workoutTemplateItems.order)],
            with: { exercise: true }
          }
        }
      },
      sets: true,
      exercisePrefs: true
    }
  });
  return s ?? null;
}
function templateItemForExercise(s, exerciseId) {
  const item = s.template?.items.find((i) => i.exercise.id === exerciseId);
  if (!item) throw new Error("Exercise not in session");
  return item;
}
function sessionPrefForExercise(s, exerciseId) {
  return s.exercisePrefs?.find((p) => p.exerciseId === exerciseId) ?? null;
}
function targetDurationSecForActiveSet(s, exerciseId, item) {
  return effectiveTargetDurationSecForSession(
    sessionPrefForExercise(s, exerciseId),
    item
  );
}
function targetDistanceForActiveSet(s, exerciseId, item) {
  return effectiveTargetDistanceForSession(
    sessionPrefForExercise(s, exerciseId),
    item
  );
}
function isTimeTemplateItem(item) {
  return (item.exercise.logKind ?? "reps") === "time";
}
function isDistanceTemplateItem(item) {
  return (item.exercise.logKind ?? "reps") === "distance";
}
async function upsertWorkoutSet(userId, input) {
  const s = await getSession$1(userId, input.sessionId);
  if (!s || s.status !== "active") throw new Error("Invalid session");
  const item = templateItemForExercise(s, input.exerciseId);
  const timeMode = isTimeTemplateItem(item);
  const distanceMode = isDistanceTemplateItem(item);
  const durationAsDistanceExercise = distanceMode && item.logTimeForDistanceSets;
  const dUnit = parseDistanceUnit(item.exercise.distanceUnit);
  const weight = Number(input.weight);
  const existing = await db.query.workoutSets.findFirst({
    where: and(
      eq(workoutSets.sessionId, input.sessionId),
      eq(workoutSets.exerciseId, input.exerciseId),
      eq(workoutSets.setIndex, input.setIndex)
    )
  });
  if (timeMode || durationAsDistanceExercise) {
    const d = input.durationSec != null && Number.isFinite(input.durationSec) ? Math.round(input.durationSec) : null;
    if (existing) {
      if (d !== null && d < 1) {
        const higher = await db.query.workoutSets.findFirst({
          where: and(
            eq(workoutSets.sessionId, input.sessionId),
            eq(workoutSets.exerciseId, input.exerciseId),
            gt(workoutSets.setIndex, input.setIndex)
          )
        });
        if (higher) {
          const resetD = targetDurationSecForActiveSet(
            s,
            input.exerciseId,
            item
          );
          await db.update(workoutSets).set({
            durationSec: resetD,
            reps: null,
            distance: null,
            weight: existing.weight,
            rpe: existing.rpe ?? null
          }).where(eq(workoutSets.id, existing.id));
          const updated = await db.query.workoutSets.findFirst({
            where: eq(workoutSets.id, existing.id)
          });
          return updated ?? null;
        }
        await db.delete(workoutSets).where(eq(workoutSets.id, existing.id));
        return null;
      }
      if (d !== null) {
        await db.update(workoutSets).set({
          durationSec: d,
          reps: null,
          distance: null,
          weight,
          rpe: input.rpe ?? existing.rpe ?? null
        }).where(eq(workoutSets.id, existing.id));
        const updated = await db.query.workoutSets.findFirst({
          where: eq(workoutSets.id, existing.id)
        });
        return updated ?? null;
      }
      return await db.query.workoutSets.findFirst({
        where: eq(workoutSets.id, existing.id)
      }) ?? null;
    }
    if (d === null || d < 1) throw new Error("Invalid duration");
    const [row2] = await db.insert(workoutSets).values({
      sessionId: input.sessionId,
      exerciseId: input.exerciseId,
      setIndex: input.setIndex,
      reps: null,
      durationSec: d,
      distance: null,
      weight,
      rpe: input.rpe ?? null
    }).returning();
    return row2;
  }
  if (distanceMode) {
    const minD = minPositiveDistance(dUnit);
    const dist = input.distance != null && Number.isFinite(input.distance) ? roundDistance(Number(input.distance), dUnit) : null;
    if (existing) {
      if (dist !== null && dist < minD) {
        const higher = await db.query.workoutSets.findFirst({
          where: and(
            eq(workoutSets.sessionId, input.sessionId),
            eq(workoutSets.exerciseId, input.exerciseId),
            gt(workoutSets.setIndex, input.setIndex)
          )
        });
        if (higher) {
          const resetDist = targetDistanceForActiveSet(
            s,
            input.exerciseId,
            item
          );
          await db.update(workoutSets).set({
            distance: resetDist,
            reps: null,
            durationSec: null,
            weight: existing.weight,
            rpe: existing.rpe ?? null
          }).where(eq(workoutSets.id, existing.id));
          const updated = await db.query.workoutSets.findFirst({
            where: eq(workoutSets.id, existing.id)
          });
          return updated ?? null;
        }
        await db.delete(workoutSets).where(eq(workoutSets.id, existing.id));
        return null;
      }
      if (dist !== null) {
        await db.update(workoutSets).set({
          distance: dist,
          reps: null,
          durationSec: null,
          weight,
          rpe: input.rpe ?? existing.rpe ?? null
        }).where(eq(workoutSets.id, existing.id));
        const updated = await db.query.workoutSets.findFirst({
          where: eq(workoutSets.id, existing.id)
        });
        return updated ?? null;
      }
      return await db.query.workoutSets.findFirst({
        where: eq(workoutSets.id, existing.id)
      }) ?? null;
    }
    if (dist === null || dist < minD) throw new Error("Invalid distance");
    const [row2] = await db.insert(workoutSets).values({
      sessionId: input.sessionId,
      exerciseId: input.exerciseId,
      setIndex: input.setIndex,
      reps: null,
      durationSec: null,
      distance: dist,
      weight,
      rpe: input.rpe ?? null
    }).returning();
    return row2;
  }
  const reps = input.reps != null && Number.isFinite(input.reps) ? Math.round(input.reps) : NaN;
  if (existing) {
    if (!Number.isFinite(reps)) throw new Error("Invalid reps");
    if (reps < 1) {
      const higher = await db.query.workoutSets.findFirst({
        where: and(
          eq(workoutSets.sessionId, input.sessionId),
          eq(workoutSets.exerciseId, input.exerciseId),
          gt(workoutSets.setIndex, input.setIndex)
        )
      });
      if (higher) {
        const resetReps = Math.max(1, item.targetReps ?? 5);
        await db.update(workoutSets).set({
          reps: resetReps,
          durationSec: null,
          distance: null,
          weight: existing.weight,
          rpe: existing.rpe ?? null
        }).where(eq(workoutSets.id, existing.id));
        const updated2 = await db.query.workoutSets.findFirst({
          where: eq(workoutSets.id, existing.id)
        });
        return updated2 ?? null;
      }
      await db.delete(workoutSets).where(eq(workoutSets.id, existing.id));
      return null;
    }
    await db.update(workoutSets).set({
      reps,
      durationSec: null,
      distance: null,
      weight,
      rpe: input.rpe ?? existing.rpe ?? null
    }).where(eq(workoutSets.id, existing.id));
    const updated = await db.query.workoutSets.findFirst({
      where: eq(workoutSets.id, existing.id)
    });
    return updated ?? null;
  }
  if (!Number.isFinite(reps) || reps < 1) throw new Error("Invalid reps");
  const [row] = await db.insert(workoutSets).values({
    sessionId: input.sessionId,
    exerciseId: input.exerciseId,
    setIndex: input.setIndex,
    reps,
    durationSec: null,
    distance: null,
    weight,
    rpe: input.rpe ?? null
  }).returning();
  return row;
}
async function applyProgressiveOverloadAfterCompletedSession(userId, s) {
  const templateId = s.templateId;
  if (!templateId || !s.template?.items.length) return;
  const tmpl = await getTemplate(userId, templateId);
  if (!tmpl) return;
  for (const sessionItem of s.template.items) {
    const live = tmpl.items.find((i) => i.id === sessionItem.id);
    if (!live?.progressiveOverloadEnabled) continue;
    if (live.isWarmup) continue;
    const inc = live.progressiveOverloadIncrement;
    if (inc == null || !Number.isFinite(inc) || inc <= 0) continue;
    const lk = parseExerciseLogKind(sessionItem.exercise.logKind);
    const weightPo = lk === "reps" && live.trackWeight;
    const durationPo = lk === "time" || lk === "distance" && sessionItem.logTimeForDistanceSets;
    const distancePo = lk === "distance" && !sessionItem.logTimeForDistanceSets;
    if (!weightPo && !durationPo && !distancePo) continue;
    const setsForExercise = s.sets.filter((x) => x.exerciseId === sessionItem.exercise.id).map((x) => ({
      setIndex: x.setIndex,
      reps: x.reps,
      durationSec: x.durationSec,
      distance: x.distance
    }));
    const pref = s.exercisePrefs?.find((p) => p.exerciseId === sessionItem.exercise.id) ?? null;
    const itemShape = {
      targetSets: sessionItem.targetSets,
      targetReps: sessionItem.targetReps,
      targetDurationSec: sessionItem.targetDurationSec,
      targetDistance: sessionItem.targetDistance,
      logTimeForDistanceSets: sessionItem.logTimeForDistanceSets,
      exercise: {
        logKind: sessionItem.exercise.logKind,
        defaultDurationSec: sessionItem.exercise.defaultDurationSec,
        defaultDistance: sessionItem.exercise.defaultDistance,
        distanceUnit: sessionItem.exercise.distanceUnit
      }
    };
    const ok2 = shouldBumpProgressiveOverload({
      enabled: live.progressiveOverloadEnabled,
      increment: inc,
      requireFullCompletion: live.progressiveOverloadRequireFullCompletion,
      item: itemShape,
      pref,
      setsForExercise
    });
    if (!ok2) continue;
    if (weightPo) {
      const next = bumpedDefaultWeight(live.defaultWeight, inc);
      await db.update(workoutTemplateItems).set({ defaultWeight: next }).where(
        and(
          eq(workoutTemplateItems.id, live.id),
          eq(workoutTemplateItems.templateId, templateId)
        )
      );
      continue;
    }
    if (durationPo) {
      const next = bumpedTargetDurationSec(
        live.targetDurationSec ?? sessionItem.exercise.defaultDurationSec,
        inc
      );
      await db.update(workoutTemplateItems).set({ targetDurationSec: next }).where(
        and(
          eq(workoutTemplateItems.id, live.id),
          eq(workoutTemplateItems.templateId, templateId)
        )
      );
      continue;
    }
    if (distancePo) {
      const u = parseDistanceUnit(sessionItem.exercise.distanceUnit);
      const base = live.targetDistance ?? sessionItem.exercise.defaultDistance ?? (u === "m" ? 400 : 1);
      const cur = roundDistance(
        Math.max(minPositiveDistance(u), Number(base)),
        u
      );
      const next = roundDistance(
        Math.max(minPositiveDistance(u), cur + inc),
        u
      );
      await db.update(workoutTemplateItems).set({ targetDistance: next }).where(
        and(
          eq(workoutTemplateItems.id, live.id),
          eq(workoutTemplateItems.templateId, templateId)
        )
      );
    }
  }
}
async function completeWorkout(userId, sessionId) {
  const s = await getSession$1(userId, sessionId);
  if (!s || s.status !== "active") throw new Error("Invalid session");
  await applyProgressiveOverloadAfterCompletedSession(userId, s);
  await db.update(workoutSessions).set({
    status: "completed",
    endedAt: /* @__PURE__ */ new Date()
  }).where(
    and(
      eq(workoutSessions.id, sessionId),
      eq(workoutSessions.userId, userId)
    )
  );
}
async function ensurePresetExercisesSeeded(database) {
  const client = db;
  if (PRESET_EXERCISES.length === 0) return;
  const rows = PRESET_EXERCISES.map((p) => {
    const logKind = p.logKind === "time" ? "time" : "reps";
    const defaultDurationSec = logKind === "time" ? Math.max(1, Math.round(p.defaultDurationSec ?? 60)) : null;
    return {
      id: p.id,
      userId: null,
      name: p.name,
      muscleGroup: p.muscleGroup,
      logKind,
      defaultDurationSec,
      defaultDistance: null,
      distanceUnit: "km",
      weightUnit: "lb",
      trackWeight: true,
      isCustom: false
    };
  });
  await client.insert(exercises).values(rows).onConflictDoNothing();
  for (const r of rows) {
    await client.update(exercises).set({
      name: r.name,
      muscleGroup: r.muscleGroup,
      logKind: r.logKind,
      defaultDurationSec: r.defaultDurationSec,
      defaultDistance: r.defaultDistance,
      distanceUnit: r.distanceUnit,
      weightUnit: "lb",
      trackWeight: true,
      isCustom: false,
      userId: null
    }).where(eq(exercises.id, r.id));
  }
}
async function listUserExercises(userId) {
  await ensurePresetExercisesSeeded();
  return db.query.exercises.findMany({
    where: or(eq(exercises.userId, userId), isNull(exercises.userId)),
    orderBy: [asc(exercises.name)]
  });
}
async function listScheduledInRange(userId, fromDayKey, toDayKey) {
  return db.query.workoutScheduledItems.findMany({
    where: and(
      eq(workoutScheduledItems.userId, userId),
      gte(workoutScheduledItems.dayKey, fromDayKey),
      lte(workoutScheduledItems.dayKey, toDayKey)
    ),
    orderBy: [
      asc(workoutScheduledItems.dayKey),
      asc(workoutScheduledItems.createdAt)
    ],
    with: { template: true }
  });
}
async function createScheduledWorkout(userId, input) {
  const dk = input.dayKey.trim();
  if (!parseDayKey(dk)) throw new Error("Invalid dayKey");
  const t = await getTemplate(userId, input.templateId.trim());
  if (!t) throw new Error("Template not found");
  const [row] = await db.insert(workoutScheduledItems).values({
    userId,
    templateId: t.id,
    dayKey: dk,
    notes: input.notes?.trim() || null
  }).returning();
  return row;
}
async function deleteScheduledWorkout(userId, scheduleId) {
  const row = await db.query.workoutScheduledItems.findFirst({
    where: and(
      eq(workoutScheduledItems.id, scheduleId),
      eq(workoutScheduledItems.userId, userId)
    )
  });
  if (!row) throw new Error("Scheduled workout not found");
  await db.delete(workoutScheduledItems).where(
    and(
      eq(workoutScheduledItems.id, scheduleId),
      eq(workoutScheduledItems.userId, userId)
    )
  );
}
async function listSessionsStartedInDayRange(userId, fromDayKey, toDayKey) {
  const bounds = localDayRangeBoundsMs(fromDayKey, toDayKey);
  if (!bounds) return [];
  const rows = await db.query.workoutSessions.findMany({
    where: and(
      eq(workoutSessions.userId, userId),
      gte(workoutSessions.startedAt, new Date(bounds.startMs)),
      lt(workoutSessions.startedAt, new Date(bounds.endExclusiveMs))
    ),
    orderBy: [desc(workoutSessions.startedAt)],
    with: { template: true }
  });
  return rows.map((s) => ({
    ...s,
    dayKey: formatDayKey(new Date(s.startedAt))
  }));
}
async function listRecurringRules(userId) {
  return db.query.workoutRecurringRules.findMany({
    where: eq(workoutRecurringRules.userId, userId),
    orderBy: [asc(workoutRecurringRules.startDayKey)],
    with: { template: true }
  });
}
async function createRecurringWorkoutRule(userId, input) {
  const start = input.startDayKey.trim();
  if (!parseDayKey(start)) throw new Error("Invalid startDayKey");
  const days = [...new Set(input.byDay.filter((d) => d >= 0 && d <= 6))].sort(
    (a, b) => a - b
  );
  if (days.length === 0) throw new Error("Select at least one weekday");
  const until = input.untilDayKey?.trim() || null;
  if (until && !parseDayKey(until)) throw new Error("Invalid untilDayKey");
  if (until && until < start) throw new Error("End date must be on or after start");
  const t = await getTemplate(userId, input.templateId.trim());
  if (!t) throw new Error("Template not found");
  const iw = Math.max(1, Math.round(input.intervalWeeks ?? 1));
  const [row] = await db.insert(workoutRecurringRules).values({
    userId,
    templateId: t.id,
    intervalWeeks: iw,
    byDay: JSON.stringify(days),
    startDayKey: start,
    untilDayKey: until,
    notes: input.notes?.trim() || null
  }).returning();
  return row;
}
async function deleteRecurringWorkoutRule(userId, ruleId) {
  const r = await db.query.workoutRecurringRules.findFirst({
    where: and(
      eq(workoutRecurringRules.id, ruleId),
      eq(workoutRecurringRules.userId, userId)
    )
  });
  if (!r) throw new Error("Rule not found");
  await db.delete(workoutRecurringRules).where(
    and(
      eq(workoutRecurringRules.id, ruleId),
      eq(workoutRecurringRules.userId, userId)
    )
  );
}
async function skipRecurringOccurrence(userId, ruleId, dayKey) {
  const dk = dayKey.trim();
  if (!parseDayKey(dk)) throw new Error("Invalid dayKey");
  const r = await db.query.workoutRecurringRules.findFirst({
    where: and(
      eq(workoutRecurringRules.id, ruleId),
      eq(workoutRecurringRules.userId, userId)
    )
  });
  if (!r) throw new Error("Rule not found");
  await db.insert(workoutRecurringSkips).values({ ruleId, dayKey: dk }).onConflictDoNothing();
}
async function expandRecurringPlanned(userId, fromKey, toKey) {
  const rules = await db.query.workoutRecurringRules.findMany({
    where: and(
      eq(workoutRecurringRules.userId, userId),
      lte(workoutRecurringRules.startDayKey, toKey),
      or(
        isNull(workoutRecurringRules.untilDayKey),
        gte(workoutRecurringRules.untilDayKey, fromKey)
      )
    ),
    with: { template: true }
  });
  if (rules.length === 0) return [];
  const ruleIds = rules.map((r) => r.id);
  const skips = await db.query.workoutRecurringSkips.findMany({
    where: inArray(workoutRecurringSkips.ruleId, ruleIds)
  });
  return expandRecurringPlannedFromRules(
    rules.map((r) => ({
      id: r.id,
      startDayKey: r.startDayKey,
      untilDayKey: r.untilDayKey,
      byDay: r.byDay,
      intervalWeeks: r.intervalWeeks,
      templateId: r.templateId,
      templateName: r.template.name,
      notes: r.notes
    })),
    skips.map((s) => ({ ruleId: s.ruleId, dayKey: s.dayKey })),
    fromKey,
    toKey
  );
}
async function listPlannedWorkoutsInRange(userId, fromKey, toKey) {
  const [onceRows, recurring] = await Promise.all([
    listScheduledInRange(userId, fromKey, toKey),
    expandRecurringPlanned(userId, fromKey, toKey)
  ]);
  const onceEntries = onceRows.map((s) => ({
    source: "once",
    scheduleId: s.id,
    dayKey: s.dayKey,
    templateId: s.templateId,
    templateName: s.template.name,
    notes: s.notes
  }));
  return mergePlannedOnceAndRecurring(onceEntries, recurring);
}
function stripRecipeMarkdownImagesAndLinks(text2) {
  let s = text2.replace(/\r\n/g, "\n");
  s = s.replace(/!\[[^\]]*\]\([^)]*\)/g, "");
  s = s.replace(/!\[[^\]]*\]\[[^\]]*\]/g, "");
  s = s.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
  s = s.replace(/\[([^\]]+)\]\[[^\]]*\]/g, "$1");
  s = s.replace(/<https?:\/\/[^>\s]+>/gi, "");
  s = s.replace(/<img\b[^>]*>/gi, "");
  s = s.replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, "$1");
  s = s.replace(/\n{3,}/g, "\n\n");
  return s.trim();
}
const FIRECRAWL_SCRAPE_URL = "https://api.firecrawl.dev/v2/scrape";
const MAX_MARKDOWN_CHARS = 12e4;
function normalizeRecipeImportUrl(raw) {
  const s = raw.trim();
  if (!s) return null;
  let u;
  try {
    u = new URL(s);
  } catch {
    return null;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  if (u.username || u.password) return null;
  return u.toString();
}
function normalizeMetadataTitle(raw) {
  if (typeof raw === "string") {
    const t = raw.trim();
    return t.length > 0 ? t : void 0;
  }
  if (Array.isArray(raw)) {
    for (const x of raw) {
      if (typeof x === "string") {
        const t = x.trim();
        if (t.length > 0) return t;
      }
    }
  }
  return void 0;
}
async function scrapeUrlToMarkdown(url2) {
  const normalized = normalizeRecipeImportUrl(url2);
  if (!normalized) {
    return { ok: false, error: "Invalid URL (http and https only)." };
  }
  const apiKey = process.env.FIRECRAWL_API_KEY?.trim();
  if (!apiKey) {
    return {
      ok: false,
      error: "Recipe import is not configured (missing FIRECRAWL_API_KEY on the server)."
    };
  }
  let res;
  try {
    res = await fetch(FIRECRAWL_SCRAPE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url: normalized,
        formats: ["markdown"],
        onlyMainContent: true
      })
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error";
    return { ok: false, error: `Firecrawl request failed: ${msg}` };
  }
  let body;
  try {
    body = await res.json();
  } catch {
    return {
      ok: false,
      error: "Firecrawl returned a non-JSON response.",
      status: res.status
    };
  }
  if (!res.ok) {
    const errMsg = typeof body === "object" && body !== null && "error" in body && typeof body.error === "string" ? body.error : `Firecrawl error (${res.status})`;
    return { ok: false, error: errMsg, status: res.status };
  }
  if (typeof body !== "object" || body === null || !("success" in body) || body.success !== true) {
    const errMsg = typeof body === "object" && body !== null && "error" in body && typeof body.error === "string" ? body.error : "Firecrawl scrape was not successful.";
    return { ok: false, error: errMsg, status: res.status };
  }
  const data = body.data;
  if (typeof data !== "object" || data === null) {
    return { ok: false, error: "Firecrawl response missing data." };
  }
  const md = "markdown" in data && typeof data.markdown === "string" ? data.markdown : "";
  if (!md.trim()) {
    return {
      ok: false,
      error: "No markdown content returned for this page."
    };
  }
  const meta = "metadata" in data ? data.metadata : void 0;
  const title = typeof meta === "object" && meta !== null && "title" in meta ? normalizeMetadataTitle(meta.title) : void 0;
  const truncated = md.length > MAX_MARKDOWN_CHARS;
  const markdown = truncated ? md.slice(0, MAX_MARKDOWN_CHARS) : md;
  return {
    ok: true,
    sourceUrl: normalized,
    markdown,
    title,
    truncated
  };
}
async function runTrainlogToolInline(name, userId, rawInput) {
  const input = parseTrainlogToolInput(name, rawInput);
  switch (name) {
    case "list_workout_templates":
      return listTemplates(userId);
    case "create_workout_template": {
      const { name: n, notes } = input;
      const row = await createTemplate(userId, {
        name: n.trim(),
        notes: notes?.trim()
      });
      return {
        id: row.id,
        name: row.name,
        notes: row.notes
      };
    }
    case "update_workout_template": {
      const { templateId, name: name2, notes } = input;
      const row = await updateWorkoutTemplate(
        userId,
        templateId.trim(),
        { name: name2, notes }
      );
      return {
        id: row.id,
        name: row.name,
        notes: row.notes
      };
    }
    case "list_exercises": {
      const list = await listUserExercises(userId);
      return list.map((e) => ({
        id: e.id,
        name: e.name,
        muscleGroup: e.muscleGroup,
        isPreset: e.userId == null,
        logKind: e.logKind ?? "reps",
        defaultDurationSec: e.defaultDurationSec,
        defaultDistance: e.defaultDistance,
        distanceUnit: e.distanceUnit ?? "km",
        weightUnit: e.weightUnit ?? "lb"
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
        weightUnit
      } = input;
      const lk = parseExerciseLogKind(logKindRaw);
      const row = await createExercise(userId, {
        name: exerciseName.trim(),
        muscleGroup: muscleGroup?.trim(),
        logKind: lk,
        defaultDurationSec: lk === "time" ? defaultDurationSec ?? 60 : null,
        defaultDistance: lk === "distance" ? defaultDistance : null,
        distanceUnit: lk === "distance" ? distanceUnit : void 0,
        weightUnit: weightUnit ?? "lb"
      });
      return {
        id: row.id,
        name: row.name,
        muscleGroup: row.muscleGroup,
        logKind: row.logKind,
        defaultDurationSec: row.defaultDurationSec,
        defaultDistance: row.defaultDistance,
        distanceUnit: row.distanceUnit ?? "km",
        weightUnit: row.weightUnit ?? "lb"
      };
    }
    case "add_exercise_to_template": {
      const i = input;
      const row = await appendTemplateItem(userId, {
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
        progressiveOverloadRequireFullCompletion: i.progressiveOverloadRequireFullCompletion,
        isWarmup: i.isWarmup,
        restBetweenSetsSec: i.restBetweenSetsSec
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
        progressiveOverloadRequireFullCompletion: row.progressiveOverloadRequireFullCompletion,
        isWarmup: row.isWarmup,
        restBetweenSetsSec: row.restBetweenSetsSec
      };
    }
    case "bulk_add_exercises_to_template": {
      const { templateId, exercises: exercises2 } = input;
      const rows = await appendTemplateItemsBulk(
        userId,
        templateId.trim(),
        exercises2.map((i) => ({
          exerciseId: i.exerciseId,
          targetSets: i.targetSets,
          targetReps: i.targetReps,
          targetDurationSec: i.targetDurationSec,
          targetDistance: i.targetDistance,
          defaultWeight: i.defaultWeight,
          weightUnit: i.weightUnit,
          progressiveOverloadEnabled: i.progressiveOverloadEnabled,
          progressiveOverloadIncrement: i.progressiveOverloadIncrement,
          progressiveOverloadRequireFullCompletion: i.progressiveOverloadRequireFullCompletion,
          isWarmup: i.isWarmup,
          restBetweenSetsSec: i.restBetweenSetsSec
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
          progressiveOverloadRequireFullCompletion: row.progressiveOverloadRequireFullCompletion,
          isWarmup: row.isWarmup,
          restBetweenSetsSec: row.restBetweenSetsSec
        }))
      };
    }
    case "list_workout_routines": {
      const lib = await listWorkoutRoutinesLibrary(userId);
      return {
        groups: lib.groups.map((g) => ({
          id: g.id,
          name: g.name,
          sortOrder: g.sortOrder,
          createdAt: g.createdAt.toISOString(),
          templates: g.templates.map((t) => ({
            id: t.id,
            name: t.name,
            routineOrder: t.routineOrder ?? null
          }))
        })),
        ungrouped: lib.ungrouped.map((t) => ({
          id: t.id,
          name: t.name
        }))
      };
    }
    case "create_workout_routine": {
      const { name: name2 } = input;
      const row = await createRoutineGroup(userId, {
        name: name2.trim()
      });
      return {
        id: row.id,
        name: row.name,
        sortOrder: row.sortOrder,
        createdAt: row.createdAt.toISOString()
      };
    }
    case "assign_workout_to_routine": {
      const { templateId, routineGroupId } = input;
      await setTemplateRoutineGroup(
        userId,
        templateId.trim(),
        routineGroupId
      );
      const t = await getTemplate(userId, templateId.trim());
      return {
        templateId: templateId.trim(),
        routineGroupId: t?.routineGroupId ?? null,
        routineOrder: t?.routineOrder ?? null
      };
    }
    case "rename_workout_routine": {
      const { routineGroupId, name: name2 } = input;
      const row = await renameRoutineGroup(
        userId,
        routineGroupId.trim(),
        name2.trim()
      );
      return {
        id: row.id,
        name: row.name,
        sortOrder: row.sortOrder
      };
    }
    case "delete_workout_routine": {
      const { routineGroupId } = input;
      await deleteRoutineGroup(userId, routineGroupId.trim());
      return { ok: true, routineGroupId: routineGroupId.trim() };
    }
    case "list_workout_schedule": {
      const inp = input;
      let from;
      let to;
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
        const range = monthDayKeyRange(formatMonthKey(/* @__PURE__ */ new Date()));
        from = range.first;
        to = range.last;
      }
      const [scheduled, sessions, planned, recurringRules] = await Promise.all([
        listScheduledInRange(userId, from, to),
        listSessionsStartedInDayRange(userId, from, to),
        listPlannedWorkoutsInRange(userId, from, to),
        listRecurringRules(userId)
      ]);
      return {
        from,
        to,
        planned,
        recurringRules: recurringRules.map((r) => {
          let byDay = [];
          try {
            byDay = JSON.parse(r.byDay);
          } catch {
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
            createdAt: r.createdAt
          };
        }),
        scheduled: scheduled.map((s) => ({
          id: s.id,
          dayKey: s.dayKey,
          notes: s.notes,
          templateId: s.templateId,
          templateName: s.template.name,
          createdAt: s.createdAt
        })),
        sessions: sessions.map((s) => ({
          id: s.id,
          dayKey: s.dayKey,
          status: s.status,
          startedAt: s.startedAt,
          endedAt: s.endedAt,
          templateId: s.templateId,
          templateName: s.template?.name ?? null
        }))
      };
    }
    case "schedule_workout_template": {
      const { templateId, dayKey, notes } = input;
      const row = await createScheduledWorkout(userId, {
        templateId: templateId.trim(),
        dayKey: dayKey.trim(),
        notes: notes?.trim()
      });
      return {
        id: row.id,
        dayKey: row.dayKey,
        notes: row.notes,
        templateId: row.templateId,
        createdAt: row.createdAt
      };
    }
    case "unschedule_workout": {
      const { scheduleId } = input;
      await deleteScheduledWorkout(userId, scheduleId.trim());
      return { ok: true, id: scheduleId.trim() };
    }
    case "create_recurring_workout_schedule": {
      const inp = input;
      const row = await createRecurringWorkoutRule(userId, {
        templateId: inp.templateId.trim(),
        byDay: inp.byDay,
        startDayKey: inp.startDayKey.trim(),
        untilDayKey: inp.untilDayKey?.trim(),
        intervalWeeks: inp.intervalWeeks,
        notes: inp.notes?.trim()
      });
      return {
        id: row.id,
        templateId: row.templateId,
        intervalWeeks: row.intervalWeeks,
        byDay: JSON.parse(row.byDay),
        startDayKey: row.startDayKey,
        untilDayKey: row.untilDayKey,
        notes: row.notes
      };
    }
    case "delete_recurring_workout_schedule": {
      const { ruleId } = input;
      await deleteRecurringWorkoutRule(userId, ruleId.trim());
      return { ok: true, ruleId: ruleId.trim() };
    }
    case "skip_recurring_workout_day": {
      const { ruleId, dayKey } = input;
      await skipRecurringOccurrence(
        userId,
        ruleId.trim(),
        dayKey.trim()
      );
      return {
        ok: true,
        ruleId: ruleId.trim(),
        dayKey: dayKey.trim()
      };
    }
    case "get_active_workout": {
      const session = await getActiveSession(userId);
      return session ?? { active: false };
    }
    case "start_workout": {
      const { templateId } = input;
      const result = await startWorkoutFromTemplate(
        userId,
        templateId.trim()
      );
      return {
        sessionId: result.session.id,
        resumed: result.kind === "existing"
      };
    }
    case "log_set": {
      const row = await upsertWorkoutSet(
        userId,
        input
      );
      return row ?? { deleted: true };
    }
    case "complete_workout": {
      const { sessionId } = input;
      await completeWorkout(userId, sessionId.trim());
      return { ok: true, sessionId: sessionId.trim() };
    }
    case "get_progress_exercise_weight": {
      const { exerciseId, from, to } = input;
      const { metric, points: series } = await getExerciseProgressByDay(
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
        series
      };
    }
    case "get_progress_macros": {
      const { from, to } = input;
      const series = await getMacroTotalsByDay(
        userId,
        from.trim(),
        to.trim()
      );
      return { from: from.trim(), to: to.trim(), series };
    }
    case "get_progress_weight_bmi": {
      const { from, to } = input;
      const data = await getWeightAndBmiSeries(
        userId,
        from.trim(),
        to.trim()
      );
      return { from: from.trim(), to: to.trim(), ...data };
    }
    case "get_progress_vitals_latest": {
      const m = await getLatestVitalMap(userId);
      const latest = {};
      for (const [k, v] of m) {
        if (k === "height_in") continue;
        latest[k] = { value: v.value, dayKey: v.dayKey };
      }
      return { latest };
    }
    case "get_progress_vitals_log": {
      const { from, to, keys } = input;
      const fromK = from.trim();
      const toK = to.trim();
      if (!parseDayKey(fromK) || !parseDayKey(toK)) {
        return { error: "from and to must be valid YYYY-MM-DD day keys" };
      }
      const keysArr = keys?.trim() ? keys.split(",").map((k) => k.trim()).filter(Boolean) : void 0;
      const rows = await listVitalEntriesInRange(
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
          recordedAt: r.recordedAt.toISOString()
        }))
      };
    }
    case "upsert_progress_vitals": {
      const { dayKey, entries } = input;
      const saved = [];
      for (const e of entries) {
        const row = await upsertVitalEntry(userId, {
          vitalKey: e.vitalKey,
          value: e.value,
          dayKey: dayKey?.trim()
        });
        saved.push({
          id: row.id,
          vitalKey: row.vitalKey,
          dayKey: row.dayKey,
          value: row.value,
          recordedAt: row.recordedAt.toISOString()
        });
      }
      return { saved };
    }
    case "get_user_profile": {
      return getProfileForUser(userId);
    }
    case "update_user_profile": {
      const p = input;
      return updateUserProfile(userId, p);
    }
    case "get_daily_nutrition": {
      const { date } = input;
      const raw = date?.trim();
      const dayKey = raw && parseDayKey(raw) ? raw : formatDayKey(/* @__PURE__ */ new Date());
      const [meals2, totals] = await Promise.all([
        listMealsForDay(userId, dayKey),
        getDailyTotals(userId, dayKey)
      ]);
      return {
        date: dayKey,
        totals,
        meals: meals2.map((m) => ({
          id: m.id,
          name: m.name,
          loggedAt: m.loggedAt,
          entries: m.entries.map((e) => ({
            id: e.id,
            description: e.description,
            calories: e.calories,
            proteinG: e.proteinG,
            carbsG: e.carbsG,
            fatG: e.fatG
          }))
        }))
      };
    }
    case "log_meal": {
      const { dayKey, name: mealName } = input;
      return createMeal(userId, {
        dayKey: dayKey.trim(),
        name: mealName.trim()
      });
    }
    case "log_meal_entry": {
      const inp = input;
      return addMealEntry(userId, {
        mealId: inp.mealId,
        description: inp.description,
        calories: inp.calories,
        proteinG: inp.proteinG ?? 0,
        carbsG: inp.carbsG ?? 0,
        fatG: inp.fatG ?? 0
      });
    }
    case "scrape_recipe_url": {
      const { url: url2 } = input;
      const result = await scrapeUrlToMarkdown(url2);
      if (!result.ok) {
        return {
          error: result.error,
          ...result.status !== void 0 ? { httpStatus: result.status } : {}
        };
      }
      return {
        sourceUrl: result.sourceUrl,
        markdown: stripRecipeMarkdownImagesAndLinks(result.markdown),
        pageTitle: result.title,
        truncated: result.truncated
      };
    }
    case "list_meal_library": {
      const { query } = input;
      const items = await listLibraryItems(userId, query?.trim());
      return { items: items.map((i) => jsonMealLibraryItem(i)) };
    }
    case "get_meal_library_item": {
      const { id } = input;
      const item = await getLibraryItem(userId, id.trim());
      if (!item) return { error: "not_found" };
      return { item: jsonMealLibraryItem(item) };
    }
    case "create_meal_library_item": {
      const inp = input;
      const row = await createLibraryItem(userId, {
        name: inp.name.trim(),
        instructions: inp.instructions?.trim() ?? "",
        calories: inp.calories ?? 0,
        proteinG: inp.proteinG ?? 0,
        carbsG: inp.carbsG ?? 0,
        fatG: inp.fatG ?? 0,
        ingredients: (inp.ingredients ?? []).map((line) => ({
          line: String(line)
        }))
      });
      if (!row) return { error: "failed" };
      return { item: jsonMealLibraryItem(row) };
    }
    case "update_meal_library_item": {
      const inp = input;
      const row = await updateLibraryItem(userId, inp.id.trim(), {
        name: inp.name.trim(),
        instructions: inp.instructions?.trim() ?? "",
        calories: inp.calories ?? 0,
        proteinG: inp.proteinG ?? 0,
        carbsG: inp.carbsG ?? 0,
        fatG: inp.fatG ?? 0,
        ingredients: (inp.ingredients ?? []).map((line) => ({
          line: String(line)
        }))
      });
      if (!row) return { error: "not_found" };
      return { item: jsonMealLibraryItem(row) };
    }
    case "delete_meal_library_item": {
      const { id } = input;
      const existing = await getLibraryItem(userId, id.trim());
      if (!existing) return { ok: false, error: "not_found" };
      await deleteLibraryItem(userId, id.trim());
      return { ok: true };
    }
    case "get_meal_plan": {
      const { weekStart } = input;
      const raw = weekStart?.trim();
      const week = raw && parseDayKey(raw) ? raw : mondayOfWeekContaining(formatDayKey());
      const plan = await getOrCreatePlanForWeek(userId, week);
      if (!plan) return { error: "failed" };
      return await jsonMealPlan(plan);
    }
    case "get_meal_plan_shopping_list": {
      const { weekStart } = input;
      const raw = weekStart?.trim();
      const week = raw && parseDayKey(raw) ? raw : mondayOfWeekContaining(formatDayKey());
      const plan = await getOrCreatePlanForWeek(userId, week);
      if (!plan) return { error: "failed" };
      const shoppingList = await generateShoppingListForMealPlan(plan);
      return {
        weekStartDayKey: plan.weekStartDayKey,
        shoppingList
      };
    }
    case "set_meal_plan_slot": {
      try {
        const inp = input;
        const plan = await setPlanSlot(userId, {
          weekStartDayKey: inp.weekStartDayKey.trim(),
          dayIndex: inp.dayIndex,
          slotIndex: inp.slotIndex,
          libraryItemId: inp.libraryItemId ?? null
        });
        if (!plan) return { error: "failed" };
        return await jsonMealPlan(plan);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Error";
        return { error: message };
      }
    }
    case "set_meal_plan_slots_batch": {
      try {
        const inp = input;
        const plan = await setPlanSlotsBatch(userId, {
          weekStartDayKey: inp.weekStartDayKey.trim(),
          assignments: inp.assignments.map((a) => ({
            dayIndex: a.dayIndex,
            ...a.slotIndex !== void 0 ? { slotIndex: a.slotIndex } : {},
            libraryItemId: a.libraryItemId ?? null
          }))
        });
        if (!plan) return { error: "failed" };
        return await jsonMealPlan(plan);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Error";
        return { error: message };
      }
    }
    default: {
      const _exhaustive = name;
      return _exhaustive;
    }
  }
}
function createSharedTrainlogTools(userId) {
  return TRAINLOG_TOOL_DEFINITIONS.reduce((acc, def) => {
    acc[def.name] = tool({
      description: def.description,
      inputSchema: def.inputSchema,
      providerOptions: {
        anthropic: { deferLoading: true }
      },
      execute: async (input) => runTrainlogToolInline(def.name, userId, input)
    });
    return acc;
  }, {});
}
function createOnboardingTools(userId, options) {
  const base = {
    tool_search_tool_bm25: anthropic.tools.toolSearchBm25_20251119(),
    ...createSharedTrainlogTools(userId)
  };
  if (options?.mealPlanRefinement) {
    return {
      ...base,
      suggest_quick_replies: suggestQuickRepliesTool,
      onboarding_meal_refinement_complete: onboardingMealRefinementCompleteTool
    };
  }
  return base;
}
const TOOL_STATES_OMITTED_FROM_MODEL$1 = /* @__PURE__ */ new Set([
  "input-streaming",
  "input-available",
  "approval-requested",
  "approval-responded"
]);
function dropUnusableOnboardingToolParts(messages) {
  return messages.map((m) => {
    if (m.role !== "assistant" || m.parts == null || m.parts.length === 0) {
      return m;
    }
    const parts = m.parts.filter((p) => {
      if (!isToolUIPart(p)) return true;
      return !TOOL_STATES_OMITTED_FROM_MODEL$1.has(p.state);
    });
    if (parts.length === m.parts.length) return m;
    if (parts.length > 0) {
      return { ...m, parts };
    }
    return null;
  }).filter((m) => m != null);
}
async function getOnboardingModelInput(userId, mode, weekStartDayKey, messages, options) {
  const tools = createOnboardingTools(userId, {
    mealPlanRefinement: options?.mealPlanRefinement
  });
  const sanitized = dropUnusableOnboardingToolParts(messages);
  const modelMessages = await convertToModelMessages(
    sanitized.map(({ id, ...rest }) => {
      return rest;
    }),
    {
      tools,
      ignoreIncompleteToolCalls: true
    }
  );
  const p = await getProfileForUser(userId);
  const system = [
    getCoachSystemDateLine(),
    "",
    buildOnboardingContextBlock(p, mode, weekStartDayKey),
    mode === "meal_plan" && options?.mealPlanRefinement ? buildMealPlanRefinementContextAddendum() : ""
  ].join("\n");
  const modelId = process.env["ANTHROPIC_MODEL"]?.trim() || "claude-haiku-4-5";
  return { system, modelMessages, modelId, tools };
}
function isCoachAiDebugEnabled() {
  const raw = process.env["COACH_AI_DEBUG"];
  if (raw == null || raw === "") return false;
  const v = String(raw).trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}
function isCoachAiDebugUiEnabled() {
  const raw = process.env["NEXT_PUBLIC_COACH_AI_DEBUG"];
  if (raw == null || raw === "") return false;
  const v = String(raw).trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}
const USER_SAFE_ERROR$1 = "Something went wrong.";
function debugErrorBody$1(detail) {
  if (!isCoachAiDebugEnabled()) return void 0;
  if (detail == null) return void 0;
  if (typeof detail === "string") return detail.trim() || void 0;
  if (detail instanceof Error) return detail.message.trim() || void 0;
  const s = String(detail).trim();
  return s || void 0;
}
function clientErrorResponse$1(status, detail) {
  const body = debugErrorBody$1(detail) ?? USER_SAFE_ERROR$1;
  const safe = body.length > 8e3 ? `${body.slice(0, 8e3)}…` : body;
  return new Response(safe, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
}
async function handlePost$6({ request }) {
  const claims = await authenticateBearer(request);
  if (!claims) return clientErrorResponse$1(401, "Not authenticated.");
  const userId = claims.userId;
  if (!process.env.ANTHROPIC_API_KEY) {
    return clientErrorResponse$1(
      503,
      "ANTHROPIC_API_KEY is not configured for onboarding."
    );
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return clientErrorResponse$1(400, "Request body is not valid JSON.");
  }
  const mode = body.mode;
  if (mode !== "meal_plan" && mode !== "workout") {
    return clientErrorResponse$1(400, "Body must include mode: meal_plan | workout.");
  }
  const weekStart = body.weekStartDayKey?.trim();
  if (!weekStart || !/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
    return clientErrorResponse$1(
      400,
      "Body must include weekStartDayKey (YYYY-MM-DD, Monday of the plan week)."
    );
  }
  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return clientErrorResponse$1(400, "Body must include a non-empty messages array.");
  }
  const mealPlanRefinement = Boolean(
    body.mealPlanRefinement
  );
  try {
    const { system, modelMessages, modelId, tools } = await getOnboardingModelInput(
      userId,
      mode,
      weekStart,
      messages,
      { mealPlanRefinement: mode === "meal_plan" ? mealPlanRefinement : false }
    );
    const result = streamText({
      model: anthropic(modelId),
      system,
      messages: modelMessages,
      tools,
      stopWhen: stepCountIs(32)
    });
    const coachDebug = isCoachAiDebugEnabled();
    return result.toUIMessageStreamResponse({
      messageMetadata: ({ part }) => {
        if (!coachDebug) return void 0;
        if (part.type === "finish") {
          const u = part.totalUsage;
          return {
            coachAiUsage: {
              inputTokens: u.inputTokens,
              outputTokens: u.outputTokens,
              totalTokens: u.totalTokens
            }
          };
        }
        if (part.type === "finish-step") {
          const u = part.usage;
          return {
            coachAiUsage: {
              inputTokens: u.inputTokens,
              outputTokens: u.outputTokens,
              totalTokens: u.totalTokens
            }
          };
        }
        return void 0;
      },
      onError: (error2) => {
        console.error("[onboarding/chat] stream error:", error2);
        return coachDebug ? debugErrorBody$1(error2) ?? "Unknown stream error." : USER_SAFE_ERROR$1;
      }
    });
  } catch (error2) {
    console.error("[onboarding/chat] request error:", error2);
    return clientErrorResponse$1(500, error2);
  }
}
const Route$b = createFileRoute("/api/onboarding/chat")({
  server: {
    handlers: {
      POST: handlePost$6
    }
  }
});
function buildRecipeReformatPrompt(pageTitle, markdown) {
  const titleLine = pageTitle && pageTitle.trim().length > 0 ? `Suggested title from the page: ${pageTitle.trim()}` : "The page had no clear title; infer a short name from the content.";
  return `You are normalizing recipe text scraped from a website into a clean structure for a meal-tracking app.

${titleLine}

Output a single JSON object and nothing else (no \`\`\` code fences). Keys and types:
- "name": string — concise recipe name.
- "ingredients": array of strings — one ingredient per entry, plain text (amounts in the string). No links or URLs.
- "instructions": string — how to make the recipe. Use markdown: headings optional, **bold** for key times or temperatures, numbered or bullet lists. No links, no image syntax.
- "calories", "proteinG", "carbsG", "fatG": numbers. Use 0 for anything not stated. Pick per-serving values if the page says "per serving"; otherwise use totals for the full recipe. Best reasonable estimate from the text; do not invent nutrition not implied by the page.

Scraped content:
---
${markdown}
---
`;
}
const LlmRecipeDraftZ = z$1.object({
  name: z$1.string(),
  ingredients: z$1.array(z$1.string()),
  instructions: z$1.string(),
  calories: z$1.coerce.number().min(0).max(5e5),
  proteinG: z$1.coerce.number().min(0).max(2e4),
  carbsG: z$1.coerce.number().min(0).max(2e4),
  fatG: z$1.coerce.number().min(0).max(2e4)
});
const MAX_MARKDOWN = 32e3;
function truncateMarkdown(markdown) {
  if (markdown.length <= MAX_MARKDOWN) return markdown;
  return markdown.slice(0, MAX_MARKDOWN) + "\n\n[… content truncated for processing …]";
}
function safeJsonParseObject(raw) {
  const trimmed = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  return JSON.parse(trimmed);
}
async function reformatScrapedRecipeWithLlm(input) {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const md = input.markdown.trim();
  if (!md) return null;
  const modelId = process.env.ANTHROPIC_QUICK_MODEL?.trim() || process.env.ANTHROPIC_MODEL?.trim() || "claude-haiku-4-5";
  const prompt = buildRecipeReformatPrompt(
    input.pageTitle,
    truncateMarkdown(md)
  );
  let text2;
  try {
    const res = await generateText({
      model: anthropic(modelId),
      prompt,
      maxOutputTokens: 8192
    });
    text2 = res.text;
  } catch (e) {
    console.warn(
      "[ai-reformat-recipe] generateText failed:",
      e instanceof Error ? e.message : e
    );
    return null;
  }
  let parsed;
  try {
    parsed = safeJsonParseObject(text2);
  } catch (e) {
    console.warn(
      "[ai-reformat-recipe] JSON parse failed:",
      e instanceof Error ? e.message : e
    );
    return null;
  }
  const v = LlmRecipeDraftZ.safeParse(parsed);
  if (!v.success) {
    console.warn("[ai-reformat-recipe] Zod validation failed:", v.error.flatten());
    return null;
  }
  const o = v.data;
  const name = stripRecipeMarkdownImagesAndLinks(o.name).trim() || "Imported recipe";
  const instructions = stripRecipeMarkdownImagesAndLinks(o.instructions).trim();
  const ingredients = o.ingredients.map((line) => stripRecipeMarkdownImagesAndLinks(String(line).trim())).filter((line) => line.length > 0);
  if (!instructions && ingredients.length === 0) {
    return null;
  }
  return {
    name,
    instructions: instructions || (ingredients.length > 0 ? "Follow ingredient prep as described on the page." : "Add cooking steps if you have them."),
    ingredients,
    calories: Number.isFinite(o.calories) ? Math.round(o.calories) : 0,
    proteinG: Number.isFinite(o.proteinG) ? o.proteinG : 0,
    carbsG: Number.isFinite(o.carbsG) ? o.carbsG : 0,
    fatG: Number.isFinite(o.fatG) ? o.fatG : 0
  };
}
function firstH1Title(markdown) {
  const m = markdown.match(/^#\s+(.+)$/m);
  if (!m?.[1]) return void 0;
  const t = m[1].trim();
  return t.length > 0 ? t : void 0;
}
function sectionBlocks(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let currentHeading = "";
  let currentBody = [];
  const flush = () => {
    const body = currentBody.join("\n").trim();
    if (currentHeading || body) {
      blocks.push({ heading: currentHeading, body });
    }
    currentBody = [];
  };
  for (const line of lines) {
    const hm = line.match(/^#{2,3}\s+(.+)$/);
    if (hm) {
      flush();
      currentHeading = hm[1]?.trim() ?? "";
    } else {
      currentBody.push(line);
    }
  }
  flush();
  return blocks;
}
function headingKind(h) {
  const n = h.toLowerCase();
  if (/\bingredients?\b/.test(n) || /\bwhat you need\b/.test(n) || /\bshopping\b/.test(n)) {
    return "ingredients";
  }
  if (/\binstructions?\b/.test(n) || /\bdirections?\b/.test(n) || /\bmethod\b/.test(n) || /\bsteps?\b/.test(n) || /\bhow to\b/.test(n) || /\bpreparation\b/.test(n)) {
    return "instructions";
  }
  return "other";
}
function linesToIngredientList(body) {
  const out = [];
  for (const line of body.split("\n")) {
    const t = line.replace(/^[\s>*-]*(?:\d+\.|[-*+])\s+/, "").replace(/^\[[ x]\]\s+/i, "").trim();
    if (t.length > 0) out.push(t);
  }
  return out;
}
function extractMacrosFromText(text2) {
  let calories = 0;
  let proteinG = 0;
  let carbsG = 0;
  let fatG = 0;
  const calM = text2.match(/\b(\d{1,5})\s*(?:kcal|calories?)\b/i) ?? text2.match(/\b(?:calories?|energy)\s*[:(]?\s*(\d{1,5})\b/i);
  if (calM?.[1]) calories = Math.round(Number(calM[1])) || 0;
  const p = text2.match(/\b(\d{1,4}(?:\.\d+)?)\s*g\s*(?:of\s+)?protein\b/i) ?? text2.match(/\bprotein\s*[:(]?\s*(\d{1,4}(?:\.\d+)?)\s*g\b/i);
  if (p?.[1]) proteinG = Number(p[1]) || 0;
  const c = text2.match(/\b(\d{1,4}(?:\.\d+)?)\s*g\s*(?:of\s+)?(?:carbs?|carbohydrate)s?\b/i) ?? text2.match(/\b(?:carbs?|carbohydrate)s?\s*[:(]?\s*(\d{1,4}(?:\.\d+)?)\s*g\b/i);
  if (c?.[1]) carbsG = Number(c[1]) || 0;
  const f = text2.match(/\b(\d{1,4}(?:\.\d+)?)\s*g\s*(?:of\s+)?fat\b/i) ?? text2.match(/\bfat\s*[:(]?\s*(\d{1,4}(?:\.\d+)?)\s*g\b/i);
  if (f?.[1]) fatG = Number(f[1]) || 0;
  return { calories, proteinG, carbsG, fatG };
}
function buildRecipeDraftFromMarkdown(markdown, titleHint) {
  const normalized = markdown.replace(/\r\n/g, "\n").trim();
  const macros = extractMacrosFromText(normalized);
  const forSections = normalized.replace(/^#\s+[^\n]+\n+/, "").trim();
  const blocks = sectionBlocks(forSections.length > 0 ? forSections : normalized);
  const ingBlocks = [];
  const instBlocks = [];
  for (const b of blocks) {
    const kind = headingKind(b.heading);
    if (kind === "ingredients" && b.body.trim()) {
      const lines = linesToIngredientList(b.body);
      if (lines.length > 0) ingBlocks.push(...lines);
    } else if (kind === "instructions" && b.body.trim()) {
      instBlocks.push(b.body.trim());
    }
  }
  const h1 = firstH1Title(normalized);
  let name = (titleHint?.trim() && titleHint.trim().length > 0 ? titleHint.trim() : void 0) ?? h1 ?? "Imported recipe";
  let instructions = instBlocks.join("\n\n").trim();
  let ingredients = ingBlocks;
  if (ingredients.length === 0 && instructions.length === 0) {
    instructions = normalized;
  } else if (ingredients.length === 0 && instructions.length > 0) ;
  else if (ingredients.length > 0 && instructions.length === 0) {
    const withoutIng = blocks.filter((b) => headingKind(b.heading) !== "ingredients").map((b) => b.body.trim()).filter(Boolean).join("\n\n");
    instructions = withoutIng || normalized;
  }
  return {
    name,
    instructions,
    ingredients,
    calories: macros.calories,
    proteinG: macros.proteinG,
    carbsG: macros.carbsG,
    fatG: macros.fatG
  };
}
const bodySchema$2 = z$1.object({
  url: z$1.string().min(1)
});
function json$1(data, init2) {
  return new Response(JSON.stringify(data), {
    ...init2,
    headers: {
      "Content-Type": "application/json",
      ...init2?.headers ?? {}
    }
  });
}
async function handlePost$5({ request }) {
  const claims = await authenticateBearer(request);
  if (!claims) return json$1({ error: "Unauthorized" }, { status: 401 });
  let raw;
  try {
    raw = await request.json();
  } catch {
    return json$1({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = bodySchema$2.safeParse(raw);
  if (!parsed.success) {
    return json$1({ error: "Expected { url: string }" }, { status: 400 });
  }
  const scraped = await scrapeUrlToMarkdown(parsed.data.url);
  if (!scraped.ok) {
    if (scraped.error.includes("Invalid URL")) {
      return json$1({ error: scraped.error }, { status: 400 });
    }
    const misconfigured = scraped.error.includes("FIRECRAWL_API_KEY") || scraped.error.includes("not configured");
    const status = misconfigured ? 503 : scraped.status === 402 || scraped.status === 429 ? scraped.status : 502;
    return json$1({ error: scraped.error }, { status });
  }
  const cleanedMarkdown = stripRecipeMarkdownImagesAndLinks(scraped.markdown);
  const llmDraft = await reformatScrapedRecipeWithLlm({
    pageTitle: scraped.title,
    markdown: cleanedMarkdown
  });
  const heurDraft = (() => {
    const draftRaw = buildRecipeDraftFromMarkdown(cleanedMarkdown, scraped.title);
    return {
      ...draftRaw,
      instructions: stripRecipeMarkdownImagesAndLinks(draftRaw.instructions),
      ingredients: draftRaw.ingredients.map(
        (line) => stripRecipeMarkdownImagesAndLinks(line)
      )
    };
  })();
  const draft = llmDraft ?? heurDraft;
  const draftSource = llmDraft != null ? "llm" : "heuristic";
  return json$1({
    sourceUrl: scraped.sourceUrl,
    pageTitle: scraped.title,
    truncated: scraped.truncated,
    markdown: cleanedMarkdown,
    draft,
    draftSource
  });
}
const Route$a = createFileRoute("/api/nutrition/import-recipe-url")({
  server: {
    handlers: {
      POST: handlePost$5
    }
  }
});
async function handleGet$2({ request }) {
  const claims = await authenticateBearer(request);
  if (!claims) {
    return new Response("Unauthorized", { status: 401 });
  }
  const rows = await db.select({
    id: coachConversations.id,
    title: coachConversations.title,
    updatedAt: coachConversations.updatedAt
  }).from(coachConversations).where(
    and(
      eq(coachConversations.userId, claims.userId),
      isNull(coachConversations.deletedAt)
    )
  ).orderBy(desc(coachConversations.updatedAt));
  return Response.json({ conversations: rows });
}
async function handlePost$4({ request }) {
  const claims = await authenticateBearer(request);
  if (!claims) {
    return new Response("Unauthorized", { status: 401 });
  }
  const id = crypto.randomUUID();
  await db.insert(coachConversations).values({
    id,
    userId: claims.userId,
    title: "New chat",
    messages: "[]"
  });
  const [row] = await db.select({
    id: coachConversations.id,
    title: coachConversations.title,
    updatedAt: coachConversations.updatedAt
  }).from(coachConversations).where(
    and(
      eq(coachConversations.id, id),
      eq(coachConversations.userId, claims.userId)
    )
  ).limit(1);
  if (!row) {
    return Response.json(
      { error: "Could not create conversation" },
      { status: 500 }
    );
  }
  return Response.json({ conversation: row });
}
const Route$9 = createFileRoute("/api/coach/conversations")({
  server: {
    handlers: {
      GET: handleGet$2,
      POST: handlePost$4
    }
  }
});
function buildConversationTitlePrompt(transcript2) {
  return `Here is a fitness coaching chat between a user and an assistant:

${transcript2}

Write a short conversation title (max 8 words) that captures the main topic. No quotes, no trailing punctuation, no "Chat about".

Return ONLY valid JSON: {"title":"..."}`;
}
function transcript(messages, maxChars = 12e3) {
  const lines = messages.map((m) => `${m.role}: ${m.text}`);
  let s = lines.join("\n\n");
  if (s.length > maxChars) s = s.slice(-maxChars);
  return s;
}
function clampTitle(s) {
  const t = s.replace(/\s+/g, " ").trim().slice(0, 72);
  return t || "Chat";
}
async function handlePost$3({ request }) {
  const claims = await authenticateBearer(request);
  if (!claims) {
    return new Response("Unauthorized", { status: 401 });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "messages required" }, { status: 400 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    const firstUser = messages.find(
      (m) => m.role === "user" && m.text?.trim()
    );
    return Response.json({
      title: clampTitle(firstUser?.text ?? "Chat")
    });
  }
  const modelId = process.env.ANTHROPIC_QUICK_MODEL?.trim() || process.env.ANTHROPIC_MODEL?.trim() || "claude-haiku-4-5";
  try {
    const { text: text2 } = await generateText({
      model: anthropic(modelId),
      prompt: buildConversationTitlePrompt(transcript(messages)),
      maxOutputTokens: 80
    });
    const trimmed = text2.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    const parsed = JSON.parse(trimmed);
    const raw = parsed.title;
    const title = typeof raw === "string" ? clampTitle(raw) : clampTitle(trimmed);
    return Response.json({ title });
  } catch {
    const firstUser = messages.find(
      (m) => m.role === "user" && m.text?.trim()
    );
    return Response.json({
      title: clampTitle(firstUser?.text ?? "Chat")
    });
  }
}
const Route$8 = createFileRoute("/api/coach/conversation-title")({
  server: {
    handlers: {
      POST: handlePost$3
    }
  }
});
function safeJsonClone(value) {
  try {
    return JSON.parse(
      JSON.stringify(
        value,
        (_k, v) => typeof v === "bigint" ? v.toString() : v
      )
    );
  } catch {
    return String(value);
  }
}
function serializeModelMessagesForDebug(messages) {
  return safeJsonClone(messages);
}
function summarizeCoachToolDeferFlags(tools) {
  const immediateToolNames = [];
  const deferredToolNames = [];
  for (const [name, t] of Object.entries(tools)) {
    const typed = t;
    if (typed.type === "provider") {
      immediateToolNames.push(name);
      continue;
    }
    if (typed.providerOptions?.anthropic?.deferLoading === true) {
      deferredToolNames.push(name);
    } else {
      immediateToolNames.push(name);
    }
  }
  immediateToolNames.sort((a, b) => a.localeCompare(b));
  deferredToolNames.sort((a, b) => a.localeCompare(b));
  return { immediateToolNames, deferredToolNames };
}
async function serializeToolSetForDebug(tools) {
  const out = [];
  for (const [name, t] of Object.entries(tools)) {
    const schema2 = asSchema(t.inputSchema);
    const inputJsonSchema = await Promise.resolve(schema2.jsonSchema);
    out.push({
      name,
      title: t.title,
      description: t.description,
      inputJsonSchema
    });
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}
function coachContextCharStats(options) {
  const { system, modelMessages, toolDefinitions, tools } = options;
  const { immediateToolNames, deferredToolNames } = summarizeCoachToolDeferFlags(tools);
  const immediateSet = new Set(immediateToolNames);
  const deferredSet = new Set(deferredToolNames);
  const prefixDefs = toolDefinitions.filter((d) => immediateSet.has(d.name));
  const deferredDefs = toolDefinitions.filter((d) => deferredSet.has(d.name));
  const modelMessagesChars = JSON.stringify(modelMessages).length;
  const toolsChars = JSON.stringify(toolDefinitions).length;
  const prefixToolsChars = JSON.stringify(prefixDefs).length;
  const deferredCatalogChars = JSON.stringify(deferredDefs).length;
  const systemChars = system.length;
  const totalChars = systemChars + modelMessagesChars + toolsChars;
  const prefixTotalChars = systemChars + modelMessagesChars + prefixToolsChars;
  return {
    systemChars,
    modelMessagesChars,
    toolsChars,
    totalChars,
    approxInputTokens: Math.ceil(totalChars / 4),
    prefixToolsChars,
    deferredCatalogChars,
    approxPrefixOnlyTokens: Math.ceil(prefixTotalChars / 4),
    immediateToolNames,
    deferredToolNames
  };
}
function createCoachTools(userId) {
  return {
    /**
     * Anthropic tool search (BM25). Must stay non-deferred. Surfaces deferred data tools by reference.
     */
    tool_search_tool_bm25: anthropic.tools.toolSearchBm25_20251119(),
    ...createSharedTrainlogTools(userId),
    /**
     * UI-only: suggestions stream as tool arguments. The client renders chips and hides the normal tool row.
     */
    suggest_quick_replies: suggestQuickRepliesTool
  };
}
const COACH_CACHED_SYSTEM_PROVIDER_OPTIONS = {
  anthropic: { cacheControl: { type: "ephemeral" } }
};
const TOOL_STATES_OMITTED_FROM_MODEL = /* @__PURE__ */ new Set([
  "input-streaming",
  "input-available",
  "approval-requested",
  "approval-responded"
]);
function dropUnusableCoachToolParts(messages) {
  return messages.map((m) => {
    if (m.role !== "assistant" || m.parts == null || m.parts.length === 0) {
      return m;
    }
    const parts = m.parts.filter((p) => {
      if (!isToolUIPart(p)) return true;
      return !TOOL_STATES_OMITTED_FROM_MODEL.has(p.state);
    });
    if (parts.length === m.parts.length) return m;
    if (parts.length > 0) {
      return { ...m, parts };
    }
    return null;
  }).filter((m) => m != null);
}
function flattenCoachSystemForDebug(system) {
  if (typeof system === "string") return system;
  const parts = Array.isArray(system) ? system : [system];
  return parts.map((m) => m.content).join("\n\n");
}
async function getCoachModelInput(userId, messages) {
  const tools = createCoachTools(userId);
  const sanitized = dropUnusableCoachToolParts(messages);
  const modelMessages = await convertToModelMessages(
    sanitized.map(({ id, ...rest }) => {
      return rest;
    }),
    {
      tools,
      ignoreIncompleteToolCalls: true
    }
  );
  const profileBundle = await getProfileForUser(userId);
  const system = [
    {
      role: "system",
      content: getCoachCachableSystemPrefix(),
      providerOptions: COACH_CACHED_SYSTEM_PROVIDER_OPTIONS
    },
    {
      role: "system",
      content: `${getCoachSystemDateLine()}

${formatProfileForCoachPrompt(profileBundle)}`
    }
  ];
  const systemForDebug = flattenCoachSystemForDebug(system);
  const modelId = process.env["ANTHROPIC_MODEL"]?.trim() || "claude-haiku-4-5";
  return { system, systemForDebug, modelMessages, modelId, tools };
}
async function handlePost$2({ request }) {
  const claims = await authenticateBearer(request);
  if (!claims) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isCoachAiDebugEnabled()) {
    return Response.json({ error: "Not available" }, { status: 404 });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const conversationId = body.conversationId?.trim();
  const messages = body.messages;
  if (!conversationId || !Array.isArray(messages)) {
    return Response.json(
      { error: "conversationId and messages required" },
      { status: 400 }
    );
  }
  const userId = claims.userId;
  const [conv] = await db.select({ id: coachConversations.id }).from(coachConversations).where(
    and(
      eq(coachConversations.id, conversationId),
      eq(coachConversations.userId, userId)
    )
  ).limit(1);
  if (!conv) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  try {
    const { systemForDebug, modelMessages, modelId, tools } = await getCoachModelInput(userId, messages);
    const serializedMessages = serializeModelMessagesForDebug(modelMessages);
    const toolDefinitions = await serializeToolSetForDebug(tools);
    const contextStats = coachContextCharStats({
      system: systemForDebug,
      modelMessages: serializedMessages,
      toolDefinitions,
      tools
    });
    return Response.json({
      system: systemForDebug,
      modelMessages: serializedMessages,
      toolDefinitions,
      contextStats,
      modelId
    });
  } catch (error2) {
    console.error("[coach/context-preview]", error2);
    return Response.json(
      { error: "Failed to build preview" },
      { status: 500 }
    );
  }
}
const Route$7 = createFileRoute("/api/coach/context-preview")({
  server: {
    handlers: {
      POST: handlePost$2
    }
  }
});
const USER_SAFE_ERROR = "Something went wrong.";
function debugErrorBody(detail) {
  if (!isCoachAiDebugEnabled()) return void 0;
  if (detail == null) return void 0;
  if (typeof detail === "string") return detail.trim() || void 0;
  if (detail instanceof Error) return detail.message.trim() || void 0;
  const s = String(detail).trim();
  return s || void 0;
}
function clientErrorResponse(status, detail) {
  const body = debugErrorBody(detail) ?? USER_SAFE_ERROR;
  const safe = body.length > 8e3 ? `${body.slice(0, 8e3)}…` : body;
  return new Response(safe, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
}
async function handlePost$1({ request }) {
  const claims = await authenticateBearer(request);
  if (!claims) return clientErrorResponse(401, "Not authenticated.");
  const userId = claims.userId;
  if (!process.env.ANTHROPIC_API_KEY) {
    return clientErrorResponse(
      503,
      "ANTHROPIC_API_KEY is not configured for coach chat."
    );
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return clientErrorResponse(400, "Request body is not valid JSON.");
  }
  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return clientErrorResponse(400, "Body must include a non-empty messages array.");
  }
  const conversationId = body.id?.trim();
  if (!conversationId) {
    return clientErrorResponse(400, "Missing or empty conversation id.");
  }
  const [conv] = await db.select({ id: coachConversations.id }).from(coachConversations).where(
    and(
      eq(coachConversations.id, conversationId),
      eq(coachConversations.userId, userId)
    )
  ).limit(1);
  if (!conv) return clientErrorResponse(404, "Conversation not found.");
  try {
    const { system, modelMessages, modelId, tools } = await getCoachModelInput(
      userId,
      messages
    );
    const result = streamText({
      model: anthropic(modelId),
      system,
      messages: modelMessages,
      tools,
      stopWhen: stepCountIs(24)
    });
    const coachDebug = isCoachAiDebugEnabled();
    return result.toUIMessageStreamResponse({
      messageMetadata: ({ part }) => {
        if (!coachDebug) return void 0;
        if (part.type === "finish") {
          const u = part.totalUsage;
          return {
            coachAiUsage: {
              inputTokens: u.inputTokens,
              outputTokens: u.outputTokens,
              totalTokens: u.totalTokens
            }
          };
        }
        if (part.type === "finish-step") {
          const u = part.usage;
          return {
            coachAiUsage: {
              inputTokens: u.inputTokens,
              outputTokens: u.outputTokens,
              totalTokens: u.totalTokens
            }
          };
        }
        return void 0;
      },
      onError: (error2) => {
        console.error("[coach/chat] stream error:", error2);
        return coachDebug ? debugErrorBody(error2) ?? "Unknown stream error." : USER_SAFE_ERROR;
      }
    });
  } catch (error2) {
    console.error("[coach/chat] request error:", error2);
    return clientErrorResponse(500, error2);
  }
}
const Route$6 = createFileRoute("/api/coach/chat")({
  server: {
    handlers: {
      POST: handlePost$1
    }
  }
});
const bodySchema$1 = z$1.object({
  refreshToken: z$1.string().min(16)
});
const Route$5 = createFileRoute("/api/auth/refresh")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => null);
        const parsed = bodySchema$1.safeParse(body);
        if (!parsed.success) {
          return new Response("Bad request", { status: 400 });
        }
        const bundle = await rotateRefreshToken(parsed.data.refreshToken);
        if (!bundle) {
          return new Response("Unauthorized", { status: 401 });
        }
        return Response.json(bundle);
      }
    }
  }
});
function escapeRegExpChar(char) {
  if (char === "-" || char === "^" || char === "$" || char === "+" || char === "." || char === "(" || char === ")" || char === "|" || char === "[" || char === "]" || char === "{" || char === "}" || char === "*" || char === "?" || char === "\\") return `\\${char}`;
  else return char;
}
function escapeRegExpString(str) {
  let result = "";
  for (let i = 0; i < str.length; i++) result += escapeRegExpChar(str[i]);
  return result;
}
function transform(pattern, separator = true) {
  if (Array.isArray(pattern)) return `(?:${pattern.map((p) => `^${transform(p, separator)}$`).join("|")})`;
  let separatorSplitter = "";
  let separatorMatcher = "";
  let wildcard = ".";
  if (separator === true) {
    separatorSplitter = "/";
    separatorMatcher = "[/\\\\]";
    wildcard = "[^/\\\\]";
  } else if (separator) {
    separatorSplitter = separator;
    separatorMatcher = escapeRegExpString(separatorSplitter);
    if (separatorMatcher.length > 1) {
      separatorMatcher = `(?:${separatorMatcher})`;
      wildcard = `((?!${separatorMatcher}).)`;
    } else wildcard = `[^${separatorMatcher}]`;
  }
  const requiredSeparator = separator ? `${separatorMatcher}+?` : "";
  const optionalSeparator = separator ? `${separatorMatcher}*?` : "";
  const segments = separator ? pattern.split(separatorSplitter) : [pattern];
  let result = "";
  for (let s = 0; s < segments.length; s++) {
    const segment = segments[s];
    const nextSegment = segments[s + 1];
    let currentSeparator = "";
    if (!segment && s > 0) continue;
    if (separator) if (s === segments.length - 1) currentSeparator = optionalSeparator;
    else if (nextSegment !== "**") currentSeparator = requiredSeparator;
    else currentSeparator = "";
    if (separator && segment === "**") {
      if (currentSeparator) {
        result += s === 0 ? "" : currentSeparator;
        result += `(?:${wildcard}*?${currentSeparator})*?`;
      }
      continue;
    }
    for (let c = 0; c < segment.length; c++) {
      const char = segment[c];
      if (char === "\\") {
        if (c < segment.length - 1) {
          result += escapeRegExpChar(segment[c + 1]);
          c++;
        }
      } else if (char === "?") result += wildcard;
      else if (char === "*") result += `${wildcard}*?`;
      else result += escapeRegExpChar(char);
    }
    result += currentSeparator;
  }
  return result;
}
function isMatch(regexp, sample) {
  if (typeof sample !== "string") throw new TypeError(`Sample must be a string, but ${typeof sample} given`);
  return regexp.test(sample);
}
function wildcardMatch(pattern, options) {
  if (typeof pattern !== "string" && !Array.isArray(pattern)) throw new TypeError(`The first argument must be a single pattern string or an array of patterns, but ${typeof pattern} given`);
  if (typeof options === "string" || typeof options === "boolean") options = { separator: options };
  if (arguments.length === 2 && !(typeof options === "undefined" || typeof options === "object" && options !== null && !Array.isArray(options))) throw new TypeError(`The second argument must be an options object or a string/boolean separator, but ${typeof options} given`);
  options = options || {};
  if (options.separator === "\\") throw new Error("\\ is not a valid separator because it is used for escaping. Try setting the separator to `true` instead");
  const regexpPattern = transform(pattern, options.separator);
  const regexp = new RegExp(`^${regexpPattern}$`, options.flags);
  const fn = isMatch.bind(null, regexp);
  fn.options = options;
  fn.pattern = pattern;
  fn.regexp = regexp;
  return fn;
}
function isLoopbackForDevScheme(host) {
  const hostname = host.replace(/:\d+$/, "").replace(/^\[|\]$/g, "").toLowerCase();
  return hostname === "localhost" || hostname.endsWith(".localhost") || hostname === "::1" || hostname.startsWith("127.");
}
function checkHasPath(url2) {
  try {
    return (new URL(url2).pathname.replace(/\/+$/, "") || "/") !== "/";
  } catch {
    throw new BetterAuthError(`Invalid base URL: ${url2}. Please provide a valid base URL.`);
  }
}
function assertHasProtocol(url2) {
  try {
    const parsedUrl = new URL(url2);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") throw new BetterAuthError(`Invalid base URL: ${url2}. URL must include 'http://' or 'https://'`);
  } catch (error2) {
    if (error2 instanceof BetterAuthError) throw error2;
    throw new BetterAuthError(`Invalid base URL: ${url2}. Please provide a valid base URL.`, { cause: error2 });
  }
}
function withPath(url2, path = "/api/auth") {
  assertHasProtocol(url2);
  if (checkHasPath(url2)) return url2;
  const trimmedUrl = url2.replace(/\/+$/, "");
  if (!path || path === "/") return trimmedUrl;
  path = path.startsWith("/") ? path : `/${path}`;
  return `${trimmedUrl}${path}`;
}
function validateProxyHeader(header, type) {
  if (!header || header.trim() === "") return false;
  if (type === "proto") return header === "http" || header === "https";
  if (type === "host") {
    if ([
      /\.\./,
      /\0/,
      /[\s]/,
      /^[.]/,
      /[<>'"]/,
      /javascript:/i,
      /file:/i,
      /data:/i
    ].some((pattern) => pattern.test(header))) return false;
    return /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*(:[0-9]{1,5})?$/.test(header) || /^(\d{1,3}\.){3}\d{1,3}(:[0-9]{1,5})?$/.test(header) || /^\[[0-9a-fA-F:]+\](:[0-9]{1,5})?$/.test(header) || /^localhost(:[0-9]{1,5})?$/i.test(header);
  }
  return false;
}
function getBaseURL(url2, path, request, loadEnv, trustedProxyHeaders) {
  if (url2) return withPath(url2, path);
  {
    const fromEnv = env.BETTER_AUTH_URL || env.NEXT_PUBLIC_BETTER_AUTH_URL || env.PUBLIC_BETTER_AUTH_URL || env.NUXT_PUBLIC_BETTER_AUTH_URL || env.NUXT_PUBLIC_AUTH_URL || (env.BASE_URL !== "/" ? env.BASE_URL : void 0);
    if (fromEnv) return withPath(fromEnv, path);
  }
  const fromRequest = request?.headers.get("x-forwarded-host");
  const fromRequestProto = request?.headers.get("x-forwarded-proto");
  if (fromRequest && fromRequestProto && trustedProxyHeaders) {
    if (validateProxyHeader(fromRequestProto, "proto") && validateProxyHeader(fromRequest, "host")) try {
      return withPath(`${fromRequestProto}://${fromRequest}`, path);
    } catch (_error) {
    }
  }
  if (request) {
    const url3 = getOrigin(request.url);
    if (!url3) throw new BetterAuthError("Could not get origin from request. Please provide a valid base URL.");
    return withPath(url3, path);
  }
  if (typeof window !== "undefined" && window.location) return withPath(window.location.origin, path);
}
function getOrigin(url2) {
  try {
    const parsedUrl = new URL(url2);
    return parsedUrl.origin === "null" ? null : parsedUrl.origin;
  } catch {
    return null;
  }
}
function getProtocol(url2) {
  try {
    return new URL(url2).protocol;
  } catch {
    return null;
  }
}
function getHost(url2) {
  try {
    return new URL(url2).host;
  } catch {
    return null;
  }
}
function isDynamicBaseURLConfig(config) {
  return typeof config === "object" && config !== null && "allowedHosts" in config && Array.isArray(config.allowedHosts);
}
function isRequestLike(value) {
  if (value instanceof Request) return true;
  if (typeof value !== "object" || value === null || Object.prototype.toString.call(value) !== "[object Request]") return false;
  const v = value;
  return typeof v.url === "string" && typeof v.headers === "object" && v.headers !== null && typeof v.headers.get === "function";
}
function getHostFromSource(source, trustedProxyHeaders) {
  const headers = isRequestLike(source) ? source.headers : source;
  if (trustedProxyHeaders) {
    const forwardedHost = headers.get("x-forwarded-host");
    if (forwardedHost && validateProxyHeader(forwardedHost, "host")) return forwardedHost;
  }
  const host = headers.get("host");
  if (host && validateProxyHeader(host, "host")) return host;
  if (isRequestLike(source)) try {
    return new URL(source.url).host;
  } catch {
    return null;
  }
  return null;
}
function getProtocolFromSource(source, configProtocol, trustedProxyHeaders) {
  if (configProtocol === "http" || configProtocol === "https") return configProtocol;
  const headers = isRequestLike(source) ? source.headers : source;
  if (trustedProxyHeaders) {
    const forwardedProto = headers.get("x-forwarded-proto");
    if (forwardedProto && validateProxyHeader(forwardedProto, "proto")) return forwardedProto;
  }
  if (isRequestLike(source)) try {
    const url2 = new URL(source.url);
    if (url2.protocol === "http:" || url2.protocol === "https:") return url2.protocol.slice(0, -1);
  } catch {
  }
  const host = getHostFromSource(source, trustedProxyHeaders);
  if (host && isLoopbackForDevScheme(host)) return "http";
  return "https";
}
const matchesHostPattern = (host, pattern) => {
  if (!host || !pattern) return false;
  const normalizedHost = host.replace(/^https?:\/\//, "").split("/")[0].toLowerCase();
  const normalizedPattern = pattern.replace(/^https?:\/\//, "").split("/")[0].toLowerCase();
  if (normalizedPattern.includes("*") || normalizedPattern.includes("?")) return wildcardMatch(normalizedPattern)(normalizedHost);
  return normalizedHost.toLowerCase() === normalizedPattern.toLowerCase();
};
function resolveDynamicBaseURL(config, source, basePath, trustedProxyHeaders) {
  const host = getHostFromSource(source, trustedProxyHeaders);
  if (!host) {
    if (config.fallback) return withPath(config.fallback, basePath);
    throw new BetterAuthError("Could not determine host from request headers. Please provide a fallback URL in your baseURL config.");
  }
  if (config.allowedHosts.some((pattern) => matchesHostPattern(host, pattern))) return withPath(`${getProtocolFromSource(source, config.protocol, trustedProxyHeaders)}://${host}`, basePath);
  if (config.fallback) return withPath(config.fallback, basePath);
  throw new BetterAuthError(`Host "${host}" is not in the allowed hosts list. Allowed hosts: ${config.allowedHosts.join(", ")}. Add this host to your allowedHosts config or provide a fallback URL.`);
}
function resolveBaseURL(config, basePath, source, loadEnv, trustedProxyHeaders) {
  if (isDynamicBaseURLConfig(config)) {
    if (source) return resolveDynamicBaseURL(config, source, basePath, trustedProxyHeaders);
    if (config.fallback) return withPath(config.fallback, basePath);
    return getBaseURL(void 0, basePath, void 0, loadEnv, trustedProxyHeaders);
  }
  const request = isRequestLike(source) ? source : void 0;
  if (typeof config === "string") return getBaseURL(config, basePath, request, loadEnv, trustedProxyHeaders);
  return getBaseURL(void 0, basePath, request, loadEnv, trustedProxyHeaders);
}
const generateRandomString = createRandomStringGenerator("a-z", "0-9", "A-Z", "-_");
async function signJWT(payload, secret, expiresIn = 3600) {
  return await new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(Math.floor(Date.now() / 1e3) + expiresIn).sign(new TextEncoder().encode(secret));
}
async function verifyJWT(token, secret) {
  try {
    return (await jwtVerify(token, new TextEncoder().encode(secret))).payload;
  } catch {
    return null;
  }
}
const info = new Uint8Array([
  66,
  101,
  116,
  116,
  101,
  114,
  65,
  117,
  116,
  104,
  46,
  106,
  115,
  32,
  71,
  101,
  110,
  101,
  114,
  97,
  116,
  101,
  100,
  32,
  69,
  110,
  99,
  114,
  121,
  112,
  116,
  105,
  111,
  110,
  32,
  75,
  101,
  121
]);
const now = () => Date.now() / 1e3 | 0;
const alg = "dir";
const enc = "A256CBC-HS512";
function deriveEncryptionSecret(secret, salt) {
  return hkdf(sha256, new TextEncoder().encode(secret), new TextEncoder().encode(salt), info, 64);
}
function getCurrentSecret(secret) {
  if (typeof secret === "string") return secret;
  const value = secret.keys.get(secret.currentVersion);
  if (!value) throw new Error(`Secret version ${secret.currentVersion} not found in keys`);
  return value;
}
function getAllSecrets(secret) {
  if (typeof secret === "string") return [{
    version: 0,
    value: secret
  }];
  const result = [];
  for (const [version, value] of secret.keys) result.push({
    version,
    value
  });
  if (secret.legacySecret && !result.some((s) => s.value === secret.legacySecret)) result.push({
    version: -1,
    value: secret.legacySecret
  });
  return result;
}
async function symmetricEncodeJWT(payload, secret, salt, expiresIn = 3600) {
  const encryptionSecret = deriveEncryptionSecret(getCurrentSecret(secret), salt);
  const thumbprint = await calculateJwkThumbprint({
    kty: "oct",
    k: base64url.encode(encryptionSecret)
  }, "sha256");
  return await new EncryptJWT(payload).setProtectedHeader({
    alg,
    enc,
    kid: thumbprint
  }).setIssuedAt().setExpirationTime(now() + expiresIn).setJti(crypto.randomUUID()).encrypt(encryptionSecret);
}
const jwtDecryptOpts = {
  clockTolerance: 15,
  keyManagementAlgorithms: [alg],
  contentEncryptionAlgorithms: [enc, "A256GCM"]
};
async function symmetricDecodeJWT(token, secret, salt) {
  if (!token) return null;
  let hasKid = false;
  try {
    hasKid = decodeProtectedHeader(token).kid !== void 0;
  } catch {
    return null;
  }
  try {
    const secrets = getAllSecrets(secret);
    const { payload } = await jwtDecrypt(token, async (protectedHeader) => {
      const kid = protectedHeader.kid;
      if (kid !== void 0) {
        for (const s of secrets) {
          const encryptionSecret = deriveEncryptionSecret(s.value, salt);
          if (kid === await calculateJwkThumbprint({
            kty: "oct",
            k: base64url.encode(encryptionSecret)
          }, "sha256")) return encryptionSecret;
        }
        throw new Error("no matching decryption secret");
      }
      if (secrets.length === 1) return deriveEncryptionSecret(secrets[0].value, salt);
      return deriveEncryptionSecret(secrets[0].value, salt);
    }, jwtDecryptOpts);
    return payload;
  } catch {
    if (hasKid) return null;
    const secrets = getAllSecrets(secret);
    if (secrets.length <= 1) return null;
    for (let i = 1; i < secrets.length; i++) try {
      const s = secrets[i];
      const { payload } = await jwtDecrypt(token, deriveEncryptionSecret(s.value, salt), jwtDecryptOpts);
      return payload;
    } catch {
      continue;
    }
    return null;
  }
}
const hashPassword$1 = hashPassword;
const verifyPassword$1 = async ({ hash, password }) => {
  return verifyPassword$2(hash, password);
};
const ENVELOPE_PREFIX = "$ba$";
function parseEnvelope(data) {
  if (!data.startsWith(ENVELOPE_PREFIX)) return null;
  const firstSep = 4;
  const secondSep = data.indexOf("$", firstSep);
  if (secondSep === -1) return null;
  const version = parseInt(data.slice(firstSep, secondSep), 10);
  if (!Number.isInteger(version) || version < 0) return null;
  return {
    version,
    ciphertext: data.slice(secondSep + 1)
  };
}
function formatEnvelope(version, ciphertext) {
  return `${ENVELOPE_PREFIX}${version}$${ciphertext}`;
}
async function rawEncrypt(secret, data) {
  const keyAsBytes = await createHash$1("SHA-256").digest(secret);
  const dataAsBytes = utf8ToBytes(data);
  return bytesToHex(managedNonce(xchacha20poly1305)(new Uint8Array(keyAsBytes)).encrypt(dataAsBytes));
}
async function rawDecrypt(secret, hex) {
  const keyAsBytes = await createHash$1("SHA-256").digest(secret);
  const dataAsBytes = hexToBytes(hex);
  const chacha = managedNonce(xchacha20poly1305)(new Uint8Array(keyAsBytes));
  return new TextDecoder().decode(chacha.decrypt(dataAsBytes));
}
const symmetricEncrypt = async ({ key, data }) => {
  if (typeof key === "string") return rawEncrypt(key, data);
  const secret = key.keys.get(key.currentVersion);
  if (!secret) throw new Error(`Secret version ${key.currentVersion} not found in keys`);
  const ciphertext = await rawEncrypt(secret, data);
  return formatEnvelope(key.currentVersion, ciphertext);
};
const symmetricDecrypt = async ({ key, data }) => {
  if (typeof key === "string") return rawDecrypt(key, data);
  const envelope = parseEnvelope(data);
  if (envelope) {
    const secret = key.keys.get(envelope.version);
    if (!secret) throw new Error(`Secret version ${envelope.version} not found in keys (key may have been retired)`);
    return rawDecrypt(secret, envelope.ciphertext);
  }
  if (key.legacySecret) return rawDecrypt(key.legacySecret, data);
  throw new Error("Cannot decrypt legacy bare-hex payload: no legacy secret available. Set BETTER_AUTH_SECRET for backwards compatibility.");
};
const cache = /* @__PURE__ */ new WeakMap();
function getFields(options, modelName, mode) {
  const cacheKey = `${modelName}:${mode}`;
  if (!cache.has(options)) cache.set(options, /* @__PURE__ */ new Map());
  const tableCache = cache.get(options);
  if (tableCache.has(cacheKey)) return tableCache.get(cacheKey);
  const coreSchema = mode === "output" ? getAuthTables(options)[modelName]?.fields ?? {} : {};
  const additionalFields = modelName === "user" || modelName === "session" || modelName === "account" ? options[modelName]?.additionalFields : void 0;
  let schema2 = {
    ...coreSchema,
    ...additionalFields ?? {}
  };
  for (const plugin of options.plugins || []) if (plugin.schema && plugin.schema[modelName]) schema2 = {
    ...schema2,
    ...plugin.schema[modelName].fields
  };
  tableCache.set(cacheKey, schema2);
  return schema2;
}
function parseUserOutput(options, user) {
  return filterOutputFields(user, getFields(options, "user", "output"));
}
function parseSessionOutput(options, session) {
  return filterOutputFields(session, getFields(options, "session", "output"));
}
function parseAccountOutput(options, account) {
  const { accessToken: _accessToken, refreshToken: _refreshToken, idToken: _idToken, accessTokenExpiresAt: _accessTokenExpiresAt, refreshTokenExpiresAt: _refreshTokenExpiresAt, password: _password, ...rest } = filterOutputFields(account, getFields(options, "account", "output"));
  return rest;
}
function parseInputData(data, schema2) {
  const action = schema2.action || "create";
  const fields = schema2.fields;
  const parsedData = /* @__PURE__ */ Object.create(null);
  for (const key in fields) {
    if (key in data) {
      if (fields[key].input === false) {
        if (fields[key].defaultValue !== void 0) {
          if (action !== "update") {
            parsedData[key] = fields[key].defaultValue;
            continue;
          }
        }
        if (data[key]) throw APIError.from("BAD_REQUEST", {
          ...BASE_ERROR_CODES.FIELD_NOT_ALLOWED,
          message: `${key} is not allowed to be set`
        });
        continue;
      }
      if (fields[key].validator?.input && data[key] !== void 0) {
        const result = fields[key].validator.input["~standard"].validate(data[key]);
        if (result instanceof Promise) throw APIError.from("INTERNAL_SERVER_ERROR", BASE_ERROR_CODES.ASYNC_VALIDATION_NOT_SUPPORTED);
        if ("issues" in result && result.issues) throw APIError.from("BAD_REQUEST", {
          ...BASE_ERROR_CODES.VALIDATION_ERROR,
          message: result.issues[0]?.message || "Validation Error"
        });
        parsedData[key] = result.value;
        continue;
      }
      if (fields[key].transform?.input && data[key] !== void 0) {
        parsedData[key] = fields[key].transform?.input(data[key]);
        continue;
      }
      parsedData[key] = data[key];
      continue;
    }
    if (fields[key].defaultValue !== void 0 && action === "create") {
      if (typeof fields[key].defaultValue === "function") {
        parsedData[key] = fields[key].defaultValue();
        continue;
      }
      parsedData[key] = fields[key].defaultValue;
      continue;
    }
    if (fields[key].required && action === "create") throw APIError.from("BAD_REQUEST", {
      ...BASE_ERROR_CODES.MISSING_FIELD,
      message: `${key} is required`
    });
  }
  return parsedData;
}
function parseUserInput(options, user = {}, action) {
  return parseInputData(user, {
    fields: getFields(options, "user", "input"),
    action
  });
}
function parseSessionInput(options, session, action) {
  return parseInputData(session, {
    fields: getFields(options, "session", "input"),
    action
  });
}
function getSessionDefaultFields(options) {
  const fields = getFields(options, "session", "input");
  const defaults = {};
  for (const key in fields) if (fields[key].defaultValue !== void 0) defaults[key] = typeof fields[key].defaultValue === "function" ? fields[key].defaultValue() : fields[key].defaultValue;
  return defaults;
}
const getDate = (span, unit = "ms") => {
  return new Date(Date.now() + (unit === "sec" ? span * 1e3 : span));
};
function isPromise(obj) {
  return !!obj && (typeof obj === "object" || typeof obj === "function") && typeof obj.then === "function";
}
const SEC = 1e3;
const MIN = SEC * 60;
const HOUR = MIN * 60;
const DAY = HOUR * 24;
const WEEK = DAY * 7;
const MONTH = DAY * 30;
const YEAR = DAY * 365.25;
const REGEX = /^(\+|\-)? ?(\d+|\d+\.\d+) ?(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|months?|mo|years?|yrs?|y)(?: (ago|from now))?$/i;
function parse(value) {
  const match = REGEX.exec(value);
  if (!match || match[4] && match[1]) throw new TypeError(`Invalid time string format: "${value}". Use formats like "7d", "30m", "1 hour", etc.`);
  const n = parseFloat(match[2]);
  const unit = match[3].toLowerCase();
  let result;
  switch (unit) {
    case "years":
    case "year":
    case "yrs":
    case "yr":
    case "y":
      result = n * YEAR;
      break;
    case "months":
    case "month":
    case "mo":
      result = n * MONTH;
      break;
    case "weeks":
    case "week":
    case "w":
      result = n * WEEK;
      break;
    case "days":
    case "day":
    case "d":
      result = n * DAY;
      break;
    case "hours":
    case "hour":
    case "hrs":
    case "hr":
    case "h":
      result = n * HOUR;
      break;
    case "minutes":
    case "minute":
    case "mins":
    case "min":
    case "m":
      result = n * MIN;
      break;
    case "seconds":
    case "second":
    case "secs":
    case "sec":
    case "s":
      result = n * SEC;
      break;
    default:
      throw new TypeError(`Unknown time unit: "${unit}"`);
  }
  if (match[1] === "-" || match[4] === "ago") return -result;
  return result;
}
function sec(value) {
  return Math.round(parse(value) / 1e3);
}
const SECURE_COOKIE_PREFIX = "__Secure-";
const ALLOWED_COOKIE_SIZE = 4096;
const ESTIMATED_EMPTY_COOKIE_SIZE = 200;
const CHUNK_SIZE = ALLOWED_COOKIE_SIZE - ESTIMATED_EMPTY_COOKIE_SIZE;
function parseCookiesFromContext(ctx) {
  const cookieHeader = ctx.headers?.get("cookie");
  if (!cookieHeader) return {};
  const cookies = {};
  const pairs = cookieHeader.split("; ");
  for (const pair of pairs) {
    const [name, ...valueParts] = pair.split("=");
    if (name && valueParts.length > 0) cookies[name] = valueParts.join("=");
  }
  return cookies;
}
function getChunkIndex(cookieName) {
  const parts = cookieName.split(".");
  const lastPart = parts[parts.length - 1];
  const index2 = parseInt(lastPart || "0", 10);
  return isNaN(index2) ? 0 : index2;
}
function readExistingChunks(cookieName, ctx) {
  const chunks = {};
  const cookies = parseCookiesFromContext(ctx);
  for (const [name, value] of Object.entries(cookies)) if (name.startsWith(cookieName)) chunks[name] = value;
  return chunks;
}
function joinChunks(chunks) {
  return Object.keys(chunks).sort((a, b) => {
    return getChunkIndex(a) - getChunkIndex(b);
  }).map((key) => chunks[key]).join("");
}
function chunkCookie(storeName, cookie, chunks, logger2) {
  const chunkCount = Math.ceil(cookie.value.length / CHUNK_SIZE);
  if (chunkCount === 1) {
    chunks[cookie.name] = cookie.value;
    return [cookie];
  }
  const cookies = [];
  for (let i = 0; i < chunkCount; i++) {
    const name = `${cookie.name}.${i}`;
    const start = i * CHUNK_SIZE;
    const value = cookie.value.substring(start, start + CHUNK_SIZE);
    cookies.push({
      ...cookie,
      name,
      value
    });
    chunks[name] = value;
  }
  logger2.debug(`CHUNKING_${storeName.toUpperCase()}_COOKIE`, {
    message: `${storeName} cookie exceeds allowed ${ALLOWED_COOKIE_SIZE} bytes.`,
    emptyCookieSize: ESTIMATED_EMPTY_COOKIE_SIZE,
    valueSize: cookie.value.length,
    chunkCount,
    chunks: cookies.map((c) => c.value.length + ESTIMATED_EMPTY_COOKIE_SIZE)
  });
  return cookies;
}
function getCleanCookies(chunks, cookieOptions) {
  const cleanedChunks = {};
  for (const name in chunks) cleanedChunks[name] = {
    name,
    value: "",
    attributes: {
      ...cookieOptions,
      maxAge: 0
    }
  };
  return cleanedChunks;
}
const storeFactory = (storeName) => (cookieName, cookieOptions, ctx) => {
  const chunks = readExistingChunks(cookieName, ctx);
  const logger2 = ctx.context.logger;
  return {
    getValue() {
      return joinChunks(chunks);
    },
    hasChunks() {
      return Object.keys(chunks).length > 0;
    },
    chunk(value, options) {
      const cleanedChunks = getCleanCookies(chunks, cookieOptions);
      for (const name in chunks) delete chunks[name];
      const cookies = cleanedChunks;
      const chunked = chunkCookie(storeName, {
        name: cookieName,
        value,
        attributes: {
          ...cookieOptions,
          ...options
        }
      }, chunks, logger2);
      for (const chunk of chunked) cookies[chunk.name] = chunk;
      return Object.values(cookies);
    },
    clean() {
      const cleanedChunks = getCleanCookies(chunks, cookieOptions);
      for (const name in chunks) delete chunks[name];
      return Object.values(cleanedChunks);
    },
    setCookies(cookies) {
      for (const cookie of cookies) ctx.setCookie(cookie.name, cookie.value, cookie.attributes);
    }
  };
};
const createSessionStore = storeFactory("Session");
const createAccountStore = storeFactory("Account");
function getChunkedCookie(ctx, cookieName) {
  const value = ctx.getCookie(cookieName);
  if (value) return value;
  const chunks = [];
  const cookieHeader = ctx.headers?.get("cookie");
  if (!cookieHeader) return null;
  const cookies = {};
  const pairs = cookieHeader.split("; ");
  for (const pair of pairs) {
    const [name, ...valueParts] = pair.split("=");
    if (name && valueParts.length > 0) cookies[name] = valueParts.join("=");
  }
  for (const [name, val] of Object.entries(cookies)) if (name.startsWith(cookieName + ".")) {
    const indexStr = name.split(".").at(-1);
    const index2 = parseInt(indexStr || "0", 10);
    if (!isNaN(index2)) chunks.push({
      index: index2,
      value: val
    });
  }
  if (chunks.length > 0) {
    chunks.sort((a, b) => a.index - b.index);
    return chunks.map((c) => c.value).join("");
  }
  return null;
}
async function setAccountCookie(c, accountData) {
  const accountDataCookie = c.context.authCookies.accountData;
  const options = {
    maxAge: 300,
    ...accountDataCookie.attributes
  };
  const data = await symmetricEncodeJWT(accountData, c.context.secretConfig, "better-auth-account", options.maxAge);
  if (data.length > ALLOWED_COOKIE_SIZE) {
    const accountStore = createAccountStore(accountDataCookie.name, options, c);
    const cookies = accountStore.chunk(data, options);
    accountStore.setCookies(cookies);
  } else {
    const accountStore = createAccountStore(accountDataCookie.name, options, c);
    if (accountStore.hasChunks()) {
      const cleanCookies = accountStore.clean();
      accountStore.setCookies(cleanCookies);
    }
    c.setCookie(accountDataCookie.name, data, options);
  }
}
async function getAccountCookie(c) {
  const accountCookie = getChunkedCookie(c, c.context.authCookies.accountData.name);
  if (accountCookie) {
    const accountData = safeJSONParse(await symmetricDecodeJWT(accountCookie, c.context.secretConfig, "better-auth-account"));
    if (accountData) return accountData;
  }
  return null;
}
const getSessionQuerySchema = z.optional(z.object({
  disableCookieCache: z.coerce.boolean().meta({ description: "Disable cookie cache and fetch session from database" }).optional(),
  disableRefresh: z.coerce.boolean().meta({ description: "Disable session refresh. Useful for checking session status, without updating the session" }).optional()
}));
function createCookieGetter(options) {
  const baseURLString = typeof options.baseURL === "string" ? options.baseURL : void 0;
  const dynamicProtocol = typeof options.baseURL === "object" && options.baseURL !== null ? options.baseURL.protocol : void 0;
  const secureCookiePrefix = (options.advanced?.useSecureCookies !== void 0 ? options.advanced?.useSecureCookies : dynamicProtocol === "https" ? true : dynamicProtocol === "http" ? false : baseURLString ? baseURLString.startsWith("https://") : isProduction) ? SECURE_COOKIE_PREFIX : "";
  const crossSubdomainEnabled = !!options.advanced?.crossSubDomainCookies?.enabled;
  const domain = crossSubdomainEnabled ? options.advanced?.crossSubDomainCookies?.domain || (baseURLString ? new URL(baseURLString).hostname : void 0) : void 0;
  if (crossSubdomainEnabled && !domain && !isDynamicBaseURLConfig(options.baseURL)) throw new BetterAuthError("baseURL is required when crossSubdomainCookies are enabled.");
  function createCookie(cookieName, overrideAttributes = {}) {
    const prefix = options.advanced?.cookiePrefix || "better-auth";
    const name = options.advanced?.cookies?.[cookieName]?.name || `${prefix}.${cookieName}`;
    const attributes = options.advanced?.cookies?.[cookieName]?.attributes ?? {};
    return {
      name: `${secureCookiePrefix}${name}`,
      attributes: {
        secure: !!secureCookiePrefix,
        sameSite: "lax",
        path: "/",
        httpOnly: true,
        ...crossSubdomainEnabled ? { domain } : {},
        ...options.advanced?.defaultCookieAttributes,
        ...overrideAttributes,
        ...attributes
      }
    };
  }
  return createCookie;
}
function getCookies(options) {
  const createCookie = createCookieGetter(options);
  const sessionToken = createCookie("session_token", { maxAge: options.session?.expiresIn || sec("7d") });
  const sessionData = createCookie("session_data", { maxAge: options.session?.cookieCache?.maxAge || 300 });
  const accountData = createCookie("account_data", { maxAge: options.session?.cookieCache?.maxAge || 300 });
  const dontRememberToken = createCookie("dont_remember");
  return {
    sessionToken: {
      name: sessionToken.name,
      attributes: sessionToken.attributes
    },
    sessionData: {
      name: sessionData.name,
      attributes: sessionData.attributes
    },
    dontRememberToken: {
      name: dontRememberToken.name,
      attributes: dontRememberToken.attributes
    },
    accountData: {
      name: accountData.name,
      attributes: accountData.attributes
    }
  };
}
async function setCookieCache(ctx, session, dontRememberMe) {
  if (!ctx.context.options.session?.cookieCache?.enabled) return;
  const filteredSession = filterOutputFields(session.session, ctx.context.options.session?.additionalFields);
  const filteredUser = parseUserOutput(ctx.context.options, session.user);
  const versionConfig = ctx.context.options.session?.cookieCache?.version;
  let version = "1";
  if (versionConfig) {
    if (typeof versionConfig === "string") version = versionConfig;
    else if (typeof versionConfig === "function") {
      const result = versionConfig(session.session, session.user);
      version = isPromise(result) ? await result : result;
    }
  }
  const sessionData = {
    session: filteredSession,
    user: filteredUser,
    updatedAt: Date.now(),
    version
  };
  const options = {
    ...ctx.context.authCookies.sessionData.attributes,
    maxAge: dontRememberMe ? void 0 : ctx.context.authCookies.sessionData.attributes.maxAge
  };
  const expiresAtDate = getDate(options.maxAge || 60, "sec").getTime();
  const strategy = ctx.context.options.session?.cookieCache?.strategy || "compact";
  let data;
  if (strategy === "jwe") data = await symmetricEncodeJWT(sessionData, ctx.context.secretConfig, "better-auth-session", options.maxAge || 300);
  else if (strategy === "jwt") data = await signJWT(sessionData, ctx.context.secret, options.maxAge || 300);
  else data = base64Url.encode(JSON.stringify({
    session: sessionData,
    expiresAt: expiresAtDate,
    signature: await createHMAC("SHA-256", "base64urlnopad").sign(ctx.context.secret, JSON.stringify({
      ...sessionData,
      expiresAt: expiresAtDate
    }))
  }), { padding: false });
  if (data.length > 4093) {
    const sessionStore = createSessionStore(ctx.context.authCookies.sessionData.name, options, ctx);
    const cookies = sessionStore.chunk(data, options);
    sessionStore.setCookies(cookies);
  } else {
    const sessionStore = createSessionStore(ctx.context.authCookies.sessionData.name, options, ctx);
    if (sessionStore.hasChunks()) {
      const cleanCookies = sessionStore.clean();
      sessionStore.setCookies(cleanCookies);
    }
    ctx.setCookie(ctx.context.authCookies.sessionData.name, data, options);
  }
  if (ctx.context.options.account?.storeAccountCookie) {
    const accountData = await getAccountCookie(ctx);
    if (accountData) await setAccountCookie(ctx, accountData);
  }
}
async function setSessionCookie(ctx, session, dontRememberMe, overrides) {
  const dontRememberMeCookie = await ctx.getSignedCookie(ctx.context.authCookies.dontRememberToken.name, ctx.context.secret);
  dontRememberMe = dontRememberMe !== void 0 ? dontRememberMe : !!dontRememberMeCookie;
  const options = ctx.context.authCookies.sessionToken.attributes;
  const maxAge = dontRememberMe ? void 0 : ctx.context.sessionConfig.expiresIn;
  await ctx.setSignedCookie(ctx.context.authCookies.sessionToken.name, session.session.token, ctx.context.secret, {
    ...options,
    maxAge,
    ...overrides
  });
  if (dontRememberMe) await ctx.setSignedCookie(ctx.context.authCookies.dontRememberToken.name, "true", ctx.context.secret, ctx.context.authCookies.dontRememberToken.attributes);
  await setCookieCache(ctx, session, dontRememberMe);
  ctx.context.setNewSession(session);
}
function expireCookie(ctx, cookie) {
  ctx.setCookie(cookie.name, "", {
    ...cookie.attributes,
    maxAge: 0
  });
}
function deleteSessionCookie(ctx, skipDontRememberMe) {
  expireCookie(ctx, ctx.context.authCookies.sessionToken);
  expireCookie(ctx, ctx.context.authCookies.sessionData);
  if (ctx.context.options.account?.storeAccountCookie) {
    expireCookie(ctx, ctx.context.authCookies.accountData);
    const accountStore = createAccountStore(ctx.context.authCookies.accountData.name, ctx.context.authCookies.accountData.attributes, ctx);
    const cleanCookies2 = accountStore.clean();
    accountStore.setCookies(cleanCookies2);
  }
  if (ctx.context.oauthConfig.storeStateStrategy === "cookie") expireCookie(ctx, ctx.context.createAuthCookie("oauth_state"));
  const sessionStore = createSessionStore(ctx.context.authCookies.sessionData.name, ctx.context.authCookies.sessionData.attributes, ctx);
  const cleanCookies = sessionStore.clean();
  sessionStore.setCookies(cleanCookies);
  expireCookie(ctx, ctx.context.authCookies.dontRememberToken);
}
const stateDataSchema = z.looseObject({
  callbackURL: z.string(),
  codeVerifier: z.string(),
  errorURL: z.string().optional(),
  newUserURL: z.string().optional(),
  expiresAt: z.number(),
  oauthState: z.string().optional(),
  link: z.object({
    email: z.string(),
    userId: z.coerce.string()
  }).optional(),
  requestSignUp: z.boolean().optional()
});
var StateError = class extends BetterAuthError {
  code;
  details;
  constructor(message, options) {
    super(message, options);
    this.code = options.code;
    this.details = options.details;
  }
};
async function generateGenericState(c, stateData, settings) {
  const state = generateRandomString(32);
  if (c.context.oauthConfig.storeStateStrategy === "cookie") {
    const payload = {
      ...stateData,
      oauthState: state
    };
    const encryptedData = await symmetricEncrypt({
      key: c.context.secretConfig,
      data: JSON.stringify(payload)
    });
    const stateCookie2 = c.context.createAuthCookie("oauth_state", { maxAge: 600 });
    c.setCookie(stateCookie2.name, encryptedData, stateCookie2.attributes);
    return {
      state,
      codeVerifier: stateData.codeVerifier
    };
  }
  const stateCookie = c.context.createAuthCookie("state", { maxAge: 300 });
  await c.setSignedCookie(stateCookie.name, state, c.context.secret, stateCookie.attributes);
  const expiresAt = /* @__PURE__ */ new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10);
  if (!await c.context.internalAdapter.createVerificationValue({
    value: JSON.stringify({
      ...stateData,
      oauthState: state
    }),
    identifier: state,
    expiresAt
  })) throw new StateError("Unable to create verification. Make sure the database adapter is properly working and there is a verification table in the database", { code: "state_generation_error" });
  return {
    state,
    codeVerifier: stateData.codeVerifier
  };
}
async function parseGenericState(c, state, settings) {
  const storeStateStrategy = c.context.oauthConfig.storeStateStrategy;
  let parsedData;
  if (storeStateStrategy === "cookie") {
    const stateCookie = c.context.createAuthCookie("oauth_state");
    const encryptedData = c.getCookie(stateCookie.name);
    if (!encryptedData) throw new StateError("State mismatch: auth state cookie not found", {
      code: "state_mismatch",
      details: { state }
    });
    try {
      const decryptedData = await symmetricDecrypt({
        key: c.context.secretConfig,
        data: encryptedData
      });
      parsedData = stateDataSchema.parse(JSON.parse(decryptedData));
    } catch (error2) {
      throw new StateError("State invalid: Failed to decrypt or parse auth state", {
        code: "state_invalid",
        details: { state },
        cause: error2
      });
    }
    if (!parsedData.oauthState || parsedData.oauthState !== state) throw new StateError("State mismatch: OAuth state parameter does not match stored state", {
      code: "state_security_mismatch",
      details: { state }
    });
    expireCookie(c, stateCookie);
  } else {
    const data = await c.context.internalAdapter.findVerificationValue(state);
    if (!data) throw new StateError("State mismatch: verification not found", {
      code: "state_mismatch",
      details: { state }
    });
    parsedData = stateDataSchema.parse(JSON.parse(data.value));
    if (parsedData.oauthState !== void 0 && parsedData.oauthState !== state) throw new StateError("State mismatch: OAuth state parameter does not match stored state", {
      code: "state_security_mismatch",
      details: { state }
    });
    const stateCookie = c.context.createAuthCookie("state");
    const stateCookieValue = await c.getSignedCookie(stateCookie.name, c.context.secret);
    if (!c.context.oauthConfig.skipStateCookieCheck && (!stateCookieValue || stateCookieValue !== state)) throw new StateError("State mismatch: State not persisted correctly", {
      code: "state_security_mismatch",
      details: { state }
    });
    expireCookie(c, stateCookie);
    await c.context.internalAdapter.deleteVerificationByIdentifier(state);
  }
  if (parsedData.expiresAt < Date.now()) throw new StateError("Invalid state: request expired", {
    code: "state_mismatch",
    details: { expiresAt: parsedData.expiresAt }
  });
  return parsedData;
}
const { get: getOAuthState, set: setOAuthState } = defineRequestState(() => null);
async function generateState(c, link, additionalData) {
  const callbackURL = c.body?.callbackURL || c.context.options.baseURL;
  if (!callbackURL) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.CALLBACK_URL_REQUIRED);
  const codeVerifier = generateRandomString(128);
  const stateData = {
    ...additionalData ? additionalData : {},
    callbackURL,
    codeVerifier,
    errorURL: c.body?.errorCallbackURL,
    newUserURL: c.body?.newUserCallbackURL,
    link,
    expiresAt: Date.now() + 600 * 1e3,
    requestSignUp: c.body?.requestSignUp
  };
  await setOAuthState(stateData);
  try {
    return generateGenericState(c, stateData);
  } catch (error2) {
    c.context.logger.error("Failed to create verification", error2);
    throw new APIError("INTERNAL_SERVER_ERROR", {
      message: "Unable to create verification",
      cause: error2
    });
  }
}
async function parseState(c) {
  const state = c.query.state || c.body?.state;
  const errorURL = c.context.options.onAPIError?.errorURL || `${c.context.baseURL}/error`;
  let parsedData;
  try {
    parsedData = await parseGenericState(c, state);
  } catch (error2) {
    c.context.logger.error("Failed to parse state", error2);
    if (error2 instanceof StateError && error2.code === "state_security_mismatch") throw c.redirect(`${errorURL}?error=state_mismatch`);
    throw c.redirect(`${errorURL}?error=please_restart_the_process`);
  }
  if (!parsedData.errorURL) parsedData.errorURL = errorURL;
  if (parsedData) await setOAuthState(parsedData);
  return parsedData;
}
const HIDE_METADATA = { scope: "server" };
const matchesOriginPattern = (url2, pattern, settings) => {
  if (url2.startsWith("/")) {
    if (settings?.allowRelativePaths) return url2.startsWith("/") && /^\/(?!\/|\\|%2f|%5c)[\w\-.\+/@]*(?:\?[\w\-.\+/=&%@]*)?$/.test(url2);
    return false;
  }
  if (pattern.includes("*") || pattern.includes("?")) {
    if (pattern.includes("://")) return wildcardMatch(pattern)(getOrigin(url2) || url2);
    const host = getHost(url2);
    if (!host) return false;
    return wildcardMatch(pattern)(host);
  }
  const protocol = getProtocol(url2);
  return protocol === "http:" || protocol === "https:" || !protocol ? pattern === getOrigin(url2) : url2.startsWith(pattern);
};
function shouldSkipCSRFForBackwardCompat(ctx) {
  return ctx.context.skipOriginCheck === true && ctx.context.options.advanced?.disableCSRFCheck === void 0;
}
function shouldSkipOriginCheck(ctx) {
  const skipOriginCheck = ctx.context.skipOriginCheck;
  if (skipOriginCheck === true) return true;
  if (Array.isArray(skipOriginCheck) && ctx.request) try {
    const basePath = new URL(ctx.context.baseURL).pathname;
    const currentPath = normalizePathname(ctx.request.url, basePath);
    return skipOriginCheck.some((skipPath) => currentPath.startsWith(skipPath));
  } catch {
  }
  return false;
}
const logBackwardCompatWarning = deprecate(function logBackwardCompatWarning2() {
}, "disableOriginCheck: true currently also disables CSRF checks. In a future version, disableOriginCheck will ONLY disable URL validation. To keep CSRF disabled, add disableCSRFCheck: true to your config.");
const originCheckMiddleware = createAuthMiddleware(async (ctx) => {
  if (ctx.request?.method === "GET" || ctx.request?.method === "OPTIONS" || ctx.request?.method === "HEAD" || !ctx.request) return;
  await validateOrigin(ctx);
  if (shouldSkipOriginCheck(ctx)) return;
  const { body, query } = ctx;
  const callbackURL = body?.callbackURL || query?.callbackURL;
  const redirectURL = body?.redirectTo;
  const errorCallbackURL = body?.errorCallbackURL;
  const newUserCallbackURL = body?.newUserCallbackURL;
  const validateURL = (url2, label) => {
    if (!url2) return;
    if (!ctx.context.isTrustedOrigin(url2, { allowRelativePaths: label !== "origin" })) {
      ctx.context.logger.error(`Invalid ${label}: ${url2}`);
      ctx.context.logger.info(`If it's a valid URL, please add ${url2} to trustedOrigins in your auth config
`, `Current list of trustedOrigins: ${ctx.context.trustedOrigins}`);
      if (label === "origin") throw APIError.from("FORBIDDEN", BASE_ERROR_CODES.INVALID_ORIGIN);
      if (label === "callbackURL") throw APIError.from("FORBIDDEN", BASE_ERROR_CODES.INVALID_CALLBACK_URL);
      if (label === "redirectURL") throw APIError.from("FORBIDDEN", BASE_ERROR_CODES.INVALID_REDIRECT_URL);
      if (label === "errorCallbackURL") throw APIError.from("FORBIDDEN", BASE_ERROR_CODES.INVALID_ERROR_CALLBACK_URL);
      if (label === "newUserCallbackURL") throw APIError.from("FORBIDDEN", BASE_ERROR_CODES.INVALID_NEW_USER_CALLBACK_URL);
      throw APIError.fromStatus("FORBIDDEN", { message: `Invalid ${label}` });
    }
  };
  callbackURL && validateURL(callbackURL, "callbackURL");
  redirectURL && validateURL(redirectURL, "redirectURL");
  errorCallbackURL && validateURL(errorCallbackURL, "errorCallbackURL");
  newUserCallbackURL && validateURL(newUserCallbackURL, "newUserCallbackURL");
});
const originCheck = (getValue) => createAuthMiddleware(async (ctx) => {
  if (!ctx.request) return;
  if (shouldSkipOriginCheck(ctx)) return;
  const callbackURL = getValue(ctx);
  const validateURL = (url2, label) => {
    if (!url2) return;
    if (!ctx.context.isTrustedOrigin(url2, { allowRelativePaths: label !== "origin" })) {
      ctx.context.logger.error(`Invalid ${label}: ${url2}`);
      ctx.context.logger.info(`If it's a valid URL, please add ${url2} to trustedOrigins in your auth config
`, `Current list of trustedOrigins: ${ctx.context.trustedOrigins}`);
      throw APIError.from("FORBIDDEN", BASE_ERROR_CODES.INVALID_CALLBACK_URL);
    }
  };
  const callbacks = Array.isArray(callbackURL) ? callbackURL : [callbackURL];
  for (const url2 of callbacks) validateURL(url2, "callbackURL");
});
async function validateOrigin(ctx, forceValidate = false) {
  const headers = ctx.request?.headers;
  if (!headers || !ctx.request) return;
  const originHeader = headers.get("origin") || headers.get("referer") || "";
  const useCookies = headers.has("cookie");
  if (ctx.context.skipCSRFCheck) return;
  if (shouldSkipCSRFForBackwardCompat(ctx)) {
    ctx.context.options.advanced?.disableOriginCheck === true && logBackwardCompatWarning();
    return;
  }
  if (shouldSkipOriginCheck(ctx)) return;
  if (!(forceValidate || useCookies)) return;
  if (!originHeader || originHeader === "null") throw APIError.from("FORBIDDEN", BASE_ERROR_CODES.MISSING_OR_NULL_ORIGIN);
  const trustedOrigins2 = Array.isArray(ctx.context.options.trustedOrigins) ? ctx.context.trustedOrigins : [...ctx.context.trustedOrigins, ...(await ctx.context.options.trustedOrigins?.(ctx.request))?.filter((v) => Boolean(v)) || []];
  if (!trustedOrigins2.some((origin) => matchesOriginPattern(originHeader, origin))) {
    ctx.context.logger.error(`Invalid origin: ${originHeader}`);
    ctx.context.logger.info(`If it's a valid URL, please add ${originHeader} to trustedOrigins in your auth config
`, `Current list of trustedOrigins: ${trustedOrigins2}`);
    throw APIError.from("FORBIDDEN", BASE_ERROR_CODES.INVALID_ORIGIN);
  }
}
const formCsrfMiddleware = createAuthMiddleware(async (ctx) => {
  if (!ctx.request) return;
  await validateFormCsrf(ctx);
});
async function validateFormCsrf(ctx) {
  const req = ctx.request;
  if (!req) return;
  if (ctx.context.skipCSRFCheck) return;
  if (shouldSkipCSRFForBackwardCompat(ctx)) return;
  const headers = req.headers;
  if (headers.has("cookie")) return await validateOrigin(ctx);
  const site = headers.get("Sec-Fetch-Site");
  const mode = headers.get("Sec-Fetch-Mode");
  const dest = headers.get("Sec-Fetch-Dest");
  if (Boolean(site && site.trim() || mode && mode.trim() || dest && dest.trim())) {
    if (site === "cross-site" && mode === "navigate") {
      ctx.context.logger.error("Blocked cross-site navigation login attempt (CSRF protection)", {
        secFetchSite: site,
        secFetchMode: mode,
        secFetchDest: dest
      });
      throw APIError.from("FORBIDDEN", BASE_ERROR_CODES.CROSS_SITE_NAVIGATION_LOGIN_BLOCKED);
    }
    return await validateOrigin(ctx, true);
  }
}
const LOCALHOST_IP = "127.0.0.1";
function getIp(req, options) {
  if (options.advanced?.ipAddress?.disableIpTracking) return null;
  const headers = "headers" in req ? req.headers : req;
  const ipHeaders = options.advanced?.ipAddress?.ipAddressHeaders || ["x-forwarded-for"];
  for (const key of ipHeaders) {
    const value = "get" in headers ? headers.get(key) : headers[key];
    if (typeof value === "string") {
      const ip = value.split(",")[0].trim();
      if (isValidIP(ip)) return normalizeIP(ip, { ipv6Subnet: options.advanced?.ipAddress?.ipv6Subnet });
    }
  }
  if (isTest() || isDevelopment()) return LOCALHOST_IP;
  return null;
}
const memory = /* @__PURE__ */ new Map();
function shouldRateLimit(max, window2, rateLimitData) {
  const now2 = Date.now();
  const windowInMs = window2 * 1e3;
  return now2 - rateLimitData.lastRequest < windowInMs && rateLimitData.count >= max;
}
function rateLimitResponse(retryAfter) {
  return new Response(JSON.stringify({ message: "Too many requests. Please try again later." }), {
    status: 429,
    statusText: "Too Many Requests",
    headers: { "X-Retry-After": retryAfter.toString() }
  });
}
function getRetryAfter(lastRequest, window2) {
  const now2 = Date.now();
  const windowInMs = window2 * 1e3;
  return Math.ceil((lastRequest + windowInMs - now2) / 1e3);
}
function createDatabaseStorageWrapper(ctx) {
  const model = "rateLimit";
  const db2 = ctx.adapter;
  return {
    get: async (key) => {
      const data = (await db2.findMany({
        model,
        where: [{
          field: "key",
          value: key
        }]
      }))[0];
      if (typeof data?.lastRequest === "bigint") data.lastRequest = Number(data.lastRequest);
      return data;
    },
    set: async (key, value, _update) => {
      try {
        if (_update) await db2.updateMany({
          model,
          where: [{
            field: "key",
            value: key
          }],
          update: {
            count: value.count,
            lastRequest: value.lastRequest
          }
        });
        else await db2.create({
          model,
          data: {
            key,
            count: value.count,
            lastRequest: value.lastRequest
          }
        });
      } catch (e) {
        ctx.logger.error("Error setting rate limit", e);
      }
    }
  };
}
function getRateLimitStorage(ctx, rateLimitSettings) {
  if (ctx.options.rateLimit?.customStorage) return ctx.options.rateLimit.customStorage;
  const storage = ctx.rateLimit.storage;
  if (storage === "secondary-storage") return {
    get: async (key) => {
      const data = await ctx.options.secondaryStorage?.get(key);
      return data ? safeJSONParse(data) : null;
    },
    set: async (key, value, _update) => {
      const ttl = rateLimitSettings?.window ?? ctx.options.rateLimit?.window ?? 10;
      await ctx.options.secondaryStorage?.set?.(key, JSON.stringify(value), ttl);
    }
  };
  else if (storage === "memory") return {
    async get(key) {
      const entry = memory.get(key);
      if (!entry) return null;
      if (Date.now() >= entry.expiresAt) {
        memory.delete(key);
        return null;
      }
      return entry.data;
    },
    async set(key, value, _update) {
      const ttl = rateLimitSettings?.window ?? ctx.options.rateLimit?.window ?? 10;
      const expiresAt = Date.now() + ttl * 1e3;
      memory.set(key, {
        data: value,
        expiresAt
      });
    }
  };
  return createDatabaseStorageWrapper(ctx);
}
let ipWarningLogged = false;
async function resolveRateLimitConfig(req, ctx) {
  const basePath = new URL(ctx.baseURL).pathname;
  const path = normalizePathname(req.url, basePath);
  let currentWindow = ctx.rateLimit.window;
  let currentMax = ctx.rateLimit.max;
  const ip = getIp(req, ctx.options);
  if (!ip) {
    if (!ipWarningLogged) {
      ctx.logger.warn("Rate limiting skipped: could not determine client IP address. Ensure your runtime forwards a trusted client IP header and configure `advanced.ipAddress.ipAddressHeaders` if needed.");
      ipWarningLogged = true;
    }
    return null;
  }
  const key = createRateLimitKey(ip, path);
  const specialRule = getDefaultSpecialRules().find((rule) => rule.pathMatcher(path));
  if (specialRule) {
    currentWindow = specialRule.window;
    currentMax = specialRule.max;
  }
  for (const plugin of ctx.options.plugins || []) if (plugin.rateLimit) {
    const matchedRule = plugin.rateLimit.find((rule) => rule.pathMatcher(path));
    if (matchedRule) {
      currentWindow = matchedRule.window;
      currentMax = matchedRule.max;
      break;
    }
  }
  if (ctx.rateLimit.customRules) {
    const _path = Object.keys(ctx.rateLimit.customRules).find((p) => {
      if (p.includes("*")) return wildcardMatch(p)(path);
      return p === path;
    });
    if (_path) {
      const customRule = ctx.rateLimit.customRules[_path];
      const resolved = typeof customRule === "function" ? await customRule(req, {
        window: currentWindow,
        max: currentMax
      }) : customRule;
      if (resolved) {
        currentWindow = resolved.window;
        currentMax = resolved.max;
      }
      if (resolved === false) return null;
    }
  }
  return {
    key,
    currentWindow,
    currentMax
  };
}
async function onRequestRateLimit(req, ctx) {
  if (!ctx.rateLimit.enabled) return;
  const config = await resolveRateLimitConfig(req, ctx);
  if (!config) return;
  const { key, currentWindow, currentMax } = config;
  const data = await getRateLimitStorage(ctx, { window: currentWindow }).get(key);
  if (data && shouldRateLimit(currentMax, currentWindow, data)) return rateLimitResponse(getRetryAfter(data.lastRequest, currentWindow));
}
async function onResponseRateLimit(req, ctx) {
  if (!ctx.rateLimit.enabled) return;
  const config = await resolveRateLimitConfig(req, ctx);
  if (!config) return;
  const { key, currentWindow } = config;
  const storage = getRateLimitStorage(ctx, { window: currentWindow });
  const data = await storage.get(key);
  const now2 = Date.now();
  if (!data) await storage.set(key, {
    key,
    count: 1,
    lastRequest: now2
  });
  else if (now2 - data.lastRequest > currentWindow * 1e3) await storage.set(key, {
    ...data,
    count: 1,
    lastRequest: now2
  }, true);
  else await storage.set(key, {
    ...data,
    count: data.count + 1,
    lastRequest: now2
  }, true);
}
function getDefaultSpecialRules() {
  return [{
    pathMatcher(path) {
      return path.startsWith("/sign-in") || path.startsWith("/sign-up") || path.startsWith("/change-password") || path.startsWith("/change-email");
    },
    window: 10,
    max: 3
  }, {
    pathMatcher(path) {
      return path === "/request-password-reset" || path === "/send-verification-email" || path.startsWith("/forget-password") || path === "/email-otp/send-verification-otp" || path === "/email-otp/request-password-reset";
    },
    window: 60,
    max: 3
  }];
}
const { get: getShouldSkipSessionRefresh, set: setShouldSkipSessionRefresh } = defineRequestState(() => false);
const getSession = () => createAuthEndpoint("/get-session", {
  method: ["GET", "POST"],
  operationId: "getSession",
  query: getSessionQuerySchema,
  requireHeaders: true,
  metadata: { openapi: {
    operationId: "getSession",
    description: "Get the current session",
    responses: { "200": {
      description: "Success",
      content: { "application/json": { schema: {
        type: ["object", "null"],
        properties: {
          session: { $ref: "#/components/schemas/Session" },
          user: { $ref: "#/components/schemas/User" }
        },
        required: ["session", "user"]
      } } }
    } }
  } }
}, async (ctx) => {
  const deferSessionRefresh = ctx.context.options.session?.deferSessionRefresh;
  const isPostRequest = ctx.method === "POST";
  if (isPostRequest && !deferSessionRefresh) throw APIError.from("METHOD_NOT_ALLOWED", BASE_ERROR_CODES.METHOD_NOT_ALLOWED_DEFER_SESSION_REQUIRED);
  try {
    const sessionCookieToken = await ctx.getSignedCookie(ctx.context.authCookies.sessionToken.name, ctx.context.secret);
    if (!sessionCookieToken) return null;
    const sessionDataCookie = getChunkedCookie(ctx, ctx.context.authCookies.sessionData.name);
    let sessionDataPayload = null;
    if (sessionDataCookie) {
      const strategy = ctx.context.options.session?.cookieCache?.strategy || "compact";
      if (strategy === "jwe") {
        const payload = await symmetricDecodeJWT(sessionDataCookie, ctx.context.secretConfig, "better-auth-session");
        if (payload && payload.session && payload.user) sessionDataPayload = {
          session: {
            session: payload.session,
            user: payload.user,
            updatedAt: payload.updatedAt,
            version: payload.version
          },
          expiresAt: payload.exp ? payload.exp * 1e3 : Date.now()
        };
        else {
          expireCookie(ctx, ctx.context.authCookies.sessionData);
          return ctx.json(null);
        }
      } else if (strategy === "jwt") {
        const payload = await verifyJWT(sessionDataCookie, ctx.context.secret);
        if (payload && payload.session && payload.user) sessionDataPayload = {
          session: {
            session: payload.session,
            user: payload.user,
            updatedAt: payload.updatedAt,
            version: payload.version
          },
          expiresAt: payload.exp ? payload.exp * 1e3 : Date.now()
        };
        else {
          expireCookie(ctx, ctx.context.authCookies.sessionData);
          return ctx.json(null);
        }
      } else {
        const parsed = safeJSONParse(binary.decode(base64Url.decode(sessionDataCookie)));
        if (parsed) if (await createHMAC("SHA-256", "base64urlnopad").verify(ctx.context.secret, JSON.stringify({
          ...parsed.session,
          expiresAt: parsed.expiresAt
        }), parsed.signature)) sessionDataPayload = parsed;
        else {
          expireCookie(ctx, ctx.context.authCookies.sessionData);
          return ctx.json(null);
        }
      }
    }
    const dontRememberMe = await ctx.getSignedCookie(ctx.context.authCookies.dontRememberToken.name, ctx.context.secret);
    if (sessionDataPayload?.session && ctx.context.options.session?.cookieCache?.enabled && !ctx.query?.disableCookieCache) {
      const session2 = sessionDataPayload.session;
      const versionConfig = ctx.context.options.session?.cookieCache?.version;
      let expectedVersion = "1";
      if (versionConfig) {
        if (typeof versionConfig === "string") expectedVersion = versionConfig;
        else if (typeof versionConfig === "function") {
          const result = versionConfig(session2.session, session2.user);
          expectedVersion = result instanceof Promise ? await result : result;
        }
      }
      if ((session2.version || "1") !== expectedVersion) expireCookie(ctx, ctx.context.authCookies.sessionData);
      else {
        const cachedSessionExpiresAt = new Date(session2.session.expiresAt);
        if (sessionDataPayload.expiresAt < Date.now() || cachedSessionExpiresAt < /* @__PURE__ */ new Date()) expireCookie(ctx, ctx.context.authCookies.sessionData);
        else {
          const cookieRefreshCache = ctx.context.sessionConfig.cookieRefreshCache;
          if (cookieRefreshCache === false) {
            ctx.context.session = session2;
            const parsedSession3 = parseSessionOutput(ctx.context.options, {
              ...session2.session,
              expiresAt: new Date(session2.session.expiresAt),
              createdAt: new Date(session2.session.createdAt),
              updatedAt: new Date(session2.session.updatedAt)
            });
            const parsedUser3 = parseUserOutput(ctx.context.options, {
              ...session2.user,
              createdAt: new Date(session2.user.createdAt),
              updatedAt: new Date(session2.user.updatedAt)
            });
            return ctx.json({
              session: parsedSession3,
              user: parsedUser3
            });
          }
          const timeUntilExpiry = sessionDataPayload.expiresAt - Date.now();
          const updateAge2 = cookieRefreshCache.updateAge * 1e3;
          const shouldSkipSessionRefresh2 = await getShouldSkipSessionRefresh();
          if (timeUntilExpiry < updateAge2 && !shouldSkipSessionRefresh2) {
            const newExpiresAt = getDate(ctx.context.options.session?.cookieCache?.maxAge || 300, "sec");
            const refreshedSession = {
              session: {
                ...session2.session,
                expiresAt: newExpiresAt
              },
              user: session2.user,
              updatedAt: Date.now()
            };
            await setCookieCache(ctx, refreshedSession, false);
            const sessionTokenOptions = ctx.context.authCookies.sessionToken.attributes;
            const sessionTokenMaxAge = dontRememberMe ? void 0 : ctx.context.sessionConfig.expiresIn;
            await ctx.setSignedCookie(ctx.context.authCookies.sessionToken.name, session2.session.token, ctx.context.secret, {
              ...sessionTokenOptions,
              maxAge: sessionTokenMaxAge
            });
            const parsedRefreshedSession = parseSessionOutput(ctx.context.options, {
              ...refreshedSession.session,
              expiresAt: new Date(refreshedSession.session.expiresAt),
              createdAt: new Date(refreshedSession.session.createdAt),
              updatedAt: new Date(refreshedSession.session.updatedAt)
            });
            const parsedRefreshedUser = parseUserOutput(ctx.context.options, {
              ...refreshedSession.user,
              createdAt: new Date(refreshedSession.user.createdAt),
              updatedAt: new Date(refreshedSession.user.updatedAt)
            });
            ctx.context.session = {
              session: parsedRefreshedSession,
              user: parsedRefreshedUser
            };
            return ctx.json({
              session: parsedRefreshedSession,
              user: parsedRefreshedUser
            });
          }
          const parsedSession2 = parseSessionOutput(ctx.context.options, {
            ...session2.session,
            expiresAt: new Date(session2.session.expiresAt),
            createdAt: new Date(session2.session.createdAt),
            updatedAt: new Date(session2.session.updatedAt)
          });
          const parsedUser2 = parseUserOutput(ctx.context.options, {
            ...session2.user,
            createdAt: new Date(session2.user.createdAt),
            updatedAt: new Date(session2.user.updatedAt)
          });
          ctx.context.session = {
            session: parsedSession2,
            user: parsedUser2
          };
          return ctx.json({
            session: parsedSession2,
            user: parsedUser2
          });
        }
      }
    }
    const session = await ctx.context.internalAdapter.findSession(sessionCookieToken);
    ctx.context.session = session;
    if (!session || session.session.expiresAt < /* @__PURE__ */ new Date()) {
      deleteSessionCookie(ctx);
      if (session) {
        if (!deferSessionRefresh || isPostRequest) await ctx.context.internalAdapter.deleteSession(session.session.token);
      }
      return ctx.json(null);
    }
    if (dontRememberMe || ctx.query?.disableRefresh) {
      const parsedSession2 = parseSessionOutput(ctx.context.options, session.session);
      const parsedUser2 = parseUserOutput(ctx.context.options, session.user);
      return ctx.json({
        session: parsedSession2,
        user: parsedUser2
      });
    }
    const expiresIn = ctx.context.sessionConfig.expiresIn;
    const updateAge = ctx.context.sessionConfig.updateAge;
    const shouldBeUpdated = session.session.expiresAt.valueOf() - expiresIn * 1e3 + updateAge * 1e3 <= Date.now();
    const disableRefresh = ctx.query?.disableRefresh || ctx.context.options.session?.disableSessionRefresh;
    const shouldSkipSessionRefresh = await getShouldSkipSessionRefresh();
    const needsRefresh = shouldBeUpdated && !disableRefresh && !shouldSkipSessionRefresh;
    if (deferSessionRefresh && !isPostRequest) {
      await setCookieCache(ctx, session, !!dontRememberMe);
      const parsedSession2 = parseSessionOutput(ctx.context.options, session.session);
      const parsedUser2 = parseUserOutput(ctx.context.options, session.user);
      return ctx.json({
        session: parsedSession2,
        user: parsedUser2,
        needsRefresh
      });
    }
    if (needsRefresh) {
      const updatedSession = await ctx.context.internalAdapter.updateSession(session.session.token, {
        expiresAt: getDate(ctx.context.sessionConfig.expiresIn, "sec"),
        updatedAt: /* @__PURE__ */ new Date()
      });
      if (!updatedSession) {
        deleteSessionCookie(ctx);
        throw APIError.from("UNAUTHORIZED", BASE_ERROR_CODES.FAILED_TO_GET_SESSION);
      }
      const maxAge = (updatedSession.expiresAt.valueOf() - Date.now()) / 1e3;
      await setSessionCookie(ctx, {
        session: updatedSession,
        user: session.user
      }, false, { maxAge });
      const parsedUpdatedSession = parseSessionOutput(ctx.context.options, updatedSession);
      const parsedUser2 = parseUserOutput(ctx.context.options, session.user);
      return ctx.json({
        session: parsedUpdatedSession,
        user: parsedUser2
      });
    }
    await setCookieCache(ctx, session, !!dontRememberMe);
    const parsedSession = parseSessionOutput(ctx.context.options, session.session);
    const parsedUser = parseUserOutput(ctx.context.options, session.user);
    return ctx.json({
      session: parsedSession,
      user: parsedUser
    });
  } catch (error2) {
    if (isAPIError(error2)) throw error2;
    ctx.context.logger.error("INTERNAL_SERVER_ERROR", error2);
    throw APIError.from("INTERNAL_SERVER_ERROR", BASE_ERROR_CODES.FAILED_TO_GET_SESSION);
  }
});
const getSessionFromCtx = async (ctx, config) => {
  if (ctx.context.session) return ctx.context.session;
  const session = await getSession()({
    ...ctx,
    method: "GET",
    asResponse: false,
    headers: ctx.headers,
    returnHeaders: false,
    returnStatus: false,
    query: {
      ...config,
      ...ctx.query
    }
  }).catch((e) => {
    return null;
  });
  ctx.context.session = session;
  return session;
};
const sessionMiddleware = createAuthMiddleware(async (ctx) => {
  const session = await getSessionFromCtx(ctx);
  if (!session?.session) throw APIError.from("UNAUTHORIZED", {
    message: "Unauthorized",
    code: "UNAUTHORIZED"
  });
  return { session };
});
const sensitiveSessionMiddleware = createAuthMiddleware(async (ctx) => {
  const session = await getSessionFromCtx(ctx, { disableCookieCache: true });
  if (!session?.session) throw APIError.from("UNAUTHORIZED", {
    message: "Unauthorized",
    code: "UNAUTHORIZED"
  });
  return { session };
});
createAuthMiddleware(async (ctx) => {
  const session = await getSessionFromCtx(ctx);
  if (!session?.session && (ctx.request || ctx.headers)) throw APIError.from("UNAUTHORIZED", {
    message: "Unauthorized",
    code: "UNAUTHORIZED"
  });
  return { session };
});
const freshSessionMiddleware = createAuthMiddleware(async (ctx) => {
  const session = await getSessionFromCtx(ctx);
  if (!session?.session) throw APIError.from("UNAUTHORIZED", {
    message: "Unauthorized",
    code: "UNAUTHORIZED"
  });
  if (ctx.context.sessionConfig.freshAge !== 0) {
    const createdAt = new Date(session.session.createdAt).getTime();
    const freshAge = ctx.context.sessionConfig.freshAge * 1e3;
    if (Date.now() - createdAt >= freshAge) throw APIError.from("FORBIDDEN", BASE_ERROR_CODES.SESSION_NOT_FRESH);
  }
  return { session };
});
const listSessions = () => createAuthEndpoint("/list-sessions", {
  method: "GET",
  operationId: "listUserSessions",
  use: [sessionMiddleware],
  requireHeaders: true,
  metadata: { openapi: {
    operationId: "listUserSessions",
    description: "List all active sessions for the user",
    responses: { "200": {
      description: "Success",
      content: { "application/json": { schema: {
        type: "array",
        items: { $ref: "#/components/schemas/Session" }
      } } }
    } }
  } }
}, async (ctx) => {
  try {
    const activeSessions = (await ctx.context.internalAdapter.listSessions(ctx.context.session.user.id, { onlyActiveSessions: true })).filter((session) => {
      return session.expiresAt > /* @__PURE__ */ new Date();
    });
    return ctx.json(activeSessions.map((session) => parseSessionOutput(ctx.context.options, session)));
  } catch (e) {
    ctx.context.logger.error(e);
    throw ctx.error("INTERNAL_SERVER_ERROR");
  }
});
const revokeSession = createAuthEndpoint("/revoke-session", {
  method: "POST",
  body: z.object({ token: z.string().meta({ description: "The token to revoke" }) }),
  use: [sensitiveSessionMiddleware],
  requireHeaders: true,
  metadata: { openapi: {
    description: "Revoke a single session",
    requestBody: { content: { "application/json": { schema: {
      type: "object",
      properties: { token: {
        type: "string",
        description: "The token to revoke"
      } },
      required: ["token"]
    } } } },
    responses: { "200": {
      description: "Success",
      content: { "application/json": { schema: {
        type: "object",
        properties: { status: {
          type: "boolean",
          description: "Indicates if the session was revoked successfully"
        } },
        required: ["status"]
      } } }
    } }
  } }
}, async (ctx) => {
  const token = ctx.body.token;
  if ((await ctx.context.internalAdapter.findSession(token))?.session.userId === ctx.context.session.user.id) try {
    await ctx.context.internalAdapter.deleteSession(token);
  } catch (error2) {
    ctx.context.logger.error(error2 && typeof error2 === "object" && "name" in error2 ? error2.name : "", error2);
    throw APIError.from("INTERNAL_SERVER_ERROR", {
      message: "Internal Server Error",
      code: "INTERNAL_SERVER_ERROR"
    });
  }
  return ctx.json({ status: true });
});
const revokeSessions = createAuthEndpoint("/revoke-sessions", {
  method: "POST",
  use: [sensitiveSessionMiddleware],
  requireHeaders: true,
  metadata: { openapi: {
    description: "Revoke all sessions for the user",
    responses: { "200": {
      description: "Success",
      content: { "application/json": { schema: {
        type: "object",
        properties: { status: {
          type: "boolean",
          description: "Indicates if all sessions were revoked successfully"
        } },
        required: ["status"]
      } } }
    } }
  } }
}, async (ctx) => {
  try {
    await ctx.context.internalAdapter.deleteSessions(ctx.context.session.user.id);
  } catch (error2) {
    ctx.context.logger.error(error2 && typeof error2 === "object" && "name" in error2 ? error2.name : "", error2);
    throw APIError.from("INTERNAL_SERVER_ERROR", {
      message: "Internal Server Error",
      code: "INTERNAL_SERVER_ERROR"
    });
  }
  return ctx.json({ status: true });
});
const revokeOtherSessions = createAuthEndpoint("/revoke-other-sessions", {
  method: "POST",
  requireHeaders: true,
  use: [sensitiveSessionMiddleware],
  metadata: { openapi: {
    description: "Revoke all other sessions for the user except the current one",
    responses: { "200": {
      description: "Success",
      content: { "application/json": { schema: {
        type: "object",
        properties: { status: {
          type: "boolean",
          description: "Indicates if all other sessions were revoked successfully"
        } },
        required: ["status"]
      } } }
    } }
  } }
}, async (ctx) => {
  const session = ctx.context.session;
  if (!session.user) throw APIError.from("UNAUTHORIZED", {
    message: "Unauthorized",
    code: "UNAUTHORIZED"
  });
  const otherSessions = (await ctx.context.internalAdapter.listSessions(session.user.id)).filter((session2) => {
    return session2.expiresAt > /* @__PURE__ */ new Date();
  }).filter((session2) => session2.token !== ctx.context.session.session.token);
  await Promise.all(otherSessions.map((session2) => ctx.context.internalAdapter.deleteSession(session2.token)));
  return ctx.json({ status: true });
});
const defaultKeyHasher = async (identifier) => {
  const hash = await createHash$1("SHA-256").digest(new TextEncoder().encode(identifier));
  return base64Url.encode(new Uint8Array(hash), { padding: false });
};
async function processIdentifier(identifier, option) {
  if (!option || option === "plain") return identifier;
  if (option === "hashed") return defaultKeyHasher(identifier);
  if (typeof option === "object" && "hash" in option) return option.hash(identifier);
  return identifier;
}
function getStorageOption(identifier, config) {
  if (!config) return;
  if (typeof config === "object" && "default" in config) {
    if (config.overrides) {
      for (const [prefix, option] of Object.entries(config.overrides)) if (identifier.startsWith(prefix)) return option;
    }
    return config.default;
  }
  return config;
}
function getWithHooks(adapter, ctx) {
  const hooksEntries = ctx.hooks;
  async function createWithHooks(data, model, customCreateFn) {
    const context = await getCurrentAuthContext().catch(() => null);
    let actualData = data;
    for (const { source, hooks } of hooksEntries) {
      const toRun = hooks[model]?.create?.before;
      if (toRun) {
        const result = await withSpan(`db create.before ${model}`, {
          [ATTR_HOOK_TYPE]: "create.before",
          [ATTR_DB_COLLECTION_NAME]: model,
          [ATTR_CONTEXT]: source
        }, () => toRun(actualData, context));
        if (result === false) return null;
        if (typeof result === "object" && "data" in result) actualData = {
          ...actualData,
          ...result.data
        };
      }
    }
    let created = null;
    if (!customCreateFn || customCreateFn.executeMainFn) created = await (await getCurrentAdapter(adapter)).create({
      model,
      data: actualData,
      forceAllowId: true
    });
    if (customCreateFn?.fn) created = await customCreateFn.fn(created ?? actualData);
    for (const { source, hooks } of hooksEntries) {
      const toRun = hooks[model]?.create?.after;
      if (toRun) await queueAfterTransactionHook(async () => {
        await withSpan(`db create.after ${model}`, {
          [ATTR_HOOK_TYPE]: "create.after",
          [ATTR_DB_COLLECTION_NAME]: model,
          [ATTR_CONTEXT]: source
        }, () => toRun(created, context));
      });
    }
    return created;
  }
  async function updateWithHooks(data, where, model, customUpdateFn) {
    const context = await getCurrentAuthContext().catch(() => null);
    let actualData = data;
    for (const { source, hooks } of hooksEntries) {
      const toRun = hooks[model]?.update?.before;
      if (toRun) {
        const result = await withSpan(`db update.before ${model}`, {
          [ATTR_HOOK_TYPE]: "update.before",
          [ATTR_DB_COLLECTION_NAME]: model,
          [ATTR_CONTEXT]: source
        }, () => toRun(data, context));
        if (result === false) return null;
        if (typeof result === "object" && "data" in result) actualData = {
          ...actualData,
          ...result.data
        };
      }
    }
    const customUpdated = customUpdateFn ? await customUpdateFn.fn(actualData) : null;
    const updated = !customUpdateFn || customUpdateFn.executeMainFn ? await (await getCurrentAdapter(adapter)).update({
      model,
      update: actualData,
      where
    }) : customUpdated;
    for (const { source, hooks } of hooksEntries) {
      const toRun = hooks[model]?.update?.after;
      if (toRun) await queueAfterTransactionHook(async () => {
        await withSpan(`db update.after ${model}`, {
          [ATTR_HOOK_TYPE]: "update.after",
          [ATTR_DB_COLLECTION_NAME]: model,
          [ATTR_CONTEXT]: source
        }, () => toRun(updated, context));
      });
    }
    return updated;
  }
  async function updateManyWithHooks(data, where, model, customUpdateFn) {
    const context = await getCurrentAuthContext().catch(() => null);
    let actualData = data;
    for (const { source, hooks } of hooksEntries) {
      const toRun = hooks[model]?.update?.before;
      if (toRun) {
        const result = await withSpan(`db updateMany.before ${model}`, {
          [ATTR_HOOK_TYPE]: "updateMany.before",
          [ATTR_DB_COLLECTION_NAME]: model,
          [ATTR_CONTEXT]: source
        }, () => toRun(data, context));
        if (result === false) return null;
        if (typeof result === "object" && "data" in result) actualData = {
          ...actualData,
          ...result.data
        };
      }
    }
    const customUpdated = customUpdateFn ? await customUpdateFn.fn(actualData) : null;
    const updated = !customUpdateFn || customUpdateFn.executeMainFn ? await (await getCurrentAdapter(adapter)).updateMany({
      model,
      update: actualData,
      where
    }) : customUpdated;
    for (const { source, hooks } of hooksEntries) {
      const toRun = hooks[model]?.update?.after;
      if (toRun) await queueAfterTransactionHook(async () => {
        await withSpan(`db updateMany.after ${model}`, {
          [ATTR_HOOK_TYPE]: "updateMany.after",
          [ATTR_DB_COLLECTION_NAME]: model,
          [ATTR_CONTEXT]: source
        }, () => toRun(updated, context));
      });
    }
    return updated;
  }
  async function deleteWithHooks(where, model, customDeleteFn) {
    const context = await getCurrentAuthContext().catch(() => null);
    let entityToDelete = null;
    try {
      entityToDelete = (await (await getCurrentAdapter(adapter)).findMany({
        model,
        where,
        limit: 1
      }))[0] || null;
    } catch {
    }
    if (entityToDelete) for (const { source, hooks } of hooksEntries) {
      const toRun = hooks[model]?.delete?.before;
      if (toRun) {
        if (await withSpan(`db delete.before ${model}`, {
          [ATTR_HOOK_TYPE]: "delete.before",
          [ATTR_DB_COLLECTION_NAME]: model,
          [ATTR_CONTEXT]: source
        }, () => toRun(entityToDelete, context)) === false) return null;
      }
    }
    const customDeleted = customDeleteFn ? await customDeleteFn.fn(where) : null;
    const deleted = (!customDeleteFn || customDeleteFn.executeMainFn) && entityToDelete ? await (await getCurrentAdapter(adapter)).delete({
      model,
      where
    }) : customDeleted;
    if (entityToDelete) for (const { source, hooks } of hooksEntries) {
      const toRun = hooks[model]?.delete?.after;
      if (toRun) await queueAfterTransactionHook(async () => {
        await withSpan(`db delete.after ${model}`, {
          [ATTR_HOOK_TYPE]: "delete.after",
          [ATTR_DB_COLLECTION_NAME]: model,
          [ATTR_CONTEXT]: source
        }, () => toRun(entityToDelete, context));
      });
    }
    return deleted;
  }
  async function deleteManyWithHooks(where, model, customDeleteFn) {
    const context = await getCurrentAuthContext().catch(() => null);
    let entitiesToDelete = [];
    try {
      entitiesToDelete = await (await getCurrentAdapter(adapter)).findMany({
        model,
        where
      });
    } catch {
    }
    for (const entity2 of entitiesToDelete) for (const { source, hooks } of hooksEntries) {
      const toRun = hooks[model]?.delete?.before;
      if (toRun) {
        if (await withSpan(`db delete.before ${model}`, {
          [ATTR_HOOK_TYPE]: "delete.before",
          [ATTR_DB_COLLECTION_NAME]: model,
          [ATTR_CONTEXT]: source
        }, () => toRun(entity2, context)) === false) return null;
      }
    }
    const customDeleted = customDeleteFn ? await customDeleteFn.fn(where) : null;
    const deleted = !customDeleteFn || customDeleteFn.executeMainFn ? await (await getCurrentAdapter(adapter)).deleteMany({
      model,
      where
    }) : customDeleted;
    for (const entity2 of entitiesToDelete) for (const { source, hooks } of hooksEntries) {
      const toRun = hooks[model]?.delete?.after;
      if (toRun) await queueAfterTransactionHook(async () => {
        await withSpan(`db delete.after ${model}`, {
          [ATTR_HOOK_TYPE]: "delete.after",
          [ATTR_DB_COLLECTION_NAME]: model,
          [ATTR_CONTEXT]: source
        }, () => toRun(entity2, context));
      });
    }
    return deleted;
  }
  return {
    createWithHooks,
    updateWithHooks,
    updateManyWithHooks,
    deleteWithHooks,
    deleteManyWithHooks
  };
}
function getTTLSeconds(expiresAt, now2 = Date.now()) {
  const expiresMs = typeof expiresAt === "number" ? expiresAt : expiresAt.getTime();
  return Math.max(Math.floor((expiresMs - now2) / 1e3), 0);
}
const createInternalAdapter = (adapter, ctx) => {
  const logger2 = ctx.logger;
  const options = ctx.options;
  const secondaryStorage = options.secondaryStorage;
  const sessionExpiration = options.session?.expiresIn || 3600 * 24 * 7;
  const { createWithHooks, updateWithHooks, updateManyWithHooks, deleteWithHooks, deleteManyWithHooks } = getWithHooks(adapter, ctx);
  async function refreshUserSessions(user) {
    if (!secondaryStorage) return;
    const listRaw = await secondaryStorage.get(`active-sessions-${user.id}`);
    if (!listRaw) return;
    const now2 = Date.now();
    const validSessions = (safeJSONParse(listRaw) || []).filter((s) => s.expiresAt > now2);
    await Promise.all(validSessions.map(async ({ token }) => {
      const cached = await secondaryStorage.get(token);
      if (!cached) return;
      const parsed = safeJSONParse(cached);
      if (!parsed) return;
      const sessionTTL = getTTLSeconds(parsed.session.expiresAt, now2);
      await secondaryStorage.set(token, JSON.stringify({
        session: parsed.session,
        user
      }), Math.floor(sessionTTL));
    }));
  }
  return {
    createOAuthUser: async (user, account) => {
      return runWithTransaction(adapter, async () => {
        const createdUser = await createWithHooks({
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date(),
          ...user
        }, "user", void 0);
        return {
          user: createdUser,
          account: await createWithHooks({
            ...account,
            userId: createdUser.id,
            createdAt: /* @__PURE__ */ new Date(),
            updatedAt: /* @__PURE__ */ new Date()
          }, "account", void 0)
        };
      });
    },
    createUser: async (user) => {
      return await createWithHooks({
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date(),
        ...user,
        email: user.email?.toLowerCase()
      }, "user", void 0);
    },
    createAccount: async (account) => {
      return await createWithHooks({
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date(),
        ...account
      }, "account", void 0);
    },
    listSessions: async (userId, options2) => {
      if (secondaryStorage) {
        const currentList = await secondaryStorage.get(`active-sessions-${userId}`);
        if (!currentList) return [];
        const list = safeJSONParse(currentList) || [];
        const now2 = Date.now();
        const seenTokens = /* @__PURE__ */ new Set();
        const sessions = [];
        for (const { token, expiresAt } of list) {
          if (expiresAt <= now2 || seenTokens.has(token)) continue;
          seenTokens.add(token);
          const data = await secondaryStorage.get(token);
          if (!data) continue;
          try {
            const parsed = typeof data === "string" ? JSON.parse(data) : data;
            if (!parsed?.session) continue;
            sessions.push(parseSessionOutput(ctx.options, {
              ...parsed.session,
              expiresAt: new Date(parsed.session.expiresAt)
            }));
          } catch {
            continue;
          }
        }
        return sessions;
      }
      return await (await getCurrentAdapter(adapter)).findMany({
        model: "session",
        where: [{
          field: "userId",
          value: userId
        }, ...options2?.onlyActiveSessions ? [{
          field: "expiresAt",
          value: /* @__PURE__ */ new Date(),
          operator: "gt"
        }] : []]
      });
    },
    listUsers: async (limit, offset, sortBy, where) => {
      return await (await getCurrentAdapter(adapter)).findMany({
        model: "user",
        limit,
        offset,
        sortBy,
        where
      });
    },
    countTotalUsers: async (where) => {
      const total = await (await getCurrentAdapter(adapter)).count({
        model: "user",
        where
      });
      if (typeof total === "string") return parseInt(total);
      return total;
    },
    deleteUser: async (userId) => {
      if (!secondaryStorage || options.session?.storeSessionInDatabase) await deleteManyWithHooks([{
        field: "userId",
        value: userId
      }], "session", void 0);
      await deleteManyWithHooks([{
        field: "userId",
        value: userId
      }], "account", void 0);
      await deleteWithHooks([{
        field: "id",
        value: userId
      }], "user", void 0);
    },
    createSession: async (userId, dontRememberMe, override, overrideAll) => {
      const headers = await (async () => {
        const ctx2 = await getCurrentAuthContext().catch(() => null);
        return ctx2?.headers || ctx2?.request?.headers;
      })();
      const storeInDb = options.session?.storeSessionInDatabase;
      const { id: _, ...rest } = override || {};
      let sessionId;
      if (secondaryStorage && !storeInDb) {
        const generatedId = ctx.generateId({ model: "session" });
        sessionId = generatedId !== false ? generatedId : generateId();
      }
      const defaultAdditionalFields = getSessionDefaultFields(options);
      const data = {
        ...sessionId ? { id: sessionId } : {},
        ipAddress: headers ? getIp(headers, options) || "" : "",
        userAgent: headers?.get("user-agent") || "",
        ...rest,
        expiresAt: dontRememberMe ? getDate(3600 * 24, "sec") : getDate(sessionExpiration, "sec"),
        userId,
        token: generateId(32),
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date(),
        ...defaultAdditionalFields,
        ...overrideAll ? rest : {}
      };
      return await createWithHooks(data, "session", secondaryStorage ? {
        fn: async (sessionData) => {
          const currentList = await secondaryStorage.get(`active-sessions-${userId}`);
          let list = [];
          const now2 = Date.now();
          if (currentList) {
            list = safeJSONParse(currentList) || [];
            list = list.filter((session) => session.expiresAt > now2 && session.token !== data.token);
          }
          const sorted = [...list, {
            token: data.token,
            expiresAt: data.expiresAt.getTime()
          }].sort((a, b) => a.expiresAt - b.expiresAt);
          const furthestSessionTTL = getTTLSeconds(sorted.at(-1)?.expiresAt ?? data.expiresAt.getTime(), now2);
          if (furthestSessionTTL > 0) await secondaryStorage.set(`active-sessions-${userId}`, JSON.stringify(sorted), furthestSessionTTL);
          const user = await (await getCurrentAdapter(adapter)).findOne({
            model: "user",
            where: [{
              field: "id",
              value: userId
            }]
          });
          const sessionTTL = getTTLSeconds(data.expiresAt, now2);
          if (sessionTTL > 0) await secondaryStorage.set(data.token, JSON.stringify({
            session: sessionData,
            user
          }), sessionTTL);
          return sessionData;
        },
        executeMainFn: storeInDb
      } : void 0);
    },
    findSession: async (token) => {
      if (secondaryStorage) {
        const sessionStringified = await secondaryStorage.get(token);
        if (!sessionStringified && (!options.session?.storeSessionInDatabase || ctx.options.session?.preserveSessionInDatabase)) return null;
        if (sessionStringified) {
          const s = safeJSONParse(sessionStringified);
          if (!s) return null;
          return {
            session: parseSessionOutput(ctx.options, {
              ...s.session,
              expiresAt: new Date(s.session.expiresAt),
              createdAt: new Date(s.session.createdAt),
              updatedAt: new Date(s.session.updatedAt)
            }),
            user: parseUserOutput(ctx.options, {
              ...s.user,
              createdAt: new Date(s.user.createdAt),
              updatedAt: new Date(s.user.updatedAt)
            })
          };
        }
      }
      const result = await (await getCurrentAdapter(adapter)).findOne({
        model: "session",
        where: [{
          value: token,
          field: "token"
        }],
        join: { user: true }
      });
      if (!result) return null;
      const { user, ...session } = result;
      if (!user) return null;
      return {
        session: parseSessionOutput(ctx.options, session),
        user: parseUserOutput(ctx.options, user)
      };
    },
    findSessions: async (sessionTokens, options2) => {
      if (secondaryStorage) {
        const sessions2 = [];
        for (const sessionToken of sessionTokens) {
          const sessionStringified = await secondaryStorage.get(sessionToken);
          if (sessionStringified) try {
            const s = typeof sessionStringified === "string" ? JSON.parse(sessionStringified) : sessionStringified;
            if (!s) return [];
            const expiresAt = new Date(s.session.expiresAt);
            if (options2?.onlyActiveSessions && expiresAt <= /* @__PURE__ */ new Date()) continue;
            const session = {
              session: {
                ...s.session,
                expiresAt: new Date(s.session.expiresAt)
              },
              user: {
                ...s.user,
                createdAt: new Date(s.user.createdAt),
                updatedAt: new Date(s.user.updatedAt)
              }
            };
            sessions2.push(session);
          } catch {
            continue;
          }
        }
        return sessions2;
      }
      const sessions = await (await getCurrentAdapter(adapter)).findMany({
        model: "session",
        where: [{
          field: "token",
          value: sessionTokens,
          operator: "in"
        }, ...options2?.onlyActiveSessions ? [{
          field: "expiresAt",
          value: /* @__PURE__ */ new Date(),
          operator: "gt"
        }] : []],
        join: { user: true }
      });
      if (!sessions.length) return [];
      if (sessions.some((session) => !session.user)) return [];
      return sessions.map((_session) => {
        const { user, ...session } = _session;
        return {
          session,
          user
        };
      });
    },
    updateSession: async (sessionToken, session) => {
      return await updateWithHooks(session, [{
        field: "token",
        value: sessionToken
      }], "session", secondaryStorage ? {
        async fn(data) {
          const currentSession = await secondaryStorage.get(sessionToken);
          if (!currentSession) return null;
          const parsedSession = safeJSONParse(currentSession);
          if (!parsedSession) return null;
          const mergedSession = {
            ...parsedSession.session,
            ...data,
            expiresAt: new Date(data.expiresAt ?? parsedSession.session.expiresAt),
            createdAt: new Date(parsedSession.session.createdAt),
            updatedAt: new Date(data.updatedAt ?? parsedSession.session.updatedAt)
          };
          const updatedSession = parseSessionOutput(ctx.options, mergedSession);
          const now2 = Date.now();
          const expiresMs = new Date(updatedSession.expiresAt).getTime();
          const sessionTTL = getTTLSeconds(expiresMs, now2);
          if (sessionTTL > 0) {
            await secondaryStorage.set(sessionToken, JSON.stringify({
              session: updatedSession,
              user: parsedSession.user
            }), sessionTTL);
            const listKey = `active-sessions-${updatedSession.userId}`;
            const listRaw = await secondaryStorage.get(listKey);
            const sorted = (listRaw ? safeJSONParse(listRaw) || [] : []).filter((s) => s.token !== sessionToken && s.expiresAt > now2).concat([{
              token: sessionToken,
              expiresAt: expiresMs
            }]).sort((a, b) => a.expiresAt - b.expiresAt);
            const furthestSessionExp = sorted.at(-1)?.expiresAt;
            if (furthestSessionExp && furthestSessionExp > now2) await secondaryStorage.set(listKey, JSON.stringify(sorted), getTTLSeconds(furthestSessionExp, now2));
            else await secondaryStorage.delete(listKey);
          }
          return updatedSession;
        },
        executeMainFn: options.session?.storeSessionInDatabase
      } : void 0);
    },
    deleteSession: async (token) => {
      if (secondaryStorage) {
        const data = await secondaryStorage.get(token);
        if (data) {
          const { session } = safeJSONParse(data) ?? {};
          if (!session) {
            logger2.error("Session not found in secondary storage");
            return;
          }
          const userId = session.userId;
          const currentList = await secondaryStorage.get(`active-sessions-${userId}`);
          if (currentList) {
            const list = safeJSONParse(currentList) || [];
            const now2 = Date.now();
            const filtered = list.filter((session2) => session2.expiresAt > now2 && session2.token !== token);
            const furthestSessionExp = filtered.sort((a, b) => a.expiresAt - b.expiresAt).at(-1)?.expiresAt;
            if (filtered.length > 0 && furthestSessionExp && furthestSessionExp > Date.now()) await secondaryStorage.set(`active-sessions-${userId}`, JSON.stringify(filtered), getTTLSeconds(furthestSessionExp, now2));
            else await secondaryStorage.delete(`active-sessions-${userId}`);
          } else logger2.error("Active sessions list not found in secondary storage");
        }
        await secondaryStorage.delete(token);
        if (!options.session?.storeSessionInDatabase || ctx.options.session?.preserveSessionInDatabase) return;
      }
      await deleteWithHooks([{
        field: "token",
        value: token
      }], "session", void 0);
    },
    deleteAccounts: async (userId) => {
      await deleteManyWithHooks([{
        field: "userId",
        value: userId
      }], "account", void 0);
    },
    deleteAccount: async (accountId) => {
      await deleteWithHooks([{
        field: "id",
        value: accountId
      }], "account", void 0);
    },
    deleteSessions: async (userIdOrSessionTokens) => {
      if (secondaryStorage) {
        if (typeof userIdOrSessionTokens === "string") {
          const activeSession = await secondaryStorage.get(`active-sessions-${userIdOrSessionTokens}`);
          const sessions = activeSession ? safeJSONParse(activeSession) : [];
          if (!sessions) return;
          for (const session of sessions) await secondaryStorage.delete(session.token);
          await secondaryStorage.delete(`active-sessions-${userIdOrSessionTokens}`);
        } else for (const sessionToken of userIdOrSessionTokens) if (await secondaryStorage.get(sessionToken)) await secondaryStorage.delete(sessionToken);
        if (!options.session?.storeSessionInDatabase || ctx.options.session?.preserveSessionInDatabase) return;
      }
      await deleteManyWithHooks([{
        field: Array.isArray(userIdOrSessionTokens) ? "token" : "userId",
        value: userIdOrSessionTokens,
        operator: Array.isArray(userIdOrSessionTokens) ? "in" : void 0
      }], "session", void 0);
    },
    findOAuthUser: async (email, accountId, providerId) => {
      const account = await (await getCurrentAdapter(adapter)).findOne({
        model: "account",
        where: [{
          value: accountId,
          field: "accountId"
        }, {
          value: providerId,
          field: "providerId"
        }],
        join: { user: true }
      });
      if (account) if (account.user) return {
        user: account.user,
        linkedAccount: account,
        accounts: [account]
      };
      else {
        const user = await (await getCurrentAdapter(adapter)).findOne({
          model: "user",
          where: [{
            value: email.toLowerCase(),
            field: "email"
          }]
        });
        if (user) return {
          user,
          linkedAccount: account,
          accounts: [account]
        };
        return null;
      }
      else {
        const user = await (await getCurrentAdapter(adapter)).findOne({
          model: "user",
          where: [{
            value: email.toLowerCase(),
            field: "email"
          }]
        });
        if (user) return {
          user,
          linkedAccount: null,
          accounts: await (await getCurrentAdapter(adapter)).findMany({
            model: "account",
            where: [{
              value: user.id,
              field: "userId"
            }]
          }) || []
        };
        else return null;
      }
    },
    findUserByEmail: async (email, options2) => {
      const result = await (await getCurrentAdapter(adapter)).findOne({
        model: "user",
        where: [{
          value: email.toLowerCase(),
          field: "email"
        }],
        join: { ...options2?.includeAccounts ? { account: true } : {} }
      });
      if (!result) return null;
      const { account: accounts, ...user } = result;
      return {
        user,
        accounts: accounts ?? []
      };
    },
    findUserById: async (userId) => {
      if (!userId) return null;
      return await (await getCurrentAdapter(adapter)).findOne({
        model: "user",
        where: [{
          field: "id",
          value: userId
        }]
      });
    },
    linkAccount: async (account) => {
      return await createWithHooks({
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date(),
        ...account
      }, "account", void 0);
    },
    updateUser: async (userId, data) => {
      const user = await updateWithHooks(data, [{
        field: "id",
        value: userId
      }], "user", void 0);
      await refreshUserSessions(user);
      return user;
    },
    updateUserByEmail: async (email, data) => {
      const user = await updateWithHooks(data, [{
        field: "email",
        value: email.toLowerCase()
      }], "user", void 0);
      await refreshUserSessions(user);
      return user;
    },
    updatePassword: async (userId, password) => {
      await updateManyWithHooks({ password }, [{
        field: "userId",
        value: userId
      }, {
        field: "providerId",
        value: "credential"
      }], "account", void 0);
    },
    findAccounts: async (userId) => {
      return await (await getCurrentAdapter(adapter)).findMany({
        model: "account",
        where: [{
          field: "userId",
          value: userId
        }]
      });
    },
    findAccount: async (accountId) => {
      return await (await getCurrentAdapter(adapter)).findOne({
        model: "account",
        where: [{
          field: "accountId",
          value: accountId
        }]
      });
    },
    findAccountByProviderId: async (accountId, providerId) => {
      return await (await getCurrentAdapter(adapter)).findOne({
        model: "account",
        where: [{
          field: "accountId",
          value: accountId
        }, {
          field: "providerId",
          value: providerId
        }]
      });
    },
    findAccountByUserId: async (userId) => {
      return await (await getCurrentAdapter(adapter)).findMany({
        model: "account",
        where: [{
          field: "userId",
          value: userId
        }]
      });
    },
    updateAccount: async (id, data) => {
      return await updateWithHooks(data, [{
        field: "id",
        value: id
      }], "account", void 0);
    },
    createVerificationValue: async (data) => {
      const storageOption = getStorageOption(data.identifier, options.verification?.storeIdentifier);
      const storedIdentifier = await processIdentifier(data.identifier, storageOption);
      return await createWithHooks({
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date(),
        ...data,
        identifier: storedIdentifier
      }, "verification", secondaryStorage ? {
        async fn(verificationData) {
          const ttl = getTTLSeconds(verificationData.expiresAt);
          if (ttl > 0) await secondaryStorage.set(`verification:${storedIdentifier}`, JSON.stringify(verificationData), ttl);
          return verificationData;
        },
        executeMainFn: options.verification?.storeInDatabase
      } : void 0);
    },
    findVerificationValue: async (identifier) => {
      const storageOption = getStorageOption(identifier, options.verification?.storeIdentifier);
      const storedIdentifier = await processIdentifier(identifier, storageOption);
      if (secondaryStorage) {
        const cached = await secondaryStorage.get(`verification:${storedIdentifier}`);
        if (cached) {
          const parsed = safeJSONParse(cached);
          if (parsed) return parsed;
        }
        if (storageOption && storageOption !== "plain") {
          const plainCached = await secondaryStorage.get(`verification:${identifier}`);
          if (plainCached) {
            const parsed = safeJSONParse(plainCached);
            if (parsed) return parsed;
          }
        }
        if (!options.verification?.storeInDatabase) return null;
      }
      const currentAdapter = await getCurrentAdapter(adapter);
      async function findByIdentifier(id) {
        return currentAdapter.findMany({
          model: "verification",
          where: [{
            field: "identifier",
            value: id
          }],
          sortBy: {
            field: "createdAt",
            direction: "desc"
          },
          limit: 1
        });
      }
      let verification = await findByIdentifier(storedIdentifier);
      if (!verification.length && storageOption && storageOption !== "plain") verification = await findByIdentifier(identifier);
      if (!options.verification?.disableCleanup) await deleteManyWithHooks([{
        field: "expiresAt",
        value: /* @__PURE__ */ new Date(),
        operator: "lt"
      }], "verification", void 0);
      return verification[0] || null;
    },
    deleteVerificationByIdentifier: async (identifier) => {
      const storedIdentifier = await processIdentifier(identifier, getStorageOption(identifier, options.verification?.storeIdentifier));
      if (secondaryStorage) await secondaryStorage.delete(`verification:${storedIdentifier}`);
      if (!secondaryStorage || options.verification?.storeInDatabase) await deleteWithHooks([{
        field: "identifier",
        value: storedIdentifier
      }], "verification", void 0);
    },
    updateVerificationByIdentifier: async (identifier, data) => {
      const storedIdentifier = await processIdentifier(identifier, getStorageOption(identifier, options.verification?.storeIdentifier));
      if (secondaryStorage) {
        const cached = await secondaryStorage.get(`verification:${storedIdentifier}`);
        if (cached) {
          const parsed = safeJSONParse(cached);
          if (parsed) {
            const updated = {
              ...parsed,
              ...data
            };
            const expiresAt = updated.expiresAt ?? parsed.expiresAt;
            const ttl = getTTLSeconds(expiresAt instanceof Date ? expiresAt : new Date(expiresAt));
            if (ttl > 0) await secondaryStorage.set(`verification:${storedIdentifier}`, JSON.stringify(updated), ttl);
            if (!options.verification?.storeInDatabase) return updated;
          }
        }
      }
      if (!secondaryStorage || options.verification?.storeInDatabase) return await updateWithHooks(data, [{
        field: "identifier",
        value: storedIdentifier
      }], "verification", void 0);
      return data;
    }
  };
};
async function runPluginInit(context) {
  let options = context.options;
  const plugins = options.plugins || [];
  const pluginTrustedOrigins = [];
  const dbHooks = [];
  for (const plugin of plugins) if (plugin.init) {
    const initPromise = plugin.init(context);
    let result;
    if (isPromise(initPromise)) result = await initPromise;
    else result = initPromise;
    if (typeof result === "object") {
      if (result.options) {
        const { databaseHooks, trustedOrigins: trustedOrigins2, ...restOpts } = result.options;
        if (databaseHooks) dbHooks.push({
          source: `plugin:${plugin.id}`,
          hooks: databaseHooks
        });
        if (trustedOrigins2) pluginTrustedOrigins.push(trustedOrigins2);
        options = defu(options, restOpts);
      }
      if (result.context) Object.assign(context, result.context);
    }
  }
  if (pluginTrustedOrigins.length > 0) {
    const allSources = [...options.trustedOrigins ? [options.trustedOrigins] : [], ...pluginTrustedOrigins];
    const staticOrigins = allSources.filter(Array.isArray).flat();
    const dynamicOrigins = allSources.filter((s) => typeof s === "function");
    if (dynamicOrigins.length > 0) options.trustedOrigins = async (request) => {
      const resolved = await Promise.all(dynamicOrigins.map((fn) => fn(request)));
      return [...staticOrigins, ...resolved.flat()].filter((v) => typeof v === "string" && v !== "");
    };
    else options.trustedOrigins = staticOrigins;
  }
  if (options.databaseHooks) dbHooks.push({
    source: "user",
    hooks: options.databaseHooks
  });
  context.internalAdapter = createInternalAdapter(context.adapter, {
    options,
    logger: context.logger,
    hooks: dbHooks,
    generateId: context.generateId
  });
  context.options = options;
}
function getInternalPlugins(options) {
  const plugins = [];
  if (options.advanced?.crossSubDomainCookies?.enabled) ;
  return plugins;
}
async function getTrustedOrigins(options, request) {
  const trustedOrigins2 = [];
  if (isDynamicBaseURLConfig(options.baseURL)) {
    const allowedHosts = options.baseURL.allowedHosts;
    for (const host of allowedHosts) if (!host.includes("://")) {
      trustedOrigins2.push(`https://${host}`);
      if (isLoopbackHost(host)) trustedOrigins2.push(`http://${host}`);
    } else trustedOrigins2.push(host);
    if (options.baseURL.fallback) try {
      trustedOrigins2.push(new URL(options.baseURL.fallback).origin);
    } catch {
    }
  } else {
    const baseURL = getBaseURL(typeof options.baseURL === "string" ? options.baseURL : void 0, options.basePath, request);
    if (baseURL) trustedOrigins2.push(new URL(baseURL).origin);
  }
  if (options.trustedOrigins) {
    if (Array.isArray(options.trustedOrigins)) trustedOrigins2.push(...options.trustedOrigins);
    if (typeof options.trustedOrigins === "function") {
      const validOrigins = await options.trustedOrigins(request);
      trustedOrigins2.push(...validOrigins);
    }
  }
  const envTrustedOrigins = env.BETTER_AUTH_TRUSTED_ORIGINS;
  if (envTrustedOrigins) trustedOrigins2.push(...envTrustedOrigins.split(","));
  return trustedOrigins2.filter((v) => Boolean(v));
}
function pickSource(input) {
  if (isRequestLike(input?.request)) return input.request;
  if (!input?.headers) return void 0;
  const headers = input.headers instanceof Headers ? input.headers : new Headers(input.headers);
  if (!headers.has("host") && !headers.has("x-forwarded-host")) return;
  return headers;
}
function resolveDynamicTrustedProxyHeaders(options) {
  return options.advanced?.trustedProxyHeaders ?? true;
}
async function resolveRequestContext(ctx, source, trustedProxyHeaders) {
  const dynamicBaseURLConfig = ctx.options.baseURL;
  const baseURL = resolveBaseURL(dynamicBaseURLConfig, ctx.options.basePath || "/api/auth", source, void 0, trustedProxyHeaders);
  if (!baseURL) throw new BetterAuthError("Could not resolve base URL from request. Check your allowedHosts config.");
  const resolved = Object.create(Object.getPrototypeOf(ctx), Object.getOwnPropertyDescriptors(ctx));
  resolved.baseURL = baseURL;
  resolved.options = {
    ...ctx.options,
    baseURL: getOrigin(baseURL) || void 0
  };
  const trustedOriginOptions = {
    ...resolved.options,
    baseURL: dynamicBaseURLConfig
  };
  const needsRequest = typeof ctx.options.trustedOrigins === "function" || typeof ctx.options.account?.accountLinking?.trustedProviders === "function";
  let callbackRequest;
  if (needsRequest) if (isRequestLike(source)) callbackRequest = source;
  else if (source) callbackRequest = new Request(baseURL, { headers: source });
  else callbackRequest = void 0;
  else callbackRequest = void 0;
  resolved.trustedOrigins = await getTrustedOrigins(trustedOriginOptions, callbackRequest);
  resolved.trustedProviders = await getTrustedProviders(resolved.options, callbackRequest);
  if (ctx.options.advanced?.crossSubDomainCookies?.enabled) {
    resolved.authCookies = getCookies(resolved.options);
    resolved.createAuthCookie = createCookieGetter(resolved.options);
  }
  return resolved;
}
async function getAwaitableValue(arr, item) {
  if (!arr) return void 0;
  for (const val of arr) {
    const value = typeof val === "function" ? await val() : val;
    if (value[item.field ?? "id"] === item.value) return value;
  }
}
async function getTrustedProviders(options, request) {
  const trustedProviders = options.account?.accountLinking?.trustedProviders;
  if (!trustedProviders) return [];
  if (Array.isArray(trustedProviders)) return trustedProviders.filter((v) => Boolean(v));
  return (await trustedProviders(request) ?? []).filter((v) => Boolean(v));
}
function isLikelyEncrypted(token) {
  if (token.startsWith("$ba$")) return true;
  return token.length % 2 === 0 && /^[0-9a-f]+$/i.test(token);
}
function decryptOAuthToken(token, ctx) {
  if (!token) return token;
  if (ctx.options.account?.encryptOAuthTokens) {
    if (!isLikelyEncrypted(token)) return token;
    return symmetricDecrypt({
      key: ctx.secretConfig,
      data: token
    });
  }
  return token;
}
function setTokenUtil(token, ctx) {
  if (ctx.options.account?.encryptOAuthTokens && token) return symmetricEncrypt({
    key: ctx.secretConfig,
    data: token
  });
  return token;
}
const listUserAccounts = createAuthEndpoint("/list-accounts", {
  method: "GET",
  use: [sessionMiddleware],
  metadata: { openapi: {
    operationId: "listUserAccounts",
    description: "List all accounts linked to the user",
    responses: { "200": {
      description: "Success",
      content: { "application/json": { schema: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            providerId: { type: "string" },
            createdAt: {
              type: "string",
              format: "date-time"
            },
            updatedAt: {
              type: "string",
              format: "date-time"
            },
            accountId: { type: "string" },
            userId: { type: "string" },
            scopes: {
              type: "array",
              items: { type: "string" }
            }
          },
          required: [
            "id",
            "providerId",
            "createdAt",
            "updatedAt",
            "accountId",
            "userId",
            "scopes"
          ]
        }
      } } }
    } }
  } }
}, async (c) => {
  const session = c.context.session;
  const accounts = await c.context.internalAdapter.findAccounts(session.user.id);
  return c.json(accounts.map((a) => {
    const { scope, ...parsed } = parseAccountOutput(c.context.options, a);
    return {
      ...parsed,
      scopes: scope?.split(",") || []
    };
  }));
});
const linkSocialAccount = createAuthEndpoint("/link-social", {
  method: "POST",
  requireHeaders: true,
  body: z.object({
    callbackURL: z.string().meta({ description: "The URL to redirect to after the user has signed in" }).optional(),
    provider: SocialProviderListEnum,
    idToken: z.object({
      token: z.string(),
      nonce: z.string().optional(),
      accessToken: z.string().optional(),
      refreshToken: z.string().optional(),
      scopes: z.array(z.string()).optional()
    }).optional(),
    requestSignUp: z.boolean().optional(),
    scopes: z.array(z.string()).meta({ description: "Additional scopes to request from the provider" }).optional(),
    errorCallbackURL: z.string().meta({ description: "The URL to redirect to if there is an error during the link process" }).optional(),
    disableRedirect: z.boolean().meta({ description: "Disable automatic redirection to the provider. Useful for handling the redirection yourself" }).optional(),
    additionalData: z.record(z.string(), z.any()).optional()
  }),
  use: [sessionMiddleware],
  metadata: { openapi: {
    description: "Link a social account to the user",
    operationId: "linkSocialAccount",
    responses: { "200": {
      description: "Success",
      content: { "application/json": { schema: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "The authorization URL to redirect the user to"
          },
          redirect: {
            type: "boolean",
            description: "Indicates if the user should be redirected to the authorization URL"
          },
          status: { type: "boolean" }
        },
        required: ["redirect"]
      } } }
    } }
  } }
}, async (c) => {
  const session = c.context.session;
  const provider = await getAwaitableValue(c.context.socialProviders, { value: c.body.provider });
  if (!provider) {
    c.context.logger.error("Provider not found. Make sure to add the provider in your auth config", { provider: c.body.provider });
    throw APIError.from("NOT_FOUND", BASE_ERROR_CODES.PROVIDER_NOT_FOUND);
  }
  if (c.body.idToken) {
    if (!provider.verifyIdToken) {
      c.context.logger.error("Provider does not support id token verification", { provider: c.body.provider });
      throw APIError.from("NOT_FOUND", BASE_ERROR_CODES.ID_TOKEN_NOT_SUPPORTED);
    }
    const { token, nonce } = c.body.idToken;
    if (!await provider.verifyIdToken(token, nonce)) {
      c.context.logger.error("Invalid id token", { provider: c.body.provider });
      throw APIError.from("UNAUTHORIZED", BASE_ERROR_CODES.INVALID_TOKEN);
    }
    const linkingUserInfo = await provider.getUserInfo({
      idToken: token,
      accessToken: c.body.idToken.accessToken,
      refreshToken: c.body.idToken.refreshToken
    });
    if (!linkingUserInfo || !linkingUserInfo?.user) {
      c.context.logger.error("Failed to get user info", { provider: c.body.provider });
      throw APIError.from("UNAUTHORIZED", BASE_ERROR_CODES.FAILED_TO_GET_USER_INFO);
    }
    const linkingUserId = String(linkingUserInfo.user.id);
    if (!linkingUserInfo.user.email) {
      c.context.logger.error("User email not found", { provider: c.body.provider });
      throw APIError.from("UNAUTHORIZED", BASE_ERROR_CODES.USER_EMAIL_NOT_FOUND);
    }
    if ((await c.context.internalAdapter.findAccounts(session.user.id)).find((a) => a.providerId === provider.id && a.accountId === linkingUserId)) return c.json({
      url: "",
      status: true,
      redirect: false
    });
    if (!c.context.trustedProviders.includes(provider.id) && !linkingUserInfo.user.emailVerified || c.context.options.account?.accountLinking?.enabled === false) throw APIError.from("UNAUTHORIZED", {
      message: "Account not linked - linking not allowed",
      code: "LINKING_NOT_ALLOWED"
    });
    if (linkingUserInfo.user.email?.toLowerCase() !== session.user.email.toLowerCase() && c.context.options.account?.accountLinking?.allowDifferentEmails !== true) throw APIError.from("UNAUTHORIZED", {
      message: "Account not linked - different emails not allowed",
      code: "LINKING_DIFFERENT_EMAILS_NOT_ALLOWED"
    });
    try {
      await c.context.internalAdapter.createAccount({
        userId: session.user.id,
        providerId: provider.id,
        accountId: linkingUserId,
        accessToken: c.body.idToken.accessToken,
        idToken: token,
        refreshToken: c.body.idToken.refreshToken,
        scope: c.body.idToken.scopes?.join(",")
      });
    } catch (_e) {
      throw APIError.from("EXPECTATION_FAILED", {
        message: "Account not linked - unable to create account",
        code: "LINKING_FAILED"
      });
    }
    if (c.context.options.account?.accountLinking?.updateUserInfoOnLink === true) try {
      await c.context.internalAdapter.updateUser(session.user.id, {
        name: linkingUserInfo.user?.name,
        image: linkingUserInfo.user?.image
      });
    } catch (e) {
      console.warn("Could not update user - " + e.toString());
    }
    return c.json({
      url: "",
      status: true,
      redirect: false
    });
  }
  const state = await generateState(c, {
    userId: session.user.id,
    email: session.user.email
  }, c.body.additionalData);
  const url2 = await provider.createAuthorizationURL({
    state: state.state,
    codeVerifier: state.codeVerifier,
    redirectURI: `${c.context.baseURL}/callback/${provider.id}`,
    scopes: c.body.scopes
  });
  if (!c.body.disableRedirect) c.setHeader("Location", url2.toString());
  return c.json({
    url: url2.toString(),
    redirect: !c.body.disableRedirect
  });
});
const unlinkAccount = createAuthEndpoint("/unlink-account", {
  method: "POST",
  body: z.object({
    providerId: z.string(),
    accountId: z.string().optional()
  }),
  use: [freshSessionMiddleware],
  metadata: { openapi: {
    description: "Unlink an account",
    responses: { "200": {
      description: "Success",
      content: { "application/json": { schema: {
        type: "object",
        properties: { status: { type: "boolean" } }
      } } }
    } }
  } }
}, async (ctx) => {
  const { providerId, accountId } = ctx.body;
  const accounts = await ctx.context.internalAdapter.findAccounts(ctx.context.session.user.id);
  if (accounts.length === 1 && !ctx.context.options.account?.accountLinking?.allowUnlinkingAll) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.FAILED_TO_UNLINK_LAST_ACCOUNT);
  const accountExist = accounts.find((account) => accountId ? account.accountId === accountId && account.providerId === providerId : account.providerId === providerId);
  if (!accountExist) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.ACCOUNT_NOT_FOUND);
  await ctx.context.internalAdapter.deleteAccount(accountExist.id);
  return ctx.json({ status: true });
});
const getAccessToken = createAuthEndpoint("/get-access-token", {
  method: "POST",
  body: z.object({
    providerId: z.string().meta({ description: "The provider ID for the OAuth provider" }),
    accountId: z.string().meta({ description: "The account ID associated with the refresh token" }).optional(),
    userId: z.string().meta({ description: "The user ID associated with the account" }).optional()
  }),
  metadata: { openapi: {
    description: "Get a valid access token, doing a refresh if needed",
    responses: {
      200: {
        description: "A Valid access token",
        content: { "application/json": { schema: {
          type: "object",
          properties: {
            tokenType: { type: "string" },
            idToken: { type: "string" },
            accessToken: { type: "string" },
            accessTokenExpiresAt: {
              type: "string",
              format: "date-time"
            }
          }
        } } }
      },
      400: { description: "Invalid refresh token or provider configuration" }
    }
  } }
}, async (ctx) => {
  const { providerId, accountId, userId } = ctx.body || {};
  const req = ctx.request;
  const session = await getSessionFromCtx(ctx);
  if (req && !session) throw ctx.error("UNAUTHORIZED");
  const resolvedUserId = session?.user?.id || userId;
  if (!resolvedUserId) throw ctx.error("UNAUTHORIZED");
  const provider = await getAwaitableValue(ctx.context.socialProviders, { value: providerId });
  if (!provider) throw APIError.from("BAD_REQUEST", {
    message: `Provider ${providerId} is not supported.`,
    code: "PROVIDER_NOT_SUPPORTED"
  });
  const accountData = await getAccountCookie(ctx);
  let account = void 0;
  if (accountData && accountData.userId === resolvedUserId && providerId === accountData.providerId && (!accountId || accountData.accountId === accountId)) account = accountData;
  else account = (await ctx.context.internalAdapter.findAccounts(resolvedUserId)).find((acc) => accountId ? acc.accountId === accountId && acc.providerId === providerId : acc.providerId === providerId);
  if (!account) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.ACCOUNT_NOT_FOUND);
  try {
    let newTokens = null;
    const accessTokenExpired = account.accessTokenExpiresAt && new Date(account.accessTokenExpiresAt).getTime() - Date.now() < 5e3;
    if (account.refreshToken && accessTokenExpired && provider.refreshAccessToken) {
      const refreshToken2 = await decryptOAuthToken(account.refreshToken, ctx.context);
      newTokens = await provider.refreshAccessToken(refreshToken2);
      const updatedData = {
        accessToken: await setTokenUtil(newTokens?.accessToken, ctx.context),
        accessTokenExpiresAt: newTokens?.accessTokenExpiresAt,
        refreshToken: newTokens?.refreshToken ? await setTokenUtil(newTokens.refreshToken, ctx.context) : account.refreshToken,
        refreshTokenExpiresAt: newTokens?.refreshTokenExpiresAt ?? account.refreshTokenExpiresAt,
        idToken: newTokens?.idToken || account.idToken
      };
      let updatedAccount = null;
      if (account.id) updatedAccount = await ctx.context.internalAdapter.updateAccount(account.id, updatedData);
      if (ctx.context.options.account?.storeAccountCookie) await setAccountCookie(ctx, {
        ...account,
        ...updatedAccount ?? updatedData
      });
    }
    const accessTokenExpiresAt = (() => {
      if (newTokens?.accessTokenExpiresAt) {
        if (typeof newTokens.accessTokenExpiresAt === "string") return new Date(newTokens.accessTokenExpiresAt);
        return newTokens.accessTokenExpiresAt;
      }
      if (account.accessTokenExpiresAt) {
        if (typeof account.accessTokenExpiresAt === "string") return new Date(account.accessTokenExpiresAt);
        return account.accessTokenExpiresAt;
      }
    })();
    const tokens = {
      accessToken: newTokens?.accessToken ?? await decryptOAuthToken(account.accessToken ?? "", ctx.context),
      accessTokenExpiresAt,
      scopes: account.scope?.split(",") ?? [],
      idToken: newTokens?.idToken ?? account.idToken ?? void 0
    };
    return ctx.json(tokens);
  } catch (_error) {
    throw APIError.from("BAD_REQUEST", {
      message: "Failed to get a valid access token",
      code: "FAILED_TO_GET_ACCESS_TOKEN"
    });
  }
});
const refreshToken = createAuthEndpoint("/refresh-token", {
  method: "POST",
  body: z.object({
    providerId: z.string().meta({ description: "The provider ID for the OAuth provider" }),
    accountId: z.string().meta({ description: "The account ID associated with the refresh token" }).optional(),
    userId: z.string().meta({ description: "The user ID associated with the account" }).optional()
  }),
  metadata: { openapi: {
    description: "Refresh the access token using a refresh token",
    responses: {
      200: {
        description: "Access token refreshed successfully",
        content: { "application/json": { schema: {
          type: "object",
          properties: {
            tokenType: { type: "string" },
            idToken: { type: "string" },
            accessToken: { type: "string" },
            refreshToken: { type: "string" },
            accessTokenExpiresAt: {
              type: "string",
              format: "date-time"
            },
            refreshTokenExpiresAt: {
              type: "string",
              format: "date-time"
            }
          }
        } } }
      },
      400: { description: "Invalid refresh token or provider configuration" }
    }
  } }
}, async (ctx) => {
  const { providerId, accountId, userId } = ctx.body;
  const req = ctx.request;
  const session = await getSessionFromCtx(ctx);
  if (req && !session) throw ctx.error("UNAUTHORIZED");
  const resolvedUserId = session?.user?.id || userId;
  if (!resolvedUserId) throw APIError.from("BAD_REQUEST", {
    message: `Either userId or session is required`,
    code: "USER_ID_OR_SESSION_REQUIRED"
  });
  const provider = await getAwaitableValue(ctx.context.socialProviders, { value: providerId });
  if (!provider) throw APIError.from("BAD_REQUEST", {
    message: `Provider ${providerId} is not supported.`,
    code: "PROVIDER_NOT_SUPPORTED"
  });
  if (!provider.refreshAccessToken) throw APIError.from("BAD_REQUEST", {
    message: `Provider ${providerId} does not support token refreshing.`,
    code: "TOKEN_REFRESH_NOT_SUPPORTED"
  });
  let account = void 0;
  const accountData = await getAccountCookie(ctx);
  if (accountData && accountData.userId === resolvedUserId && (!providerId || providerId === accountData?.providerId)) account = accountData;
  else account = (await ctx.context.internalAdapter.findAccounts(resolvedUserId)).find((acc) => accountId ? acc.accountId === accountId && acc.providerId === providerId : acc.providerId === providerId);
  if (!account) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.ACCOUNT_NOT_FOUND);
  let refreshToken2 = void 0;
  if (accountData && providerId === accountData.providerId) refreshToken2 = accountData.refreshToken ?? void 0;
  else refreshToken2 = account.refreshToken ?? void 0;
  if (!refreshToken2) throw APIError.from("BAD_REQUEST", {
    message: "Refresh token not found",
    code: "REFRESH_TOKEN_NOT_FOUND"
  });
  try {
    const decryptedRefreshToken = await decryptOAuthToken(refreshToken2, ctx.context);
    const tokens = await provider.refreshAccessToken(decryptedRefreshToken);
    const resolvedRefreshToken = tokens.refreshToken ? await setTokenUtil(tokens.refreshToken, ctx.context) : refreshToken2;
    const resolvedRefreshTokenExpiresAt = tokens.refreshTokenExpiresAt ?? account.refreshTokenExpiresAt;
    if (account.id) {
      const updateData = {
        ...account || {},
        accessToken: await setTokenUtil(tokens.accessToken, ctx.context),
        refreshToken: resolvedRefreshToken,
        accessTokenExpiresAt: tokens.accessTokenExpiresAt,
        refreshTokenExpiresAt: resolvedRefreshTokenExpiresAt,
        scope: tokens.scopes?.join(",") || account.scope,
        idToken: tokens.idToken || account.idToken
      };
      await ctx.context.internalAdapter.updateAccount(account.id, updateData);
    }
    if (accountData && providerId === accountData.providerId && ctx.context.options.account?.storeAccountCookie) await setAccountCookie(ctx, {
      ...accountData,
      accessToken: await setTokenUtil(tokens.accessToken, ctx.context),
      refreshToken: resolvedRefreshToken,
      accessTokenExpiresAt: tokens.accessTokenExpiresAt,
      refreshTokenExpiresAt: resolvedRefreshTokenExpiresAt,
      scope: tokens.scopes?.join(",") || accountData.scope,
      idToken: tokens.idToken || accountData.idToken
    });
    return ctx.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken ?? decryptedRefreshToken,
      accessTokenExpiresAt: tokens.accessTokenExpiresAt,
      refreshTokenExpiresAt: resolvedRefreshTokenExpiresAt,
      scope: tokens.scopes?.join(",") || account.scope,
      idToken: tokens.idToken || account.idToken,
      providerId: account.providerId,
      accountId: account.accountId
    });
  } catch (_error) {
    throw APIError.from("BAD_REQUEST", {
      message: "Failed to refresh access token",
      code: "FAILED_TO_REFRESH_ACCESS_TOKEN"
    });
  }
});
const accountInfoQuerySchema = z.optional(z.object({ accountId: z.string().meta({ description: "The provider given account id for which to get the account info" }).optional() }));
const accountInfo = createAuthEndpoint("/account-info", {
  method: "GET",
  use: [sessionMiddleware],
  metadata: { openapi: {
    description: "Get the account info provided by the provider",
    responses: { "200": {
      description: "Success",
      content: { "application/json": { schema: {
        type: "object",
        properties: {
          user: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              email: { type: "string" },
              image: { type: "string" },
              emailVerified: { type: "boolean" }
            },
            required: ["id", "emailVerified"]
          },
          data: {
            type: "object",
            properties: {},
            additionalProperties: true
          }
        },
        required: ["user", "data"],
        additionalProperties: false
      } } }
    } }
  } },
  query: accountInfoQuerySchema
}, async (ctx) => {
  const providedAccountId = ctx.query?.accountId;
  let account = void 0;
  if (!providedAccountId) {
    if (ctx.context.options.account?.storeAccountCookie) {
      const accountData = await getAccountCookie(ctx);
      if (accountData) account = accountData;
    }
  } else {
    const accountData = await ctx.context.internalAdapter.findAccount(providedAccountId);
    if (accountData) account = accountData;
  }
  if (!account || account.userId !== ctx.context.session.user.id) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.ACCOUNT_NOT_FOUND);
  const provider = await getAwaitableValue(ctx.context.socialProviders, { value: account.providerId });
  if (!provider) throw APIError.from("INTERNAL_SERVER_ERROR", {
    message: `Provider account provider is ${account.providerId} but it is not configured`,
    code: "PROVIDER_NOT_CONFIGURED"
  });
  const tokens = await getAccessToken({
    ...ctx,
    method: "POST",
    body: {
      accountId: account.accountId,
      providerId: account.providerId
    },
    returnHeaders: false,
    returnStatus: false
  });
  if (!tokens.accessToken) throw APIError.from("BAD_REQUEST", {
    message: "Access token not found",
    code: "ACCESS_TOKEN_NOT_FOUND"
  });
  const info2 = await provider.getUserInfo({
    ...tokens,
    accessToken: tokens.accessToken
  });
  return ctx.json(info2);
});
async function createEmailVerificationToken(secret, email, updateTo, expiresIn = 3600, extraPayload) {
  return await signJWT({
    email: email.toLowerCase(),
    updateTo,
    ...extraPayload
  }, secret, expiresIn);
}
async function sendVerificationEmailFn(ctx, user) {
  if (!ctx.context.options.emailVerification?.sendVerificationEmail) {
    ctx.context.logger.error("Verification email isn't enabled.");
    throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.VERIFICATION_EMAIL_NOT_ENABLED);
  }
  const token = await createEmailVerificationToken(ctx.context.secret, user.email, void 0, ctx.context.options.emailVerification?.expiresIn);
  const callbackURL = ctx.body.callbackURL ? encodeURIComponent(ctx.body.callbackURL) : encodeURIComponent("/");
  const url2 = `${ctx.context.baseURL}/verify-email?token=${token}&callbackURL=${callbackURL}`;
  await ctx.context.runInBackgroundOrAwait(ctx.context.options.emailVerification.sendVerificationEmail({
    user,
    url: url2,
    token
  }, ctx.request));
}
const sendVerificationEmail = createAuthEndpoint("/send-verification-email", {
  method: "POST",
  operationId: "sendVerificationEmail",
  body: z.object({
    email: z.email().meta({ description: "The email to send the verification email to" }),
    callbackURL: z.string().meta({ description: "The URL to use for email verification callback" }).optional()
  }),
  metadata: { openapi: {
    operationId: "sendVerificationEmail",
    description: "Send a verification email to the user",
    requestBody: { content: { "application/json": { schema: {
      type: "object",
      properties: {
        email: {
          type: "string",
          description: "The email to send the verification email to",
          example: "user@example.com"
        },
        callbackURL: {
          type: "string",
          description: "The URL to use for email verification callback",
          example: "https://example.com/callback",
          nullable: true
        }
      },
      required: ["email"]
    } } } },
    responses: {
      "200": {
        description: "Success",
        content: { "application/json": { schema: {
          type: "object",
          properties: { status: {
            type: "boolean",
            description: "Indicates if the email was sent successfully",
            example: true
          } }
        } } }
      },
      "400": {
        description: "Bad Request",
        content: { "application/json": { schema: {
          type: "object",
          properties: { message: {
            type: "string",
            description: "Error message",
            example: "Verification email isn't enabled"
          } }
        } } }
      }
    }
  } }
}, async (ctx) => {
  if (!ctx.context.options.emailVerification?.sendVerificationEmail) {
    ctx.context.logger.error("Verification email isn't enabled.");
    throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.VERIFICATION_EMAIL_NOT_ENABLED);
  }
  const { email } = ctx.body;
  const session = await getSessionFromCtx(ctx);
  if (!session) {
    const user = await ctx.context.internalAdapter.findUserByEmail(email);
    if (!user || user.user.emailVerified) {
      await createEmailVerificationToken(ctx.context.secret, email, void 0, ctx.context.options.emailVerification?.expiresIn);
      return ctx.json({ status: true });
    }
    await sendVerificationEmailFn(ctx, user.user);
    return ctx.json({ status: true });
  }
  if (session?.user.email !== email) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.EMAIL_MISMATCH);
  if (session?.user.emailVerified) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.EMAIL_ALREADY_VERIFIED);
  await sendVerificationEmailFn(ctx, session.user);
  return ctx.json({ status: true });
});
const verifyEmail = createAuthEndpoint("/verify-email", {
  method: "GET",
  operationId: "verifyEmail",
  query: z.object({
    token: z.string().meta({ description: "The token to verify the email" }),
    callbackURL: z.string().meta({ description: "The URL to redirect to after email verification" }).optional()
  }),
  use: [originCheck((ctx) => ctx.query.callbackURL)],
  metadata: { openapi: {
    description: "Verify the email of the user",
    parameters: [{
      name: "token",
      in: "query",
      description: "The token to verify the email",
      required: true,
      schema: { type: "string" }
    }, {
      name: "callbackURL",
      in: "query",
      description: "The URL to redirect to after email verification",
      required: false,
      schema: { type: "string" }
    }],
    responses: { "200": {
      description: "Success",
      content: { "application/json": { schema: {
        type: "object",
        properties: {
          user: {
            type: "object",
            $ref: "#/components/schemas/User"
          },
          status: {
            type: "boolean",
            description: "Indicates if the email was verified successfully"
          }
        },
        required: ["user", "status"]
      } } }
    } }
  } }
}, async (ctx) => {
  function redirectOnError(error2) {
    if (ctx.query.callbackURL) {
      if (ctx.query.callbackURL.includes("?")) throw ctx.redirect(`${ctx.query.callbackURL}&error=${error2.code}`);
      throw ctx.redirect(`${ctx.query.callbackURL}?error=${error2.code}`);
    }
    throw APIError.from("UNAUTHORIZED", error2);
  }
  const { token } = ctx.query;
  let jwt;
  try {
    jwt = await jwtVerify(token, new TextEncoder().encode(ctx.context.secret), { algorithms: ["HS256"] });
  } catch (e) {
    if (e instanceof JWTExpired) return redirectOnError(BASE_ERROR_CODES.TOKEN_EXPIRED);
    return redirectOnError(BASE_ERROR_CODES.INVALID_TOKEN);
  }
  const parsed = z.object({
    email: z.email(),
    updateTo: z.string().optional(),
    requestType: z.string().optional()
  }).parse(jwt.payload);
  const user = await ctx.context.internalAdapter.findUserByEmail(parsed.email);
  if (!user) return redirectOnError(BASE_ERROR_CODES.USER_NOT_FOUND);
  if (parsed.updateTo) {
    const session = await getSessionFromCtx(ctx);
    if (session && session.user.email !== parsed.email) return redirectOnError(BASE_ERROR_CODES.INVALID_USER);
    switch (parsed.requestType) {
      case "change-email-confirmation": {
        const newToken = await createEmailVerificationToken(ctx.context.secret, parsed.email, parsed.updateTo, ctx.context.options.emailVerification?.expiresIn, { requestType: "change-email-verification" });
        const updateCallbackURL = ctx.query.callbackURL ? encodeURIComponent(ctx.query.callbackURL) : encodeURIComponent("/");
        const url2 = `${ctx.context.baseURL}/verify-email?token=${newToken}&callbackURL=${updateCallbackURL}`;
        if (ctx.context.options.emailVerification?.sendVerificationEmail) await ctx.context.runInBackgroundOrAwait(ctx.context.options.emailVerification.sendVerificationEmail({
          user: {
            ...user.user,
            email: parsed.updateTo
          },
          url: url2,
          token: newToken
        }, ctx.request));
        if (ctx.query.callbackURL) throw ctx.redirect(ctx.query.callbackURL);
        return ctx.json({ status: true });
      }
      case "change-email-verification": {
        let activeSession = session;
        if (!activeSession) {
          const newSession = await ctx.context.internalAdapter.createSession(user.user.id);
          if (!newSession) throw APIError.from("INTERNAL_SERVER_ERROR", BASE_ERROR_CODES.FAILED_TO_CREATE_SESSION);
          activeSession = {
            session: newSession,
            user: user.user
          };
        }
        const updatedUser2 = await ctx.context.internalAdapter.updateUserByEmail(parsed.email, {
          email: parsed.updateTo,
          emailVerified: true
        });
        if (ctx.context.options.emailVerification?.afterEmailVerification) await ctx.context.options.emailVerification.afterEmailVerification(updatedUser2, ctx.request);
        await setSessionCookie(ctx, {
          session: activeSession.session,
          user: {
            ...activeSession.user,
            email: parsed.updateTo,
            emailVerified: true
          }
        });
        if (ctx.query.callbackURL) throw ctx.redirect(ctx.query.callbackURL);
        return ctx.json({
          status: true,
          user: parseUserOutput(ctx.context.options, updatedUser2)
        });
      }
      default: {
        let activeSession = session;
        if (!activeSession) {
          const newSession = await ctx.context.internalAdapter.createSession(user.user.id);
          if (!newSession) throw APIError.from("INTERNAL_SERVER_ERROR", BASE_ERROR_CODES.FAILED_TO_CREATE_SESSION);
          activeSession = {
            session: newSession,
            user: user.user
          };
        }
        const updatedUser2 = await ctx.context.internalAdapter.updateUserByEmail(parsed.email, {
          email: parsed.updateTo,
          emailVerified: false
        });
        const newToken = await createEmailVerificationToken(ctx.context.secret, parsed.updateTo);
        const updateCallbackURL = ctx.query.callbackURL ? encodeURIComponent(ctx.query.callbackURL) : encodeURIComponent("/");
        if (ctx.context.options.emailVerification?.sendVerificationEmail) await ctx.context.runInBackgroundOrAwait(ctx.context.options.emailVerification.sendVerificationEmail({
          user: updatedUser2,
          url: `${ctx.context.baseURL}/verify-email?token=${newToken}&callbackURL=${updateCallbackURL}`,
          token: newToken
        }, ctx.request));
        await setSessionCookie(ctx, {
          session: activeSession.session,
          user: {
            ...activeSession.user,
            email: parsed.updateTo,
            emailVerified: false
          }
        });
        if (ctx.query.callbackURL) throw ctx.redirect(ctx.query.callbackURL);
        return ctx.json({
          status: true,
          user: parseUserOutput(ctx.context.options, updatedUser2)
        });
      }
    }
  }
  if (user.user.emailVerified) {
    if (ctx.query.callbackURL) throw ctx.redirect(ctx.query.callbackURL);
    return ctx.json({
      status: true,
      user: null
    });
  }
  if (ctx.context.options.emailVerification?.beforeEmailVerification) await ctx.context.options.emailVerification.beforeEmailVerification(user.user, ctx.request);
  const updatedUser = await ctx.context.internalAdapter.updateUserByEmail(parsed.email, { emailVerified: true });
  if (ctx.context.options.emailVerification?.afterEmailVerification) await ctx.context.options.emailVerification.afterEmailVerification(updatedUser, ctx.request);
  if (ctx.context.options.emailVerification?.autoSignInAfterVerification) {
    const currentSession = await getSessionFromCtx(ctx);
    if (!currentSession || currentSession.user.email !== parsed.email) {
      const session = await ctx.context.internalAdapter.createSession(user.user.id);
      if (!session) throw APIError.from("INTERNAL_SERVER_ERROR", BASE_ERROR_CODES.FAILED_TO_CREATE_SESSION);
      await setSessionCookie(ctx, {
        session,
        user: {
          ...user.user,
          emailVerified: true
        }
      });
    } else await setSessionCookie(ctx, {
      session: currentSession.session,
      user: {
        ...currentSession.user,
        emailVerified: true
      }
    });
  }
  if (ctx.query.callbackURL) throw ctx.redirect(ctx.query.callbackURL);
  return ctx.json({
    status: true,
    user: null
  });
});
async function handleOAuthUserInfo(c, opts) {
  const { userInfo, account, callbackURL, disableSignUp, overrideUserInfo } = opts;
  const dbUser = await c.context.internalAdapter.findOAuthUser(userInfo.email.toLowerCase(), account.accountId, account.providerId).catch((e) => {
    logger.error("Better auth was unable to query your database.\nError: ", e);
    const errorURL = c.context.options.onAPIError?.errorURL || `${c.context.baseURL}/error`;
    throw c.redirect(`${errorURL}?error=internal_server_error`);
  });
  let user = dbUser?.user;
  const isRegister = !user;
  if (dbUser) {
    const linkedAccount = dbUser.linkedAccount ?? dbUser.accounts.find((acc) => acc.providerId === account.providerId && acc.accountId === account.accountId);
    if (!linkedAccount) {
      const accountLinking = c.context.options.account?.accountLinking;
      if (!(opts.isTrustedProvider || c.context.trustedProviders.includes(account.providerId)) && !userInfo.emailVerified || accountLinking?.enabled === false || accountLinking?.disableImplicitLinking === true) {
        if (isDevelopment()) logger.warn(`User already exist but account isn't linked to ${account.providerId}. To read more about how account linking works in Better Auth see https://www.better-auth.com/docs/concepts/users-accounts#account-linking.`);
        return {
          error: "account not linked",
          data: null
        };
      }
      try {
        await c.context.internalAdapter.linkAccount({
          providerId: account.providerId,
          accountId: userInfo.id.toString(),
          userId: dbUser.user.id,
          accessToken: await setTokenUtil(account.accessToken, c.context),
          refreshToken: await setTokenUtil(account.refreshToken, c.context),
          idToken: account.idToken,
          accessTokenExpiresAt: account.accessTokenExpiresAt,
          refreshTokenExpiresAt: account.refreshTokenExpiresAt,
          scope: account.scope
        });
      } catch (e) {
        logger.error("Unable to link account", e);
        return {
          error: "unable to link account",
          data: null
        };
      }
      if (userInfo.emailVerified && !dbUser.user.emailVerified && userInfo.email.toLowerCase() === dbUser.user.email) await c.context.internalAdapter.updateUser(dbUser.user.id, { emailVerified: true });
    } else {
      const freshTokens = c.context.options.account?.updateAccountOnSignIn !== false ? Object.fromEntries(Object.entries({
        idToken: account.idToken,
        accessToken: await setTokenUtil(account.accessToken, c.context),
        refreshToken: await setTokenUtil(account.refreshToken, c.context),
        accessTokenExpiresAt: account.accessTokenExpiresAt,
        refreshTokenExpiresAt: account.refreshTokenExpiresAt,
        scope: account.scope
      }).filter(([_, value]) => value !== void 0)) : {};
      if (c.context.options.account?.storeAccountCookie) await setAccountCookie(c, {
        ...linkedAccount,
        ...freshTokens
      });
      if (Object.keys(freshTokens).length > 0) await c.context.internalAdapter.updateAccount(linkedAccount.id, freshTokens);
      if (userInfo.emailVerified && !dbUser.user.emailVerified && userInfo.email.toLowerCase() === dbUser.user.email) await c.context.internalAdapter.updateUser(dbUser.user.id, { emailVerified: true });
    }
    if (overrideUserInfo) {
      const { id: _, ...restUserInfo } = userInfo;
      user = await c.context.internalAdapter.updateUser(dbUser.user.id, {
        ...restUserInfo,
        email: userInfo.email.toLowerCase(),
        emailVerified: userInfo.email.toLowerCase() === dbUser.user.email ? dbUser.user.emailVerified || userInfo.emailVerified : userInfo.emailVerified
      });
    }
  } else {
    if (disableSignUp) return {
      error: "signup disabled",
      data: null,
      isRegister: false
    };
    try {
      const { id: _, ...restUserInfo } = userInfo;
      const accountData = {
        accessToken: await setTokenUtil(account.accessToken, c.context),
        refreshToken: await setTokenUtil(account.refreshToken, c.context),
        idToken: account.idToken,
        accessTokenExpiresAt: account.accessTokenExpiresAt,
        refreshTokenExpiresAt: account.refreshTokenExpiresAt,
        scope: account.scope,
        providerId: account.providerId,
        accountId: userInfo.id.toString()
      };
      const { user: createdUser, account: createdAccount } = await c.context.internalAdapter.createOAuthUser({
        ...restUserInfo,
        email: userInfo.email.toLowerCase()
      }, accountData);
      user = createdUser;
      if (c.context.options.account?.storeAccountCookie) await setAccountCookie(c, createdAccount);
      if (!userInfo.emailVerified && user && c.context.options.emailVerification?.sendOnSignUp && c.context.options.emailVerification?.sendVerificationEmail) {
        const token = await createEmailVerificationToken(c.context.secret, user.email, void 0, c.context.options.emailVerification?.expiresIn);
        const url2 = `${c.context.baseURL}/verify-email?token=${token}&callbackURL=${callbackURL}`;
        await c.context.runInBackgroundOrAwait(c.context.options.emailVerification.sendVerificationEmail({
          user,
          url: url2,
          token
        }, c.request));
      }
    } catch (e) {
      logger.error(e);
      if (isAPIError(e)) return {
        error: e.message,
        data: null,
        isRegister: false
      };
      return {
        error: "unable to create user",
        data: null,
        isRegister: false
      };
    }
  }
  if (!user) return {
    error: "unable to create user",
    data: null,
    isRegister: false
  };
  const session = await c.context.internalAdapter.createSession(user.id);
  if (!session) return {
    error: "unable to create session",
    data: null,
    isRegister: false
  };
  return {
    data: {
      session,
      user
    },
    error: null,
    isRegister
  };
}
const schema = z.object({
  code: z.string().optional(),
  error: z.string().optional(),
  device_id: z.string().optional(),
  error_description: z.string().optional(),
  state: z.string().optional(),
  user: z.string().optional()
});
const callbackOAuth = createAuthEndpoint("/callback/:id", {
  method: ["GET", "POST"],
  operationId: "handleOAuthCallback",
  body: schema.optional(),
  query: schema.optional(),
  metadata: {
    ...HIDE_METADATA,
    allowedMediaTypes: ["application/x-www-form-urlencoded", "application/json"]
  }
}, async (c) => {
  let queryOrBody;
  const defaultErrorURL = c.context.options.onAPIError?.errorURL || `${c.context.baseURL}/error`;
  if (c.method === "POST") {
    const postData = c.body ? schema.parse(c.body) : {};
    const queryData = c.query ? schema.parse(c.query) : {};
    const mergedData = schema.parse({
      ...postData,
      ...queryData
    });
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(mergedData)) if (value !== void 0 && value !== null) params.set(key, String(value));
    const redirectURL = `${c.context.baseURL}/callback/${c.params.id}?${params.toString()}`;
    throw c.redirect(redirectURL);
  }
  try {
    if (c.method === "GET") queryOrBody = schema.parse(c.query);
    else if (c.method === "POST") queryOrBody = schema.parse(c.body);
    else throw new Error("Unsupported method");
  } catch (e) {
    c.context.logger.error("INVALID_CALLBACK_REQUEST", e);
    throw c.redirect(`${defaultErrorURL}?error=invalid_callback_request`);
  }
  const { code, error: error2, state, error_description, device_id, user: userData } = queryOrBody;
  if (!state) {
    c.context.logger.error("State not found", error2);
    const url2 = `${defaultErrorURL}${defaultErrorURL.includes("?") ? "&" : "?"}state=state_not_found`;
    throw c.redirect(url2);
  }
  const { codeVerifier, callbackURL, link, errorURL, newUserURL, requestSignUp } = await parseState(c);
  function redirectOnError(error3, description) {
    const baseURL = errorURL ?? defaultErrorURL;
    const params = new URLSearchParams({ error: error3 });
    if (description) params.set("error_description", description);
    const url2 = `${baseURL}${baseURL.includes("?") ? "&" : "?"}${params.toString()}`;
    throw c.redirect(url2);
  }
  if (error2) redirectOnError(error2, error_description);
  if (!code) {
    c.context.logger.error("Code not found");
    throw redirectOnError("no_code");
  }
  const provider = await getAwaitableValue(c.context.socialProviders, { value: c.params.id });
  if (!provider) {
    c.context.logger.error("Oauth provider with id", c.params.id, "not found");
    throw redirectOnError("oauth_provider_not_found");
  }
  let tokens;
  try {
    tokens = await provider.validateAuthorizationCode({
      code,
      codeVerifier,
      deviceId: device_id,
      redirectURI: `${c.context.baseURL}/callback/${provider.id}`
    });
  } catch (e) {
    c.context.logger.error("", e);
    throw redirectOnError("invalid_code");
  }
  if (!tokens) throw redirectOnError("invalid_code");
  const parsedUserData = userData ? safeJSONParse(userData) : null;
  const userInfo = await provider.getUserInfo({
    ...tokens,
    user: parsedUserData ?? void 0
  }).then((res) => res?.user);
  if (!userInfo) {
    c.context.logger.error("Unable to get user info");
    return redirectOnError("unable_to_get_user_info");
  }
  if (!callbackURL) {
    c.context.logger.error("No callback URL found");
    throw redirectOnError("no_callback_url");
  }
  if (link) {
    if (!c.context.trustedProviders.includes(provider.id) && !userInfo.emailVerified || c.context.options.account?.accountLinking?.enabled === false) {
      c.context.logger.error("Unable to link account - untrusted provider");
      return redirectOnError("unable_to_link_account");
    }
    if (userInfo.email?.toLowerCase() !== link.email.toLowerCase() && c.context.options.account?.accountLinking?.allowDifferentEmails !== true) return redirectOnError("email_doesn't_match");
    const existingAccount = await c.context.internalAdapter.findAccountByProviderId(String(userInfo.id), provider.id);
    if (existingAccount) {
      if (existingAccount.userId.toString() !== link.userId.toString()) return redirectOnError("account_already_linked_to_different_user");
      const updateData = Object.fromEntries(Object.entries({
        accessToken: await setTokenUtil(tokens.accessToken, c.context),
        refreshToken: await setTokenUtil(tokens.refreshToken, c.context),
        idToken: tokens.idToken,
        accessTokenExpiresAt: tokens.accessTokenExpiresAt,
        refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
        scope: tokens.scopes?.join(",")
      }).filter(([_, value]) => value !== void 0));
      await c.context.internalAdapter.updateAccount(existingAccount.id, updateData);
    } else if (!await c.context.internalAdapter.createAccount({
      userId: link.userId,
      providerId: provider.id,
      accountId: String(userInfo.id),
      ...tokens,
      accessToken: await setTokenUtil(tokens.accessToken, c.context),
      refreshToken: await setTokenUtil(tokens.refreshToken, c.context),
      scope: tokens.scopes?.join(",")
    })) return redirectOnError("unable_to_link_account");
    let toRedirectTo2;
    try {
      toRedirectTo2 = callbackURL.toString();
    } catch {
      toRedirectTo2 = callbackURL;
    }
    throw c.redirect(toRedirectTo2);
  }
  if (!userInfo.email) {
    c.context.logger.error("Provider did not return email. This could be due to misconfiguration in the provider settings.");
    return redirectOnError("email_not_found");
  }
  const accountData = {
    providerId: provider.id,
    accountId: String(userInfo.id),
    ...tokens,
    scope: tokens.scopes?.join(",")
  };
  const result = await handleOAuthUserInfo(c, {
    userInfo: {
      ...userInfo,
      id: String(userInfo.id),
      email: userInfo.email,
      name: userInfo.name || ""
    },
    account: accountData,
    callbackURL,
    disableSignUp: provider.disableImplicitSignUp && !requestSignUp || provider.options?.disableSignUp,
    overrideUserInfo: provider.options?.overrideUserInfoOnSignIn
  });
  if (result.error) {
    c.context.logger.error(result.error.split(" ").join("_"));
    return redirectOnError(result.error.split(" ").join("_"));
  }
  const { session, user } = result.data;
  await setSessionCookie(c, {
    session,
    user
  });
  let toRedirectTo;
  try {
    toRedirectTo = (result.isRegister ? newUserURL || callbackURL : callbackURL).toString();
  } catch {
    toRedirectTo = result.isRegister ? newUserURL || callbackURL : callbackURL;
  }
  throw c.redirect(toRedirectTo);
});
function sanitize(input) {
  return input.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/&(?!amp;|lt;|gt;|quot;|#39;|#x[0-9a-fA-F]+;|#[0-9]+;)/g, "&amp;");
}
const html = (options, code = "Unknown", description = null) => {
  const custom = options.onAPIError?.customizeDefaultErrorPage;
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Error</title>
    <style>
      * {
        box-sizing: border-box;
      }
      body {
        font-family: ${custom?.font?.defaultFamily || "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"};
        background: ${custom?.colors?.background || "var(--background)"};
        color: var(--foreground);
        margin: 0;
      }
      :root,
      :host {
        --spacing: 0.25rem;
        --container-md: 28rem;
        --text-sm: ${custom?.size?.textSm || "0.875rem"};
        --text-sm--line-height: calc(1.25 / 0.875);
        --text-2xl: ${custom?.size?.text2xl || "1.5rem"};
        --text-2xl--line-height: calc(2 / 1.5);
        --text-4xl: ${custom?.size?.text4xl || "2.25rem"};
        --text-4xl--line-height: calc(2.5 / 2.25);
        --text-6xl: ${custom?.size?.text6xl || "3rem"};
        --text-6xl--line-height: 1;
        --font-weight-medium: 500;
        --font-weight-semibold: 600;
        --font-weight-bold: 700;
        --default-transition-duration: 150ms;
        --default-transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        --radius: ${custom?.size?.radiusSm || "0.625rem"};
        --default-mono-font-family: ${custom?.font?.monoFamily || "var(--font-geist-mono)"};
        --primary: ${custom?.colors?.primary || "black"};
        --primary-foreground: ${custom?.colors?.primaryForeground || "white"};
        --background: ${custom?.colors?.background || "white"};
        --foreground: ${custom?.colors?.foreground || "oklch(0.271 0 0)"};
        --border: ${custom?.colors?.border || "oklch(0.89 0 0)"};
        --destructive: ${custom?.colors?.destructive || "oklch(0.55 0.15 25.723)"};
        --muted-foreground: ${custom?.colors?.mutedForeground || "oklch(0.545 0 0)"};
        --corner-border: ${custom?.colors?.cornerBorder || "#404040"};
      }

      button, .btn {
        cursor: pointer;
        background: none;
        border: none;
        color: inherit;
        font: inherit;
        transition: all var(--default-transition-duration)
          var(--default-transition-timing-function);
      }
      button:hover, .btn:hover {
        opacity: 0.8;
      }

      @media (prefers-color-scheme: dark) {
        :root,
        :host {
          --primary: ${custom?.colors?.primary || "white"};
          --primary-foreground: ${custom?.colors?.primaryForeground || "black"};
          --background: ${custom?.colors?.background || "oklch(0.15 0 0)"};
          --foreground: ${custom?.colors?.foreground || "oklch(0.98 0 0)"};
          --border: ${custom?.colors?.border || "oklch(0.27 0 0)"};
          --destructive: ${custom?.colors?.destructive || "oklch(0.65 0.15 25.723)"};
          --muted-foreground: ${custom?.colors?.mutedForeground || "oklch(0.65 0 0)"};
          --corner-border: ${custom?.colors?.cornerBorder || "#a0a0a0"};
        }
      }
      @media (max-width: 640px) {
        :root, :host {
          --text-6xl: 2.5rem;
          --text-2xl: 1.25rem;
          --text-sm: 0.8125rem;
        }
      }
      @media (max-width: 480px) {
        :root, :host {
          --text-6xl: 2rem;
          --text-2xl: 1.125rem;
        }
      }
    </style>
  </head>
  <body style="width: 100vw; min-height: 100vh; overflow-x: hidden; overflow-y: auto;">
    <div
        style="
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 1.5rem;
            position: relative;
            width: 100%;
            min-height: 100vh;
            padding: 1rem;
        "
        >
${custom?.disableBackgroundGrid ? "" : `
      <div
        style="
          position: absolute;
          inset: 0;
          background-image: linear-gradient(to right, ${custom?.colors?.gridColor || "var(--border)"} 1px, transparent 1px),
            linear-gradient(to bottom, ${custom?.colors?.gridColor || "var(--border)"} 1px, transparent 1px);
          background-size: 40px 40px;
          opacity: 0.6;
          pointer-events: none;
          width: 100vw;
          height: 100vh;
        "
      ></div>
      <div
        style="
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: ${custom?.colors?.background || "var(--background)"};
          mask-image: radial-gradient(ellipse at center, transparent 20%, black);
          -webkit-mask-image: radial-gradient(ellipse at center, transparent 20%, black);
          pointer-events: none;
        "
      ></div>
`}

<div
  style="
    position: relative;
    z-index: 10;
    border: 2px solid var(--border);
    background: ${custom?.colors?.cardBackground || "var(--background)"};
    padding: 1.5rem;
    max-width: 42rem;
    width: 100%;
  "
>
    ${custom?.disableCornerDecorations ? "" : `
        <!-- Corner decorations -->
        <div
          style="
            position: absolute;
            top: -2px;
            left: -2px;
            width: 2rem;
            height: 2rem;
            border-top: 4px solid var(--corner-border);
            border-left: 4px solid var(--corner-border);
          "
        ></div>
        <div
          style="
            position: absolute;
            top: -2px;
            right: -2px;
            width: 2rem;
            height: 2rem;
            border-top: 4px solid var(--corner-border);
            border-right: 4px solid var(--corner-border);
          "
        ></div>
  
        <div
          style="
            position: absolute;
            bottom: -2px;
            left: -2px;
            width: 2rem;
            height: 2rem;
            border-bottom: 4px solid var(--corner-border);
            border-left: 4px solid var(--corner-border);
          "
        ></div>
        <div
          style="
            position: absolute;
            bottom: -2px;
            right: -2px;
            width: 2rem;
            height: 2rem;
            border-bottom: 4px solid var(--corner-border);
            border-right: 4px solid var(--corner-border);
          "
        ></div>`}

        <div style="text-align: center; margin-bottom: 1.5rem;">
          <div style="margin-bottom: 1.5rem;">
            <div
              style="
                display: inline-block;
                border: 2px solid ${custom?.disableTitleBorder ? "transparent" : custom?.colors?.titleBorder || "var(--destructive)"};
                padding: 0.375rem 1rem;
              "
            >
              <h1
                style="
                  font-size: var(--text-6xl);
                  font-weight: var(--font-weight-semibold);
                  color: ${custom?.colors?.titleColor || "var(--foreground)"};
                  letter-spacing: -0.02em;
                  margin: 0;
                "
              >
                ERROR
              </h1>
            </div>
            <div
              style="
                height: 2px;
                background-color: var(--border);
                width: calc(100% + 3rem);
                margin-left: -1.5rem;
                margin-top: 1.5rem;
              "
            ></div>
          </div>

          <h2
            style="
              font-size: var(--text-2xl);
              font-weight: var(--font-weight-semibold);
              color: var(--foreground);
              margin: 0 0 1rem;
            "
          >
            Something went wrong
          </h2>

          <div
            style="
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                border: 2px solid var(--border);
                background-color: var(--muted);
                padding: 0.375rem 0.75rem;
                margin: 0 0 1rem;
                flex-wrap: wrap;
                justify-content: center;
            "
            >
            <span
                style="
                font-size: 0.75rem;
                color: var(--muted-foreground);
                font-weight: var(--font-weight-semibold);
                "
            >
                CODE:
            </span>
            <span
                style="
                font-size: var(--text-sm);
                font-family: var(--default-mono-font-family, monospace);
                color: var(--foreground);
                word-break: break-all;
                "
            >
                ${sanitize(code)}
            </span>
            </div>

          <p
            style="
              color: var(--muted-foreground);
              max-width: 28rem;
              margin: 0 auto;
              font-size: var(--text-sm);
              line-height: 1.5;
              text-wrap: pretty;
            "
          >
            ${!description ? `We encountered an unexpected error. Please try again or return to the home page. If you're a developer, you can find more information about the error <a href='https://better-auth.com/docs/reference/errors/${encodeURIComponent(code)}' target='_blank' rel="noopener noreferrer" style='color: var(--foreground); text-decoration: underline;'>here</a>.` : description}
          </p>
        </div>

        <div
          style="
            display: flex;
            gap: 0.75rem;
            margin-top: 1.5rem;
            justify-content: center;
            flex-wrap: wrap;
          "
        >
          <a
            href="/"
            style="
              text-decoration: none;
            "
          >
            <div
              style="
                border: 2px solid var(--border);
                background: var(--primary);
                color: var(--primary-foreground);
                padding: 0.5rem 1rem;
                border-radius: 0;
                white-space: nowrap;
              "
              class="btn"
            >
              Go Home
            </div>
          </a>
          <a
            href="https://better-auth.com/docs/reference/errors/${encodeURIComponent(code)}?askai=${encodeURIComponent(`What does the error code ${code} mean?`)}"
            target="_blank"
            rel="noopener noreferrer"
            style="
              text-decoration: none;
            "
          >
            <div
              style="
                border: 2px solid var(--border);
                background: transparent;
                color: var(--foreground);
                padding: 0.5rem 1rem;
                border-radius: 0;
                white-space: nowrap;
              "
              class="btn"
            >
              Ask AI
            </div>
          </a>
        </div>
      </div>
    </div>
  </body>
</html>`;
};
const error = createAuthEndpoint("/error", {
  method: "GET",
  metadata: {
    ...HIDE_METADATA,
    openapi: {
      description: "Displays an error page",
      responses: { "200": {
        description: "Success",
        content: { "text/html": { schema: {
          type: "string",
          description: "The HTML content of the error page"
        } } }
      } }
    }
  }
}, async (c) => {
  const url2 = new URL(c.request?.url || "");
  const unsanitizedCode = url2.searchParams.get("error") || "UNKNOWN";
  const unsanitizedDescription = url2.searchParams.get("error_description") || null;
  const safeCode = /^[\'A-Za-z0-9_-]+$/.test(unsanitizedCode) ? unsanitizedCode : "UNKNOWN";
  const safeDescription = unsanitizedDescription ? sanitize(unsanitizedDescription) : null;
  const queryParams = new URLSearchParams();
  queryParams.set("error", safeCode);
  if (unsanitizedDescription) queryParams.set("error_description", unsanitizedDescription);
  const options = c.context.options;
  const errorURL = options.onAPIError?.errorURL;
  if (errorURL) return new Response(null, {
    status: 302,
    headers: { Location: `${errorURL}${errorURL.includes("?") ? "&" : "?"}${queryParams.toString()}` }
  });
  if (isProduction && !options.onAPIError?.customizeDefaultErrorPage) return new Response(null, {
    status: 302,
    headers: { Location: `/?${queryParams.toString()}` }
  });
  return new Response(html(c.context.options, safeCode, safeDescription), { headers: { "Content-Type": "text/html" } });
});
const ok = createAuthEndpoint("/ok", {
  method: "GET",
  metadata: {
    ...HIDE_METADATA,
    openapi: {
      description: "Check if the API is working",
      responses: { "200": {
        description: "API is working",
        content: { "application/json": { schema: {
          type: "object",
          properties: { ok: {
            type: "boolean",
            description: "Indicates if the API is working"
          } },
          required: ["ok"]
        } } }
      } }
    }
  }
}, async (ctx) => {
  return ctx.json({ ok: true });
});
async function validatePassword(ctx, data) {
  const credentialAccount = (await ctx.context.internalAdapter.findAccounts(data.userId))?.find((account) => account.providerId === "credential");
  const currentPassword = credentialAccount?.password;
  if (!credentialAccount || !currentPassword) return false;
  return await ctx.context.password.verify({
    hash: currentPassword,
    password: data.password
  });
}
async function checkPassword(userId, c) {
  const credentialAccount = (await c.context.internalAdapter.findAccounts(userId))?.find((account) => account.providerId === "credential");
  const currentPassword = credentialAccount?.password;
  const password = c.body.password;
  if (!credentialAccount || !currentPassword || !password) {
    if (password) await c.context.password.hash(password);
    throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.INVALID_PASSWORD);
  }
  if (!await c.context.password.verify({
    hash: currentPassword,
    password
  })) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.INVALID_PASSWORD);
  return true;
}
function redirectError(ctx, callbackURL, query) {
  const url2 = callbackURL ? new URL(callbackURL, ctx.baseURL) : new URL(`${ctx.baseURL}/error`);
  if (query) Object.entries(query).forEach(([k, v]) => url2.searchParams.set(k, v));
  return url2.href;
}
function redirectCallback(ctx, callbackURL, query) {
  const url2 = new URL(callbackURL, ctx.baseURL);
  if (query) Object.entries(query).forEach(([k, v]) => url2.searchParams.set(k, v));
  return url2.href;
}
const requestPasswordReset = createAuthEndpoint("/request-password-reset", {
  method: "POST",
  body: z.object({
    email: z.email().meta({ description: "The email address of the user to send a password reset email to" }),
    redirectTo: z.string().meta({ description: "The URL to redirect the user to reset their password. If the token isn't valid or expired, it'll be redirected with a query parameter `?error=INVALID_TOKEN`. If the token is valid, it'll be redirected with a query parameter `?token=VALID_TOKEN" }).optional()
  }),
  metadata: { openapi: {
    operationId: "requestPasswordReset",
    description: "Send a password reset email to the user",
    responses: { "200": {
      description: "Success",
      content: { "application/json": { schema: {
        type: "object",
        properties: {
          status: { type: "boolean" },
          message: { type: "string" }
        }
      } } }
    } }
  } },
  use: [originCheck((ctx) => ctx.body.redirectTo)]
}, async (ctx) => {
  if (!ctx.context.options.emailAndPassword?.sendResetPassword) {
    ctx.context.logger.error("Reset password isn't enabled.Please pass an emailAndPassword.sendResetPassword function in your auth config!");
    throw APIError.from("BAD_REQUEST", {
      message: "Reset password isn't enabled",
      code: "RESET_PASSWORD_DISABLED"
    });
  }
  const { email, redirectTo } = ctx.body;
  const user = await ctx.context.internalAdapter.findUserByEmail(email, { includeAccounts: true });
  if (!user) {
    generateId(24);
    await ctx.context.internalAdapter.findVerificationValue("dummy-verification-token");
    ctx.context.logger.error("Reset Password: User not found", { email });
    return ctx.json({
      status: true,
      message: "If this email exists in our system, check your email for the reset link"
    });
  }
  const expiresAt = getDate(ctx.context.options.emailAndPassword.resetPasswordTokenExpiresIn || 3600 * 1, "sec");
  const verificationToken = generateId(24);
  await ctx.context.internalAdapter.createVerificationValue({
    value: user.user.id,
    identifier: `reset-password:${verificationToken}`,
    expiresAt
  });
  const callbackURL = redirectTo ? encodeURIComponent(redirectTo) : "";
  const url2 = `${ctx.context.baseURL}/reset-password/${verificationToken}?callbackURL=${callbackURL}`;
  await ctx.context.runInBackgroundOrAwait(ctx.context.options.emailAndPassword.sendResetPassword({
    user: user.user,
    url: url2,
    token: verificationToken
  }, ctx.request));
  return ctx.json({
    status: true,
    message: "If this email exists in our system, check your email for the reset link"
  });
});
const requestPasswordResetCallback = createAuthEndpoint("/reset-password/:token", {
  method: "GET",
  operationId: "resetPasswordCallback",
  query: z.object({ callbackURL: z.string().meta({ description: "The URL to redirect the user to reset their password" }) }),
  use: [originCheck((ctx) => ctx.query.callbackURL)],
  metadata: { openapi: {
    operationId: "resetPasswordCallback",
    description: "Redirects the user to the callback URL with the token",
    parameters: [{
      name: "token",
      in: "path",
      required: true,
      description: "The token to reset the password",
      schema: { type: "string" }
    }, {
      name: "callbackURL",
      in: "query",
      required: true,
      description: "The URL to redirect the user to reset their password",
      schema: { type: "string" }
    }],
    responses: { "200": {
      description: "Success",
      content: { "application/json": { schema: {
        type: "object",
        properties: { token: { type: "string" } }
      } } }
    } }
  } }
}, async (ctx) => {
  const { token } = ctx.params;
  const { callbackURL } = ctx.query;
  if (!token || !callbackURL) throw ctx.redirect(redirectError(ctx.context, callbackURL, { error: "INVALID_TOKEN" }));
  const verification = await ctx.context.internalAdapter.findVerificationValue(`reset-password:${token}`);
  if (!verification || verification.expiresAt < /* @__PURE__ */ new Date()) throw ctx.redirect(redirectError(ctx.context, callbackURL, { error: "INVALID_TOKEN" }));
  throw ctx.redirect(redirectCallback(ctx.context, callbackURL, { token }));
});
const resetPassword = createAuthEndpoint("/reset-password", {
  method: "POST",
  operationId: "resetPassword",
  query: z.object({ token: z.string().optional() }).optional(),
  body: z.object({
    newPassword: z.string().meta({ description: "The new password to set" }),
    token: z.string().meta({ description: "The token to reset the password" }).optional()
  }),
  metadata: { openapi: {
    operationId: "resetPassword",
    description: "Reset the password for a user",
    responses: { "200": {
      description: "Success",
      content: { "application/json": { schema: {
        type: "object",
        properties: { status: { type: "boolean" } }
      } } }
    } }
  } }
}, async (ctx) => {
  const token = ctx.body.token || ctx.query?.token;
  if (!token) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.INVALID_TOKEN);
  const { newPassword } = ctx.body;
  const minLength = ctx.context.password?.config.minPasswordLength;
  const maxLength = ctx.context.password?.config.maxPasswordLength;
  if (newPassword.length < minLength) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.PASSWORD_TOO_SHORT);
  if (newPassword.length > maxLength) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.PASSWORD_TOO_LONG);
  const id = `reset-password:${token}`;
  const verification = await ctx.context.internalAdapter.findVerificationValue(id);
  if (!verification || verification.expiresAt < /* @__PURE__ */ new Date()) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.INVALID_TOKEN);
  const userId = verification.value;
  const hashedPassword = await ctx.context.password.hash(newPassword);
  if (!(await ctx.context.internalAdapter.findAccounts(userId)).find((ac) => ac.providerId === "credential")) await ctx.context.internalAdapter.createAccount({
    userId,
    providerId: "credential",
    password: hashedPassword,
    accountId: userId
  });
  else await ctx.context.internalAdapter.updatePassword(userId, hashedPassword);
  await ctx.context.internalAdapter.deleteVerificationByIdentifier(id);
  if (ctx.context.options.emailAndPassword?.onPasswordReset) {
    const user = await ctx.context.internalAdapter.findUserById(userId);
    if (user) await ctx.context.options.emailAndPassword.onPasswordReset({ user }, ctx.request);
  }
  if (ctx.context.options.emailAndPassword?.revokeSessionsOnPasswordReset) await ctx.context.internalAdapter.deleteSessions(userId);
  return ctx.json({ status: true });
});
const verifyPassword = createAuthEndpoint("/verify-password", {
  method: "POST",
  body: z.object({ password: z.string().meta({ description: "The password to verify" }) }),
  metadata: {
    scope: "server",
    openapi: {
      operationId: "verifyPassword",
      description: "Verify the current user's password",
      responses: { "200": {
        description: "Success",
        content: { "application/json": { schema: {
          type: "object",
          properties: { status: { type: "boolean" } }
        } } }
      } }
    }
  },
  use: [sensitiveSessionMiddleware]
}, async (ctx) => {
  const { password } = ctx.body;
  const session = ctx.context.session;
  if (!await validatePassword(ctx, {
    password,
    userId: session.user.id
  })) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.INVALID_PASSWORD);
  return ctx.json({ status: true });
});
const socialSignInBodySchema = z.object({
  callbackURL: z.string().meta({ description: "Callback URL to redirect to after the user has signed in" }).optional(),
  newUserCallbackURL: z.string().optional(),
  errorCallbackURL: z.string().meta({ description: "Callback URL to redirect to if an error happens" }).optional(),
  provider: SocialProviderListEnum,
  disableRedirect: z.boolean().meta({ description: "Disable automatic redirection to the provider. Useful for handling the redirection yourself" }).optional(),
  idToken: z.optional(z.object({
    token: z.string().meta({ description: "ID token from the provider" }),
    nonce: z.string().meta({ description: "Nonce used to generate the token" }).optional(),
    accessToken: z.string().meta({ description: "Access token from the provider" }).optional(),
    refreshToken: z.string().meta({ description: "Refresh token from the provider" }).optional(),
    expiresAt: z.number().meta({ description: "Expiry date of the token" }).optional(),
    user: z.object({
      name: z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional()
      }).optional(),
      email: z.string().optional()
    }).meta({ description: "The user object from the provider. Only available for some providers like Apple." }).optional()
  })),
  scopes: z.array(z.string()).meta({ description: "Array of scopes to request from the provider. This will override the default scopes passed." }).optional(),
  requestSignUp: z.boolean().meta({ description: "Explicitly request sign-up. Useful when disableImplicitSignUp is true for this provider" }).optional(),
  loginHint: z.string().meta({ description: "The login hint to use for the authorization code request" }).optional(),
  additionalData: z.record(z.string(), z.any()).optional().meta({ description: "Additional data to be passed through the OAuth flow" })
});
const signInSocial = () => createAuthEndpoint("/sign-in/social", {
  method: "POST",
  operationId: "socialSignIn",
  body: socialSignInBodySchema,
  metadata: {
    $Infer: {
      body: {},
      returned: {}
    },
    openapi: {
      description: "Sign in with a social provider",
      operationId: "socialSignIn",
      responses: { "200": {
        description: "Success - Returns either session details or redirect URL",
        content: { "application/json": { schema: {
          type: "object",
          description: "Session response when idToken is provided",
          properties: {
            token: { type: "string" },
            user: {
              type: "object",
              $ref: "#/components/schemas/User"
            },
            url: { type: "string" },
            redirect: {
              type: "boolean",
              enum: [false]
            }
          },
          required: [
            "redirect",
            "token",
            "user"
          ]
        } } }
      } }
    }
  }
}, async (c) => {
  const provider = await getAwaitableValue(c.context.socialProviders, { value: c.body.provider });
  if (!provider) {
    c.context.logger.error("Provider not found. Make sure to add the provider in your auth config", { provider: c.body.provider });
    throw APIError.from("NOT_FOUND", BASE_ERROR_CODES.PROVIDER_NOT_FOUND);
  }
  if (c.body.idToken) {
    if (!provider.verifyIdToken) {
      c.context.logger.error("Provider does not support id token verification", { provider: c.body.provider });
      throw APIError.from("NOT_FOUND", BASE_ERROR_CODES.ID_TOKEN_NOT_SUPPORTED);
    }
    const { token, nonce } = c.body.idToken;
    if (!await provider.verifyIdToken(token, nonce)) {
      c.context.logger.error("Invalid id token", { provider: c.body.provider });
      throw APIError.from("UNAUTHORIZED", BASE_ERROR_CODES.INVALID_TOKEN);
    }
    const userInfo = await provider.getUserInfo({
      idToken: token,
      accessToken: c.body.idToken.accessToken,
      refreshToken: c.body.idToken.refreshToken,
      user: c.body.idToken.user
    });
    if (!userInfo || !userInfo?.user) {
      c.context.logger.error("Failed to get user info", { provider: c.body.provider });
      throw APIError.from("UNAUTHORIZED", BASE_ERROR_CODES.FAILED_TO_GET_USER_INFO);
    }
    if (!userInfo.user.email) {
      c.context.logger.error("User email not found", { provider: c.body.provider });
      throw APIError.from("UNAUTHORIZED", BASE_ERROR_CODES.USER_EMAIL_NOT_FOUND);
    }
    const data = await handleOAuthUserInfo(c, {
      userInfo: {
        ...userInfo.user,
        email: userInfo.user.email,
        id: String(userInfo.user.id),
        name: userInfo.user.name || "",
        image: userInfo.user.image,
        emailVerified: userInfo.user.emailVerified || false
      },
      account: {
        providerId: provider.id,
        accountId: String(userInfo.user.id),
        accessToken: c.body.idToken.accessToken
      },
      callbackURL: c.body.callbackURL,
      disableSignUp: provider.disableImplicitSignUp && !c.body.requestSignUp || provider.disableSignUp
    });
    if (data.error) throw APIError.from("UNAUTHORIZED", {
      message: data.error,
      code: "OAUTH_LINK_ERROR"
    });
    await setSessionCookie(c, data.data);
    return c.json({
      redirect: false,
      token: data.data.session.token,
      url: void 0,
      user: parseUserOutput(c.context.options, data.data.user)
    });
  }
  const { codeVerifier, state } = await generateState(c, void 0, c.body.additionalData);
  const url2 = await provider.createAuthorizationURL({
    state,
    codeVerifier,
    redirectURI: `${c.context.baseURL}/callback/${provider.id}`,
    scopes: c.body.scopes,
    loginHint: c.body.loginHint
  });
  if (!c.body.disableRedirect) c.setHeader("Location", url2.toString());
  return c.json({
    url: url2.toString(),
    redirect: !c.body.disableRedirect
  });
});
const signInEmail = () => createAuthEndpoint("/sign-in/email", {
  method: "POST",
  operationId: "signInEmail",
  use: [formCsrfMiddleware],
  body: z.object({
    email: z.string().meta({ description: "Email of the user" }),
    password: z.string().meta({ description: "Password of the user" }),
    callbackURL: z.string().meta({ description: "Callback URL to use as a redirect for email verification" }).optional(),
    rememberMe: z.boolean().meta({ description: "If this is false, the session will not be remembered. Default is `true`." }).default(true).optional()
  }),
  metadata: {
    allowedMediaTypes: ["application/x-www-form-urlencoded", "application/json"],
    $Infer: {
      body: {},
      returned: {}
    },
    openapi: {
      operationId: "signInEmail",
      description: "Sign in with email and password",
      responses: { "200": {
        description: "Success - Returns either session details or redirect URL",
        content: { "application/json": { schema: {
          type: "object",
          description: "Session response when idToken is provided",
          properties: {
            redirect: {
              type: "boolean",
              enum: [false]
            },
            token: {
              type: "string",
              description: "Session token"
            },
            url: {
              type: "string",
              nullable: true
            },
            user: {
              type: "object",
              $ref: "#/components/schemas/User"
            }
          },
          required: [
            "redirect",
            "token",
            "user"
          ]
        } } }
      } }
    }
  }
}, async (ctx) => {
  if (!ctx.context.options?.emailAndPassword?.enabled) {
    ctx.context.logger.error("Email and password is not enabled. Make sure to enable it in the options on you `auth.ts` file. Check `https://better-auth.com/docs/authentication/email-password` for more!");
    throw APIError.from("BAD_REQUEST", {
      code: "EMAIL_PASSWORD_DISABLED",
      message: "Email and password is not enabled"
    });
  }
  const { email, password } = ctx.body;
  if (!z.email().safeParse(email).success) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.INVALID_EMAIL);
  const user = await ctx.context.internalAdapter.findUserByEmail(email, { includeAccounts: true });
  if (!user) {
    await ctx.context.password.hash(password);
    ctx.context.logger.error("User not found", { email });
    throw APIError.from("UNAUTHORIZED", BASE_ERROR_CODES.INVALID_EMAIL_OR_PASSWORD);
  }
  const credentialAccount = user.accounts.find((a) => a.providerId === "credential");
  if (!credentialAccount) {
    await ctx.context.password.hash(password);
    ctx.context.logger.error("Credential account not found", { email });
    throw APIError.from("UNAUTHORIZED", BASE_ERROR_CODES.INVALID_EMAIL_OR_PASSWORD);
  }
  const currentPassword = credentialAccount?.password;
  if (!currentPassword) {
    await ctx.context.password.hash(password);
    ctx.context.logger.error("Password not found", { email });
    throw APIError.from("UNAUTHORIZED", BASE_ERROR_CODES.INVALID_EMAIL_OR_PASSWORD);
  }
  if (!await ctx.context.password.verify({
    hash: currentPassword,
    password
  })) {
    ctx.context.logger.error("Invalid password");
    throw APIError.from("UNAUTHORIZED", BASE_ERROR_CODES.INVALID_EMAIL_OR_PASSWORD);
  }
  if (ctx.context.options?.emailAndPassword?.requireEmailVerification && !user.user.emailVerified) {
    if (!ctx.context.options?.emailVerification?.sendVerificationEmail) throw APIError.from("FORBIDDEN", BASE_ERROR_CODES.EMAIL_NOT_VERIFIED);
    if (ctx.context.options?.emailVerification?.sendOnSignIn) {
      const token = await createEmailVerificationToken(ctx.context.secret, user.user.email, void 0, ctx.context.options.emailVerification?.expiresIn);
      const callbackURL = ctx.body.callbackURL ? encodeURIComponent(ctx.body.callbackURL) : encodeURIComponent("/");
      const url2 = `${ctx.context.baseURL}/verify-email?token=${token}&callbackURL=${callbackURL}`;
      await ctx.context.runInBackgroundOrAwait(ctx.context.options.emailVerification.sendVerificationEmail({
        user: user.user,
        url: url2,
        token
      }, ctx.request));
    }
    throw APIError.from("FORBIDDEN", BASE_ERROR_CODES.EMAIL_NOT_VERIFIED);
  }
  const session = await ctx.context.internalAdapter.createSession(user.user.id, ctx.body.rememberMe === false);
  if (!session) {
    ctx.context.logger.error("Failed to create session");
    throw APIError.from("UNAUTHORIZED", BASE_ERROR_CODES.FAILED_TO_CREATE_SESSION);
  }
  await setSessionCookie(ctx, {
    session,
    user: user.user
  }, ctx.body.rememberMe === false);
  if (ctx.body.callbackURL) ctx.setHeader("Location", ctx.body.callbackURL);
  return ctx.json({
    redirect: !!ctx.body.callbackURL,
    token: session.token,
    url: ctx.body.callbackURL,
    user: parseUserOutput(ctx.context.options, user.user)
  });
});
const signOut = createAuthEndpoint("/sign-out", {
  method: "POST",
  operationId: "signOut",
  requireHeaders: true,
  metadata: { openapi: {
    operationId: "signOut",
    description: "Sign out the current user",
    responses: { "200": {
      description: "Success",
      content: { "application/json": { schema: {
        type: "object",
        properties: { success: { type: "boolean" } }
      } } }
    } }
  } }
}, async (ctx) => {
  const sessionCookieToken = await ctx.getSignedCookie(ctx.context.authCookies.sessionToken.name, ctx.context.secret);
  if (sessionCookieToken) try {
    await ctx.context.internalAdapter.deleteSession(sessionCookieToken);
  } catch (e) {
    ctx.context.logger.error("Failed to delete session from database", e);
  }
  deleteSessionCookie(ctx);
  return ctx.json({ success: true });
});
const signUpEmailBodySchema = z.object({
  name: z.string(),
  email: z.email(),
  password: z.string().nonempty(),
  image: z.string().optional(),
  callbackURL: z.string().optional(),
  rememberMe: z.boolean().optional()
}).and(z.record(z.string(), z.any()));
const signUpEmail = () => createAuthEndpoint("/sign-up/email", {
  method: "POST",
  operationId: "signUpWithEmailAndPassword",
  use: [formCsrfMiddleware],
  body: signUpEmailBodySchema,
  metadata: {
    allowedMediaTypes: ["application/x-www-form-urlencoded", "application/json"],
    $Infer: {
      body: {},
      returned: {}
    },
    openapi: {
      operationId: "signUpWithEmailAndPassword",
      description: "Sign up a user using email and password",
      requestBody: { content: { "application/json": { schema: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "The name of the user"
          },
          email: {
            type: "string",
            description: "The email of the user"
          },
          password: {
            type: "string",
            description: "The password of the user"
          },
          image: {
            type: "string",
            description: "The profile image URL of the user"
          },
          callbackURL: {
            type: "string",
            description: "The URL to use for email verification callback"
          },
          rememberMe: {
            type: "boolean",
            description: "If this is false, the session will not be remembered. Default is `true`."
          }
        },
        required: [
          "name",
          "email",
          "password"
        ]
      } } } },
      responses: {
        "200": {
          description: "Successfully created user",
          content: { "application/json": { schema: {
            type: "object",
            properties: {
              token: {
                type: "string",
                nullable: true,
                description: "Authentication token for the session"
              },
              user: {
                type: "object",
                properties: {
                  id: {
                    type: "string",
                    description: "The unique identifier of the user"
                  },
                  email: {
                    type: "string",
                    format: "email",
                    description: "The email address of the user"
                  },
                  name: {
                    type: "string",
                    description: "The name of the user"
                  },
                  image: {
                    type: "string",
                    format: "uri",
                    nullable: true,
                    description: "The profile image URL of the user"
                  },
                  emailVerified: {
                    type: "boolean",
                    description: "Whether the email has been verified"
                  },
                  createdAt: {
                    type: "string",
                    format: "date-time",
                    description: "When the user was created"
                  },
                  updatedAt: {
                    type: "string",
                    format: "date-time",
                    description: "When the user was last updated"
                  }
                },
                required: [
                  "id",
                  "email",
                  "name",
                  "emailVerified",
                  "createdAt",
                  "updatedAt"
                ]
              }
            },
            required: ["user"]
          } } }
        },
        "422": {
          description: "Unprocessable Entity. User already exists or failed to create user.",
          content: { "application/json": { schema: {
            type: "object",
            properties: { message: { type: "string" } }
          } } }
        }
      }
    }
  }
}, async (ctx) => {
  return runWithTransaction(ctx.context.adapter, async () => {
    if (!ctx.context.options.emailAndPassword?.enabled || ctx.context.options.emailAndPassword?.disableSignUp) throw APIError.from("BAD_REQUEST", {
      message: "Email and password sign up is not enabled",
      code: "EMAIL_PASSWORD_SIGN_UP_DISABLED"
    });
    const body = ctx.body;
    const { name, email, password, image, callbackURL: _callbackURL, rememberMe, ...rest } = body;
    if (!z.email().safeParse(email).success) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.INVALID_EMAIL);
    if (!password || typeof password !== "string") throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.INVALID_PASSWORD);
    const minPasswordLength = ctx.context.password.config.minPasswordLength;
    if (password.length < minPasswordLength) {
      ctx.context.logger.error("Password is too short");
      throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.PASSWORD_TOO_SHORT);
    }
    const maxPasswordLength = ctx.context.password.config.maxPasswordLength;
    if (password.length > maxPasswordLength) {
      ctx.context.logger.error("Password is too long");
      throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.PASSWORD_TOO_LONG);
    }
    const shouldReturnGenericDuplicateResponse = ctx.context.options.emailAndPassword.requireEmailVerification;
    const shouldSkipAutoSignIn = ctx.context.options.emailAndPassword.autoSignIn === false || shouldReturnGenericDuplicateResponse;
    const additionalUserFields = parseUserInput(ctx.context.options, rest, "create");
    const normalizedEmail = email.toLowerCase();
    const dbUser = await ctx.context.internalAdapter.findUserByEmail(normalizedEmail);
    if (dbUser?.user) {
      ctx.context.logger.info(`Sign-up attempt for existing email: ${email}`);
      if (shouldReturnGenericDuplicateResponse) {
        await ctx.context.password.hash(password);
        if (ctx.context.options.emailAndPassword?.onExistingUserSignUp) await ctx.context.runInBackgroundOrAwait(ctx.context.options.emailAndPassword.onExistingUserSignUp({ user: dbUser.user }, ctx.request));
        const now2 = /* @__PURE__ */ new Date();
        const generatedId = ctx.context.generateId({ model: "user" }) || generateId();
        const coreFields = {
          name,
          email: normalizedEmail,
          emailVerified: false,
          image: image || null,
          createdAt: now2,
          updatedAt: now2
        };
        const customSyntheticUser = ctx.context.options.emailAndPassword?.customSyntheticUser;
        let syntheticUser;
        if (customSyntheticUser) {
          const additionalFieldKeys = Object.keys(ctx.context.options.user?.additionalFields ?? {});
          const additionalFields = {};
          for (const key of additionalFieldKeys) if (key in additionalUserFields) additionalFields[key] = additionalUserFields[key];
          syntheticUser = customSyntheticUser({
            coreFields,
            additionalFields,
            id: generatedId
          });
        } else syntheticUser = {
          ...coreFields,
          ...additionalUserFields,
          id: generatedId
        };
        return ctx.json({
          token: null,
          user: parseUserOutput(ctx.context.options, syntheticUser)
        });
      }
      throw APIError.from("UNPROCESSABLE_ENTITY", BASE_ERROR_CODES.USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL);
    }
    const hash = await ctx.context.password.hash(password);
    let createdUser;
    try {
      createdUser = await ctx.context.internalAdapter.createUser({
        email: normalizedEmail,
        name,
        image,
        ...additionalUserFields,
        emailVerified: false
      });
      if (!createdUser) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.FAILED_TO_CREATE_USER);
    } catch (e) {
      if (isDevelopment()) ctx.context.logger.error("Failed to create user", e);
      if (isAPIError(e)) throw e;
      ctx.context.logger?.error("Failed to create user", e);
      throw APIError.from("UNPROCESSABLE_ENTITY", BASE_ERROR_CODES.FAILED_TO_CREATE_USER);
    }
    if (!createdUser) throw APIError.from("UNPROCESSABLE_ENTITY", BASE_ERROR_CODES.FAILED_TO_CREATE_USER);
    await ctx.context.internalAdapter.linkAccount({
      userId: createdUser.id,
      providerId: "credential",
      accountId: createdUser.id,
      password: hash
    });
    if (ctx.context.options.emailVerification?.sendOnSignUp ?? ctx.context.options.emailAndPassword.requireEmailVerification) {
      const token = await createEmailVerificationToken(ctx.context.secret, createdUser.email, void 0, ctx.context.options.emailVerification?.expiresIn);
      const callbackURL = body.callbackURL ? encodeURIComponent(body.callbackURL) : encodeURIComponent("/");
      const url2 = `${ctx.context.baseURL}/verify-email?token=${token}&callbackURL=${callbackURL}`;
      if (ctx.context.options.emailVerification?.sendVerificationEmail) await ctx.context.runInBackgroundOrAwait(ctx.context.options.emailVerification.sendVerificationEmail({
        user: createdUser,
        url: url2,
        token
      }, ctx.request));
    }
    if (shouldSkipAutoSignIn) return ctx.json({
      token: null,
      user: parseUserOutput(ctx.context.options, createdUser)
    });
    const session = await ctx.context.internalAdapter.createSession(createdUser.id, rememberMe === false);
    if (!session) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.FAILED_TO_CREATE_SESSION);
    await setSessionCookie(ctx, {
      session,
      user: createdUser
    }, rememberMe === false);
    return ctx.json({
      token: session.token,
      user: parseUserOutput(ctx.context.options, createdUser)
    });
  });
});
const updateSessionBodySchema = z.record(z.string().meta({ description: "Field name must be a string" }), z.any());
const updateSession = () => createAuthEndpoint("/update-session", {
  method: "POST",
  operationId: "updateSession",
  body: updateSessionBodySchema,
  use: [sessionMiddleware],
  metadata: {
    $Infer: { body: {} },
    openapi: {
      operationId: "updateSession",
      description: "Update the current session",
      responses: { "200": {
        description: "Success",
        content: { "application/json": { schema: {
          type: "object",
          properties: { session: {
            type: "object",
            $ref: "#/components/schemas/Session"
          } }
        } } }
      } }
    }
  }
}, async (ctx) => {
  const body = ctx.body;
  if (typeof body !== "object" || Array.isArray(body)) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.BODY_MUST_BE_AN_OBJECT);
  const session = ctx.context.session;
  const additionalFields = parseSessionInput(ctx.context.options, body, "update");
  if (Object.keys(additionalFields).length === 0) throw APIError.fromStatus("BAD_REQUEST", { message: "No fields to update" });
  const newSession = await ctx.context.internalAdapter.updateSession(session.session.token, {
    ...additionalFields,
    updatedAt: /* @__PURE__ */ new Date()
  }) ?? {
    ...session.session,
    ...additionalFields,
    updatedAt: /* @__PURE__ */ new Date()
  };
  await setSessionCookie(ctx, {
    session: newSession,
    user: session.user
  });
  return ctx.json({ session: parseSessionOutput(ctx.context.options, newSession) });
});
const updateUserBodySchema = z.record(z.string().meta({ description: "Field name must be a string" }), z.any());
const updateUser = () => createAuthEndpoint("/update-user", {
  method: "POST",
  operationId: "updateUser",
  body: updateUserBodySchema,
  use: [sessionMiddleware],
  metadata: {
    $Infer: { body: {} },
    openapi: {
      operationId: "updateUser",
      description: "Update the current user",
      requestBody: { content: { "application/json": { schema: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "The name of the user"
          },
          image: {
            type: "string",
            description: "The image of the user",
            nullable: true
          }
        }
      } } } },
      responses: { "200": {
        description: "Success",
        content: { "application/json": { schema: {
          type: "object",
          properties: { user: {
            type: "object",
            $ref: "#/components/schemas/User"
          } }
        } } }
      } }
    }
  }
}, async (ctx) => {
  const body = ctx.body;
  if (typeof body !== "object" || Array.isArray(body)) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.BODY_MUST_BE_AN_OBJECT);
  if (body.email) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.EMAIL_CAN_NOT_BE_UPDATED);
  const { name, image, ...rest } = body;
  const session = ctx.context.session;
  const additionalFields = parseUserInput(ctx.context.options, rest, "update");
  if (image === void 0 && name === void 0 && Object.keys(additionalFields).length === 0) throw APIError.fromStatus("BAD_REQUEST", { message: "No fields to update" });
  const updatedUser = await ctx.context.internalAdapter.updateUser(session.user.id, {
    name,
    image,
    ...additionalFields
  }) ?? {
    ...session.user,
    ...name !== void 0 && { name },
    ...image !== void 0 && { image },
    ...additionalFields
  };
  await setSessionCookie(ctx, {
    session: session.session,
    user: updatedUser
  });
  return ctx.json({ status: true });
});
const changePassword = createAuthEndpoint("/change-password", {
  method: "POST",
  operationId: "changePassword",
  body: z.object({
    newPassword: z.string().meta({ description: "The new password to set" }),
    currentPassword: z.string().meta({ description: "The current password is required" }),
    revokeOtherSessions: z.boolean().meta({ description: "Must be a boolean value" }).optional()
  }),
  use: [sensitiveSessionMiddleware],
  metadata: { openapi: {
    operationId: "changePassword",
    description: "Change the password of the user",
    responses: { "200": {
      description: "Password successfully changed",
      content: { "application/json": { schema: {
        type: "object",
        properties: {
          token: {
            type: "string",
            nullable: true,
            description: "New session token if other sessions were revoked"
          },
          user: {
            type: "object",
            properties: {
              id: {
                type: "string",
                description: "The unique identifier of the user"
              },
              email: {
                type: "string",
                format: "email",
                description: "The email address of the user"
              },
              name: {
                type: "string",
                description: "The name of the user"
              },
              image: {
                type: "string",
                format: "uri",
                nullable: true,
                description: "The profile image URL of the user"
              },
              emailVerified: {
                type: "boolean",
                description: "Whether the email has been verified"
              },
              createdAt: {
                type: "string",
                format: "date-time",
                description: "When the user was created"
              },
              updatedAt: {
                type: "string",
                format: "date-time",
                description: "When the user was last updated"
              }
            },
            required: [
              "id",
              "email",
              "name",
              "emailVerified",
              "createdAt",
              "updatedAt"
            ]
          }
        },
        required: ["user"]
      } } }
    } }
  } }
}, async (ctx) => {
  const { newPassword, currentPassword, revokeOtherSessions: revokeOtherSessions2 } = ctx.body;
  const session = ctx.context.session;
  const minPasswordLength = ctx.context.password.config.minPasswordLength;
  if (newPassword.length < minPasswordLength) {
    ctx.context.logger.error("Password is too short");
    throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.PASSWORD_TOO_SHORT);
  }
  const maxPasswordLength = ctx.context.password.config.maxPasswordLength;
  if (newPassword.length > maxPasswordLength) {
    ctx.context.logger.error("Password is too long");
    throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.PASSWORD_TOO_LONG);
  }
  const account = (await ctx.context.internalAdapter.findAccounts(session.user.id)).find((account2) => account2.providerId === "credential" && account2.password);
  if (!account || !account.password) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.CREDENTIAL_ACCOUNT_NOT_FOUND);
  const passwordHash = await ctx.context.password.hash(newPassword);
  if (!await ctx.context.password.verify({
    hash: account.password,
    password: currentPassword
  })) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.INVALID_PASSWORD);
  await ctx.context.internalAdapter.updateAccount(account.id, { password: passwordHash });
  let token = null;
  if (revokeOtherSessions2) {
    await ctx.context.internalAdapter.deleteSessions(session.user.id);
    const newSession = await ctx.context.internalAdapter.createSession(session.user.id);
    if (!newSession) throw APIError.from("INTERNAL_SERVER_ERROR", BASE_ERROR_CODES.FAILED_TO_GET_SESSION);
    await setSessionCookie(ctx, {
      session: newSession,
      user: session.user
    });
    token = newSession.token;
  }
  return ctx.json({
    token,
    user: parseUserOutput(ctx.context.options, session.user)
  });
});
const setPassword = createAuthEndpoint({
  method: "POST",
  body: z.object({ newPassword: z.string().meta({ description: "The new password to set is required" }) }),
  use: [sensitiveSessionMiddleware]
}, async (ctx) => {
  const { newPassword } = ctx.body;
  const session = ctx.context.session;
  const minPasswordLength = ctx.context.password.config.minPasswordLength;
  if (newPassword.length < minPasswordLength) {
    ctx.context.logger.error("Password is too short");
    throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.PASSWORD_TOO_SHORT);
  }
  const maxPasswordLength = ctx.context.password.config.maxPasswordLength;
  if (newPassword.length > maxPasswordLength) {
    ctx.context.logger.error("Password is too long");
    throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.PASSWORD_TOO_LONG);
  }
  const account = (await ctx.context.internalAdapter.findAccounts(session.user.id)).find((account2) => account2.providerId === "credential" && account2.password);
  const passwordHash = await ctx.context.password.hash(newPassword);
  if (!account) {
    await ctx.context.internalAdapter.linkAccount({
      userId: session.user.id,
      providerId: "credential",
      accountId: session.user.id,
      password: passwordHash
    });
    return ctx.json({ status: true });
  }
  throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.PASSWORD_ALREADY_SET);
});
const deleteUser = createAuthEndpoint("/delete-user", {
  method: "POST",
  use: [sensitiveSessionMiddleware],
  body: z.object({
    callbackURL: z.string().meta({ description: "The callback URL to redirect to after the user is deleted" }).optional(),
    password: z.string().meta({ description: "The password of the user is required to delete the user" }).optional(),
    token: z.string().meta({ description: "The token to delete the user is required" }).optional()
  }),
  metadata: { openapi: {
    operationId: "deleteUser",
    description: "Delete the user",
    requestBody: { content: { "application/json": { schema: {
      type: "object",
      properties: {
        callbackURL: {
          type: "string",
          description: "The callback URL to redirect to after the user is deleted"
        },
        password: {
          type: "string",
          description: "The user's password. Required if session is not fresh"
        },
        token: {
          type: "string",
          description: "The deletion verification token"
        }
      }
    } } } },
    responses: { "200": {
      description: "User deletion processed successfully",
      content: { "application/json": { schema: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            description: "Indicates if the operation was successful"
          },
          message: {
            type: "string",
            enum: ["User deleted", "Verification email sent"],
            description: "Status message of the deletion process"
          }
        },
        required: ["success", "message"]
      } } }
    } }
  } }
}, async (ctx) => {
  if (!ctx.context.options.user?.deleteUser?.enabled) {
    ctx.context.logger.error("Delete user is disabled. Enable it in the options");
    throw APIError.fromStatus("NOT_FOUND");
  }
  const session = ctx.context.session;
  if (ctx.body.password) {
    const account = (await ctx.context.internalAdapter.findAccounts(session.user.id)).find((account2) => account2.providerId === "credential" && account2.password);
    if (!account || !account.password) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.CREDENTIAL_ACCOUNT_NOT_FOUND);
    if (!await ctx.context.password.verify({
      hash: account.password,
      password: ctx.body.password
    })) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.INVALID_PASSWORD);
  }
  if (ctx.body.token) {
    await deleteUserCallback({
      ...ctx,
      query: { token: ctx.body.token }
    });
    return ctx.json({
      success: true,
      message: "User deleted"
    });
  }
  if (ctx.context.options.user.deleteUser?.sendDeleteAccountVerification) {
    const token = generateRandomString(32, "0-9", "a-z");
    await ctx.context.internalAdapter.createVerificationValue({
      value: session.user.id,
      identifier: `delete-account-${token}`,
      expiresAt: new Date(Date.now() + (ctx.context.options.user.deleteUser?.deleteTokenExpiresIn || 3600 * 24) * 1e3)
    });
    const url2 = `${ctx.context.baseURL}/delete-user/callback?token=${token}&callbackURL=${encodeURIComponent(ctx.body.callbackURL || "/")}`;
    await ctx.context.runInBackgroundOrAwait(ctx.context.options.user.deleteUser.sendDeleteAccountVerification({
      user: session.user,
      url: url2,
      token
    }, ctx.request));
    return ctx.json({
      success: true,
      message: "Verification email sent"
    });
  }
  if (!ctx.body.password && ctx.context.sessionConfig.freshAge !== 0) {
    const createdAt = new Date(session.session.createdAt).getTime();
    const freshAge = ctx.context.sessionConfig.freshAge * 1e3;
    if (Date.now() - createdAt >= freshAge) throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.SESSION_EXPIRED);
  }
  const beforeDelete = ctx.context.options.user.deleteUser?.beforeDelete;
  if (beforeDelete) await beforeDelete(session.user, ctx.request);
  await ctx.context.internalAdapter.deleteUser(session.user.id);
  await ctx.context.internalAdapter.deleteSessions(session.user.id);
  deleteSessionCookie(ctx);
  const afterDelete = ctx.context.options.user.deleteUser?.afterDelete;
  if (afterDelete) await afterDelete(session.user, ctx.request);
  return ctx.json({
    success: true,
    message: "User deleted"
  });
});
const deleteUserCallback = createAuthEndpoint("/delete-user/callback", {
  method: "GET",
  query: z.object({
    token: z.string().meta({ description: "The token to verify the deletion request" }),
    callbackURL: z.string().meta({ description: "The URL to redirect to after deletion" }).optional()
  }),
  use: [originCheck((ctx) => ctx.query.callbackURL)],
  metadata: { openapi: {
    description: "Callback to complete user deletion with verification token",
    responses: { "200": {
      description: "User successfully deleted",
      content: { "application/json": { schema: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            description: "Indicates if the deletion was successful"
          },
          message: {
            type: "string",
            enum: ["User deleted"],
            description: "Confirmation message"
          }
        },
        required: ["success", "message"]
      } } }
    } }
  } }
}, async (ctx) => {
  if (!ctx.context.options.user?.deleteUser?.enabled) {
    ctx.context.logger.error("Delete user is disabled. Enable it in the options");
    throw APIError.from("NOT_FOUND", {
      message: "Not found",
      code: "NOT_FOUND"
    });
  }
  const session = await getSessionFromCtx(ctx);
  if (!session) throw APIError.from("NOT_FOUND", BASE_ERROR_CODES.FAILED_TO_GET_USER_INFO);
  const token = await ctx.context.internalAdapter.findVerificationValue(`delete-account-${ctx.query.token}`);
  if (!token || token.expiresAt < /* @__PURE__ */ new Date()) throw APIError.from("NOT_FOUND", BASE_ERROR_CODES.INVALID_TOKEN);
  if (token.value !== session.user.id) throw APIError.from("NOT_FOUND", BASE_ERROR_CODES.INVALID_TOKEN);
  const beforeDelete = ctx.context.options.user.deleteUser?.beforeDelete;
  if (beforeDelete) await beforeDelete(session.user, ctx.request);
  await ctx.context.internalAdapter.deleteUser(session.user.id);
  await ctx.context.internalAdapter.deleteSessions(session.user.id);
  await ctx.context.internalAdapter.deleteAccounts(session.user.id);
  await ctx.context.internalAdapter.deleteVerificationByIdentifier(`delete-account-${ctx.query.token}`);
  deleteSessionCookie(ctx);
  const afterDelete = ctx.context.options.user.deleteUser?.afterDelete;
  if (afterDelete) await afterDelete(session.user, ctx.request);
  if (ctx.query.callbackURL) throw ctx.redirect(ctx.query.callbackURL || "/");
  return ctx.json({
    success: true,
    message: "User deleted"
  });
});
const changeEmail = createAuthEndpoint("/change-email", {
  method: "POST",
  body: z.object({
    newEmail: z.email().meta({ description: "The new email address to set must be a valid email address" }),
    callbackURL: z.string().meta({ description: "The URL to redirect to after email verification" }).optional()
  }),
  use: [sensitiveSessionMiddleware],
  metadata: { openapi: {
    operationId: "changeEmail",
    responses: { "200": {
      description: "Email change request processed successfully",
      content: { "application/json": { schema: {
        type: "object",
        properties: {
          user: {
            type: "object",
            $ref: "#/components/schemas/User"
          },
          status: {
            type: "boolean",
            description: "Indicates if the request was successful"
          },
          message: {
            type: "string",
            enum: ["Email updated", "Verification email sent"],
            description: "Status message of the email change process",
            nullable: true
          }
        },
        required: ["status"]
      } } }
    } }
  } }
}, async (ctx) => {
  if (!ctx.context.options.user?.changeEmail?.enabled) {
    ctx.context.logger.error("Change email is disabled.");
    throw APIError.fromStatus("BAD_REQUEST", { message: "Change email is disabled" });
  }
  const newEmail = ctx.body.newEmail.toLowerCase();
  if (newEmail === ctx.context.session.user.email) {
    ctx.context.logger.error("Email is the same");
    throw APIError.fromStatus("BAD_REQUEST", { message: "Email is the same" });
  }
  const canUpdateWithoutVerification = ctx.context.session.user.emailVerified !== true && ctx.context.options.user.changeEmail.updateEmailWithoutVerification;
  const canSendConfirmation = ctx.context.session.user.emailVerified && ctx.context.options.user.changeEmail.sendChangeEmailConfirmation;
  const canSendVerification = ctx.context.options.emailVerification?.sendVerificationEmail;
  if (!canUpdateWithoutVerification && !canSendConfirmation && !canSendVerification) {
    ctx.context.logger.error("Verification email isn't enabled.");
    throw APIError.fromStatus("BAD_REQUEST", { message: "Verification email isn't enabled" });
  }
  if (await ctx.context.internalAdapter.findUserByEmail(newEmail)) {
    await createEmailVerificationToken(ctx.context.secret, ctx.context.session.user.email, newEmail, ctx.context.options.emailVerification?.expiresIn);
    ctx.context.logger.info("Change email attempt for existing email");
    return ctx.json({ status: true });
  }
  if (canUpdateWithoutVerification) {
    await ctx.context.internalAdapter.updateUserByEmail(ctx.context.session.user.email, { email: newEmail });
    await setSessionCookie(ctx, {
      session: ctx.context.session.session,
      user: {
        ...ctx.context.session.user,
        email: newEmail
      }
    });
    if (canSendVerification) {
      const token2 = await createEmailVerificationToken(ctx.context.secret, newEmail, void 0, ctx.context.options.emailVerification?.expiresIn);
      const url3 = `${ctx.context.baseURL}/verify-email?token=${token2}&callbackURL=${ctx.body.callbackURL || "/"}`;
      await ctx.context.runInBackgroundOrAwait(canSendVerification({
        user: {
          ...ctx.context.session.user,
          email: newEmail
        },
        url: url3,
        token: token2
      }, ctx.request));
    }
    return ctx.json({ status: true });
  }
  if (canSendConfirmation) {
    const token2 = await createEmailVerificationToken(ctx.context.secret, ctx.context.session.user.email, newEmail, ctx.context.options.emailVerification?.expiresIn, { requestType: "change-email-confirmation" });
    const url3 = `${ctx.context.baseURL}/verify-email?token=${token2}&callbackURL=${ctx.body.callbackURL || "/"}`;
    await ctx.context.runInBackgroundOrAwait(canSendConfirmation({
      user: ctx.context.session.user,
      newEmail,
      url: url3,
      token: token2
    }, ctx.request));
    return ctx.json({ status: true });
  }
  if (!canSendVerification) {
    ctx.context.logger.error("Verification email isn't enabled.");
    throw APIError.fromStatus("BAD_REQUEST", { message: "Verification email isn't enabled" });
  }
  const token = await createEmailVerificationToken(ctx.context.secret, ctx.context.session.user.email, newEmail, ctx.context.options.emailVerification?.expiresIn, { requestType: "change-email-verification" });
  const url2 = `${ctx.context.baseURL}/verify-email?token=${token}&callbackURL=${ctx.body.callbackURL || "/"}`;
  await ctx.context.runInBackgroundOrAwait(canSendVerification({
    user: {
      ...ctx.context.session.user,
      email: newEmail
    },
    url: url2,
    token
  }, ctx.request));
  return ctx.json({ status: true });
});
const defuReplaceArrays = createDefu((obj, key, value) => {
  if (Array.isArray(obj[key]) && Array.isArray(value)) {
    obj[key] = value;
    return true;
  }
});
const hooksSourceWeakMap = /* @__PURE__ */ new WeakMap();
function getOperationId(endpoint, key) {
  if (!endpoint?.options) return key;
  const opts = endpoint.options;
  return opts.operationId ?? opts.metadata?.openapi?.operationId ?? key;
}
async function resolveDynamicContext(rawCtx, input) {
  if (rawCtx.baseURL) return rawCtx;
  const source = pickSource(input);
  const config = rawCtx.options.baseURL;
  const hasFallback = isDynamicBaseURLConfig(config) && Boolean(config.fallback);
  if (source === void 0 && !hasFallback) throw new APIError("INTERNAL_SERVER_ERROR", { message: "Dynamic baseURL could not be resolved for this direct auth.api call. Pass `headers: request.headers` (or `request`) to the call, or add `fallback` to your baseURL config." });
  try {
    return await resolveRequestContext(rawCtx, source, resolveDynamicTrustedProxyHeaders(rawCtx.options));
  } catch (err) {
    if (err instanceof BetterAuthError) throw new APIError("INTERNAL_SERVER_ERROR", { message: err.message });
    throw err;
  }
}
function toAuthEndpoints(endpoints, ctx) {
  const api = {};
  for (const [key, endpoint] of Object.entries(endpoints)) {
    api[key] = async (context) => {
      const operationId = getOperationId(endpoint, key);
      const endpointMethod = endpoint?.options?.method;
      const defaultMethod = Array.isArray(endpointMethod) ? endpointMethod[0] : endpointMethod;
      const run = async () => {
        const rawContext = await ctx;
        const methodName = context?.method ?? context?.request?.method ?? defaultMethod ?? "?";
        const route = endpoint.path ?? "/:virtual";
        const authContext = isDynamicBaseURLConfig(rawContext.options.baseURL) ? await resolveDynamicContext(rawContext, context) : rawContext;
        let internalContext = {
          ...context,
          context: {
            ...authContext,
            returned: void 0,
            responseHeaders: void 0,
            session: null
          },
          path: endpoint.path,
          headers: context?.headers ? new Headers(context?.headers) : void 0
        };
        const hasRequest = isRequestLike(context?.request);
        const shouldReturnResponse = context?.asResponse ?? hasRequest;
        return withSpan(`${methodName} ${route}`, {
          [ATTR_HTTP_ROUTE]: route,
          [ATTR_OPERATION_ID]: operationId
        }, async () => runWithEndpointContext(internalContext, async () => {
          const { beforeHooks, afterHooks } = getHooks(authContext);
          const before = await runBeforeHooks(internalContext, beforeHooks, endpoint, operationId);
          if ("context" in before && before.context && typeof before.context === "object") {
            const { headers, ...rest } = before.context;
            if (headers) headers.forEach((value, key2) => {
              internalContext.headers.set(key2, value);
            });
            internalContext = defuReplaceArrays(rest, internalContext);
          } else if (before) return shouldReturnResponse ? toResponse(before, { headers: context?.headers }) : context?.returnHeaders ? {
            headers: context?.headers,
            response: before
          } : before;
          internalContext.asResponse = false;
          internalContext.returnHeaders = true;
          internalContext.returnStatus = true;
          const result = await runWithEndpointContext(internalContext, () => withSpan(`handler ${route}`, {
            [ATTR_HTTP_ROUTE]: route,
            [ATTR_OPERATION_ID]: operationId
          }, () => endpoint(internalContext))).catch((e) => {
            if (isAPIError(e)) {
              const ctxHeaders = e[kAPIErrorHeaderSymbol];
              const errHeaders = e.headers ? new Headers(e.headers) : null;
              let headers = null;
              if (ctxHeaders || errHeaders) {
                headers = new Headers();
                ctxHeaders?.forEach((value, key2) => {
                  headers.append(key2, value);
                });
                errHeaders?.forEach((value, key2) => {
                  if (key2.toLowerCase() === "set-cookie") headers.append(key2, value);
                  else headers.set(key2, value);
                });
              }
              return {
                response: e,
                status: e.statusCode,
                headers
              };
            }
            throw e;
          });
          if (result && result instanceof Response) return result;
          internalContext.context.returned = result.response;
          internalContext.context.responseHeaders = result.headers;
          const after = await runAfterHooks(internalContext, afterHooks, endpoint, operationId);
          if (after.response) result.response = after.response;
          if (isAPIError(result.response) && shouldPublishLog(authContext.logger.level, "debug")) result.response.stack = result.response.errorStack;
          if (isAPIError(result.response) && !shouldReturnResponse) {
            if (result.headers) Object.defineProperty(result.response, kAPIErrorHeaderSymbol, {
              enumerable: false,
              configurable: true,
              writable: false,
              value: result.headers
            });
            throw result.response;
          }
          return shouldReturnResponse ? toResponse(result.response, {
            headers: result.headers,
            status: result.status
          }) : context?.returnHeaders ? context?.returnStatus ? {
            headers: result.headers,
            response: result.response,
            status: result.status
          } : {
            headers: result.headers,
            response: result.response
          } : context?.returnStatus ? {
            response: result.response,
            status: result.status
          } : result.response;
        }));
      };
      if (await hasRequestState()) return run();
      else return runWithRequestState(/* @__PURE__ */ new WeakMap(), run);
    };
    api[key].path = endpoint.path;
    api[key].options = endpoint.options;
  }
  return api;
}
async function runBeforeHooks(context, hooks, endpoint, operationId) {
  let modifiedContext = {};
  for (const hook of hooks) {
    let matched = false;
    try {
      matched = hook.matcher(context);
    } catch (error2) {
      const hookSource = hooksSourceWeakMap.get(hook.handler) ?? "unknown";
      context.context.logger.error(`An error occurred during ${hookSource} hook matcher execution:`, error2);
      throw new APIError("INTERNAL_SERVER_ERROR", { message: `An error occurred during hook matcher execution. Check the logs for more details.` });
    }
    if (matched) {
      const hookSource = hooksSourceWeakMap.get(hook.handler) ?? "unknown";
      const route = endpoint.path ?? "/:virtual";
      const result = await withSpan(`hook before ${route} ${hookSource}`, {
        [ATTR_HOOK_TYPE]: "before",
        [ATTR_HTTP_ROUTE]: route,
        [ATTR_CONTEXT]: hookSource,
        [ATTR_OPERATION_ID]: operationId
      }, () => hook.handler({
        ...context,
        returnHeaders: false
      })).catch((e) => {
        if (isAPIError(e) && shouldPublishLog(context.context.logger.level, "debug")) e.stack = e.errorStack;
        throw e;
      });
      if (result && typeof result === "object") {
        if ("context" in result && typeof result.context === "object") {
          const { headers, ...rest } = result.context;
          if (headers instanceof Headers) if (modifiedContext.headers) headers.forEach((value, key) => {
            modifiedContext.headers?.set(key, value);
          });
          else modifiedContext.headers = headers;
          modifiedContext = defuReplaceArrays(rest, modifiedContext);
          continue;
        }
        return result;
      }
    }
  }
  return { context: modifiedContext };
}
async function runAfterHooks(context, hooks, endpoint, operationId) {
  for (const hook of hooks) if (hook.matcher(context)) {
    const hookSource = hooksSourceWeakMap.get(hook.handler) ?? "unknown";
    const route = endpoint.path ?? "/:virtual";
    const result = await withSpan(`hook after ${route} ${hookSource}`, {
      [ATTR_HOOK_TYPE]: "after",
      [ATTR_HTTP_ROUTE]: route,
      [ATTR_CONTEXT]: hookSource,
      [ATTR_OPERATION_ID]: operationId
    }, () => hook.handler(context)).catch((e) => {
      if (isAPIError(e)) {
        const headers = e[kAPIErrorHeaderSymbol];
        if (shouldPublishLog(context.context.logger.level, "debug")) e.stack = e.errorStack;
        return {
          response: e,
          headers: headers ? headers : e.headers ? new Headers(e.headers) : null
        };
      }
      throw e;
    });
    if (result.headers) result.headers.forEach((value, key) => {
      if (!context.context.responseHeaders) context.context.responseHeaders = new Headers({ [key]: value });
      else if (key.toLowerCase() === "set-cookie") context.context.responseHeaders.append(key, value);
      else context.context.responseHeaders.set(key, value);
    });
    if (result.response) context.context.returned = result.response;
  }
  return {
    response: context.context.returned,
    headers: context.context.responseHeaders
  };
}
function getHooks(authContext) {
  const plugins = authContext.options.plugins || [];
  const beforeHooks = [];
  const afterHooks = [];
  const beforeHookHandler = authContext.options.hooks?.before;
  if (beforeHookHandler) {
    hooksSourceWeakMap.set(beforeHookHandler, "user");
    beforeHooks.push({
      matcher: () => true,
      handler: beforeHookHandler
    });
  }
  const afterHookHandler = authContext.options.hooks?.after;
  if (afterHookHandler) {
    hooksSourceWeakMap.set(afterHookHandler, "user");
    afterHooks.push({
      matcher: () => true,
      handler: afterHookHandler
    });
  }
  const pluginBeforeHooks = plugins.flatMap((plugin) => (plugin.hooks?.before ?? []).map((h) => {
    hooksSourceWeakMap.set(h.handler, `plugin:${plugin.id}`);
    return h;
  }));
  const pluginAfterHooks = plugins.flatMap((plugin) => (plugin.hooks?.after ?? []).map((h) => {
    hooksSourceWeakMap.set(h.handler, `plugin:${plugin.id}`);
    return h;
  }));
  if (pluginBeforeHooks.length) beforeHooks.push(...pluginBeforeHooks);
  if (pluginAfterHooks.length) afterHooks.push(...pluginAfterHooks);
  return {
    beforeHooks,
    afterHooks
  };
}
function checkEndpointConflicts(options, logger2) {
  const endpointRegistry = /* @__PURE__ */ new Map();
  options.plugins?.forEach((plugin) => {
    if (plugin.endpoints) {
      for (const [key, endpoint] of Object.entries(plugin.endpoints)) if (endpoint && "path" in endpoint && typeof endpoint.path === "string") {
        const path = endpoint.path;
        let methods = [];
        if (endpoint.options && "method" in endpoint.options) {
          if (Array.isArray(endpoint.options.method)) methods = endpoint.options.method;
          else if (typeof endpoint.options.method === "string") methods = [endpoint.options.method];
        }
        if (methods.length === 0) methods = ["*"];
        if (!endpointRegistry.has(path)) endpointRegistry.set(path, []);
        endpointRegistry.get(path).push({
          pluginId: plugin.id,
          endpointKey: key,
          methods
        });
      }
    }
  });
  const conflicts = [];
  for (const [path, entries] of endpointRegistry.entries()) if (entries.length > 1) {
    const methodMap = /* @__PURE__ */ new Map();
    let hasConflict = false;
    for (const entry of entries) for (const method of entry.methods) {
      if (!methodMap.has(method)) methodMap.set(method, []);
      methodMap.get(method).push(entry.pluginId);
      if (methodMap.get(method).length > 1) hasConflict = true;
      if (method === "*" && entries.length > 1) hasConflict = true;
      else if (method !== "*" && methodMap.has("*")) hasConflict = true;
    }
    if (hasConflict) {
      const uniquePlugins = [...new Set(entries.map((e) => e.pluginId))];
      const conflictingMethods = [];
      for (const [method, plugins] of methodMap.entries()) if (plugins.length > 1 || method === "*" && entries.length > 1 || method !== "*" && methodMap.has("*")) conflictingMethods.push(method);
      conflicts.push({
        path,
        plugins: uniquePlugins,
        conflictingMethods
      });
    }
  }
  if (conflicts.length > 0) {
    const conflictMessages = conflicts.map((conflict) => `  - "${conflict.path}" [${conflict.conflictingMethods.join(", ")}] used by plugins: ${conflict.plugins.join(", ")}`).join("\n");
    logger2.error(`Endpoint path conflicts detected! Multiple plugins are trying to use the same endpoint paths with conflicting HTTP methods:
${conflictMessages}

To resolve this, you can:
	1. Use only one of the conflicting plugins
	2. Configure the plugins to use different paths (if supported)
	3. Ensure plugins use different HTTP methods for the same path
`);
  }
}
function getEndpoints(ctx, options) {
  const pluginEndpoints = options.plugins?.reduce((acc, plugin) => {
    return {
      ...acc,
      ...plugin.endpoints
    };
  }, {}) ?? {};
  const middlewares = options.plugins?.map((plugin) => plugin.middlewares?.map((m) => {
    const middleware = (async (context) => {
      const authContext = await ctx;
      return withSpan(`middleware ${m.path} ${plugin.id}`, {
        [ATTR_HOOK_TYPE]: "middleware",
        [ATTR_HTTP_ROUTE]: m.path,
        [ATTR_CONTEXT]: `plugin:${plugin.id}`
      }, () => m.middleware({
        ...context,
        context: {
          ...authContext,
          ...context.context
        }
      }));
    });
    middleware.options = m.middleware.options;
    return {
      path: m.path,
      middleware
    };
  })).filter((plugin) => plugin !== void 0).flat() || [];
  return {
    api: toAuthEndpoints({
      signInSocial: signInSocial(),
      callbackOAuth,
      getSession: getSession(),
      signOut,
      signUpEmail: signUpEmail(),
      signInEmail: signInEmail(),
      resetPassword,
      verifyPassword,
      verifyEmail,
      sendVerificationEmail,
      changeEmail,
      changePassword,
      setPassword,
      updateSession: updateSession(),
      updateUser: updateUser(),
      deleteUser,
      requestPasswordReset,
      requestPasswordResetCallback,
      listSessions: listSessions(),
      revokeSession,
      revokeSessions,
      revokeOtherSessions,
      linkSocialAccount,
      listUserAccounts,
      deleteUserCallback,
      unlinkAccount,
      refreshToken,
      getAccessToken,
      accountInfo,
      ...pluginEndpoints,
      ok,
      error
    }, ctx),
    middlewares
  };
}
const router$1 = (ctx, options) => {
  const { api, middlewares } = getEndpoints(ctx, options);
  const basePath = new URL(ctx.baseURL).pathname;
  return createRouter(api, {
    routerContext: ctx,
    openapi: { disabled: true },
    basePath,
    routerMiddleware: [{
      path: "/**",
      middleware: originCheckMiddleware
    }, ...middlewares],
    allowedMediaTypes: ["application/json"],
    skipTrailingSlashes: options.advanced?.skipTrailingSlashes ?? false,
    async onRequest(req) {
      const disabledPaths = ctx.options.disabledPaths || [];
      const normalizedPath = normalizePathname(req.url, basePath);
      if (disabledPaths.includes(normalizedPath)) return new Response("Not Found", { status: 404 });
      let currentRequest = req;
      for (const plugin of ctx.options.plugins || []) if (plugin.onRequest) {
        const response = await withSpan(`onRequest ${plugin.id}`, {
          [ATTR_HOOK_TYPE]: "onRequest",
          [ATTR_CONTEXT]: `plugin:${plugin.id}`
        }, () => plugin.onRequest(currentRequest, ctx));
        if (response && "response" in response) return response.response;
        if (response && "request" in response) currentRequest = response.request;
      }
      const rateLimitResponse2 = await onRequestRateLimit(currentRequest, ctx);
      if (rateLimitResponse2) return rateLimitResponse2;
      return currentRequest;
    },
    async onResponse(res, req) {
      await onResponseRateLimit(req, ctx);
      for (const plugin of ctx.options.plugins || []) if (plugin.onResponse) {
        const response = await withSpan(`onResponse ${plugin.id}`, {
          [ATTR_HOOK_TYPE]: "onResponse",
          [ATTR_CONTEXT]: `plugin:${plugin.id}`,
          [ATTR_HTTP_RESPONSE_STATUS_CODE]: res.status
        }, () => plugin.onResponse(res, ctx));
        if (response) return response.response;
      }
      return res;
    },
    onError(e) {
      if (isAPIError(e) && e.status === "FOUND") return;
      if (options.onAPIError?.throw) throw e;
      if (options.onAPIError?.onError) {
        options.onAPIError.onError(e, ctx);
        return;
      }
      const optLogLevel = options.logger?.level;
      const log = optLogLevel === "error" || optLogLevel === "warn" || optLogLevel === "debug" ? logger : void 0;
      if (options.logger?.disabled !== true) {
        if (e && typeof e === "object" && "message" in e && typeof e.message === "string") {
          if (e.message.includes("no column") || e.message.includes("column") || e.message.includes("relation") || e.message.includes("table") || e.message.includes("does not exist")) {
            ctx.logger?.error(e.message);
            return;
          }
        }
        if (isAPIError(e)) {
          if (e.status === "INTERNAL_SERVER_ERROR") ctx.logger.error(e.status, e);
          log?.error(e.message);
        } else ctx.logger?.error(e && typeof e === "object" && "name" in e ? e.name : "", e);
      }
    }
  });
};
async function getBaseAdapter(options, handleDirectDatabase) {
  let adapter;
  if (!options.database) {
    const tables = getAuthTables(options);
    const memoryDB = Object.keys(tables).reduce((acc, key) => {
      acc[key] = [];
      return acc;
    }, {});
    const { memoryAdapter } = await import("@better-auth/memory-adapter");
    adapter = memoryAdapter(memoryDB)(options);
  } else if (typeof options.database === "function") adapter = options.database(options);
  else adapter = await handleDirectDatabase(options);
  if (!adapter.transaction) {
    logger.warn("Adapter does not correctly implement transaction function, patching it automatically. Please update your adapter implementation.");
    adapter.transaction = async (cb) => {
      return cb(adapter);
    };
  }
  return adapter;
}
async function getAdapter(options) {
  return getBaseAdapter(options, async (opts) => {
    const { createKyselyAdapter: createKyselyAdapter2 } = await import("./index-C6hDhOht.mjs");
    const { kysely, databaseType, transaction } = await createKyselyAdapter2(opts);
    if (!kysely) throw new BetterAuthError("Failed to initialize database adapter");
    const { kyselyAdapter } = await import("./index-C6hDhOht.mjs");
    return kyselyAdapter(kysely, {
      type: databaseType || "sqlite",
      debugLogs: opts.database && "debugLogs" in opts.database ? opts.database.debugLogs : false,
      transaction
    })(opts);
  });
}
function getSchema(config) {
  const tables = getAuthTables(config);
  const schema2 = {};
  for (const key in tables) {
    const table = tables[key];
    const fields = table.fields;
    const actualFields = {};
    Object.entries(fields).forEach(([key2, field]) => {
      actualFields[field.fieldName || key2] = field;
      if (field.references) {
        const refTable = tables[field.references.model];
        if (refTable) actualFields[field.fieldName || key2].references = {
          ...field.references,
          model: refTable.modelName,
          field: field.references.field
        };
      }
    });
    if (schema2[table.modelName]) {
      schema2[table.modelName].fields = {
        ...schema2[table.modelName].fields,
        ...actualFields
      };
      continue;
    }
    schema2[table.modelName] = {
      fields: actualFields,
      order: table.order || Infinity
    };
  }
  return schema2;
}
const map = {
  postgres: {
    string: [
      "character varying",
      "varchar",
      "text",
      "uuid"
    ],
    number: [
      "int4",
      "integer",
      "bigint",
      "smallint",
      "numeric",
      "real",
      "double precision"
    ],
    boolean: ["bool", "boolean"],
    date: [
      "timestamptz",
      "timestamp",
      "date"
    ],
    json: ["json", "jsonb"]
  },
  mysql: {
    string: [
      "varchar",
      "text",
      "uuid"
    ],
    number: [
      "integer",
      "int",
      "bigint",
      "smallint",
      "decimal",
      "float",
      "double"
    ],
    boolean: ["boolean", "tinyint"],
    date: [
      "timestamp",
      "datetime",
      "date"
    ],
    json: ["json"]
  },
  sqlite: {
    string: ["TEXT"],
    number: ["INTEGER", "REAL"],
    boolean: ["INTEGER", "BOOLEAN"],
    date: ["DATE", "INTEGER"],
    json: ["TEXT"]
  },
  mssql: {
    string: [
      "varchar",
      "nvarchar",
      "uniqueidentifier"
    ],
    number: [
      "int",
      "bigint",
      "smallint",
      "decimal",
      "float",
      "double"
    ],
    boolean: ["bit", "smallint"],
    date: [
      "datetime2",
      "date",
      "datetime"
    ],
    json: ["varchar", "nvarchar"]
  }
};
function matchType(columnDataType, fieldType, dbType) {
  function normalize(type) {
    return type.toLowerCase().split("(")[0].trim();
  }
  if (fieldType === "string[]" || fieldType === "number[]") return columnDataType.toLowerCase().includes("json");
  const types = map[dbType];
  return (Array.isArray(fieldType) ? types["string"].map((t) => t.toLowerCase()) : types[fieldType].map((t) => t.toLowerCase())).includes(normalize(columnDataType));
}
async function getPostgresSchema(db2) {
  try {
    const result = await sql$1`SHOW search_path`.execute(db2);
    const searchPath = result.rows[0]?.search_path ?? result.rows[0]?.searchPath;
    if (searchPath) return searchPath.split(",").map((s) => s.trim()).map((s) => s.replace(/^["']|["']$/g, "")).filter((s) => !s.startsWith("$") && !s.startsWith("\\$"))[0] || "public";
  } catch {
  }
  return "public";
}
async function getMigrations(config) {
  const betterAuthSchema = getSchema(config);
  const logger2 = createLogger(config.logger);
  let { kysely: db2, databaseType: dbType } = await createKyselyAdapter(config);
  if (!dbType) {
    logger2.warn("Could not determine database type, defaulting to sqlite. Please provide a type in the database options to avoid this.");
    dbType = "sqlite";
  }
  if (!db2) {
    logger2.error("Only kysely adapter is supported for migrations. You can use `generate` command to generate the schema, if you're using a different adapter.");
    process.exit(1);
  }
  let currentSchema = "public";
  if (dbType === "postgres") {
    currentSchema = await getPostgresSchema(db2);
    logger2.debug(`PostgreSQL migration: Using schema '${currentSchema}' (from search_path)`);
    try {
      const schemaCheck = await sql$1`
				SELECT schema_name
				FROM information_schema.schemata
				WHERE schema_name = ${currentSchema}
			`.execute(db2);
      if (!(schemaCheck.rows[0]?.schema_name ?? schemaCheck.rows[0]?.schemaName)) logger2.warn(`Schema '${currentSchema}' does not exist. Tables will be inspected from available schemas. Consider creating the schema first or checking your database configuration.`);
    } catch (error2) {
      logger2.debug(`Could not verify schema existence: ${error2 instanceof Error ? error2.message : String(error2)}`);
    }
  }
  const allTableMetadata = await db2.introspection.getTables();
  let tableMetadata = allTableMetadata;
  if (dbType === "postgres") try {
    const tablesInSchema = await sql$1`
				SELECT table_name
				FROM information_schema.tables
				WHERE table_schema = ${currentSchema}
				AND table_type = 'BASE TABLE'
			`.execute(db2);
    const tableNamesInSchema = new Set(tablesInSchema.rows.map((row) => row.table_name ?? row.tableName));
    tableMetadata = allTableMetadata.filter((table) => table.schema === currentSchema && tableNamesInSchema.has(table.name));
    logger2.debug(`Found ${tableMetadata.length} table(s) in schema '${currentSchema}': ${tableMetadata.map((t) => t.name).join(", ") || "(none)"}`);
  } catch (error2) {
    logger2.warn(`Could not filter tables by schema. Using all discovered tables. Error: ${error2 instanceof Error ? error2.message : String(error2)}`);
  }
  const toBeCreated = [];
  const toBeAdded = [];
  for (const [key, value] of Object.entries(betterAuthSchema)) {
    const table = tableMetadata.find((t) => t.name === key);
    if (!table) {
      const tIndex = toBeCreated.findIndex((t) => t.table === key);
      const tableData = {
        table: key,
        fields: value.fields,
        order: value.order || Infinity
      };
      const insertIndex = toBeCreated.findIndex((t) => (t.order || Infinity) > tableData.order);
      if (insertIndex === -1) if (tIndex === -1) toBeCreated.push(tableData);
      else toBeCreated[tIndex].fields = {
        ...toBeCreated[tIndex].fields,
        ...value.fields
      };
      else toBeCreated.splice(insertIndex, 0, tableData);
      continue;
    }
    const toBeAddedFields = {};
    for (const [fieldName, field] of Object.entries(value.fields)) {
      const column = table.columns.find((c) => c.name === fieldName);
      if (!column) {
        toBeAddedFields[fieldName] = field;
        continue;
      }
      if (matchType(column.dataType, field.type, dbType)) continue;
      else logger2.warn(`Field ${fieldName} in table ${key} has a different type in the database. Expected ${field.type} but got ${column.dataType}.`);
    }
    if (Object.keys(toBeAddedFields).length > 0) toBeAdded.push({
      table: key,
      fields: toBeAddedFields,
      order: value.order || Infinity
    });
  }
  const migrations = [];
  const useUUIDs = config.advanced?.database?.generateId === "uuid";
  const useNumberId = config.advanced?.database?.generateId === "serial";
  function getType(field, fieldName) {
    const type = field.type;
    const provider = dbType || "sqlite";
    const typeMap = {
      string: {
        sqlite: "text",
        postgres: "text",
        mysql: field.unique ? "varchar(255)" : field.references ? "varchar(36)" : field.sortable ? "varchar(255)" : field.index ? "varchar(255)" : "text",
        mssql: field.unique || field.sortable ? "varchar(255)" : field.references ? "varchar(36)" : "varchar(8000)"
      },
      boolean: {
        sqlite: "integer",
        postgres: "boolean",
        mysql: "boolean",
        mssql: "smallint"
      },
      number: {
        sqlite: field.bigint ? "bigint" : "integer",
        postgres: field.bigint ? "bigint" : "integer",
        mysql: field.bigint ? "bigint" : "integer",
        mssql: field.bigint ? "bigint" : "integer"
      },
      date: {
        sqlite: "date",
        postgres: "timestamptz",
        mysql: "timestamp(3)",
        mssql: sql$1`datetime2(3)`
      },
      json: {
        sqlite: "text",
        postgres: "jsonb",
        mysql: "json",
        mssql: "varchar(8000)"
      },
      id: {
        postgres: useNumberId ? sql$1`integer GENERATED BY DEFAULT AS IDENTITY` : useUUIDs ? "uuid" : "text",
        mysql: useNumberId ? "integer" : useUUIDs ? "varchar(36)" : "varchar(36)",
        mssql: useNumberId ? "integer" : useUUIDs ? "varchar(36)" : "varchar(36)",
        sqlite: useNumberId ? "integer" : "text"
      },
      foreignKeyId: {
        postgres: useNumberId ? "integer" : useUUIDs ? "uuid" : "text",
        mysql: useNumberId ? "integer" : useUUIDs ? "varchar(36)" : "varchar(36)",
        mssql: useNumberId ? "integer" : useUUIDs ? "varchar(36)" : "varchar(36)",
        sqlite: useNumberId ? "integer" : "text"
      },
      "string[]": {
        sqlite: "text",
        postgres: "jsonb",
        mysql: "json",
        mssql: "varchar(8000)"
      },
      "number[]": {
        sqlite: "text",
        postgres: "jsonb",
        mysql: "json",
        mssql: "varchar(8000)"
      }
    };
    if (fieldName === "id" || field.references?.field === "id") {
      if (fieldName === "id") return typeMap.id[provider];
      return typeMap.foreignKeyId[provider];
    }
    if (Array.isArray(type)) return "text";
    if (!(type in typeMap)) throw new Error(`Unsupported field type '${String(type)}' for field '${fieldName}'. Allowed types are: string, number, boolean, date, string[], number[]. If you need to store structured data, store it as a JSON string (type: "string") or split it into primitive fields. See https://better-auth.com/docs/advanced/schema#additional-fields`);
    return typeMap[type][provider];
  }
  const getModelName = initGetModelName({
    schema: getAuthTables(config),
    usePlural: false
  });
  const getFieldName = initGetFieldName({
    schema: getAuthTables(config),
    usePlural: false
  });
  function getReferencePath(model, field) {
    try {
      return `${getModelName(model)}.${getFieldName({
        model,
        field
      })}`;
    } catch {
      return `${model}.${field}`;
    }
  }
  if (toBeAdded.length) for (const table of toBeAdded) for (const [fieldName, field] of Object.entries(table.fields)) {
    const type = getType(field, fieldName);
    const builder = db2.schema.alterTable(table.table);
    if (field.index) {
      const indexName = `${table.table}_${fieldName}_${field.unique ? "uidx" : "idx"}`;
      const indexBuilder = db2.schema.createIndex(indexName).on(table.table).columns([fieldName]);
      migrations.push(field.unique ? indexBuilder.unique() : indexBuilder);
    }
    const built = builder.addColumn(fieldName, type, (col2) => {
      col2 = field.required !== false ? col2.notNull() : col2;
      if (field.references) col2 = col2.references(getReferencePath(field.references.model, field.references.field)).onDelete(field.references.onDelete || "cascade");
      if (field.unique) col2 = col2.unique();
      if (field.type === "date" && typeof field.defaultValue === "function" && (dbType === "postgres" || dbType === "mysql" || dbType === "mssql")) if (dbType === "mysql") col2 = col2.defaultTo(sql$1`CURRENT_TIMESTAMP(3)`);
      else col2 = col2.defaultTo(sql$1`CURRENT_TIMESTAMP`);
      return col2;
    });
    migrations.push(built);
  }
  const toBeIndexed = [];
  if (toBeCreated.length) for (const table of toBeCreated) {
    const idType = getType({ type: useNumberId ? "number" : "string" }, "id");
    let dbT = db2.schema.createTable(table.table).addColumn("id", idType, (col2) => {
      if (useNumberId) {
        if (dbType === "postgres") return col2.primaryKey().notNull();
        else if (dbType === "sqlite") return col2.primaryKey().notNull();
        else if (dbType === "mssql") return col2.identity().primaryKey().notNull();
        return col2.autoIncrement().primaryKey().notNull();
      }
      if (useUUIDs) {
        if (dbType === "postgres") return col2.primaryKey().defaultTo(sql$1`pg_catalog.gen_random_uuid()`).notNull();
        return col2.primaryKey().notNull();
      }
      return col2.primaryKey().notNull();
    });
    for (const [fieldName, field] of Object.entries(table.fields)) {
      const type = getType(field, fieldName);
      dbT = dbT.addColumn(fieldName, type, (col2) => {
        col2 = field.required !== false ? col2.notNull() : col2;
        if (field.references) col2 = col2.references(getReferencePath(field.references.model, field.references.field)).onDelete(field.references.onDelete || "cascade");
        if (field.unique) col2 = col2.unique();
        if (field.type === "date" && typeof field.defaultValue === "function" && (dbType === "postgres" || dbType === "mysql" || dbType === "mssql")) if (dbType === "mysql") col2 = col2.defaultTo(sql$1`CURRENT_TIMESTAMP(3)`);
        else col2 = col2.defaultTo(sql$1`CURRENT_TIMESTAMP`);
        return col2;
      });
      if (field.index) {
        const builder = db2.schema.createIndex(`${table.table}_${fieldName}_${field.unique ? "uidx" : "idx"}`).on(table.table).columns([fieldName]);
        toBeIndexed.push(field.unique ? builder.unique() : builder);
      }
    }
    migrations.push(dbT);
  }
  if (toBeIndexed.length) for (const index2 of toBeIndexed) migrations.push(index2);
  async function runMigrations() {
    for (const migration of migrations) await migration.execute();
  }
  async function compileMigrations() {
    return migrations.map((m) => m.compile().sql).join(";\n\n") + ";";
  }
  return {
    toBeCreated,
    toBeAdded,
    runMigrations,
    compileMigrations
  };
}
const DEFAULT_SECRET = "better-auth-secret-12345678901234567890";
function estimateEntropy$1(str) {
  const unique = new Set(str).size;
  if (unique === 0) return 0;
  return Math.log2(Math.pow(unique, str.length));
}
function parseSecretsEnv(envValue) {
  if (!envValue) return null;
  return envValue.split(",").map((entry) => {
    entry = entry.trim();
    const colonIdx = entry.indexOf(":");
    if (colonIdx === -1) throw new BetterAuthError(`Invalid BETTER_AUTH_SECRETS entry: "${entry}". Expected format: "<version>:<secret>"`);
    const version = parseInt(entry.slice(0, colonIdx), 10);
    if (!Number.isInteger(version) || version < 0) throw new BetterAuthError(`Invalid version in BETTER_AUTH_SECRETS: "${entry.slice(0, colonIdx)}". Version must be a non-negative integer.`);
    const value = entry.slice(colonIdx + 1).trim();
    if (!value) throw new BetterAuthError(`Empty secret value for version ${version} in BETTER_AUTH_SECRETS.`);
    return {
      version,
      value
    };
  });
}
function validateSecretsArray(secrets, logger2) {
  if (secrets.length === 0) throw new BetterAuthError("`secrets` array must contain at least one entry.");
  const seen = /* @__PURE__ */ new Set();
  for (const s of secrets) {
    const version = parseInt(String(s.version), 10);
    if (!Number.isInteger(version) || version < 0 || String(version) !== String(s.version).trim()) throw new BetterAuthError(`Invalid version ${s.version} in \`secrets\`. Version must be a non-negative integer.`);
    if (!s.value) throw new BetterAuthError(`Empty secret value for version ${version} in \`secrets\`.`);
    if (seen.has(version)) throw new BetterAuthError(`Duplicate version ${version} in \`secrets\`. Each version must be unique.`);
    seen.add(version);
  }
  const current = secrets[0];
  if (current.value.length < 32) logger2.warn(`[better-auth] Warning: the current secret (version ${current.version}) should be at least 32 characters long for adequate security.`);
  if (estimateEntropy$1(current.value) < 120) logger2.warn("[better-auth] Warning: the current secret appears low-entropy. Use a randomly generated secret for production.");
}
function buildSecretConfig(secrets, legacySecret) {
  const keys = /* @__PURE__ */ new Map();
  for (const s of secrets) keys.set(parseInt(String(s.version), 10), s.value);
  return {
    keys,
    currentVersion: parseInt(String(secrets[0].version), 10),
    legacySecret: legacySecret && legacySecret !== "better-auth-secret-12345678901234567890" ? legacySecret : void 0
  };
}
function estimateEntropy(str) {
  const unique = new Set(str).size;
  if (unique === 0) return 0;
  return Math.log2(Math.pow(unique, str.length));
}
function validateSecret(secret, logger2) {
  const isDefaultSecret = secret === DEFAULT_SECRET;
  if (isTest()) return;
  if (isDefaultSecret && isProduction) throw new BetterAuthError("You are using the default secret. Please set `BETTER_AUTH_SECRET` in your environment variables or pass `secret` in your auth config.");
  if (!secret) throw new BetterAuthError("BETTER_AUTH_SECRET is missing. Set it in your environment or pass `secret` to betterAuth({ secret }).");
  if (secret.length < 32) logger2.warn(`[better-auth] Warning: your BETTER_AUTH_SECRET should be at least 32 characters long for adequate security. Generate one with \`npx auth secret\` or \`openssl rand -base64 32\`.`);
  if (estimateEntropy(secret) < 120) logger2.warn("[better-auth] Warning: your BETTER_AUTH_SECRET appears low-entropy. Use a randomly generated secret for production.");
}
async function createAuthContext(adapter, options, getDatabaseType) {
  if (!options.database) options = defu$1(options, {
    session: { cookieCache: {
      enabled: true,
      strategy: "jwe",
      refreshCache: true,
      maxAge: options.session?.expiresIn || 3600 * 24 * 7
    } },
    account: {
      storeStateStrategy: "cookie",
      storeAccountCookie: true
    }
  });
  const plugins = options.plugins || [];
  const internalPlugins = getInternalPlugins(options);
  const logger2 = createLogger(options.logger);
  const isDynamicConfig = isDynamicBaseURLConfig(options.baseURL);
  if (isDynamicBaseURLConfig(options.baseURL)) {
    const { allowedHosts } = options.baseURL;
    if (!allowedHosts || allowedHosts.length === 0) throw new BetterAuthError('baseURL.allowedHosts cannot be empty. Provide at least one allowed host pattern (e.g., ["myapp.com", "*.vercel.app"]).');
  }
  const baseURL = isDynamicConfig ? void 0 : getBaseURL(typeof options.baseURL === "string" ? options.baseURL : void 0, options.basePath);
  if (!baseURL && !isDynamicConfig) logger2.warn(`[better-auth] Base URL could not be determined. Please set a valid base URL using the baseURL config option or the BETTER_AUTH_URL environment variable. Without this, callbacks and redirects may not work correctly.`);
  if (adapter.id === "memory" && options.advanced?.database?.generateId === false) logger2.error(`[better-auth] Misconfiguration detected.
You are using the memory DB with generateId: false.
This will cause no id to be generated for any model.
Most of the features of Better Auth will not work correctly.`);
  const secretsArray = options.secrets ?? parseSecretsEnv(env.BETTER_AUTH_SECRETS);
  const legacySecret = options.secret || env.BETTER_AUTH_SECRET || env.AUTH_SECRET || "";
  let secret;
  let secretConfig;
  if (secretsArray) {
    validateSecretsArray(secretsArray, logger2);
    secret = secretsArray[0].value;
    secretConfig = buildSecretConfig(secretsArray, legacySecret);
  } else {
    secret = legacySecret || "better-auth-secret-12345678901234567890";
    validateSecret(secret, logger2);
    secretConfig = secret;
  }
  options = {
    ...options,
    secret,
    baseURL: isDynamicConfig ? options.baseURL : baseURL ? new URL(baseURL).origin : "",
    basePath: options.basePath || "/api/auth",
    plugins: plugins.concat(internalPlugins)
  };
  checkEndpointConflicts(options, logger2);
  const cookies = getCookies(options);
  const tables = getAuthTables(options);
  const providers = (await Promise.all(Object.entries(options.socialProviders || {}).map(async ([key, originalConfig]) => {
    const config = typeof originalConfig === "function" ? await originalConfig() : originalConfig;
    if (config == null) return null;
    if (config.enabled === false) return null;
    if (!config.clientId) logger2.warn(`Social provider ${key} is missing clientId or clientSecret`);
    const provider = socialProviders[key](config);
    provider.disableImplicitSignUp = config.disableImplicitSignUp;
    return provider;
  }))).filter((x) => x !== null);
  const generateIdFunc = ({ model, size }) => {
    if (typeof options.advanced?.generateId === "function") return options.advanced.generateId({
      model,
      size
    });
    const dbGenerateId = options?.advanced?.database?.generateId;
    if (typeof dbGenerateId === "function") return dbGenerateId({
      model,
      size
    });
    if (dbGenerateId === "uuid") return crypto.randomUUID();
    if (dbGenerateId === "serial" || dbGenerateId === false) return false;
    return generateId(size);
  };
  const { publish } = await createTelemetry(options, {
    adapter: adapter.id,
    database: typeof options.database === "function" ? "adapter" : getDatabaseType(options.database)
  });
  const pluginIds = new Set(options.plugins.map((p) => p.id));
  const getPluginFn = (id) => options.plugins.find((p) => p.id === id) ?? null;
  const hasPluginFn = (id) => pluginIds.has(id);
  const trustedOrigins2 = await getTrustedOrigins(options);
  const trustedProviders = await getTrustedProviders(options);
  const ctx = {
    appName: options.appName || "Better Auth",
    baseURL: baseURL || "",
    version: getBetterAuthVersion(),
    socialProviders: providers,
    options,
    oauthConfig: {
      storeStateStrategy: options.account?.storeStateStrategy || (options.database ? "database" : "cookie"),
      skipStateCookieCheck: !!options.account?.skipStateCookieCheck
    },
    tables,
    trustedOrigins: trustedOrigins2,
    trustedProviders,
    isTrustedOrigin(url2, settings) {
      return this.trustedOrigins.some((origin) => matchesOriginPattern(url2, origin, settings));
    },
    sessionConfig: {
      updateAge: options.session?.updateAge !== void 0 ? options.session.updateAge : 1440 * 60,
      expiresIn: options.session?.expiresIn || 3600 * 24 * 7,
      freshAge: options.session?.freshAge === void 0 ? 3600 * 24 : options.session.freshAge,
      cookieRefreshCache: (() => {
        const refreshCache = options.session?.cookieCache?.refreshCache;
        const maxAge = options.session?.cookieCache?.maxAge || 300;
        if ((!!options.database || !!options.secondaryStorage) && refreshCache) {
          logger2.warn("[better-auth] `session.cookieCache.refreshCache` is enabled while `database` or `secondaryStorage` is configured. `refreshCache` is meant for stateless (DB-less) setups. Disabling `refreshCache` — remove it from your config to silence this warning.");
          return false;
        }
        if (refreshCache === false || refreshCache === void 0) return false;
        if (refreshCache === true) return {
          enabled: true,
          updateAge: Math.floor(maxAge * 0.2)
        };
        return {
          enabled: true,
          updateAge: refreshCache.updateAge !== void 0 ? refreshCache.updateAge : Math.floor(maxAge * 0.2)
        };
      })()
    },
    secret,
    secretConfig,
    rateLimit: {
      ...options.rateLimit,
      enabled: options.rateLimit?.enabled ?? isProduction,
      window: options.rateLimit?.window || 10,
      max: options.rateLimit?.max || 100,
      storage: options.rateLimit?.storage || (options.secondaryStorage ? "secondary-storage" : "memory")
    },
    authCookies: cookies,
    logger: logger2,
    generateId: generateIdFunc,
    session: null,
    secondaryStorage: options.secondaryStorage,
    password: {
      hash: options.emailAndPassword?.password?.hash || hashPassword$1,
      verify: options.emailAndPassword?.password?.verify || verifyPassword$1,
      config: {
        minPasswordLength: options.emailAndPassword?.minPasswordLength || 8,
        maxPasswordLength: options.emailAndPassword?.maxPasswordLength || 128
      },
      checkPassword
    },
    setNewSession(session) {
      this.newSession = session;
    },
    newSession: null,
    adapter,
    internalAdapter: createInternalAdapter(adapter, {
      options,
      logger: logger2,
      hooks: options.databaseHooks ? [{
        source: "user",
        hooks: options.databaseHooks
      }] : [],
      generateId: generateIdFunc
    }),
    createAuthCookie: createCookieGetter(options),
    async runMigrations() {
      throw new BetterAuthError("runMigrations will be set by the specific init implementation");
    },
    publishTelemetry: publish,
    skipCSRFCheck: !!options.advanced?.disableCSRFCheck,
    skipOriginCheck: options.advanced?.disableOriginCheck !== void 0 ? options.advanced.disableOriginCheck : isTest() ? true : false,
    runInBackground: options.advanced?.backgroundTasks?.handler ?? ((p) => {
      p.catch(() => {
      });
    }),
    async runInBackgroundOrAwait(promise) {
      try {
        if (options.advanced?.backgroundTasks?.handler) {
          if (promise instanceof Promise) options.advanced.backgroundTasks.handler(promise.catch((e) => {
            logger2.error("Failed to run background task:", e);
          }));
        } else await promise;
      } catch (e) {
        logger2.error("Failed to run background task:", e);
      }
    },
    getPlugin: getPluginFn,
    hasPlugin: hasPluginFn
  };
  const initOrPromise = runPluginInit(ctx);
  if (isPromise(initOrPromise)) await initOrPromise;
  return ctx;
}
const init = async (options) => {
  const adapter = await getAdapter(options);
  const getDatabaseType = (database) => getKyselyDatabaseType(database) || "unknown";
  const ctx = await createAuthContext(adapter, options, getDatabaseType);
  ctx.runMigrations = async function() {
    if (!options.database || "updateMany" in options.database) throw new BetterAuthError("Database is not provided or it's an adapter. Migrations are only supported with a database instance.");
    const { runMigrations } = await getMigrations(options);
    await runMigrations();
  };
  return ctx;
};
const createBetterAuth = (options, initFn) => {
  const authContext = initFn(options);
  const { api } = getEndpoints(authContext, options);
  return {
    handler: async (request) => {
      const ctx = await authContext;
      const basePath = ctx.options.basePath || "/api/auth";
      let handlerCtx;
      if (isDynamicBaseURLConfig(options.baseURL)) handlerCtx = await resolveRequestContext(ctx, request, resolveDynamicTrustedProxyHeaders(ctx.options));
      else {
        handlerCtx = ctx;
        if (!ctx.options.baseURL) {
          const baseURL = getBaseURL(void 0, basePath, request, void 0, ctx.options.advanced?.trustedProxyHeaders);
          if (baseURL) {
            ctx.baseURL = baseURL;
            ctx.options.baseURL = getOrigin(ctx.baseURL) || void 0;
          } else throw new BetterAuthError("Could not get base URL from request. Please provide a valid base URL.");
        }
        handlerCtx.trustedOrigins = await getTrustedOrigins(ctx.options, request);
        handlerCtx.trustedProviders = await getTrustedProviders(ctx.options, request);
      }
      const { handler: handler2 } = router$1(handlerCtx, options);
      return runWithAdapter(handlerCtx.adapter, () => handler2(request));
    },
    api,
    options,
    $context: authContext,
    $ERROR_CODES: {
      ...options.plugins?.reduce((acc, plugin) => {
        if (plugin.$ERROR_CODES) return {
          ...acc,
          ...plugin.$ERROR_CODES
        };
        return acc;
      }, {}),
      ...BASE_ERROR_CODES
    }
  };
};
const betterAuth = (options) => {
  return createBetterAuth(options, init);
};
const authSecret = process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET ?? "dev-insecure-secret-change-me";
const trustedOrigins = (process.env.TRUSTED_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
const auth = betterAuth({
  secret: authSecret,
  baseURL: process.env.APP_URL ?? process.env.AUTH_URL,
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true
  },
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      user: users,
      session: baSessions,
      account: baAccounts,
      verification: baVerifications
    }
  }),
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24
  }
});
const bodySchema = z$1.object({
  deviceName: z$1.string().max(200).default("")
});
const Route$4 = createFileRoute("/api/auth/device-tokens")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) {
          return new Response("Unauthorized", { status: 401 });
        }
        const parsed = bodySchema.safeParse(
          await request.json().catch(() => ({}))
        );
        const deviceName = parsed.success ? parsed.data.deviceName : "";
        const bundle = await issueDeviceTokens(session.user.id, deviceName);
        return Response.json(bundle);
      }
    }
  }
});
async function handler({ request }) {
  return auth.handler(request);
}
const Route$3 = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: handler,
      POST: handler
    }
  }
});
const $$splitComponentImporter = () => import("./session._sessionId-BKjccGon.mjs");
const Route$2 = createFileRoute("/app/workouts/session/$sessionId")({
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
function json(data, init2) {
  return new Response(JSON.stringify(data), {
    ...init2,
    headers: {
      "Content-Type": "application/json",
      ...init2?.headers ?? {}
    }
  });
}
function weekStartFromRequest(request) {
  const url2 = new URL(request.url);
  const raw = url2.searchParams.get("weekStart")?.trim();
  return raw && parseDayKey(raw) ? raw : mondayOfWeekContaining(formatDayKey(/* @__PURE__ */ new Date()));
}
async function handleGet$1({ request }) {
  const claims = await authenticateBearer(request);
  if (!claims) return json({ error: "Unauthorized" }, { status: 401 });
  const weekStart = weekStartFromRequest(request);
  const plan = await getOrCreatePlanForWeek(claims.userId, weekStart);
  if (!plan) return json({ error: "Failed to load plan" }, { status: 500 });
  const shoppingList = await resolveShoppingListForMealPlan(plan);
  return json({ weekStartDayKey: plan.weekStartDayKey, shoppingList });
}
async function handlePost({ request }) {
  const claims = await authenticateBearer(request);
  if (!claims) return json({ error: "Unauthorized" }, { status: 401 });
  const weekStart = weekStartFromRequest(request);
  const plan = await getOrCreatePlanForWeek(claims.userId, weekStart);
  if (!plan) return json({ error: "Failed to load plan" }, { status: 500 });
  const shoppingList = await generateShoppingListForMealPlan(plan);
  return json({ weekStartDayKey: plan.weekStartDayKey, shoppingList });
}
const Route$1 = createFileRoute("/api/nutrition/meal-plan/shopping-list")({
  server: {
    handlers: {
      GET: handleGet$1,
      POST: handlePost
    }
  }
});
function textFromUserMessage(m) {
  if (m.role !== "user") return "";
  return m.parts.filter((p) => p.type === "text").map((p) => p.text).join("").trim();
}
function deriveTitleFromMessages(messages) {
  for (const m of messages) {
    if (m.role !== "user") continue;
    const text2 = textFromUserMessage(m);
    if (text2) return text2.slice(0, 72);
  }
  return void 0;
}
async function handleGet({
  request,
  params
}) {
  const claims = await authenticateBearer(request);
  if (!claims) {
    return new Response("Unauthorized", { status: 401 });
  }
  const { id } = params;
  const [row] = await db.select().from(coachConversations).where(
    and(
      eq(coachConversations.id, id),
      eq(coachConversations.userId, claims.userId)
    )
  ).limit(1);
  if (!row) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  let messages = [];
  try {
    const parsed = JSON.parse(row.messages);
    messages = Array.isArray(parsed) ? parsed : [];
  } catch {
    messages = [];
  }
  return Response.json({
    conversation: {
      id: row.id,
      title: row.title,
      updatedAt: row.updatedAt,
      messages
    }
  });
}
async function handlePatch({
  request,
  params
}) {
  const claims = await authenticateBearer(request);
  if (!claims) {
    return new Response("Unauthorized", { status: 401 });
  }
  const { id } = params;
  const [existing] = await db.select().from(coachConversations).where(
    and(
      eq(coachConversations.id, id),
      eq(coachConversations.userId, claims.userId)
    )
  ).limit(1);
  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const messagesPayload = body.messages;
  const titleOverride = body.title?.trim();
  const hasMessages = Array.isArray(messagesPayload);
  if (!hasMessages && !titleOverride) {
    return Response.json(
      { error: "messages array and/or title required" },
      { status: 400 }
    );
  }
  let nextTitle = existing.title;
  if (titleOverride) {
    nextTitle = titleOverride.slice(0, 120);
  } else if (hasMessages && (existing.title === "New chat" || existing.title.trim().length === 0)) {
    const derived = deriveTitleFromMessages(messagesPayload);
    if (derived) nextTitle = derived;
  }
  let messagesJson = existing.messages;
  if (hasMessages) {
    messagesJson = JSON.stringify(messagesPayload);
  }
  const now2 = /* @__PURE__ */ new Date();
  await db.update(coachConversations).set({
    messages: messagesJson,
    title: nextTitle,
    updatedAt: now2
  }).where(
    and(
      eq(coachConversations.id, id),
      eq(coachConversations.userId, claims.userId)
    )
  );
  return Response.json({
    conversation: {
      id,
      title: nextTitle,
      updatedAt: now2.getTime()
    }
  });
}
async function handleDelete({
  request,
  params
}) {
  const claims = await authenticateBearer(request);
  if (!claims) {
    return new Response("Unauthorized", { status: 401 });
  }
  const { id } = params;
  const deleted = await db.delete(coachConversations).where(
    and(
      eq(coachConversations.id, id),
      eq(coachConversations.userId, claims.userId)
    )
  ).returning({ id: coachConversations.id });
  if (deleted.length === 0) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return new Response(null, { status: 204 });
}
const Route = createFileRoute("/api/coach/conversations/$id")({
  server: {
    handlers: {
      GET: handleGet,
      PATCH: handlePatch,
      DELETE: handleDelete
    }
  }
});
const RegisterRoute = Route$y.update({
  id: "/register",
  path: "/register",
  getParentRoute: () => Route$z
});
const LoginRoute = Route$x.update({
  id: "/login",
  path: "/login",
  getParentRoute: () => Route$z
});
const AppRouteRoute = Route$w.update({
  id: "/app",
  path: "/app",
  getParentRoute: () => Route$z
});
const IndexRoute = Route$v.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$z
});
const AppIndexRoute = Route$u.update({
  id: "/",
  path: "/",
  getParentRoute: () => AppRouteRoute
});
const AppProgressRoute = Route$t.update({
  id: "/progress",
  path: "/progress",
  getParentRoute: () => AppRouteRoute
});
const AppProfileRoute = Route$s.update({
  id: "/profile",
  path: "/profile",
  getParentRoute: () => AppRouteRoute
});
const AppOnboardingRoute = Route$r.update({
  id: "/onboarding",
  path: "/onboarding",
  getParentRoute: () => AppRouteRoute
});
const AppCalendarRoute = Route$q.update({
  id: "/calendar",
  path: "/calendar",
  getParentRoute: () => AppRouteRoute
});
const ApiHealthRoute = Route$p.update({
  id: "/api/health",
  path: "/api/health",
  getParentRoute: () => Route$z
});
const AppWorkoutsRouteRoute = Route$o.update({
  id: "/workouts",
  path: "/workouts",
  getParentRoute: () => AppRouteRoute
});
const AppNutritionRouteRoute = Route$n.update({
  id: "/nutrition",
  path: "/nutrition",
  getParentRoute: () => AppRouteRoute
});
const AppCoachRouteRoute = Route$m.update({
  id: "/coach",
  path: "/coach",
  getParentRoute: () => AppRouteRoute
});
const AppWorkoutsIndexRoute = Route$l.update({
  id: "/",
  path: "/",
  getParentRoute: () => AppWorkoutsRouteRoute
});
const AppNutritionIndexRoute = Route$k.update({
  id: "/",
  path: "/",
  getParentRoute: () => AppNutritionRouteRoute
});
const AppCoachIndexRoute = Route$j.update({
  id: "/",
  path: "/",
  getParentRoute: () => AppCoachRouteRoute
});
const AppWorkoutsNewRoute = Route$i.update({
  id: "/new",
  path: "/new",
  getParentRoute: () => AppWorkoutsRouteRoute
});
const AppWorkoutsCalendarRoute = Route$h.update({
  id: "/calendar",
  path: "/calendar",
  getParentRoute: () => AppWorkoutsRouteRoute
});
const AppWorkoutsIdRoute = Route$g.update({
  id: "/$id",
  path: "/$id",
  getParentRoute: () => AppWorkoutsRouteRoute
});
const AppNutritionPlanRoute = Route$f.update({
  id: "/plan",
  path: "/plan",
  getParentRoute: () => AppNutritionRouteRoute
});
const AppNutritionLibraryRoute = Route$e.update({
  id: "/library",
  path: "/library",
  getParentRoute: () => AppNutritionRouteRoute
});
const ApiUserProfileRoute = Route$d.update({
  id: "/api/user/profile",
  path: "/api/user/profile",
  getParentRoute: () => Route$z
});
const ApiSyncCollectionRoute = Route$c.update({
  id: "/api/sync/$collection",
  path: "/api/sync/$collection",
  getParentRoute: () => Route$z
});
const ApiOnboardingChatRoute = Route$b.update({
  id: "/api/onboarding/chat",
  path: "/api/onboarding/chat",
  getParentRoute: () => Route$z
});
const ApiNutritionImportRecipeUrlRoute = Route$a.update({
  id: "/api/nutrition/import-recipe-url",
  path: "/api/nutrition/import-recipe-url",
  getParentRoute: () => Route$z
});
const ApiCoachConversationsRoute = Route$9.update({
  id: "/api/coach/conversations",
  path: "/api/coach/conversations",
  getParentRoute: () => Route$z
});
const ApiCoachConversationTitleRoute = Route$8.update({
  id: "/api/coach/conversation-title",
  path: "/api/coach/conversation-title",
  getParentRoute: () => Route$z
});
const ApiCoachContextPreviewRoute = Route$7.update({
  id: "/api/coach/context-preview",
  path: "/api/coach/context-preview",
  getParentRoute: () => Route$z
});
const ApiCoachChatRoute = Route$6.update({
  id: "/api/coach/chat",
  path: "/api/coach/chat",
  getParentRoute: () => Route$z
});
const ApiAuthRefreshRoute = Route$5.update({
  id: "/api/auth/refresh",
  path: "/api/auth/refresh",
  getParentRoute: () => Route$z
});
const ApiAuthDeviceTokensRoute = Route$4.update({
  id: "/api/auth/device-tokens",
  path: "/api/auth/device-tokens",
  getParentRoute: () => Route$z
});
const ApiAuthSplatRoute = Route$3.update({
  id: "/api/auth/$",
  path: "/api/auth/$",
  getParentRoute: () => Route$z
});
const AppWorkoutsSessionSessionIdRoute = Route$2.update({
  id: "/session/$sessionId",
  path: "/session/$sessionId",
  getParentRoute: () => AppWorkoutsRouteRoute
});
const ApiNutritionMealPlanShoppingListRoute = Route$1.update({
  id: "/api/nutrition/meal-plan/shopping-list",
  path: "/api/nutrition/meal-plan/shopping-list",
  getParentRoute: () => Route$z
});
const ApiCoachConversationsIdRoute = Route.update({
  id: "/$id",
  path: "/$id",
  getParentRoute: () => ApiCoachConversationsRoute
});
const AppCoachRouteRouteChildren = {
  AppCoachIndexRoute
};
const AppCoachRouteRouteWithChildren = AppCoachRouteRoute._addFileChildren(
  AppCoachRouteRouteChildren
);
const AppNutritionRouteRouteChildren = {
  AppNutritionLibraryRoute,
  AppNutritionPlanRoute,
  AppNutritionIndexRoute
};
const AppNutritionRouteRouteWithChildren = AppNutritionRouteRoute._addFileChildren(AppNutritionRouteRouteChildren);
const AppWorkoutsRouteRouteChildren = {
  AppWorkoutsIdRoute,
  AppWorkoutsCalendarRoute,
  AppWorkoutsNewRoute,
  AppWorkoutsIndexRoute,
  AppWorkoutsSessionSessionIdRoute
};
const AppWorkoutsRouteRouteWithChildren = AppWorkoutsRouteRoute._addFileChildren(AppWorkoutsRouteRouteChildren);
const AppRouteRouteChildren = {
  AppCoachRouteRoute: AppCoachRouteRouteWithChildren,
  AppNutritionRouteRoute: AppNutritionRouteRouteWithChildren,
  AppWorkoutsRouteRoute: AppWorkoutsRouteRouteWithChildren,
  AppCalendarRoute,
  AppOnboardingRoute,
  AppProfileRoute,
  AppProgressRoute,
  AppIndexRoute
};
const AppRouteRouteWithChildren = AppRouteRoute._addFileChildren(
  AppRouteRouteChildren
);
const ApiCoachConversationsRouteChildren = {
  ApiCoachConversationsIdRoute
};
const ApiCoachConversationsRouteWithChildren = ApiCoachConversationsRoute._addFileChildren(
  ApiCoachConversationsRouteChildren
);
const rootRouteChildren = {
  IndexRoute,
  AppRouteRoute: AppRouteRouteWithChildren,
  LoginRoute,
  RegisterRoute,
  ApiHealthRoute,
  ApiAuthSplatRoute,
  ApiAuthDeviceTokensRoute,
  ApiAuthRefreshRoute,
  ApiCoachChatRoute,
  ApiCoachContextPreviewRoute,
  ApiCoachConversationTitleRoute,
  ApiCoachConversationsRoute: ApiCoachConversationsRouteWithChildren,
  ApiNutritionImportRecipeUrlRoute,
  ApiOnboardingChatRoute,
  ApiSyncCollectionRoute,
  ApiUserProfileRoute,
  ApiNutritionMealPlanShoppingListRoute
};
const routeTree = Route$z._addFileChildren(rootRouteChildren)._addFileTypes();
function getRouter() {
  const router2 = createRouter$1({
    routeTree,
    defaultPreload: "intent",
    scrollRestoration: true,
    defaultErrorComponent: ({ error: error2 }) => /* @__PURE__ */ jsxs("div", { style: { padding: 24 }, children: [
      /* @__PURE__ */ jsx("h1", { children: "Something went wrong" }),
      /* @__PURE__ */ jsx("pre", { children: String(error2?.message ?? error2) })
    ] }),
    defaultNotFoundComponent: () => /* @__PURE__ */ jsx("div", { style: { padding: 24 }, children: /* @__PURE__ */ jsx("h1", { children: "Not found" }) })
  });
  return router2;
}
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  SESSION_DURATION_STEP_SEC as $,
  APP_BRAND_NAME as A,
  formatLoadNumber as B,
  resolveTemplateItemWeightUnit as C,
  Route$g as D,
  computeMealPlanSlotLabels as E,
  stripRecipeMarkdownImagesAndLinks as F,
  Route$e as G,
  dayKeysDistance as H,
  addDaysKey as I,
  parseDayKey as J,
  bmiFromLbIn as K,
  bmiCategory as L,
  MEAL_PLAN_REFINEMENT_USER_PROMPT as M,
  vitalKeyLabel as N,
  ONBOARDING_MEAL_REFINEMENT_COMPLETE_TOOL as O,
  PROFILE_SEX_VALUES as P,
  getNextOpenSetIndex as Q,
  Route$j as R,
  suggestedWeightForSet as S,
  TRAINLOG_TOOL_DEFINITIONS as T,
  effectiveTemplateWeightForSession as U,
  VITAL_KEYS as V,
  baseWeightForSessionAdjust as W,
  effectiveTargetDurationSecForSession as X,
  effectiveTargetDistanceForSession as Y,
  roundWorkingWeight as Z,
  sessionDistanceStep as _,
  formatMonthKey as a,
  sessionWeightStep as a0,
  Route$2 as a1,
  pullSyncCollectionFromScratch as a2,
  stopSyncRunner as a3,
  clearTokens as a4,
  resetDb as a5,
  subscribeSyncing as a6,
  getSyncingSnapshot as a7,
  getTrainlogToolNamesSorted as a8,
  isCoachAiDebugUiEnabled as a9,
  getBaseURL as aa,
  router as ab,
  parseMonthKey as b,
  calendarMonthGrid as c,
  parseProfileSex as d,
  pullSyncCollections as e,
  formatDayKey as f,
  authFetch as g,
  Route$f as h,
  isDevForceOffline as i,
  mondayOfWeekContaining as j,
  Route$x as k,
  loadTokens as l,
  monthDayKeyRange as m,
  nextMonthKey as n,
  isGoalPreset as o,
  prevMonthKey as p,
  buildOnboardingUserMessage as q,
  onboardingCacheKey as r,
  saveTokens as s,
  triggerSync as t,
  useDb as u,
  parseExerciseLogKind as v,
  parseDistanceUnit as w,
  roundDistance as x,
  minPositiveDistance as y,
  formatDistanceAmount as z
};
