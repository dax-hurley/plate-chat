import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getDb, type TrainlogDB } from "./database";
import { startSyncRunner, stopSyncRunner, triggerSync } from "./sync";

interface DbValue {
  db: TrainlogDB | null;
  ready: boolean;
}

const DbContext = createContext<DbValue>({ db: null, ready: false });

export function DbProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<TrainlogDB | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const inst = getDb();
      await inst.open();
      if (cancelled) return;
      setDb(inst);
      startSyncRunner();
      triggerSync();
    })();
    return () => {
      cancelled = true;
      stopSyncRunner();
    };
  }, []);

  const value = useMemo<DbValue>(() => ({ db, ready: db !== null }), [db]);
  return <DbContext.Provider value={value}>{children}</DbContext.Provider>;
}

export function useDb(): DbValue {
  return useContext(DbContext);
}

export function useDbRequired(): TrainlogDB {
  const { db } = useContext(DbContext);
  if (!db) {
    throw new Error(
      "Local DB not ready — render under <DbProvider> and gate on ready."
    );
  }
  return db;
}
