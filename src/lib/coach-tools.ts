import { anthropic } from "@ai-sdk/anthropic";
import { tool } from "ai";
import { z } from "zod";

import { createSharedTrainlogTools } from "@/lib/trainlog-tools/coach-adapter";

const quickReplySuggestionsSchema = z.object({
  suggestions: z
    .array(
      z.object({
        text: z
          .string()
          .describe(
            "Plain tap-to-send line (max ~8 words, no emojis inside this string)."
          ),
        emoji: z
          .string()
          .optional()
          .describe(
            "One Unicode emoji for this chip (e.g. 💪 🍽️). Prefer setting on every row; vary when topics differ."
          ),
      })
    )
    .min(1)
    .describe(
      "1–8 short tap-to-send phrases (max ~8 words each, no numbering inside a string)."
    ),
});

/**
 * Trainlog tools for the AI coach: shared registry (`src/lib/trainlog-tools/`) plus
 * UI-only helpers that are not part of the MCP server.
 */
export function createCoachTools(userId: string) {
  return {
    /**
     * Anthropic tool search (BM25). Must stay non-deferred. Surfaces deferred Trainlog tools by reference.
     */
    tool_search_tool_bm25: anthropic.tools.toolSearchBm25_20251119(),

    ...createSharedTrainlogTools(userId),

    /**
     * UI-only: suggestions stream as tool arguments. The client renders chips and hides the normal tool row.
     */
    suggest_quick_replies: tool({
      description:
        "Emit tap-ready follow-up prompts for this turn. Call exactly once per coach reply, after your user-visible answer (and after any Trainlog data tools). Each element of `suggestions` is `{ text, emoji? }`: keep `text` emoji-free; set `emoji` on each row when possible (the UI prefixes each chip). Do not describe this tool in prose to the user.",
      inputSchema: quickReplySuggestionsSchema,
      execute: async ({ suggestions }) => {
        const cleaned = suggestions
          .map((s) => ({
            text: s.text.trim(),
            em:
              typeof s.emoji === "string" ? s.emoji.trim().slice(0, 8) : "",
          }))
          .filter((s) => s.text.length > 0)
          .slice(0, 8);
        const seed = cleaned.find((s) => s.em.length > 0)?.em ?? "";
        return {
          ok: true as const,
          count: cleaned.length,
          emoji: seed.length > 0 ? seed : "💬",
          suggestions: cleaned.map((s) => s.text),
        };
      },
    }),
  };
}
