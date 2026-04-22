import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { registerTrainlogMcpTools } from "./register-trainlog-tools.js";

const base = (process.env.WORKOUT_APP_BASE_URL ?? "http://localhost:3000").replace(
  /\/$/,
  ""
);
const token = process.env.WORKOUT_APP_TOKEN ?? "";

function textResult(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text:
          typeof data === "string"
            ? data
            : JSON.stringify(data, null, 2),
      },
    ],
  };
}

async function api(method: string, path: string, body?: unknown) {
  if (!token) throw new Error("WORKOUT_APP_TOKEN is not set");
  const r = await fetch(`${base}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const raw = await r.text();
  let parsed: unknown = raw;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    /* keep text */
  }
  if (!r.ok) {
    throw new Error(
      `HTTP ${r.status}: ${typeof parsed === "string" ? parsed : JSON.stringify(parsed)}`
    );
  }
  return parsed;
}

const server = new McpServer({
  name: "trainlog",
  version: "1.0.0",
});

registerTrainlogMcpTools(server, api, textResult);

async function main() {
  if (!token) {
    console.error("WORKOUT_APP_TOKEN is required");
    process.exit(1);
  }
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
