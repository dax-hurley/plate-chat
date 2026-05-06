/**
 * Deletes all application data while keeping `user` rows and their
 * better-auth credentials (`ba_account`). Sessions and device tokens are
 * cleared on the server so every device must re-login.
 *
 * Wipes the primary LibSQL database from `DATABASE_URL` and, when it is not
 * already `data/local.db`, any existing `data/local.db` (stale local file).
 *
 * Offline cache in the browser is Dexie on IndexedDB (`trainlog`); Node cannot
 * delete that — after this script runs, follow the instructions printed at the end
 * (or hard-refresh after signing out) so the client does not re-push old rows.
 *
 * Usage: `npm run db:wipe` — you will be prompted to type `yes`.
 * Env: DATABASE_URL (optional, defaults to file:./data/local.db).
 */

import "./load-env";

import { createClient as createFileClient } from "@libsql/client";
import { createClient as createHttpClient } from "@libsql/client/http";
import { createClient as createWsClient } from "@libsql/client/ws";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql/http";
import { existsSync, unlinkSync } from "node:fs";
import { stdin as input, stdout as output } from "node:process";
import { resolve } from "node:path";
import readline from "node:readline/promises";
import { fileURLToPath, pathToFileURL } from "node:url";

import { TRAINLOG_INDEXEDDB_NAME } from "@/lib/client/db/database";
import * as schema from "@/db/schema";

/** Child / dependent tables first. */
const TABLES_IN_DELETE_ORDER = [
  schema.workoutSets,
  schema.workoutSessionExercisePrefs,
  schema.mealEntries,
  schema.mealPlanSlots,
  schema.mealPlans,
  schema.mealLibraryIngredients,
  schema.workoutRecurringSkips,
  schema.workoutRecurringRules,
  schema.workoutScheduledItems,
  schema.workoutTemplateItems,
  schema.workoutSessions,
  schema.workoutTemplates,
  schema.workoutRoutineGroups,
  schema.meals,
  schema.mealLibraryItems,
  schema.userVitalEntries,
  schema.userProfiles,
  schema.coachConversations,
  schema.exercises,
  schema.baSessions,
  schema.baVerifications,
  schema.deviceTokens,
  schema.personalAccessTokens,
] as const;

const DEFAULT_DATABASE_URL = "file:./data/local.db";
const LOCAL_SQLITE_PATH = resolve(process.cwd(), "data/local.db");

const authToken = process.env.DATABASE_AUTH_TOKEN;

function createLibsqlClient(url: string) {
  if (url.startsWith("file:") || url === ":memory:") {
    return createFileClient({ url, authToken });
  }
  if (/^wss?:/i.test(url)) {
    return createWsClient({ url, authToken });
  }
  return createHttpClient({ url, authToken });
}

function createDb(url: string) {
  return drizzle(createLibsqlClient(url), { schema });
}

type WipeDb = ReturnType<typeof createDb>;

/** Absolute path for a `file:` LibSQL URL, or `null` for remote / `:memory:`. */
function sqliteFileAbsolutePath(databaseUrl: string): string | null {
  if (databaseUrl === ":memory:") return null;
  if (!databaseUrl.startsWith("file:")) return null;
  if (databaseUrl.startsWith("file://")) {
    try {
      return fileURLToPath(databaseUrl);
    } catch {
      return resolve(process.cwd(), databaseUrl.slice("file:".length));
    }
  }
  return resolve(process.cwd(), databaseUrl.slice("file:".length));
}

async function wipeNonUserTables(db: WipeDb) {
  for (const table of TABLES_IN_DELETE_ORDER) {
    await db.delete(table).where(sql`1`);
  }
}

function errorChainIncludesNoSuchTable(err: unknown): boolean {
  let e: unknown = err;
  const seen = new Set<unknown>();
  while (e && typeof e === "object" && !seen.has(e)) {
    seen.add(e);
    const msg = (e as { message?: string }).message ?? "";
    if (/no such table/i.test(msg)) return true;
    e = (e as { cause?: unknown }).cause;
  }
  return false;
}

