/**
 * Write helpers that decorate rows with the sync metadata (`updatedAt`,
 * `rev`, `deletedAt`, `_dirty`) and kick the sync runner so pushes don't wait
 * for the heartbeat. Stores call these rather than hand-rolling the metadata
 * on every mutation.
 */
import type { Table } from "dexie";
import type { SyncedRow } from "./database";
import { triggerSync } from "./sync";

function now(): number {
  return Date.now();
}

export async function insertLocal<T extends Record<string, unknown>>(
  table: Table<SyncedRow, string>,
  row: T
): Promise<void> {
  const t = now();
  await table.put({
    ...row,
    updatedAt: t,
    deletedAt: null,
    rev: 1,
    _dirty: 1,
  } as unknown as SyncedRow);
  triggerSync();
}

export async function updateLocal(
  table: Table<SyncedRow, string>,
  key: string,
  patch: Record<string, unknown>
): Promise<void> {
  const existing = await table.get(key);
  if (!existing) return;
  const t = now();
  await table.put({
    ...existing,
    ...patch,
    updatedAt: t,
    rev: (existing.rev ?? 0) + 1,
    _dirty: 1,
  } as SyncedRow);
  triggerSync();
}

export async function softDeleteLocal(
  table: Table<SyncedRow, string>,
  key: string
): Promise<void> {
  const existing = await table.get(key);
  if (!existing) return;
  const t = now();
  await table.put({
    ...existing,
    deletedAt: t,
    updatedAt: t,
    rev: (existing.rev ?? 0) + 1,
    _dirty: 1,
  } as SyncedRow);
  triggerSync();
}
