import { and, desc, eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db/client";
import { coachConversations } from "@/db/schema";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const rows = await db
    .select({
      id: coachConversations.id,
      title: coachConversations.title,
      updatedAt: coachConversations.updatedAt,
    })
    .from(coachConversations)
    .where(eq(coachConversations.userId, session.user.id))
    .orderBy(desc(coachConversations.updatedAt));

  return Response.json({ conversations: rows });
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const id = crypto.randomUUID();
  await db.insert(coachConversations).values({
    id,
    userId: session.user.id,
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
        eq(coachConversations.userId, session.user.id)
      )
    )
    .limit(1);

  if (!row) {
    return Response.json({ error: "Could not create conversation" }, { status: 500 });
  }

  return Response.json({ conversation: row });
}
