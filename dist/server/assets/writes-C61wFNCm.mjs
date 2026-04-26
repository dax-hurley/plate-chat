import { useState, useEffect } from "react";
import { l as loadTokens, u as useDb, t as triggerSync } from "./router-CUOzYYmk.mjs";
import { useLiveQuery } from "dexie-react-hooks";
function useLocalSession() {
  const [state, setState] = useState({ userId: null, loading: true, tokens: null });
  useEffect(() => {
    let alive = true;
    loadTokens().then((t) => {
      if (!alive) return;
      setState({
        userId: t?.userId ?? null,
        loading: false,
        tokens: t
      });
    });
    return () => {
      alive = false;
    };
  }, []);
  return state;
}
function useLiveArray(fn, deps) {
  const { ready } = useDb();
  const data = useLiveQuery(
    async () => ready ? await fn() : void 0,
    [ready, ...deps]
  );
  return { data: data ?? [], loading: !ready || data === void 0 };
}
function useLiveOne(fn, deps) {
  const { ready } = useDb();
  const data = useLiveQuery(
    async () => ready ? await fn() : void 0,
    [ready, ...deps]
  );
  return {
    data: data ?? null,
    loading: !ready || data === void 0
  };
}
function now() {
  return Date.now();
}
async function insertLocal(table, row) {
  const t = now();
  await table.put({
    ...row,
    updatedAt: t,
    deletedAt: null,
    rev: 1,
    _dirty: 1
  });
  triggerSync();
}
async function updateLocal(table, key, patch) {
  const existing = await table.get(key);
  if (!existing) return;
  const t = now();
  await table.put({
    ...existing,
    ...patch,
    updatedAt: t,
    rev: (existing.rev ?? 0) + 1,
    _dirty: 1
  });
  triggerSync();
}
async function softDeleteLocal(table, key) {
  const existing = await table.get(key);
  if (!existing) return;
  const t = now();
  await table.put({
    ...existing,
    deletedAt: t,
    updatedAt: t,
    rev: (existing.rev ?? 0) + 1,
    _dirty: 1
  });
  triggerSync();
}
export {
  useLocalSession as a,
  useLiveOne as b,
  updateLocal as c,
  insertLocal as i,
  softDeleteLocal as s,
  useLiveArray as u
};
