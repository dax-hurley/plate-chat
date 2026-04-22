import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

import { db } from "@/db/client";
import {
  CredentialsMissingFields,
  CredentialsNoAccount,
  CredentialsNoPasswordSet,
  CredentialsWrongPassword,
} from "@/lib/credentials-login";
import {
  accounts,
  authenticators,
  sessions,
  users,
  verificationTokens,
} from "@/db/schema";

/** Set in `next.config.ts` when unset (dev default `127.0.0.1:3000`). */
const authUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  // HTTP dev (e.g. Capacitor + 127.0.0.1) must not use Secure cookies.
  useSecureCookies:
    authUrl.length > 0
      ? authUrl.startsWith("https://")
      : process.env.NODE_ENV === "production",
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
    authenticatorsTable: authenticators,
  }),
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        if (!creds?.email || !creds?.password || typeof creds.email !== "string") {
          throw new CredentialsMissingFields();
        }
        const email = creds.email.trim().toLowerCase();
        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });
        if (!user) {
          throw new CredentialsNoAccount();
        }
        if (!user.passwordHash) {
          throw new CredentialsNoPasswordSet();
        }
        const valid = await bcrypt.compare(
          String(creds.password),
          user.passwordHash
        );
        if (!valid) {
          throw new CredentialsWrongPassword();
        }
        return {
          id: user.id,
          email: user.email ?? undefined,
          name: user.name ?? undefined,
          image: user.image ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) session.user.id = token.id as string;
      return session;
    },
  },
});
