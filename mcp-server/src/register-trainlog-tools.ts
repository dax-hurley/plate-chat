import type { McpServer, ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AnySchema } from "@modelcontextprotocol/sdk/server/zod-compat.js";

import {
  isEmptyToolInputSchema,
  TRAINLOG_TOOL_DEFINITIONS,
} from "../../src/lib/trainlog-tools/definitions.js";
import {
  type McpApiFn,
  runTrainlogToolMcp,
} from "../../src/lib/trainlog-tools/mcp-http.js";

export function registerTrainlogMcpTools(
  server: McpServer,
  api: McpApiFn,
  textResult: (data: unknown) => {
    content: { type: "text"; text: string }[];
  }
) {
  for (const def of TRAINLOG_TOOL_DEFINITIONS) {
    const name = def.name;
    if (isEmptyToolInputSchema(def.inputSchema)) {
      server.registerTool(name, { description: def.description }, async () =>
        textResult(await runTrainlogToolMcp(name, api, {}))
      );
    } else {
      server.registerTool(
        name,
        {
          description: def.description,
          inputSchema: def.inputSchema as AnySchema,
        },
        (async (args: unknown, _extra: unknown) =>
          textResult(await runTrainlogToolMcp(name, api, args))) as ToolCallback<AnySchema>
      );
    }
  }
}
