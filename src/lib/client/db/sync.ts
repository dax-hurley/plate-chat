/**
 * Efficient client sync for `/api/sync/$collection`.
 *
 * - **Push**: debounced; only collections with pending local changes (plus FK parents).
 * - **Pull**: only the merged scope — bootstrap + ref-counted route subscriptions.
 * - **Status**: optional `POST /api/sync/status` skips pulls when the server has nothing new.
 * - **Reconnect**: after offline, reconcile pending rows, push, then pull scope.
 */
import type { Table } from "dexie";
import { isDevForceOffline } from "@/lib/client/dev-force-offline";
import { authFetch } from "@/lib/client/auth-fetch";
import {
  collectionNames,
  pullOnlyCollections,
  primaryKeyByCollection,
  type CollectionName,
} from "@/shared/schemas/collections";
import { getDb, type SyncedRow, type TrainlogDB } from "./database";

/**
 * Collections that reference rows in other synced tables. If any listed parent
 * had dirty rows and its push failed (`!res.ok`), we skip pushing the child so
 * SQLite FK checks do not run before parents land on the server.
 */
const collectionParents: Partial<
  Record<CollectionName, readonly CollectionName[]>
> = {
  workoutTemplateItems: ["workoutTemplates", "exercises"],
  workoutSets: ["workoutSessions", "exercises"],
  workoutSessionExercisePrefs: ["workoutSessions", "exercises"],
  workoutScheduledItems: ["workoutTemplates"],
  workoutRecurringSkips: ["workoutRecurringRules"],
  mealEntries: ["meals"],
  mealLibraryIngredients: ["mealLibraryItems"],
  mealPlanSlots: ["mealPlans", "mealLibraryItems"],
  workoutTemplates: ["workoutRoutineGroups"],
};

const PULL_PAGE = 200;
const PUSH_BATCH = 50;
const PUSH_DEBOUNCE_MS = 280;
/** Background refresh for subscribed collections (visible tab only). */
const SCOPED_IDLE_PULL_MS = 1_200_000;
const VISIBILITY_PULL_DEBOUNCE_MS = 450;

/** Always pulled while the app shell is open (minimal cross-route data). */
const DEFAULT_PULL_SCOPE: readonly CollectionName[] = [
  "userProfiles",
  "coachConversations",
];

interface Checkpoint {
  updatedAt: number;
  id: string;
}

let started = false;
let pushDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let visibilityPullTimer: ReturnType<typeof setTimeout> | null = null;
let idleTimer: ReturnType<typeof setTimeout> | null = null;
let pushInFlight: Promise<void> | null = null;
let pullInFlight: Promise<void> | null = null;

/** Collections that may still have `_dirty` rows (cheap enqueue signal). */
const pendingPushCollections = new Set<CollectionName>();
const scopeRefCounts = new Map<CollectionName, number>();

const syncStateListeners = new Set<() => void>();

function notifySyncStateChanged() {
  for (const l of syncStateListeners) l();
}

let syncActivityDepth = 0;
function beginSyncActivity() {
  syncActivityDepth++;
  notifySyncStateChanged();
}
function endSyncActivity() {
  syncActivityDepth = Math.max(0, syncActivityDepth - 1);
  notifySyncStateChanged();
}

/** For `useSyncExternalStore` / header sync indicator. */
export function getSyncingSnapshot(): boolean {
  return syncActivityDepth > 0;
}

export function subscribeSyncing(onChange: () => void): () => void {
  syncStateListeners.add(onChange);
  return () => syncStateListeners.delete(onChange);
}

function tableOf(db: TrainlogDB, name: CollectionName): Table<SyncedRow, string> {
  return (db as unknown as Record<string, Table<SyncedRow, string>>)[name];
}

/** Resolve Dexie table → collection name for marking pending push after writes. */
function collectionForTable(table: Table<SyncedRow, string>): CollectionName | undefined {
  const db = getDb();
  for (const name of collectionNames) {
    if (table === tableOf(db, name)) return name;
  }
  return undefined;
}

/** Called from write helpers after local mutations. */
export function markCollectionPendingPush(name: CollectionName): void {
  if (pullOnlyCollections.has(name)) return;
  pendingPushCollections.add(name);
}

