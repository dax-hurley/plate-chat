import { createCoachAgentTools } from "@/lib/coach-agent/tools";
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
 * App data tools for the AI coach (composite `coach_*` tools) plus UI-only helpers.
 *
 * **Do not import this module from client components** — it pulls in server DB code.
 * For UI-only tool definitions, import from `@/lib/coach-ui-only-tools`.
 */
export function createCoachTools(userId: string) {
  return {
    ...createCoachAgentTools(userId),
    suggest_quick_replies: suggestQuickRepliesTool,
  };
}
