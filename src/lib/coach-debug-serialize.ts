import { asSchema, type ModelMessage, type ToolSet } from "ai";

function safeJsonClone(value: unknown): unknown {
  try {
    return JSON.parse(
      JSON.stringify(value, (_k, v) =>
        typeof v === "bigint" ? v.toString() : v
      )
    );
  } catch {
    return String(value);
  }
}

export function serializeModelMessagesForDebug(
  messages: ModelMessage[]
): unknown {
  return safeJsonClone(messages);
}

/** What the provider receives for each tool: name, description, and JSON Schema for arguments (large). */
export type CoachToolDefinitionDebug = {
  name: string;
  title?: string;
  description?: string;
  inputJsonSchema: unknown;
};

/**
 * Which tools Anthropic loads in the initial prefix vs deferred (schemas omitted until search / reference).
 * Provider tools (e.g. `tool_search_tool_bm25`) are always immediate.
 */
export function summarizeCoachToolDeferFlags(tools: ToolSet): {
  immediateToolNames: string[];
  deferredToolNames: string[];
} {
  const immediateToolNames: string[] = [];
  const deferredToolNames: string[] = [];
  for (const [name, t] of Object.entries(tools)) {
    const typed = t as {
      type?: string;
      providerOptions?: { anthropic?: { deferLoading?: boolean } };
    };
    if (typed.type === "provider") {
      immediateToolNames.push(name);
      continue;
    }
    if (typed.providerOptions?.anthropic?.deferLoading === true) {
      deferredToolNames.push(name);
    } else {
      immediateToolNames.push(name);
    }
  }
  immediateToolNames.sort((a, b) => a.localeCompare(b));
  deferredToolNames.sort((a, b) => a.localeCompare(b));
  return { immediateToolNames, deferredToolNames };
}

export async function serializeToolSetForDebug(
  tools: ToolSet
): Promise<CoachToolDefinitionDebug[]> {
  const out: CoachToolDefinitionDebug[] = [];
  for (const [name, t] of Object.entries(tools)) {
    const schema = asSchema(t.inputSchema);
    const inputJsonSchema = await Promise.resolve(schema.jsonSchema);
    out.push({
      name,
      title: t.title,
      description: t.description,
      inputJsonSchema,
    });
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

export type CoachContextCharStats = {
  systemChars: number;
  modelMessagesChars: number;
  /** Full JSON size of all tool definitions (debug; see prefix vs deferred). */
  toolsChars: number;
  totalChars: number;
  /** Heuristic only; provider caching and billing rules differ. */
  approxInputTokens: number;
  /** Serialized size of tools that stay in the Anthropic *prefix* (non-deferred). */
  prefixToolsChars: number;
  /** Serialized size of deferred tools (typically not in initial prefix until discovered). */
  deferredCatalogChars: number;
  /** Rough tokens if only prefix tools + system + messages counted (closer to first-turn prefix). */
  approxPrefixOnlyTokens: number;
  immediateToolNames: string[];
  deferredToolNames: string[];
};

/** Rough size breakdown (chars; ~÷4 for token order-of-magnitude). */
export function coachContextCharStats(options: {
  system: string;
  modelMessages: unknown;
  toolDefinitions: CoachToolDefinitionDebug[];
  tools: ToolSet;
}): CoachContextCharStats {
  const { system, modelMessages, toolDefinitions, tools } = options;
  const { immediateToolNames, deferredToolNames } =
    summarizeCoachToolDeferFlags(tools);
  const immediateSet = new Set(immediateToolNames);
  const deferredSet = new Set(deferredToolNames);
  const prefixDefs = toolDefinitions.filter((d) => immediateSet.has(d.name));
  const deferredDefs = toolDefinitions.filter((d) => deferredSet.has(d.name));
  const modelMessagesChars = JSON.stringify(modelMessages).length;
  const toolsChars = JSON.stringify(toolDefinitions).length;
  const prefixToolsChars = JSON.stringify(prefixDefs).length;
  const deferredCatalogChars = JSON.stringify(deferredDefs).length;
  const systemChars = system.length;
  const totalChars = systemChars + modelMessagesChars + toolsChars;
  const prefixTotalChars =
    systemChars + modelMessagesChars + prefixToolsChars;
  return {
    systemChars,
    modelMessagesChars,
    toolsChars,
    totalChars,
    approxInputTokens: Math.ceil(totalChars / 4),
    prefixToolsChars,
    deferredCatalogChars,
    approxPrefixOnlyTokens: Math.ceil(prefixTotalChars / 4),
    immediateToolNames,
    deferredToolNames,
  };
}
