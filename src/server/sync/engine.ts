/**
 * Generic pull/push handlers for the `/api/sync/$collection` protocol.
 *
 * Design:
 * - Every synced row has `updatedAt`, `deletedAt`, `rev`, `userId`. Pull cursor
 *   is `(updatedAt, primaryKey)` for stable ordering across identical
 *   timestamps.
 * - Conflict resolution is last-write-wins on `updatedAt`: a push is accepted
 *   when `new.updatedAt > existing.updatedAt` (strict). Equal or smaller is
 *   returned as a `conflict` so the client can fold the server row in.
 * - `userId` always comes from the authenticated Bearer token — never from the
 *   request body. This prevents write-by-id-spoofing.
 * - Writes are batched per request; the server bumps `rev = max(client.rev,
 *   server.rev) + 1` so the client can learn the canonical row. `updatedAt` is
 *   kept from the client (acts as the LWW tiebreaker across devices).
 * - The push response returns both `applied` (server-canonical rows) and
 *   `conflicts` (server-canonical rows that beat the client), so clients can
 *   clear their pending flags without waiting for a round-trip pull.
 */
import { and, asc, eq, gt, or } from "drizzle-orm";
import type { SQLiteTableWithColumns } from "drizzle-orm/sqlite-core";
import { db } from "@/db/client";
import {
  collections,
  type CollectionName,
  primaryKeyByCollection,
  pullOnlyCollections,
} from "@/shared/schemas/collections";

type AnyTable = SQLiteTableWithColumns<any>;

export interface PullCheckpoint {
  updatedAt: number;
  id: string;
}

export interface PushRow {
  newDocumentState: Record<string, unknown>;
}

const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 1000;

function tableFor(name: CollectionName): AnyTable {
  return collections[name].table;
}

function pkColumn(name: CollectionName): string {
  return primaryKeyByCollection[name];
}

function col(table: AnyTable, name: string) {
  const c = (table as any)[name];
  if (!c) throw new Error(`Column ${name} not on table`);
  return c;
}

function toMs(v: unknown): number {
  if (v instanceof Date) return v.getTime();
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v);
  return 0;
}

/** Reshape a Drizzle row into plain-JSON wire format. */
function serializeRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    out[k] = v instanceof Date ? v.getTime() : v;
  }
  if (out.deletedAt === undefined) out.deletedAt = null;
  return out;
}

/**
 * Convert a plain-JSON wire row into a shape Drizzle accepts (unpack
 * timestamp_ms numbers into Date, etc.).
 */
