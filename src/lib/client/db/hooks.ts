import { useLiveQuery } from "dexie-react-hooks";
import { useDb } from "./provider";

/**
 * Subscribe to a Dexie query returning a collection. Returns `{data,
 * loading}` where `loading` is `true` until the first emission (or while the
 * DB is still opening). The query fn is gated on `ready` so call-sites can
 * reference `db` without branching.
 */
export function useLiveArray<T>(
  fn: () => Promise<T[]> | T[],
  deps: React.DependencyList
): { data: T[]; loading: boolean } {
  const { ready } = useDb();
  const data = useLiveQuery<T[] | undefined>(
    async () => (ready ? await fn() : undefined),
    [ready, ...deps]
  );
  return { data: data ?? [], loading: !ready || data === undefined };
}

/** Same as {@link useLiveArray} but for a single-row query. */
export function useLiveOne<T>(
  fn: () => Promise<T | null | undefined> | T | null | undefined,
  deps: React.DependencyList
): { data: T | null; loading: boolean } {
  const { ready } = useDb();
  const data = useLiveQuery<T | null | undefined>(
    async () => (ready ? await fn() : undefined),
    [ready, ...deps]
  );
  return {
    data: data ?? null,
    loading: !ready || data === undefined,
  };
}