/**
 * Debounced push of dirty rows. Prefer this after local writes instead of
 * immediate network work.
 */
export function scheduleDebouncedPush(): void {
  if (typeof window === "undefined") {
    void runPushCycle();
    return;
  }
  if (pushDebounceTimer != null) {
    clearTimeout(pushDebounceTimer);
  }
  pushDebounceTimer = setTimeout(() => {
    pushDebounceTimer = null;
    void runPushCycle();
  }, PUSH_DEBOUNCE_MS);
}

/**
 * Compatibility alias: schedules a debounced push only (no full pull).
 * @deprecated Prefer `scheduleDebouncedPush` or `markCollectionPendingPush`.
 */
export function triggerSync(): void {
  scheduleDebouncedPush();
}

/** Flush debounced push immediately (e.g. pull server state after onboarding). */
export async function flushPendingPushNow(): Promise<void> {
  if (typeof window !== "undefined" && pushDebounceTimer != null) {
    clearTimeout(pushDebounceTimer);
    pushDebounceTimer = null;
  }
  await runPushCycle();
}

function expandPushWithParents(base: Set<CollectionName>): Set<CollectionName> {
  const out = new Set(base);
  let growing = true;
  while (growing) {
    growing = false;
    for (const n of collectionNames) {
      const parents = collectionParents[n];
      if (!parents?.length) continue;
      if (!out.has(n)) continue;
      for (const p of parents) {
        if (!out.has(p)) {
          out.add(p);
          growing = true;
        }
      }
    }
  }
  return out;
}

async function refreshPendingAfterCollectionPush(
  db: TrainlogDB,
  name: CollectionName
): Promise<void> {
  if (pullOnlyCollections.has(name)) return;
  const table = tableOf(db, name);
  const anyDirty = await table.where("_dirty").equals(1).first();
  if (!anyDirty) pendingPushCollections.delete(name);
}

/** After reconnect: re-discover dirty rows in case the outbox lost sync with Dexie. */
async function reconcilePendingFromDb(): Promise<void> {
  const db = getDb();
  for (const name of collectionNames) {
    if (pullOnlyCollections.has(name)) continue;
    const table = tableOf(db, name);
    const anyDirty = await table.where("_dirty").equals(1).first();
    if (anyDirty) pendingPushCollections.add(name);
  }
}

async function runPushCycle(): Promise<void> {
  if (pushInFlight) return pushInFlight;
  pushInFlight = (async () => {
    if (isDevForceOffline()) return;
    if (pendingPushCollections.size === 0) return;
    beginSyncActivity();
    try {
      const db = getDb();
      const pushSet = expandPushWithParents(pendingPushCollections);
      const pushFailed = new Set<CollectionName>();
      for (const name of collectionNames) {
        if (!pushSet.has(name)) continue;
        const parents = collectionParents[name];
        if (parents?.some((p) => pushFailed.has(p))) continue;
        const outcome = await pushCollectionInternal(db, name);
        if (outcome === "failed") pushFailed.add(name);
        await refreshPendingAfterCollectionPush(db, name);
      }
    } finally {
      endSyncActivity();
      pushInFlight = null;
    }
  })();
  return pushInFlight;
}

type PushOutcome = "no_dirty" | "ok" | "failed";

