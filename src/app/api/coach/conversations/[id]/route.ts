import { and, eq } from "drizzle-orm";
import type { UIMessage } from "ai";

import { auth } from "@/auth";
import { db } from "@/db/client";
import { coachConversations } from "@/db/schema";

export const runtime = "nodejs";

function textFromUserMessage(m: UIMessage): string {
  if (m.role !== "user") return "";
  return m.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("")
    .trim();
}

function deriveTitleFromMessages(messages: UIMessage[]): string | undefined {
  for (const m of messages) {
    if (m.role !== "user") continue;
    const text = textFromUserMessage(m);
    if (text) return text.slice(0, 72);
  }
  return undefined;
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await ctx.params;

  const [row] = await db
    .select()
    .from(coachConversations)
    .where(
      and(
        eq(coachConversations.id, id),
        eq(coachConversations.userId, session.user.id)
      )
    )
    .limit(1);

  if (!row) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  let messages: UIMessage[] = [];
  try {
    const parsed = JSON.parse(row.messages) as unknown;
    messages = Array.isArray(parsed) ? (parsed as UIMessage[]) : [];
  } catch {
    messages = [];
  }

  return Response.json({
    conversation: {
      id: row.id,
      title: row.title,
      updatedAt: row.updatedAt,
      messages,
    },
  });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await ctx.params;

  const [existing] = await db
    .select()
    .from(coachConversations)
    .where(
      and(
        eq(coachConversations.id, id),
        eq(coachConversations.userId, session.user.id)
      )
    )
    .limit(1);

  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const messagesPayload = (body as { messages?: UIMessage[] }).messages;
  const titleOverride = (body as { title?: string }).title?.trim();

  const hasMessages = Array.isArray(messagesPayload);
  if (!hasMessages && !titleOverride) {
    return Response.json(
      { error: "messages array and/or title required" },
      { status: 400 }
    );
  }

  let nextTitle = existing.title;
  if (titleOverride) {
    nextTitle = titleOverride.slice(0, 120);
  } else if (
    hasMessages &&
    (existing.title === "New chat" || existing.title.trim().length === 0)
  ) {
    const derived = deriveTitleFromMessages(messagesPayload!);
    if (derived) nextTitle = derived;
  }

  let messagesJson = existing.messages;
  if (hasMessages) {
    messagesJson = JSON.stringify(messagesPayload);
  }

  const now = new Date();
  await db
    .update(coachConversations)
    .set({
      messages: messagesJson,
      title: nextTitle,
      updatedAt: now,
    })
    .where(
      and(
        eq(coachConversations.id, id),
        eq(coachConversations.userId, session.user.id)
      )
    );

  return Response.json({
    conversation: {
      id,
      title: nextTitle,
      updatedAt: now.getTime(),
    },
  });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await ctx.params;

  const deleted = await db
    .delete(coachConversations)
    .where(
      and(
        eq(coachConversations.id, id),
        eq(coachConversations.userId, session.user.id)
      )
    )
    .returning({ id: coachConversations.id });

  if (deleted.length === 0) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return new Response(null, { status: 204 });
}