function deserializeRow(
  row: Record<string, unknown>,
  table: AnyTable
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const cols = (table as any)[Symbol.for("drizzle:Columns")] as
    | Record<string, { columnType?: string; dataType?: string }>
    | undefined;
  for (const [k, v] of Object.entries(row)) {
    const def = cols?.[k];
    const isTimestamp =
      def && (def.columnType === "SQLiteTimestamp" || def.dataType === "date");
    if (isTimestamp && typeof v === "number") {
      out[k] = new Date(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

export async function handlePull(
  name: CollectionName,
  userId: string,
  cursor: PullCheckpoint | null,
  limit: number
): Promise<{
  documents: Array<Record<string, unknown>>;
  checkpoint: PullCheckpoint;
}> {
  const table = tableFor(name);
  const pk = pkColumn(name);
  const n = Math.min(Math.max(limit || DEFAULT_LIMIT, 1), MAX_LIMIT);

  const userIdCol = (table as any).userId;
  const updatedAtCol = col(table, "updatedAt");
  const idCol = col(table, pk);

  const afterCursor = cursor
    ? or(
        gt(updatedAtCol, new Date(cursor.updatedAt)),
        and(
          eq(updatedAtCol, new Date(cursor.updatedAt)),
          gt(idCol, cursor.id)
        )
      )
    : undefined;

  const where = userIdCol
    ? afterCursor
      ? and(eq(userIdCol, userId), afterCursor)
      : eq(userIdCol, userId)
    : afterCursor;

  const rows = await db
    .select()
    .from(table)
    .where(where as any)
    .orderBy(asc(updatedAtCol), asc(idCol))
    .limit(n);

  const documents = rows.map((r) => serializeRow(r as any));
  const last = rows[rows.length - 1] as Record<string, unknown> | undefined;
  const checkpoint: PullCheckpoint = last
    ? { updatedAt: toMs(last.updatedAt), id: String(last[pk]) }
    : cursor ?? { updatedAt: 0, id: "" };

  return { documents, checkpoint };
}

export async function handlePush(
  name: CollectionName,
  userId: string,
  rows: PushRow[]
): Promise<{
  applied: Array<Record<string, unknown>>;
  conflicts: Array<Record<string, unknown>>;
}> {
  if (pullOnlyCollections.has(name)) {
    return { applied: [], conflicts: [] };
  }

  const table = tableFor(name);
  const pk = pkColumn(name);
  const clientWriteSchema = collections[name].clientWrite;
  const idCol = col(table, pk);

  const applied: Array<Record<string, unknown>> = [];
  const conflicts: Array<Record<string, unknown>> = [];

  await db.transaction(async (tx) => {
    for (const { newDocumentState } of rows) {
      const parsed = clientWriteSchema.safeParse({
        ...newDocumentState,
        userId,
      });
      if (!parsed.success) {
        conflicts.push({
          ...newDocumentState,
          _syncError: parsed.error.issues.map((i) => i.message).join(", "),
        });
        continue;
      }

      const candidateId = String((newDocumentState as any)[pk] ?? "");
      if (!candidateId) {
        conflicts.push({ ...newDocumentState, _syncError: "missing pk" });
        continue;
      }

      const [existing] = await tx
        .select()
        .from(table)
        .where(eq(idCol, candidateId))
        .limit(1);

      if (existing) {
        if (
          ((existing as any).userId ?? null) !== null &&
          (existing as any).userId !== userId
        ) {
          conflicts.push({ ...newDocumentState, _syncError: "forbidden" });
          continue;
        }
        const existingUpdatedAt = toMs((existing as any).updatedAt);
        const incomingUpdatedAt = toMs(
          (newDocumentState as any).updatedAt ?? 0
        );
        if (incomingUpdatedAt <= existingUpdatedAt) {
          conflicts.push(serializeRow(existing as any));
          continue;
        }
      }

      const nextRev =
        Math.max(
          Number((newDocumentState as any).rev ?? 0),
          Number((existing as any)?.rev ?? 0)
        ) + 1;

      const payload = deserializeRow(
        {
          ...newDocumentState,
          userId,
          [pk]: candidateId,
          rev: nextRev,
        },
        table
      );

      if (existing) {
        await tx.update(table).set(payload).where(eq(idCol, candidateId));
      } else {
        await tx.insert(table).values(payload);
      }

      const [written] = await tx
        .select()
        .from(table)
        .where(eq(idCol, candidateId))
        .limit(1);
      if (written) applied.push(serializeRow(written as any));
    }
  });

  return { applied, conflicts };
}

function sanitizeCollection(raw: string): CollectionName | null {
  return (collections as Record<string, unknown>)[raw]
    ? (raw as CollectionName)
    : null;
}

/** Entrypoint for the generic `/api/sync/$collection` HTTP route. */
export async function handleSyncRequest(
  request: Request,
  rawCollection: string,
  userId: string
): Promise<Response> {
  const name = sanitizeCollection(rawCollection);
  if (!name) {
    return new Response("Unknown collection", { status: 404 });
  }

  if (request.method === "GET") {
    const url = new URL(request.url);
    const cursor: PullCheckpoint | null = (() => {
      const u = url.searchParams.get("updatedAt");
      const i = url.searchParams.get("id");
      if (u === null || i === null) return null;
      return { updatedAt: Number(u), id: i };
    })();
    const limit = Number(url.searchParams.get("limit") ?? DEFAULT_LIMIT);
    const result = await handlePull(name, userId, cursor, limit);
    return Response.json(result);
  }

  if (request.method === "POST") {
    const body = (await request.json()) as PushRow[] | { rows: PushRow[] };
    const rows = Array.isArray(body) ? body : body?.rows;
    if (!Array.isArray(rows)) {
      return new Response("Bad request", { status: 400 });
    }
    const result = await handlePush(name, userId, rows);
    return Response.json(result);
  }

  return new Response("Method not allowed", { status: 405 });
}
