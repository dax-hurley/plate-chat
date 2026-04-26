import { createFileRoute } from "@tanstack/react-router";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

import { buildConversationTitlePrompt } from "@/prompts/conversation-title-prompt";
import { authenticateBearer } from "@/server/auth/device-tokens";

type SimpleMsg = { role: string; text: string };

function transcript(messages: SimpleMsg[], maxChars = 12000) {
  const lines = messages.map((m) => `${m.role}: ${m.text}`);
  let s = lines.join("\n\n");
  if (s.length > maxChars) s = s.slice(-maxChars);
  return s;
}

function clampTitle(s: string): string {
  const t = s.replace(/\s+/g, " ").trim().slice(0, 72);
  return t || "Chat";
}

async function handlePost({ request }: { request: Request }): Promise<Response> {
  const claims = await authenticateBearer(request);
  if (!claims) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const messages = (body as { messages?: SimpleMsg[] }).messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "messages required" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    const firstUser = messages.find(
      (m) => m.role === "user" && m.text?.trim()
    );
    return Response.json({
      title: clampTitle(firstUser?.text ?? "Chat"),
    });
  }

  const modelId =
    process.env.ANTHROPIC_QUICK_MODEL?.trim() ||
    process.env.ANTHROPIC_MODEL?.trim() ||
    "claude-haiku-4-5";

  try {
    const { text } = await generateText({
      model: anthropic(modelId),
      prompt: buildConversationTitlePrompt(transcript(messages)),
      maxOutputTokens: 80,
    });

    const trimmed = text
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "");
    const parsed = JSON.parse(trimmed) as { title?: unknown };
    const raw = parsed.title;
    const title =
      typeof raw === "string" ? clampTitle(raw) : clampTitle(trimmed);
    return Response.json({ title });
  } catch {
    const firstUser = messages.find(
      (m) => m.role === "user" && m.text?.trim()
    );
    return Response.json({
      title: clampTitle(firstUser?.text ?? "Chat"),
    });
  }
}

export const Route = createFileRoute("/api/coach/conversation-title")({
  server: {
    handlers: {
      POST: handlePost,
    },
  },
});
