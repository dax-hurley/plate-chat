import { useSyncExternalStore } from "react";

import { getSyncingSnapshot, subscribeSyncing } from "@/lib/client/db/sync";

/** True while a background push/pull sync cycle is in progress. */
export function useSyncing(): boolean {
  return useSyncExternalStore(subscribeSyncing, getSyncingSnapshot, () => false);
}
