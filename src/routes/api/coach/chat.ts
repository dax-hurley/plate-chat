import { createFileRoute } from "@tanstack/react-router";
import { anthropic } from "@ai-sdk/anthropic";
import { stepCountIs, streamText, type UIMessage } from "ai";
import { and, eq } from "drizzle-orm";

import { authenticateBearer } from "@/server/auth/device-tokens";
import { db } from "@/db/client";
import { coachConversations } from "@/db/schema";
import { isCoachAiDebugEnabled } from "@/lib/coach-ai-debug";
import { getCoachModelInput } from "@/lib/coach-model-input";

const USER_SAFE_ERROR = "Something went wrong.";

function debugErrorBody(detail: unknown): string | undefined {
  if (!isCoachAiDebugEnabled()) return undefined;
  if (detail == null) return undefined;
  if (typeof detail === "string") return detail.trim() || undefined;
  if (detail instanceof Error) return detail.message.trim() || undefined;
  const s = String(detail).trim();
  return s || undefined;
}

function clientErrorResponse(status: number, detail?: unknown) {
  const body = debugErrorBody(detail) ?? USER_SAFE_ERROR;
  const safe = body.length > 8000 ? `${body.slice(0, 8000)}…` : body;
  return new Response(safe, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

async function handlePost({ request }: { request: Request }): Promise<Response> {
  const claims = await authenticateBearer(request);
  if (!claims) return clientErrorResponse(401, "Not authenticated.");
  const userId = claims.userId;

  if (!process.env.ANTHROPIC_API_KEY) {
    return clientErrorResponse(
      503,
      "ANTHROPIC_API_KEY is not configured for coach chat."
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return clientErrorResponse(400, "Request body is not valid JSON.");
  }

  const messages = (body as { messages?: UIMessage[] }).messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return clientErrorResponse(400, "Body must include a non-empty messages array.");
  }

  const conversationId = (body as { id?: string }).id?.trim();
  if (!conversationId) {
    return clientErrorResponse(400, "Missing or empty conversation id.");
  }

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

  if (!conv) return clientErrorResponse(404, "Conversation not found.");

  try {
    const { system, modelMessages, modelId, tools } = await getCoachModelInput(
      userId,
      messages
    );

    const result = streamText({
      model: anthropic(modelId),
      system,
      messages: modelMessages,
      tools,
      stopWhen: stepCountIs(12),
    });

    const coachDebug = isCoachAiDebugEnabled();

    return result.toUIMessageStreamResponse({
      messageMetadata: ({ part }) => {
        if (!coachDebug) return undefined;
        if (part.type === "finish") {
          const u = part.totalUsage;
          return {
            coachAiUsage: {
              inputTokens: u.inputTokens,
              outputTokens: u.outputTokens,
              totalTokens: u.totalTokens,
            },
          };
        }
        if (part.type === "finish-step") {
          const u = part.usage;
          return {
            coachAiUsage: {
              inputTokens: u.inputTokens,
              outputTokens: u.outputTokens,
              totalTokens: u.totalTokens,
            },
          };
        }
        return undefined;
      },
      onError: (error) => {
        // Also invoked when formatting `tool-output-error` chunks (failed tool execute).
        console.error("[coach/chat] toUIMessageStream onError:", error);
        return coachDebug
          ? (debugErrorBody(error) ?? "Unknown stream error.")
          : USER_SAFE_ERROR;
      },
    });
  } catch (error) {
    console.error("[coach/chat] request error:", error);
    return clientErrorResponse(500, error);
  }
}

export const Route = createFileRoute("/api/coach/chat")({
  server: {
    handlers: {
      POST: handlePost,
    },
  },
});
