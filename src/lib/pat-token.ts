import { createHash, randomBytes } from "node:crypto";

const PREFIX = "tlog_";

export function generatePatToken(): { raw: string; tokenHash: string } {
  const raw = `${PREFIX}${randomBytes(32).toString("base64url")}`;
  const tokenHash = hashPatToken(raw);
  return { raw, tokenHash };
}

export function hashPatToken(raw: string) {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}