async function pushCollectionInternal(
  db: TrainlogDB,
  name: CollectionName
): Promise<PushOutcome> {
  if (pullOnlyCollections.has(name)) return "no_dirty";
  const pk = primaryKeyByCollection[name];
  const table = tableOf(db, name);

  const dirty = await table.where("_dirty").equals(1).toArray();
  if (dirty.length === 0) return "no_dirty";

  for (let i = 0; i < dirty.length; i += PUSH_BATCH) {
    const chunk = dirty.slice(i, i + PUSH_BATCH);
    const payload = chunk.map((row) => ({
      newDocumentState: stripClientMeta(row),
    }));
    const res = await authFetch(`/api/sync/${name}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      if (import.meta.env?.DEV) {
        console.warn(`[sync:${name}] push failed ${res.status}`);
      }
      return "failed";
    }
    const body = (await res.json()) as {
      applied: Array<Record<string, unknown>>;
      conflicts: Array<Record<string, unknown>>;
    };

    await db.transaction("rw", table, async () => {
      for (const row of [...body.applied, ...body.conflicts]) {
        await mergeIncoming(table, row, pk);
      }
    });
  }
  return "ok";
}

function stripClientMeta(row: SyncedRow): Record<string, unknown> {
  const { _dirty, ...rest } = row;
  void _dirty;
  return rest;
}

async function mergeIncoming(
  table: Table<SyncedRow, string>,
  incoming: Record<string, unknown>,
  pk: string
): Promise<void> {
  const key = String(incoming[pk]);
  const local = await table.get(key);
  const pulled = { ...incoming, _dirty: 0 as const } as SyncedRow;
  if (!local) {
    await table.put(pulled);
    return;
  }
  if (local._dirty === 1 && local.updatedAt > pulled.updatedAt) return;
  await table.put(pulled);
}

async function loadCheckpoint(
  db: TrainlogDB,
  name: CollectionName
): Promise<Checkpoint> {
  const row = await db._sync.get(name);
  return row
    ? { updatedAt: row.updatedAt, id: row.id }
    : { updatedAt: 0, id: "" };
}

async function saveCheckpoint(
  db: TrainlogDB,
  name: CollectionName,
  cp: Checkpoint
): Promise<void> {
  await db._sync.put({ name, updatedAt: cp.updatedAt, id: cp.id });
}

/** Ref-counted route/feature subscriptions — see `addSyncScope` / `useSyncScope`. */
export function addSyncScope(names: readonly CollectionName[]): () => void {
  for (const n of names) {
    scopeRefCounts.set(n, (scopeRefCounts.get(n) ?? 0) + 1);
  }
  return () => {
    for (const n of names) {
      const next = (scopeRefCounts.get(n) ?? 0) - 1;
      if (next <= 0) scopeRefCounts.delete(n);
      else scopeRefCounts.set(n, next);
    }
  };
}

function mergedPullNames(): CollectionName[] {
  const set = new Set<CollectionName>(DEFAULT_PULL_SCOPE);
  for (const [name, count] of scopeRefCounts) {
    if (count > 0) set.add(name);
  }
  return [...set];
}

async function filterCollectionsWithRemoteChanges(
  names: CollectionName[]
): Promise<CollectionName[]> {
  if (names.length === 0) return [];
  if (isDevForceOffline()) return [];
  const db = getDb();
  const checkpoints: Record<string, Checkpoint> = {};
  for (const n of names) {
    checkpoints[n] = await loadCheckpoint(db, n);
  }
  try {
    const res = await authFetch("/api/sync/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkpoints }),
    });
    if (!res.ok) return names;
    const body = (await res.json()) as { changed?: string[] };
    const changed = new Set(body.changed ?? []);
    return names.filter((n) => changed.has(n));
  } catch {
    return names;
  }
}

async function pullCollection(
  db: TrainlogDB,
  name: CollectionName
): Promise<void> {
  const pk = primaryKeyByCollection[name];
  const table = tableOf(db, name);

  for (;;) {
    const cp = await loadCheckpoint(db, name);
    const params = new URLSearchParams({
      limit: String(PULL_PAGE),
      updatedAt: String(cp.updatedAt),
      id: cp.id,
    });
    const res = await authFetch(`/api/sync/${name}?${params}`);
    if (!res.ok) {
      if (import.meta.env?.DEV) {
        console.warn(`[sync:${name}] pull failed ${res.status}`);
      }
      return;
    }
    const body = (await res.json()) as {
      documents: Array<Record<string, unknown>>;
      checkpoint: Checkpoint;
    };
    if (body.documents.length === 0) return;

    await db.transaction("rw", table, async () => {
      for (const incoming of body.documents) {
        await mergeIncoming(table, incoming, pk);
      }
    });
    await saveCheckpoint(db, name, body.checkpoint);
    if (body.documents.length < PULL_PAGE) return;
  }
}

async function pullMergedRemoteScope(options: {
  useStatusFilter: boolean;
}): Promise<void> {
  if (pullInFlight) return pullInFlight;
  pullInFlight = (async () => {
    if (isDevForceOffline()) return;
    if (typeof document !== "undefined" && document.visibilityState !== "visible")
      return;
    beginSyncActivity();
    try {
      const db = getDb();
      const scope = mergedPullNames();
      const toPull = options.useStatusFilter
        ? await filterCollectionsWithRemoteChanges(scope)
        : scope;
      for (const name of toPull) {
        await pullCollection(db, name);
      }
    } finally {
      endSyncActivity();
      pullInFlight = null;
    }
  })();
  return pullInFlight;
}

/** Debounced pull of the current merged scope (status filter when possible). */
export function scheduleScopedPull(): void {
  if (typeof window === "undefined") {
    void pullMergedRemoteScope({ useStatusFilter: true });
    return;
  }
  if (visibilityPullTimer != null) clearTimeout(visibilityPullTimer);
  visibilityPullTimer = setTimeout(() => {
    visibilityPullTimer = null;
    void pullMergedRemoteScope({ useStatusFilter: true });
  }, VISIBILITY_PULL_DEBOUNCE_MS);
}

async function bootstrapSync(): Promise<void> {
  await reconcilePendingFromDb();
  await runPushCycle();
  await pullMergedRemoteScope({ useStatusFilter: true });
}

function onWindowOnline(): void {
  void (async () => {
    await reconcilePendingFromDb();
    await runPushCycle();
    await pullMergedRemoteScope({ useStatusFilter: true });
  })();
}

function onWindowOffline(): void {
  /* Connectivity loss; `navigator.onLine` may lie — next `online` reconciles. */
}

function onVisibilityChange(): void {
  if (typeof document === "undefined") return;
  if (document.visibilityState !== "visible") return;
  scheduleScopedPull();
  void runPushCycle();
}

function onPageShowPersisted(ev: PageTransitionEvent): void {
  if (!ev.persisted) return;
  scheduleScopedPull();
  void runPushCycle();
}

export function startSyncRunner(): void {
  if (started) return;
  started = true;
  if (typeof window === "undefined") return;

  idleTimer = setInterval(() => {
    if (document.visibilityState !== "visible") return;
    void pullMergedRemoteScope({ useStatusFilter: true });
  }, SCOPED_IDLE_PULL_MS);

  window.addEventListener("online", onWindowOnline);
  window.addEventListener("offline", onWindowOffline);
  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("pageshow", onPageShowPersisted);

  void bootstrapSync();
}

export function stopSyncRunner(): void {
  if (!started) return;
  started = false;
  if (idleTimer != null) {
    clearInterval(idleTimer);
    idleTimer = null;
  }
  if (pushDebounceTimer != null) {
    clearTimeout(pushDebounceTimer);
    pushDebounceTimer = null;
  }
  if (visibilityPullTimer != null) {
    clearTimeout(visibilityPullTimer);
    visibilityPullTimer = null;
  }
  if (typeof window !== "undefined") {
    window.removeEventListener("online", onWindowOnline);
    window.removeEventListener("offline", onWindowOffline);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("pageshow", onPageShowPersisted);
  }
}

/**
 * Pull one collection from the beginning (clears local sync cursor first).
 */
export async function pullSyncCollectionFromScratch(
  name: CollectionName
): Promise<void> {
  beginSyncActivity();
  try {
    if (pullOnlyCollections.has(name)) return;
    const db = getDb();
    await db._sync.delete(name);
    await pullCollection(db, name);
  } finally {
    endSyncActivity();
  }
}

/** Incremental pull for explicit subsets (e.g. meal-plan ensure). No status filter. */
export async function pullSyncCollections(
  names: readonly CollectionName[]
): Promise<void> {
  beginSyncActivity();
  try {
    const db = getDb();
    for (const name of names) {
      if (pullOnlyCollections.has(name)) continue;
      await pullCollection(db, name);
    }
  } finally {
    endSyncActivity();
  }
}

/** Mark writes + schedule push — used from `writes.ts`. */
export function onLocalWrite(table: Table<SyncedRow, string>): void {
  const name = collectionForTable(table);
  if (name) markCollectionPendingPush(name);
  scheduleDebouncedPush();
}
