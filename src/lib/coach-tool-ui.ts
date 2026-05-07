import { getCoachAgentDataToolNamesSorted } from "@/lib/coach-agent/tool-names";

const COACH_DATA_UI = Object.fromEntries(
  getCoachAgentDataToolNamesSorted().map((name) => [
    name,
    {
      completionText: humanizeDone(name),
      errorText: `${humanize(name)} failed`,
    },
  ])
) as Record<string, { completionText: string; errorText: string }>;

function humanize(name: string) {
  return name.replace(/^coach_/, "").replace(/_/g, " ");
}

function humanizeDone(name: string) {
  const h = humanize(name);
  return h.charAt(0).toUpperCase() + h.slice(1) + " done";
}

const EXTRA_COACH_TOOL_UI: Record<
  string,
  { completionText: string; errorText: string }
> = {
  suggest_quick_replies: {
    completionText: "Prepared quick replies",
    errorText: "Couldn't prepare quick replies",
  },
  onboarding_meal_refinement_complete: {
    completionText: "Continuing setup",
    errorText: "Couldn't continue",
  },
};

export type CoachToolUiCopy = {
  completionText: string;
  errorText: string;
};

/**
 * User-facing strings for the coach chat tool-call footer (success vs failure).
 */
export function getCoachToolUiCopy(toolName: string): CoachToolUiCopy {
  const data = COACH_DATA_UI[toolName];
  if (data) return data;
  const extra = EXTRA_COACH_TOOL_UI[toolName];
  if (extra) return extra;
  const label = toolName.replace(/_/g, " ");
  return {
    completionText: `${label} finished`,
    errorText: `${label} failed`,
  };
}
