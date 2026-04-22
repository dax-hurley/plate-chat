import { z } from "zod";

/**
 * Columns every synced row carries. The server owns `updatedAt` and `rev` on
 * write — clients send them as hints (used for LWW) but the response contains
 * the authoritative values.
 */
export const syncColumnsSchema = z.object({
  updatedAt: z.number().int().nonnegative(),
  deletedAt: z.number().int().nonnegative().nullable(),
  rev: z.number().int().nonnegative(),
});
export type SyncColumns = z.infer<typeof syncColumnsSchema>;

/** Fragment of RxDB JSON schema `properties` block for sync columns. */
export const rxSyncProps = {
  updatedAt: { type: "integer", minimum: 0, maximum: 32503680000000 },
  deletedAt: { type: ["integer", "null"], minimum: 0, maximum: 32503680000000 },
  rev: { type: "integer", minimum: 0, maximum: 2147483647 },
} as const;

/** Fields required on every synced document. */
export const rxSyncRequired = ["updatedAt", "rev"] as const;
