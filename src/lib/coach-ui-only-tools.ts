import { tool } from "ai";
import { z } from "zod";

import { APP_BRAND_NAME } from "./brand";
import { splitLeadingEmoji } from "./quick-reply-split";

export const quickReplySuggestionsSchema = z.object({
  suggestions: z
    .array(
      z
        .string()
        .min(1)
        .max(240)
        .describe(
          "One tap-to-send line (max ~8 words). Optionally start with one real UTF-8 emoji and a space (e.g. \"💪 Upper/Lower split\"). Put emoji inside this string only — never use \\\\u JSON escapes for emoji."
        )
    )
    .min(1)
    .max(8)
    .describe(
      "1–8 short follow-up chips. Prefer 2–4. No numbering inside a string."
    ),
});

/**
 * Coerce persisted or legacy quick-reply tool `input` into `{ suggestions: string[] }`.
 * Handles the old `{ suggestions: [{ text, emoji? }] }` shape and plain string arrays.
 */
export function coerceQuickReplyToolInput(
  raw: unknown
): { suggestions: string[] } | null {
  if (!raw || typeof raw !== "object") return null;
  const arr = (raw as { suggestions?: unknown }).suggestions;
  if (!Array.isArray(arr) || arr.length === 0) return null;
  const out: string[] = [];
  for (const x of arr) {
    if (typeof x === "string") {
      const t = x.trim();
      if (t) out.push(t);
    } else if (
      x &&
      typeof x === "object" &&
      typeof (x as { text?: unknown }).text === "string"
    ) {
      const text = String((x as { text: string }).text).trim();
      if (!text) continue;
      const em =
        typeof (x as { emoji?: unknown }).emoji === "string"
          ? String((x as { emoji: string }).emoji).trim().slice(0, 8)
          : "";
      out.push(em ? `${em} ${text}` : text);
    }
  }
  if (out.length === 0) return null;
  return { suggestions: out.slice(0, 8) };
}

/**
 * UI-only: tool arguments stream to the client. No server DB — safe to import from client code.
 * Reused by the full coach tool registry in `coach-tools.ts`.
 */
export const suggestQuickRepliesTool = tool({
  description: `Emit tap-ready follow-up prompts for this turn. Call exactly once per coach reply, after your user-visible answer (and after any ${APP_BRAND_NAME} data tools). \`suggestions\` is a JSON array of strings only. Each string may start with one literal emoji and a space, then plain words (max ~8 words). Never put emoji in a separate object field and never use \\\\u escapes for emoji — that breaks JSON. Do not describe this tool in prose to the user.`,
  inputSchema: quickReplySuggestionsSchema,
  providerOptions: {
    anthropic: { cacheControl: { type: "ephemeral" } },
  },
  execute: async ({ suggestions }) => {
    const cleaned = suggestions.map((s) => s.trim()).filter((s) => s.length > 0).slice(0, 8);
    const seed =
      cleaned.map((s) => splitLeadingEmoji(s).emoji).find((e) => e.length > 0) ??
      "";
    return {
      ok: true as const,
      count: cleaned.length,
      emoji: seed.length > 0 ? seed : "💬",
      suggestions: cleaned,
    };
  },
});

export const ONBOARDING_MEAL_REFINEMENT_COMPLETE_TOOL =
  "onboarding_meal_refinement_complete" as const;

/**
 * Onboarding only (meal plan refinement). Client listens for a successful result and advances the flow.
 * Import from this module in client code — not from `coach-tools.ts` (which pulls in server DB).
 */
export const onboardingMealRefinementCompleteTool = tool({
  description:
    "Call **once** when the user is finished adjusting this week’s meal plan and ready to move on in setup. Use when they express satisfaction, say they are done, want to continue, or equivalent—**after** your brief acknowledgment, and only after any meal-plan data tools. Do **not** call while they still want changes or you still owe edits. Do not mention this tool to the user.",
  inputSchema: z.object({}),
  execute: async () =>
    ({ ok: true as const, proceed: true as const } as const),
});
