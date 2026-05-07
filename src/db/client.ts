import type { Client } from "@libsql/core/api";
import { createClient as createHttpClient } from "@libsql/client/http";
import { createClient as createWsClient } from "@libsql/client/ws";
import { createRequire } from "node:module";
import { drizzle } from "drizzle-orm/libsql/http";

import * as schema from "./schema";

/** Native `file:` / `:memory:` only — kept as `require` so Rollup does not pull `libsql` native into Lambda. */
const requireLibsqlNode = createRequire(import.meta.url);

const url = process.env.DATABASE_URL ?? "file:./data/local.db";
const authToken = process.env.DATABASE_AUTH_TOKEN;

const capacitorWebBuild =
  process.env.PLATECHAT_CAPACITOR_WEB_BUILD === "1" ||
  process.env.PLATECHAT_CAPACITOR_WEB_BUILD === "true";

/**
 * The default `@libsql/client` entry statically imports the native `libsql` driver
 * (optional `@libsql/linux-x64-*`), which Lambda bundles cannot load. Production
 * uses static imports from `@libsql/client/http` and `@libsql/client/ws` so they are
 * bundled; local `file:` / `:memory:` still uses runtime `require("@libsql/client")`.
 *
 * Initialization is synchronous so `tsx` (CJS esbuild transform) and any consumer
 * that needs `db` at module load time (e.g. better-auth) work without top-level await.
 */
function createLibsqlClient(): Client {
  /**
   * TanStack Start prerender runs a local preview server (subprocess may not
   * inherit `TSS_PRERENDERING`). `CAPACITOR_WEB_BUILD` sets
   * `PLATECHAT_CAPACITOR_WEB_BUILD` via Vite `define` so the server bundle uses
   * the HTTP client for `file:` — shell prerender does not hit the DB; this
   * server output is not shipped in the APK.
   */
  if (
    (process.env.TSS_PRERENDERING === "true" || capacitorWebBuild) &&
    (url.startsWith("file:") || url === ":memory:")
  ) {
    return createHttpClient({
      url: "libsql://prerender-placeholder.local",
      authToken: "prerender",
    });
  }
  if (url.startsWith("file:") || url === ":memory:") {
    const { createClient } =
      requireLibsqlNode("@libsql/client") as typeof import("@libsql/client");
    return createClient({ url, authToken });
  }
  if (/^wss?:/i.test(url)) {
    return createWsClient({ url, authToken });
  }
  return createHttpClient({ url, authToken });
}

export const libsqlClient = createLibsqlClient();
// Align drizzle with bundled Hrana clients; `libsqlClient` remains the native client for `file:`.
export const db = drizzle(libsqlClient, { schema });

export type Database = typeof db;
