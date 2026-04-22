import {
  TRAINLOG_TOOL_DEFINITIONS,
  type TrainlogToolName,
} from "@/lib/trainlog-tools/definitions";

const TRAINLOG_UI_BY_NAME = Object.fromEntries(
  TRAINLOG_TOOL_DEFINITIONS.map((d) => [
    d.name,
    { completionText: d.completionText, errorText: d.errorText },
  ])
) as Record<
  TrainlogToolName,
  { completionText: string; errorText: string }
>;

/** Coach-only tools (not in `TRAINLOG_TOOL_DEFINITIONS`). */
const EXTRA_COACH_TOOL_UI: Record<
  string,
  { completionText: string; errorText: string }
> = {
  suggest_quick_replies: {
    completionText: "Prepared quick replies",
    errorText: "Couldn't prepare quick replies",
  },
  tool_search_tool_bm25: {
    completionText: "Searched tools",
    errorText: "Couldn't search tools",
  },
};

function humanizeToolName(name: string) {
  return name.replace(/_/g, " ");
}

export type CoachToolUiCopy = {
  completionText: string;
  errorText: string;
};

/**
 * User-facing strings for the coach chat tool-call footer (success vs failure).
 */
export function getCoachToolUiCopy(toolName: string): CoachToolUiCopy {
  const trainlog = TRAINLOG_UI_BY_NAME[toolName as TrainlogToolName];
  if (trainlog) return trainlog;
  const extra = EXTRA_COACH_TOOL_UI[toolName];
  if (extra) return extra;
  const label = humanizeToolName(toolName);
  return {
    completionText: `${label} finished`,
    errorText: `${label} failed`,
  };
}
