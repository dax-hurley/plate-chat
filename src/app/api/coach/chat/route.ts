import { anthropic } from "@ai-sdk/anthropic";
import { stepCountIs, streamText, type UIMessage } from "ai";
import { and, eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db/client";
import { coachConversations } from "@/db/schema";
import { isCoachAiDebugEnabled } from "@/lib/coach-ai-debug";
import { getCoachModelInput } from "@/lib/coach-model-input";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

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
  const body =
    debugErrorBody(detail) ?? USER_SAFE_ERROR;
  const safe =
    body.length > 8000 ? `${body.slice(0, 8000)}…` : body;
  return new Response(safe, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return clientErrorResponse(401, "Not authenticated.");
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("[coach/chat] ANTHROPIC_API_KEY is not configured");
    return clientErrorResponse(
      503,
      "ANTHROPIC_API_KEY is not configured for coach chat."
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return clientErrorResponse(400, "Request body is not valid JSON.");
  }

  const messages = (body as { messages?: UIMessage[] }).messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return clientErrorResponse(
      400,
      "Body must include a non-empty messages array."
    );
  }

  const conversationId = (body as { id?: string }).id?.trim();
  if (!conversationId) {
    return clientErrorResponse(400, "Missing or empty conversation id (id).");
  }

  const userId = session.user.id;

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
    return clientErrorResponse(
      404,
      `No coach conversation found for id "${conversationId}".`
    );
  }

  try {
    const { systemWithProfile, modelMessages, modelId, tools } =
      await getCoachModelInput(userId, messages);

    const coachDebug = isCoachAiDebugEnabled();

    const result = streamText({
      model: anthropic(modelId),
      system: systemWithProfile,
      messages: modelMessages,
      tools,
      stopWhen: stepCountIs(24),
    });

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
        console.error("[coach/chat] stream error:", error);
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
