import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db/client";
import {
  users,
  baSessions,
  baAccounts,
  baVerifications,
} from "@/db/schema";

const authSecret =
  process.env.BETTER_AUTH_SECRET ??
  process.env.AUTH_SECRET ??
  "dev-insecure-secret-change-me";

const trustedOrigins = (process.env.TRUSTED_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/**
 * better-auth instance. Email+password is the only enabled credential; the
 * registration page uses it directly. Device sync auth lives separately in
 * `device-tokens.ts` and is not one of better-auth's primitives.
 *
 * The `user` table is shared with the rest of the app (id, name, email);
 * sessions / accounts / verifications live in `ba_*`.
 */
export const auth = betterAuth({
  secret: authSecret,
  baseURL: process.env.APP_URL ?? process.env.AUTH_URL,
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      user: users,
      session: baSessions,
      account: baAccounts,
      verification: baVerifications,
    },
  }),
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
});

export type Auth = typeof auth;
