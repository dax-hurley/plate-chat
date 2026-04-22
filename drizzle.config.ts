import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  /** LibSQL file URLs use the Turso driver; avoids duplicate CREATE INDEX bug in sqlite push (drizzle-kit #3574). */
  dialect: "turso",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "file:./data/local.db",
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
});
