import type { SystemModelMessage } from "ai";

/**
 * Anthropic prompt cache (ephemeral). Re-use large, stable system prefixes across
 * turns in the same conversation; cached tokens are billed at a lower input rate
 * on cache hits after the first request.
 *
 * Haiku 4.x allows at most **4** cache breakpoints per request — do not add
 * per-tool `cacheControl` (each tool counts). Two system blocks here + tools
 * must stay under the limit.
 */
export const ANTHROPIC_EPHEMERAL_SYSTEM_CACHE: NonNullable<
  SystemModelMessage["providerOptions"]
> = {
  anthropic: { cacheControl: { type: "ephemeral" } },
};
