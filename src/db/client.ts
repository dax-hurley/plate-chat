import type { Client } from "@libsql/core/api";
import { drizzle } from "drizzle-orm/libsql/http";

import * as schema from "./schema";

const url = process.env.DATABASE_URL ?? "file:./data/local.db";
const authToken = process.env.DATABASE_AUTH_TOKEN;

const capacitorWebBuild =
  process.env.PLATECHAT_CAPACITOR_WEB_BUILD === "1" ||
  process.env.PLATECHAT_CAPACITOR_WEB_BUILD === "true";

/**
 * The default `@libsql/client` entry statically imports the native `libsql` driver
 * (optional `@libsql/linux-x64-*`), which Rollup inlines for Lambda and then fails
 * at runtime. For remote DBs, load the HTTP and WebSocket Hrana clients only.
 * The native `libsql` import is only used for local `file:` / SQLite (dev).
 */
async function createLibsqlClient(): Promise<Client> {
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
    const { createClient } = await import("@libsql/client/http");
    return createClient({
      url: "libsql://prerender-placeholder.local",
      authToken: "prerender",
    });
  }
  if (url.startsWith("file:") || url === ":memory:") {
    const { createClient } = await import("@libsql/client");
    return createClient({ url, authToken });
  }
  if (/^wss?:/i.test(url)) {
    const { createClient } = await import("@libsql/client/ws");
    return createClient({ url, authToken });
  }
  const { createClient } = await import("@libsql/client/http");
  return createClient({ url, authToken });
}

export const libsqlClient = await createLibsqlClient();
// `drizzle-orm/libsql` imports full `@libsql/client` (native). The `/http` entry only
// pulls the Hrana HTTP client; our `libsqlClient` is still the full client for `file:`.
export const db = drizzle(libsqlClient, { schema });

export type Database = typeof db;
