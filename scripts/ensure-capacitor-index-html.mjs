#!/usr/bin/env node
/**
 * TanStack Start + Nitro (`aws-lambda`) does not emit `index.html` in the client
 * output. For `CAPACITOR_WEB_BUILD`, we use Nitro `node-server`, then boot the
 * built server briefly and save the SSR HTML for `/` as `index.html` for Capacitor.
 *
 * Requires env compatible with `npm run build` (DATABASE_URL, AUTH_*, etc.).
 */
import { spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(root, ".output");
const pub = path.join(outputDir, "public");
const indexPath = path.join(pub, "index.html");

let nitroJson;
try {
  nitroJson = JSON.parse(
    await readFile(path.join(outputDir, "nitro.json"), "utf8"),
  );
} catch {
  nitroJson = null;
}

const preset = nitroJson?.preset;
if (preset !== "node-server") {
  if (!nitroJson) {
    throw new Error(
      `Missing or invalid ${path.relative(root, path.join(outputDir, "nitro.json"))}: run "npm run build" first (with CAPACITOR_WEB_BUILD=1 for Capacitor).`,
    );
  }
  throw new Error(
    `Nitro preset is "${preset}"; local SSR requires "node-server". Rebuild with CAPACITOR_WEB_BUILD=1 (see vite.config.mts), then run this script again. ` +
      `Do not run it after a default Lambda-target build.`,
  );
}

const port = 41230 + Math.floor(Math.random() * 800);

const child = spawn("node", ["./server/index.mjs"], {
  cwd: outputDir,
  env: {
    ...process.env,
    PORT: String(port),
    NITRO_HOST: "127.0.0.1",
    HOST: "127.0.0.1",
  },
  stdio: ["ignore", "pipe", "pipe"],
});

let stderr = "";
child.stderr?.on("data", (c) => {
  stderr += String(c);
});

async function fetchShellHtml() {
  const url = `http://127.0.0.1:${port}/`;
  for (let i = 0; i < 90; i++) {
    try {
      const res = await fetch(url, {
        headers: { "X-TSS_SHELL": "true" },
      });
      if (res.ok) {
        const html = await res.text();
        if (html.includes("<!DOCTYPE html") && html.includes("$_TSR")) {
          return html;
        }
      }
    } catch {
      /* server still starting */
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(
    `Timed out waiting for Nitro at ${url}. Server stderr:\n${stderr.slice(-4000)}`,
  );
}

try {
  const html = await fetchShellHtml();
  await writeFile(indexPath, html, "utf8");
  console.log(`Capacitor: wrote ${path.relative(root, indexPath)}`);
} finally {
  child.kill("SIGTERM");
  await new Promise((r) => setTimeout(r, 200));
}
