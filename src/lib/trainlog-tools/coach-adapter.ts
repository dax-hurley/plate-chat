import { tool, type ToolSet } from "ai";

import { TRAINLOG_TOOL_DEFINITIONS } from "./definitions";
import { runTrainlogToolInline } from "./inline-executors";

/**
 * AI SDK tools for the in-app coach: shared names, descriptions, and Zod schemas
 * with in-process execution (signed-in user).
 */
export function createSharedTrainlogTools(userId: string): ToolSet {
  return TRAINLOG_TOOL_DEFINITIONS.reduce<ToolSet>((acc, def) => {
    acc[def.name] = tool({
      description: def.description,
      inputSchema: def.inputSchema,
      execute: async (input: unknown) =>
        runTrainlogToolInline(def.name, userId, input),
    });
    return acc;
  }, {} as ToolSet);
}
