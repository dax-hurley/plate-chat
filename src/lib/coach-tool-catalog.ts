import { APP_BRAND_NAME } from "@/lib/brand";
import { TRAINLOG_TOOL_DEFINITIONS } from "@/lib/trainlog-tools/definitions";

/** Every data tool name, sorted (for system prompt overview). */
export function getTrainlogToolNamesSorted(): string[] {
  return TRAINLOG_TOOL_DEFINITIONS.map((d) => d.name).sort((a, b) =>
    a.localeCompare(b)
  );
}

/**
 * Short system section: tool names only. Full argument schemas are supplied to the model with each request.
 */
export function getCoachToolCatalogSystemSection(): string {
  const names = getTrainlogToolNamesSorted();
  return [
    `Tool catalog: call ${APP_BRAND_NAME} data tools by name when you need them (see names below). Prefer the right tool rather than guessing.`,
    `${APP_BRAND_NAME} data tool names: ${names.join(", ")}.`,
  ].join("\n\n");
}
