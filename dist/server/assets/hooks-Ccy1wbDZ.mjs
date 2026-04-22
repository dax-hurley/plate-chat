import { useLiveQuery } from "dexie-react-hooks";
import { u as useDb } from "./router-kvjOiOR_.mjs";
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
export {
  useLiveOne as a,
  useLiveArray as u
};
