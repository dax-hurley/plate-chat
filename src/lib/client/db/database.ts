import Dexie, { type Table } from "dexie";

/** Dexie / IndexedDB database name (offline cache on web and Capacitor WebView). */
export const TRAINLOG_INDEXEDDB_NAME = "trainlog";

/**
 * Client-side IndexedDB schema (via Dexie). Every synced row carries the
 * common fields `updatedAt`, `deletedAt`, `rev`, `userId` (except
 * `userProfiles` which keys on `userId` itself), plus a client-only `_dirty`
 * flag (0/1) toggled on local mutation and cleared when the server-canonical
 * version has been ingested.
 *
 * Only fields participating in indexes are listed in the schema string; the
 * rest are free-form JSON.
 */
export type SyncedRow = {
  [key: string]: unknown;
  updatedAt: number;
  rev: number;
  deletedAt: number | null;
  /** 1 when the row has unpushed local changes, 0 otherwise. */
  _dirty: 0 | 1;
};

export type SyncMeta = {
  name: string;
  updatedAt: number;
  id: string;
};

export class TrainlogDB extends Dexie {
  exercises!: Table<SyncedRow, string>;
  workoutRoutineGroups!: Table<SyncedRow, string>;
  workoutTemplates!: Table<SyncedRow, string>;
  workoutTemplateItems!: Table<SyncedRow, string>;
  workoutSessions!: Table<SyncedRow, string>;
  workoutSets!: Table<SyncedRow, string>;
  workoutSessionExercisePrefs!: Table<SyncedRow, string>;
  workoutScheduledItems!: Table<SyncedRow, string>;
  workoutRecurringRules!: Table<SyncedRow, string>;
  workoutRecurringSkips!: Table<SyncedRow, string>;
  meals!: Table<SyncedRow, string>;
  mealEntries!: Table<SyncedRow, string>;
  mealLibraryItems!: Table<SyncedRow, string>;
  mealLibraryIngredients!: Table<SyncedRow, string>;
  mealPlans!: Table<SyncedRow, string>;
  mealPlanSlots!: Table<SyncedRow, string>;
  userProfiles!: Table<SyncedRow, string>;
  userVitalEntries!: Table<SyncedRow, string>;
  coachConversations!: Table<SyncedRow, string>;
  _sync!: Table<SyncMeta, string>;

  constructor() {
    super(TRAINLOG_INDEXEDDB_NAME);
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
      userVitalEntries:
        "id, [userId+vitalKey+dayKey], [userId+vitalKey], [userId+dayKey], _dirty",
      coachConversations: "id, [userId+updatedAt], _dirty",
      _sync: "name",
    });
  }
}

let instance: TrainlogDB | null = null;

export function getDb(): TrainlogDB {
  if (!instance) instance = new TrainlogDB();
  return instance;
}

export async function resetDb(): Promise<void> {
  const db = getDb();
  await db.delete();
  instance = null;
}
