/**
 * Client-side sync runner for the `/api/sync/$collection` protocol.
 *
 * Pull: GET with `(updatedAt, id)` cursor, page through until the server
 * returns an empty batch or a checkpoint equal to what we sent.
 *
 * Push: batch all rows in a collection with `_dirty=1` and POST them. The
 * server replies with `applied[]` (server-canonical versions of accepted
 * writes) and `conflicts[]` (server rows that beat us on LWW). We fold both
 * back in — if local is still dirtier than what came back (the user wrote
 * again between push and response), we keep local and retry next tick.
 *
 * A heartbeat + online/focus event listeners poke the runner. Writes also
 * call `triggerSync()` so pushes don't wait for the poll interval.
 */
import type { Table } from "dexie";
import { authFetch } from "@/lib/client/auth-fetch";
import {
  collectionNames,
  pullOnlyCollections,
  primaryKeyByCollection,
  type CollectionName,
} from "@/shared/schemas/collections";
import { getDb, type SyncedRow, type TrainlogDB } from "./database";

interface Checkpoint {
  updatedAt: number;
  id: string;
}

const POLL_MS = 30_000;
const PULL_PAGE = 200;
const PUSH_BATCH = 50;

let started = false;
let cycleInFlight: Promise<void> | null = null;
let heartbeat: ReturnType<typeof setInterval> | null = null;

export function triggerSync() {
  runCycle().catch((err) => {
    if (import.meta.env?.DEV) console.warn("[sync] cycle failed", err);
  });
}

export function startSyncRunner() {
  if (started) return;
  started = true;
  heartbeat = setInterval(triggerSync, POLL_MS);
  if (typeof window !== "undefined") {
    window.addEventListener("online", triggerSync);
    window.addEventListener("focus", triggerSync);
  }
  triggerSync();
}

export function stopSyncRunner() {
  if (!started) return;
  started = false;
  if (heartbeat) clearInterval(heartbeat);
  heartbeat = null;
  if (typeof window !== "undefined") {
    window.removeEventListener("online", triggerSync);
    window.removeEventListener("focus", triggerSync);
  }
}

async function runCycle(): Promise<void> {
  if (cycleInFlight) return cycleInFlight;
  cycleInFlight = (async () => {
    const db = getDb();
    try {
      for (const name of collectionNames) {
        await pushCollection(db, name);
      }
      for (const name of collectionNames) {
        await pullCollection(db, name);
      }
    } finally {
      cycleInFlight = null;
    }
  })();
  return cycleInFlight;
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

function tableOf(db: TrainlogDB, name: CollectionName): Table<SyncedRow, string> {
  return (db as unknown as Record<string, Table<SyncedRow, string>>)[name];
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

async function pushCollection(
  db: TrainlogDB,
  name: CollectionName
): Promise<void> {
  if (pullOnlyCollections.has(name)) return;
  const pk = primaryKeyByCollection[name];
  const table = tableOf(db, name);

  const dirty = await table.where("_dirty").equals(1).toArray();
  if (dirty.length === 0) return;

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
      return;
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
}

function stripClientMeta(row: SyncedRow): Record<string, unknown> {
  const { _dirty, ...rest } = row;
  void _dirty;
  return rest;
}
