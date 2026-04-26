import { tool } from "ai";
import { z } from "zod";

import { APP_BRAND_NAME } from "./brand";

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
 * UI-only: tool arguments stream to the client. No server DB — safe to import from client code.
 * Reused by the full coach tool registry in `coach-tools.ts`.
 */
export const suggestQuickRepliesTool = tool({
  description: `Emit tap-ready follow-up prompts for this turn. Call exactly once per coach reply, after your user-visible answer (and after any ${APP_BRAND_NAME} data tools). Each element of \`suggestions\` is \`{ text, emoji? }\`: keep \`text\` emoji-free; set \`emoji\` on each row when possible (the UI prefixes each chip). Do not describe this tool in prose to the user.`,
  inputSchema: quickReplySuggestionsSchema,
  providerOptions: {
    anthropic: { cacheControl: { type: "ephemeral" } },
  },
  execute: async ({ suggestions }) => {
    const cleaned = suggestions
      .map((s) => ({
        text: s.text.trim(),
        em: typeof s.emoji === "string" ? s.emoji.trim().slice(0, 8) : "",
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
