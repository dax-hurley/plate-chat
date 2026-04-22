import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

import { auth } from "@/auth";

export const runtime = "nodejs";
export const maxDuration = 30;

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

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const messages = (body as { messages?: SimpleMsg[] }).messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "messages required" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    const firstUser = messages.find((m) => m.role === "user" && m.text?.trim());
    return Response.json({
      title: clampTitle(firstUser?.text ?? "Chat"),
    });
  }

  const modelId =
    process.env.ANTHROPIC_QUICK_MODEL?.trim() ||
    process.env.ANTHROPIC_MODEL?.trim() ||
    "claude-haiku-4-5";

  const prompt = `Here is a fitness coaching chat between a user and an assistant:

${transcript(messages)}

Write a short conversation title (max 8 words) that captures the main topic. No quotes, no trailing punctuation, no "Chat about".

Return ONLY valid JSON: {"title":"..."}`;

  try {
    const { text } = await generateText({
      model: anthropic(modelId),
      prompt,
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
    const firstUser = messages.find((m) => m.role === "user" && m.text?.trim());
    return Response.json({
      title: clampTitle(firstUser?.text ?? "Chat"),
    });
  }
}
