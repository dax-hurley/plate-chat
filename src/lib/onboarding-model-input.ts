import { anthropic } from "@ai-sdk/anthropic";
import {
  convertToModelMessages,
  isToolUIPart,
  type ToolSet,
  type UIMessage,
} from "ai";

import {
  buildMealPlanRefinementContextAddendum,
  buildOnboardingContextBlock,
} from "@/prompts/onboarding-system-prompt";
import { getCoachSystemDateLine } from "@/prompts/coach-system-prompt";
import { repairSuggestQuickRepliesToolInputs } from "@/lib/coach-quick-reply-sanitize";
import {
  onboardingMealRefinementCompleteTool,
  suggestQuickRepliesTool,
} from "@/lib/coach-ui-only-tools";
import { createSharedTrainlogTools } from "@/lib/trainlog-tools/coach-adapter";
import * as profile from "@/lib/services/profile";

/**
 * Anthropic requires at least one non-deferred tool. Coach uses the same BM25
 * tool so deferred data tools can be discovered by reference.
 */
function createOnboardingTools(
  userId: string,
  options?: { mealPlanRefinement?: boolean }
): ToolSet {
  const base: ToolSet = {
    tool_search_tool_bm25: anthropic.tools.toolSearchBm25_20251119(),
    ...createSharedTrainlogTools(userId),
  };
  if (options?.mealPlanRefinement) {
    return {
      ...base,
      suggest_quick_replies: suggestQuickRepliesTool,
      onboarding_meal_refinement_complete: onboardingMealRefinementCompleteTool,
    };
  }
  return base;
}

const TOOL_STATES_OMITTED_FROM_MODEL: ReadonlySet<string> = new Set([
  "input-streaming",
  "input-available",
  "approval-requested",
  "approval-responded",
]);

function dropUnusableOnboardingToolParts(
  messages: UIMessage[]
): UIMessage[] {
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

/**
 * System + model messages for the onboarding AI (meal plan or workout), using
 * the same data tool registry as the coach. For meal-plan **refinement**, also registers
 * `suggest_quick_replies` and `onboarding_meal_refinement_complete` (UI/flow: advance when the user is done).
 */
export async function getOnboardingModelInput(
  userId: string,
  mode: "meal_plan" | "workout",
  weekStartDayKey: string,
  messages: UIMessage[],
  options?: { mealPlanRefinement?: boolean }
) {
  const tools = createOnboardingTools(userId, {
    mealPlanRefinement: options?.mealPlanRefinement,
  });
  const sanitized = repairSuggestQuickRepliesToolInputs(
    dropUnusableOnboardingToolParts(messages)
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
  const p = await profile.getProfileForUser(userId);
  const system = [
    getCoachSystemDateLine(),
    "",
    buildOnboardingContextBlock(p, mode, weekStartDayKey),
    mode === "meal_plan" && options?.mealPlanRefinement
      ? buildMealPlanRefinementContextAddendum()
      : "",
  ].join("\n");
  const modelId =
    process.env["ANTHROPIC_MODEL"]?.trim() || "claude-haiku-4-5";
  return { system, modelMessages, modelId, tools };
}
