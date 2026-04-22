"use server";

import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { users } from "@/db/schema";
import { ensurePresetExercisesSeeded } from "@/lib/services/workouts";
import { hashPassword } from "@/lib/password";

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = data.email.trim().toLowerCase();
  if (!email || !data.password) {
    return { ok: false, error: "Email and password are required." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }
  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  if (existing) {
    return {
      ok: false,
      error:
        "An account with this email already exists. Try signing in instead.",
    };
  }
  const passwordHash = await hashPassword(data.password);
  const name = data.name.trim() || null;
  try {
    const [created] = await db
      .insert(users)
      .values({
        email,
        name,
        passwordHash,
      })
      .returning({ id: users.id });
    if (!created?.id) {
      return { ok: false, error: "Could not create account." };
    }
    await ensurePresetExercisesSeeded();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/unique|UNIQUE|constraint/i.test(msg)) {
      return {
        ok: false,
        error:
          "An account with this email already exists. Try signing in instead.",
      };
    }
    throw e;
  }
  return { ok: true };
}
