import { TRAINLOG_TOOL_DEFINITIONS } from "@/lib/trainlog-tools/definitions";

/** Every Trainlog tool name, sorted (for system prompt — schemas are deferred). */
export function getTrainlogToolNamesSorted(): string[] {
  return TRAINLOG_TOOL_DEFINITIONS.map((d) => d.name).sort((a, b) =>
    a.localeCompare(b)
  );
}

/**
 * Short system section: tool names only. Full JSON schemas are loaded via
 * `tool_search_tool_bm25` (except `suggest_quick_replies`, which stays loaded for UI chips).
 */
export function getCoachToolCatalogSystemSection(): string {
  const trainlog = getTrainlogToolNamesSorted();
  return [
    "Tool catalog: Trainlog tools are registered with deferred loading. Before calling a Trainlog tool, use `tool_search_tool_bm25` with a short natural-language query (e.g. \"meal plan shopping list\", \"log a set\") so the full definition is available. `suggest_quick_replies` is always loaded.",
    `Trainlog tool names: ${trainlog.join(", ")}.`,
  ].join("\n\n");
}
