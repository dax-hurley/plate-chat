import {
  convertToModelMessages,
  isToolUIPart,
  type SystemModelMessage,
  type ToolSet,
  type UIMessage,
} from "ai";

import {
  buildMealPlanRefinementContextAddendum,
  buildOnboardingCachableStem,
} from "@/prompts/onboarding-system-prompt";
import { getCoachSystemDateLine } from "@/prompts/coach-system-prompt";
import { ANTHROPIC_EPHEMERAL_SYSTEM_CACHE } from "@/lib/anthropic-prompt-cache";
import { formatProfileForCoachPrompt } from "@/lib/coach-profile-context";
import { createCoachAgentTools } from "@/lib/coach-agent/tools";
import { repairSuggestQuickRepliesToolInputs } from "@/lib/coach-quick-reply-sanitize";
import {
  onboardingMealRefinementCompleteTool,
  suggestQuickRepliesTool,
} from "@/lib/coach-ui-only-tools";
import * as profile from "@/lib/services/profile";

function createOnboardingTools(
  userId: string,
  options?: { mealPlanRefinement?: boolean }
): ToolSet {
  const base: ToolSet = {
    ...createCoachAgentTools(userId),
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

function dropUnusableOnboardingToolParts(messages: UIMessage[]): UIMessage[] {
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
 * the same composite coach tools as main chat. For meal-plan **refinement**, also registers
 * `suggest_quick_replies` and `onboarding_meal_refinement_complete`.
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
  const volatileLines = [getCoachSystemDateLine()];
  if (mode === "meal_plan" && options?.mealPlanRefinement) {
    volatileLines.push(buildMealPlanRefinementContextAddendum());
  }
  const volatileContent = volatileLines.filter((s) => s.length > 0).join("\n\n");

  const system: SystemModelMessage[] = [
    {
      role: "system",
      content: buildOnboardingCachableStem(mode, weekStartDayKey),
      providerOptions: ANTHROPIC_EPHEMERAL_SYSTEM_CACHE,
    },
    {
      role: "system",
      content: formatProfileForCoachPrompt(p),
      providerOptions: ANTHROPIC_EPHEMERAL_SYSTEM_CACHE,
    },
    {
      role: "system",
      content: volatileContent,
    },
  ];
  const modelId =
    process.env["ANTHROPIC_MODEL"]?.trim() || "claude-haiku-4-5";
  return { system, modelMessages, modelId, tools };
}