/** Best-effort delete of main DB + SQLite WAL/SHM sidecars (after `client.close()`). */
function removeSqliteDatabaseFiles(dbPath: string): void {
  for (const p of [dbPath, `${dbPath}-wal`, `${dbPath}-shm`]) {
    try {
      unlinkSync(p);
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") {
        console.warn(`Could not remove ${p}:`, e);
      }
    }
  }
}

/**
 * Wipe non-user tables in an on-disk SQLite file, or remove the file set if it
 * was never migrated (no `user` table).
 */
async function wipeSecondaryLocalSqlite(absolutePath: string): Promise<void> {
  const fileUrl = pathToFileURL(absolutePath).href;
  const client = createFileClient({ url: fileUrl, authToken });
  const localDb = drizzle(client, { schema });
  let removeFiles = false;
  try {
    const [{ n: localUsers }] = await localDb
      .select({ n: sql<number>`count(*)` })
      .from(schema.users);
    console.log(
      `Local DB: keeping ${localUsers} user row(s); clearing all other tables…`
    );
    await wipeNonUserTables(localDb);
  } catch (err) {
    if (errorChainIncludesNoSuchTable(err)) {
      console.log(
        `Local file has no app tables (never migrated or stale file). Removing SQLite files…`
      );
      removeFiles = true;
    } else {
      throw err;
    }
  } finally {
    client.close();
  }
  if (removeFiles) {
    removeSqliteDatabaseFiles(absolutePath);
  }
}

function printOfflineFollowUp(): void {
  console.log("");
  console.log("Offline / browser cache (Dexie IndexedDB) was not changed by this script.");
  console.log(
    `  • In Chromium: DevTools → Application → Storage → IndexedDB → delete “${TRAINLOG_INDEXEDDB_NAME}”.`
  );
  console.log(
    "  • Or in the tab: DevTools console → indexedDB.deleteDatabase(\"" +
      TRAINLOG_INDEXEDDB_NAME +
      '") then reload.'
  );
  console.log(
    "  • Device tokens live in localStorage / Capacitor Preferences (key trainlog.device-tokens); sign out in the app or clear site data so the client stops syncing stale rows."
  );
}

async function confirmInteractive(): Promise<boolean> {
  if (!input.isTTY) {
    console.error(
      "Refusing to run: not a TTY. Run this script in a terminal so you can confirm interactively."
    );
    return false;
  }
  const rl = readline.createInterface({ input, output });
  try {
    const line = await rl.question(
      'This will delete ALL app data on the server DB(s) below and clear sessions/device tokens, keeping `user` rows and their credentials. Offline IndexedDB must be cleared separately (instructions after). Type "yes" to continue: '
    );
    return line.trim().toLowerCase() === "yes";
  } finally {
    await rl.close();
  }
}

async function main() {
  if (!(await confirmInteractive())) {
    console.error("Aborted.");
    process.exit(1);
  }

  const primaryUrl = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;
  const primaryDb = createDb(primaryUrl);

  const [{ n: userCount }] = await primaryDb
    .select({ n: sql<number>`count(*)` })
    .from(schema.users);

  console.log(`Keeping ${userCount} user(s). Wiping all other tables…`);
  console.log(`Primary target: ${primaryUrl}`);

  await wipeNonUserTables(primaryDb);

  const primaryPath = sqliteFileAbsolutePath(primaryUrl);
  const shouldWipeLocalCopy =
    existsSync(LOCAL_SQLITE_PATH) &&
    (primaryPath === null || primaryPath !== LOCAL_SQLITE_PATH);

  if (shouldWipeLocalCopy) {
    console.log(
      `Also wiping default local SQLite: ${LOCAL_SQLITE_PATH} (different from primary)`
    );
    await wipeSecondaryLocalSqlite(LOCAL_SQLITE_PATH);
  }

  console.log("Done. Users preserved on the cleared server DB(s); all other rows cleared.");
  printOfflineFollowUp();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
