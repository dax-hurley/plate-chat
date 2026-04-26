import { createFileRoute } from "@tanstack/react-router";
import { and, desc, eq, isNull } from "drizzle-orm";

import { authenticateBearer } from "@/server/auth/device-tokens";
import { db } from "@/db/client";
import { coachConversations } from "@/db/schema";

async function handleGet({ request }: { request: Request }): Promise<Response> {
  const claims = await authenticateBearer(request);
  if (!claims) {
    return new Response("Unauthorized", { status: 401 });
  }

  const rows = await db
    .select({
      id: coachConversations.id,
      title: coachConversations.title,
      updatedAt: coachConversations.updatedAt,
    })
    .from(coachConversations)
    .where(
      and(
        eq(coachConversations.userId, claims.userId),
        isNull(coachConversations.deletedAt)
      )
    )
    .orderBy(desc(coachConversations.updatedAt));

  return Response.json({ conversations: rows });
}

async function handlePost({ request }: { request: Request }): Promise<Response> {
  const claims = await authenticateBearer(request);
  if (!claims) {
    return new Response("Unauthorized", { status: 401 });
  }

  const id = crypto.randomUUID();
  await db.insert(coachConversations).values({
    id,
    userId: claims.userId,
    title: "New chat",
    messages: "[]",
  });

  const [row] = await db
    .select({
      id: coachConversations.id,
      title: coachConversations.title,
      updatedAt: coachConversations.updatedAt,
    })
    .from(coachConversations)
    .where(
      and(
        eq(coachConversations.id, id),
        eq(coachConversations.userId, claims.userId)
      )
    )
    .limit(1);

  if (!row) {
    return Response.json(
      { error: "Could not create conversation" },
      { status: 500 }
    );
  }

  return Response.json({ conversation: row });
}

export const Route = createFileRoute("/api/coach/conversations")({
  server: {
    handlers: {
      GET: handleGet,
      POST: handlePost,
    },
  },
});
