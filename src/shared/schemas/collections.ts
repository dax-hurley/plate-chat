import type { SQLiteTableWithColumns } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import * as db from "@/db/schema";

/**
 * Catalog of offline-synced collections. Each entry binds a Drizzle table to
 * its Zod schemas used for server-side validation on `/api/sync/$collection`
 * push requests.
 *
 * Adding an entity: add the Drizzle table in `src/db/schema.ts` (with sync
 * cols + `userId`), register it here, and mirror the Dexie index in
 * `src/lib/client/db/database.ts`.
 */

type AnyTable = SQLiteTableWithColumns<any>;

function entity<T extends AnyTable>(table: T) {
  const select = createSelectSchema(table) as z.ZodObject<any>;
  const insert = createInsertSchema(table) as z.ZodObject<any>;
  return {
    table,
    /** For push payload validation — omits server-owned sync columns. */
    clientWrite: insert.omit({
      updatedAt: true,
      rev: true,
    }),
    row: select,
  };
}

export const collections = {
  exercises: entity(db.exercises),
  workoutRoutineGroups: entity(db.workoutRoutineGroups),
  workoutTemplates: entity(db.workoutTemplates),
  workoutTemplateItems: entity(db.workoutTemplateItems),
  workoutSessions: entity(db.workoutSessions),
  workoutSets: entity(db.workoutSets),
  workoutSessionExercisePrefs: entity(db.workoutSessionExercisePrefs),
  workoutScheduledItems: entity(db.workoutScheduledItems),
  workoutRecurringRules: entity(db.workoutRecurringRules),
  workoutRecurringSkips: entity(db.workoutRecurringSkips),
  meals: entity(db.meals),
  mealEntries: entity(db.mealEntries),
  mealLibraryItems: entity(db.mealLibraryItems),
  mealLibraryIngredients: entity(db.mealLibraryIngredients),
  mealPlans: entity(db.mealPlans),
  mealPlanSlots: entity(db.mealPlanSlots),
  userProfiles: entity(db.userProfiles),
  userVitalEntries: entity(db.userVitalEntries),
  coachConversations: entity(db.coachConversations),
} as const;

export type CollectionName = keyof typeof collections;
export const collectionNames = Object.keys(collections) as CollectionName[];

/**
 * `userProfiles` is primary-keyed on `userId` rather than `id`. All other
 * collections use `id` as PK.
 */
export const primaryKeyByCollection: Record<CollectionName, string> = {
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
  coachConversations: "id",
};

/**
 * Collections that are read-only on the client (pull-only replication).
 * `coachConversations` is mutated by the server's `/api/coach/chat` stream;
 * clients observe through pull replication.
 */
export const pullOnlyCollections: ReadonlySet<CollectionName> = new Set([
  "coachConversations",
]);
