/**
 * Load env files before any module reads `process.env` (e.g. `@/db/client`).
 * Mirrors Next.js: `.env` then `.env.local` (local overrides).
 * `import "dotenv/config"` alone only loads `.env`, not `.env.local`.
 */
import { config } from "dotenv";
import { resolve } from "node:path";

const root = process.cwd();
config({ path: resolve(root, ".env") });
config({ path: resolve(root, ".env.local") });
