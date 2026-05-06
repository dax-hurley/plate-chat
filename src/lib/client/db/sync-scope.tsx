import { useEffect } from "react";
import type { CollectionName } from "@/shared/schemas/collections";
import { addSyncScope } from "./sync";

/**
 * Register Dexie collections for incremental background pull while this
 * component is mounted (ref-counted).
 */
export function useSyncScope(names: readonly CollectionName[]): void {
  const serialized = JSON.stringify([...new Set(names)].sort());
  useEffect(() => {
    const sorted = JSON.parse(serialized) as CollectionName[];
    return addSyncScope(sorted);
  }, [serialized]);
}
