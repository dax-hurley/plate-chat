import { getCoachAgentDataToolNamesSorted } from "@/lib/coach-agent/tool-names";

/** Tools that stay in the Anthropic prefix (heuristic for debug UI). */
const IMMEDIATE_TOOL_NAMES = new Set([
  "suggest_quick_replies",
  "onboarding_meal_refinement_complete",
]);

export type CoachContextPreviewPayload = {
  system?: string;
  modelMessages?: unknown;
  toolDefinitions?: unknown;
  contextStats?: {
    systemChars?: number;
    modelMessagesChars?: number;
    toolsChars?: number;
    totalChars?: number;
    approxInputTokens?: number;
    prefixToolsChars?: number;
    deferredCatalogChars?: number;
    approxPrefixOnlyTokens?: number;
    immediateToolNames?: string[];
    deferredToolNames?: string[];
  };
  modelId?: string;
};

/**
 * Fills in prefix/deferred stats when the context-preview API returns an older/partial
 * `contextStats` (e.g. stale deploy) but includes `toolDefinitions`.
 */
export function enrichCoachContextPreviewPayload(
  payload: CoachContextPreviewPayload | null
): CoachContextPreviewPayload | null {
  if (payload == null) return null;
  const defs = payload.toolDefinitions;
  if (!Array.isArray(defs)) return payload;

  const dataTools = new Set(getCoachAgentDataToolNamesSorted());
  const namedDefs = defs.filter(
    (d): d is { name: string } =>
      d != null &&
      typeof d === "object" &&
      typeof (d as { name?: unknown }).name === "string"
  );

  const prefixDefs = namedDefs.filter((d) => IMMEDIATE_TOOL_NAMES.has(d.name));
  const deferredDefs = namedDefs.filter((d) => dataTools.has(d.name));
  const prefixToolsChars = JSON.stringify(prefixDefs).length;
  const deferredCatalogChars = JSON.stringify(deferredDefs).length;
  const immediateSorted = [...IMMEDIATE_TOOL_NAMES].sort((a, b) =>
    a.localeCompare(b)
  );
  const deferredSorted = getCoachAgentDataToolNamesSorted();

  const raw = payload.contextStats;
  const systemChars = raw?.systemChars ?? 0;
  const modelMessagesChars = raw?.modelMessagesChars ?? 0;
  const prefixTotalChars = systemChars + modelMessagesChars + prefixToolsChars;

  const needNames =
    raw?.immediateToolNames == null ||
    raw.immediateToolNames.length === 0 ||
    raw?.deferredToolNames == null ||
    raw.deferredToolNames.length === 0;

  const needChars =
    raw?.prefixToolsChars == null ||
    raw?.deferredCatalogChars == null ||
    raw?.approxPrefixOnlyTokens == null;

  if (!needNames && !needChars) return payload;

  return {
    ...payload,
    contextStats: {
      ...raw,
      ...(needChars
        ? {
            prefixToolsChars: raw?.prefixToolsChars ?? prefixToolsChars,
            deferredCatalogChars: raw?.deferredCatalogChars ?? deferredCatalogChars,
            approxPrefixOnlyTokens:
              raw?.approxPrefixOnlyTokens ??
              Math.ceil(prefixTotalChars / 4),
          }
        : {}),
      ...(needNames
        ? {
            immediateToolNames:
              raw?.immediateToolNames != null &&
              raw.immediateToolNames.length > 0
                ? raw.immediateToolNames
                : immediateSorted,
            deferredToolNames:
              raw?.deferredToolNames != null && raw.deferredToolNames.length > 0
                ? raw.deferredToolNames
                : deferredSorted,
          }
        : {}),
    },
  };
}
