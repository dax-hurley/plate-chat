import { APP_BRAND_NAME } from "@/lib/brand";
import { TRAINLOG_TOOL_DEFINITIONS } from "@/lib/trainlog-tools/definitions";

/** Every data tool name, sorted (for system prompt — schemas are deferred). */
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
  const names = getTrainlogToolNamesSorted();
  return [
    `Tool catalog: ${APP_BRAND_NAME} data tools are registered with deferred loading. Before calling a data tool, use \`tool_search_tool_bm25\` with a short natural-language query (e.g. "meal plan shopping list", "log a set") so the full definition is available. \`suggest_quick_replies\` is always loaded.`,
    `${APP_BRAND_NAME} data tool names: ${names.join(", ")}.`,
  ].join("\n\n");
}
