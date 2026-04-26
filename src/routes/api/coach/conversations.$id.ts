import { createFileRoute } from "@tanstack/react-router";
import { and, eq } from "drizzle-orm";
import type { UIMessage } from "ai";

import { authenticateBearer } from "@/server/auth/device-tokens";
import { db } from "@/db/client";
import { coachConversations } from "@/db/schema";

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

async function handleGet({
  request,
  params,
}: {
  request: Request;
  params: { id: string };
}): Promise<Response> {
  const claims = await authenticateBearer(request);
  if (!claims) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = params;

  const [row] = await db
    .select()
    .from(coachConversations)
    .where(
      and(
        eq(coachConversations.id, id),
        eq(coachConversations.userId, claims.userId)
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

async function handlePatch({
  request,
  params,
}: {
  request: Request;
  params: { id: string };
}): Promise<Response> {
  const claims = await authenticateBearer(request);
  if (!claims) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = params;

  const [existing] = await db
    .select()
    .from(coachConversations)
    .where(
      and(
        eq(coachConversations.id, id),
        eq(coachConversations.userId, claims.userId)
      )
    )
    .limit(1);

  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
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
        eq(coachConversations.userId, claims.userId)
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

async function handleDelete({
  request,
  params,
}: {
  request: Request;
  params: { id: string };
}): Promise<Response> {
  const claims = await authenticateBearer(request);
  if (!claims) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = params;

  const deleted = await db
    .delete(coachConversations)
    .where(
      and(
        eq(coachConversations.id, id),
        eq(coachConversations.userId, claims.userId)
      )
    )
    .returning({ id: coachConversations.id });

  if (deleted.length === 0) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return new Response(null, { status: 204 });
}

export const Route = createFileRoute("/api/coach/conversations/$id")({
  server: {
    handlers: {
      GET: handleGet,
      PATCH: handlePatch,
      DELETE: handleDelete,
    },
  },
});
