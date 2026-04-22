import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "./schema";

const url = process.env.DATABASE_URL ?? "file:./data/local.db";

export const libsqlClient = createClient({
  url,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

export const db = drizzle(libsqlClient, { schema });

export type Database = typeof db;
