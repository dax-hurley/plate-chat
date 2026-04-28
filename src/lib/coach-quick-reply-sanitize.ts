import { getToolName, isToolUIPart, type UIMessage } from "ai";

import {
  coerceQuickReplyToolInput,
  quickReplySuggestionsSchema,
} from "@/lib/coach-ui-only-tools";

const QUICK_REPLY_TOOL = "suggest_quick_replies" as const;

/**
 * Anthropic requires each tool_use `input` to be a valid object. Broken JSON or
 * invalid shapes from older turns (e.g. bad `\\u` escapes in emoji fields) 400 the API.
 */
export function repairSuggestQuickRepliesToolInputs(
  messages: UIMessage[]
): UIMessage[] {
  return messages.map((m) => {
    if (m.role !== "assistant" || m.parts == null || m.parts.length === 0) {
      return m;
    }
    let changed = false;
    const parts = m.parts.map((p) => {
      if (!isToolUIPart(p) || getToolName(p) !== QUICK_REPLY_TOOL) return p;
      if (quickReplySuggestionsSchema.safeParse(p.input).success) return p;
      const coerced = coerceQuickReplyToolInput(p.input);
      const parsed =
        coerced != null
          ? quickReplySuggestionsSchema.safeParse(coerced)
          : null;
      const nextInput = parsed?.success
        ? parsed.data
        : ({ suggestions: ["Continue"] } as const);
      changed = true;
      return { ...p, input: nextInput };
    });
    return changed ? { ...m, parts } : m;
  });
}
