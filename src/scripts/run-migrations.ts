/**
 * Apply SQL migrations in ./drizzle to DATABASE_URL (Turso, local file, etc.).
 *
 * drizzle-kit's `migrate` command hides errors in CI: on failure it calls process.exit(1)
 * without printing the underlying cause (hanji TaskTerminal + MigrateProgress).
 *
 * Usage: `npm run db:migrate`
 * Env: DATABASE_URL (required), DATABASE_AUTH_TOKEN (Turso / remote)
 */

import "./load-env";

import { createClient as createFileClient } from "@libsql/client";
import { createClient as createHttpClient } from "@libsql/client/http";
import { createClient as createWsClient } from "@libsql/client/ws";
import { drizzle } from "drizzle-orm/libsql/http";
import { migrate } from "drizzle-orm/libsql/migrator";
import { resolve } from "node:path";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const authToken = process.env.DATABASE_AUTH_TOKEN;

function createLibsqlClient() {
  if (url.startsWith("file:") || url === ":memory:") {
    return createFileClient({ url, authToken });
  }
  if (/^wss?:/i.test(url)) {
    return createWsClient({ url, authToken });
  }
  return createHttpClient({ url, authToken });
}

function printErr(err: unknown) {
  console.error(err);
  if (err instanceof Error) {
    if (err.cause) console.error("Cause:", err.cause);
    if (err.stack) console.error(err.stack);
  }
}

const client = createLibsqlClient();
const db = drizzle(client);
const migrationsFolder = resolve(process.cwd(), "drizzle");

migrate(db, { migrationsFolder })
  .then(() => {
    console.log("Migrations applied successfully.");
  })
  .catch((err: unknown) => {
    printErr(err);
    process.exit(1);
  });
