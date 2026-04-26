import { createFileRoute } from "@tanstack/react-router";
import { and, eq } from "drizzle-orm";
import type { UIMessage } from "ai";

import { authenticateBearer } from "@/server/auth/device-tokens";
import { db } from "@/db/client";
import { coachConversations } from "@/db/schema";
import {
  coachContextCharStats,
  serializeModelMessagesForDebug,
  serializeToolSetForDebug,
} from "@/lib/coach-debug-serialize";
import { isCoachAiDebugEnabled } from "@/lib/coach-ai-debug";
import { getCoachModelInput } from "@/lib/coach-model-input";

async function handlePost({ request }: { request: Request }): Promise<Response> {
  const claims = await authenticateBearer(request);
  if (!claims) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isCoachAiDebugEnabled()) {
    return Response.json({ error: "Not available" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const conversationId = (body as { conversationId?: string }).conversationId?.trim();
  const messages = (body as { messages?: UIMessage[] }).messages;
  if (!conversationId || !Array.isArray(messages)) {
    return Response.json(
      { error: "conversationId and messages required" },
      { status: 400 }
    );
  }

  const userId = claims.userId;

  const [conv] = await db
    .select({ id: coachConversations.id })
    .from(coachConversations)
    .where(
      and(
        eq(coachConversations.id, conversationId),
        eq(coachConversations.userId, userId)
      )
    )
    .limit(1);

  if (!conv) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const { systemForDebug, modelMessages, modelId, tools } =
      await getCoachModelInput(userId, messages);
    const serializedMessages = serializeModelMessagesForDebug(modelMessages);
    const toolDefinitions = await serializeToolSetForDebug(tools);
    const contextStats = coachContextCharStats({
      system: systemForDebug,
      modelMessages: serializedMessages,
      toolDefinitions,
      tools,
    });
    return Response.json({
      system: systemForDebug,
      modelMessages: serializedMessages,
      toolDefinitions,
      contextStats,
      modelId,
    });
  } catch (error) {
    console.error("[coach/context-preview]", error);
    return Response.json(
      { error: "Failed to build preview" },
      { status: 500 }
    );
  }
}

export const Route = createFileRoute("/api/coach/context-preview")({
  server: {
    handlers: {
      POST: handlePost,
    },
  },
});
