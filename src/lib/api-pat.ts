import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { personalAccessTokens } from "@/db/schema";

import { hashPatToken } from "./pat-token";

export async function resolvePatUserId(request: Request): Promise<string | null> {
  const header = request.headers.get("authorization");
  if (!header?.toLowerCase().startsWith("bearer ")) return null;
  const raw = header.slice(7).trim();
  if (!raw) return null;
  const tokenHash = hashPatToken(raw);
  const row = await db.query.personalAccessTokens.findFirst({
    where: eq(personalAccessTokens.tokenHash, tokenHash),
  });
  if (!row) return null;
  await db
    .update(personalAccessTokens)
    .set({ lastUsedAt: new Date() })
    .where(eq(personalAccessTokens.id, row.id));
  return row.userId;
}

export function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

export function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, init);
}
