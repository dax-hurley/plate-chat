import { anthropic } from "@ai-sdk/anthropic";

import { createSharedTrainlogTools } from "@/lib/trainlog-tools/coach-adapter";

import {
  onboardingMealRefinementCompleteTool,
  ONBOARDING_MEAL_REFINEMENT_COMPLETE_TOOL,
  suggestQuickRepliesTool,
} from "@/lib/coach-ui-only-tools";

export {
  ONBOARDING_MEAL_REFINEMENT_COMPLETE_TOOL,
  onboardingMealRefinementCompleteTool,
  suggestQuickRepliesTool,
} from "@/lib/coach-ui-only-tools";

/**
 * App data tools for the AI coach: shared registry (`src/lib/trainlog-tools/`) plus
 * UI-only helpers that are not part of the shared trainlog data tools.
 *
 * **Do not import this module from client components** — it pulls in server DB code via
 * `createSharedTrainlogTools`. For UI-only tool definitions, import from `@/lib/coach-ui-only-tools`.
 */
export function createCoachTools(userId: string) {
  return {
    /**
     * Anthropic tool search (BM25). Must stay non-deferred. Surfaces deferred data tools by reference.
     */
    tool_search_tool_bm25: anthropic.tools.toolSearchBm25_20251119(),

    ...createSharedTrainlogTools(userId),

    /**
     * UI-only: suggestions stream as tool arguments. The client renders chips and hides the normal tool row.
     */
    suggest_quick_replies: suggestQuickRepliesTool,
  };
}
