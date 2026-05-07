import {
  convertToModelMessages,
  isToolUIPart,
  type SystemModelMessage,
  type UIMessage,
} from "ai";

import { ANTHROPIC_EPHEMERAL_SYSTEM_CACHE } from "@/lib/anthropic-prompt-cache";
import { formatProfileForCoachPrompt } from "@/lib/coach-profile-context";
import { repairSuggestQuickRepliesToolInputs } from "@/lib/coach-quick-reply-sanitize";
import {
  getCoachCachableSystemPrefix,
  getCoachSystemDateLine,
} from "@/prompts/coach-system-prompt";
import { createCoachTools } from "@/lib/coach-tools";
import * as profile from "@/lib/services/profile";

/**
 * Tool parts in these states have no `tool_result` in the model transcript (see
 * `convertToModelMessages` in the AI SDK) but would still emit `tool_call`, which
 * Anthropic rejects.
 */
const TOOL_STATES_OMITTED_FROM_MODEL: ReadonlySet<string> = new Set([
  "input-streaming",
  "input-available",
  "approval-requested",
  "approval-responded",
]);

/**
 * Drop tool invocations that cannot be round-tripped to Anthropic, e.g. after a
 * reload while approval was pending or mid-stream.
 */
function dropUnusableCoachToolParts(messages: UIMessage[]): UIMessage[] {
  return messages
    .map((m) => {
      if (m.role !== "assistant" || m.parts == null || m.parts.length === 0) {
        return m;
      }
      const parts = m.parts.filter((p) => {
        if (!isToolUIPart(p)) return true;
        return !TOOL_STATES_OMITTED_FROM_MODEL.has(p.state);
      });
      if (parts.length === m.parts.length) return m;
      if (parts.length > 0) {
        return { ...m, parts };
      }
      return null;
    })
    .filter((m): m is UIMessage => m != null);
}

/** Flattens multi-block coach system for debug/char stats (no provider options). */
export function flattenCoachSystemForDebug(
  system: string | SystemModelMessage | SystemModelMessage[]
): string {
  if (typeof system === "string") return system;
  const parts = Array.isArray(system) ? system : [system];
  return parts.map((m) => m.content).join("\n\n");
}

/**
 * Builds system messages (static prefix cached) + model messages the coach chat route sends to the LLM.
 */
export async function getCoachModelInput(userId: string, messages: UIMessage[]) {
  const tools = createCoachTools(userId);
  const sanitized = repairSuggestQuickRepliesToolInputs(
    dropUnusableCoachToolParts(messages)
  );
  const modelMessages = await convertToModelMessages(
    sanitized.map(({ id, ...rest }) => {
      void id;
      return rest;
    }),
    {
      tools,
      ignoreIncompleteToolCalls: true,
    }
  );
  const profileBundle = await profile.getProfileForUser(userId);
  /** Stable per request except profile edits — second cache tier after global prefix. */
  const system: [SystemModelMessage, SystemModelMessage, SystemModelMessage] = [
    {
      role: "system",
      content: getCoachCachableSystemPrefix(),
      providerOptions: ANTHROPIC_EPHEMERAL_SYSTEM_CACHE,
    },
    {
      role: "system",
      content: formatProfileForCoachPrompt(profileBundle),
      providerOptions: ANTHROPIC_EPHEMERAL_SYSTEM_CACHE,
    },
    {
      role: "system",
      content: getCoachSystemDateLine(),
    },
  ];
  const systemForDebug = flattenCoachSystemForDebug(system);
  const modelId =
    process.env["ANTHROPIC_MODEL"]?.trim() || "claude-haiku-4-5";
  return { system, systemForDebug, modelMessages, modelId, tools };
}
