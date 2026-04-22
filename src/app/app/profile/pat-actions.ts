"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";

import { requireUserId } from "@/lib/auth-user";
import { db } from "@/db/client";
import { personalAccessTokens } from "@/db/schema";
import { generatePatToken } from "@/lib/pat-token";

export async function actionCreatePat(formData: FormData): Promise<
  | { ok: true; token: string }
  | { ok: false; error: string }
> {
  const userId = await requireUserId();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, error: "Name required" };
  const { raw, tokenHash } = generatePatToken();
  await db.insert(personalAccessTokens).values({
    userId,
    name,
    tokenHash,
  });
  revalidatePath("/app/profile");
  return { ok: true, token: raw };
}

export async function actionRevokePat(tokenId: string) {
  const userId = await requireUserId();
  await db
    .delete(personalAccessTokens)
    .where(
      and(
        eq(personalAccessTokens.id, tokenId),
        eq(personalAccessTokens.userId, userId)
      )
    );
  revalidatePath("/app/profile");
}
