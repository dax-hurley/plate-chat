import { useCallback } from "react";
import { useLocalSession } from "./session";
import { useDb } from "@/lib/client/db/provider";
import { useLiveArray } from "@/lib/client/db/hooks";
import {
  insertLocal,
  softDeleteLocal,
  updateLocal,
} from "@/lib/client/db/writes";
import { newId, nowMs } from "./ids";

export interface VitalEntry {
  id: string;
  userId: string;
  vitalKey: string;
  dayKey: string;
  value: number;
  recordedAt: number;
  updatedAt: number;
  deletedAt: number | null;
  rev: number;
}

export function useVitals(vitalKey: string | null) {
  const { db } = useDb();
  const { userId } = useLocalSession();
  return useLiveArray<VitalEntry>(
    async () => {
      if (!db || !userId || !vitalKey) return [];
      const rows = (await db.userVitalEntries
        .where("[userId+vitalKey]")
        .equals([userId, vitalKey])
        .toArray()) as unknown as VitalEntry[];
      return rows
        .filter((r) => r.deletedAt === null)
        .sort((a, b) => a.dayKey.localeCompare(b.dayKey));
    },
    [db, userId, vitalKey]
  );
}

export function useVitalsForDay(dayKey: string) {
  const { db } = useDb();
  const { userId } = useLocalSession();
  return useLiveArray<VitalEntry>(
    async () => {
      if (!db || !userId) return [];
      const rows = (await db.userVitalEntries
        .where("[userId+dayKey]")
        .equals([userId, dayKey])
        .toArray()) as unknown as VitalEntry[];
      return rows.filter((r) => r.deletedAt === null);
    },
    [db, userId, dayKey]
  );
}

export function useProgressMutations() {
  const { db, ready } = useDb();
  const { userId } = useLocalSession();

  const setVital = useCallback(
    async (vitalKey: string, dayKey: string, value: number) => {
      if (!ready || !db || !userId) throw new Error("Not ready");
      const matches = (await db.userVitalEntries
        .where("[userId+vitalKey+dayKey]")
        .equals([userId, vitalKey, dayKey])
        .toArray()) as unknown as VitalEntry[];
      const existing = matches[0];
      if (existing) {
        await updateLocal(db.userVitalEntries, existing.id, {
          value,
          recordedAt: nowMs(),
          deletedAt: null,
        });
        return;
      }
      await insertLocal(db.userVitalEntries, {
        id: newId(),
        userId,
        vitalKey,
        dayKey,
        value,
        recordedAt: nowMs(),
      });
    },
    [db, ready, userId]
  );

  const clearVital = useCallback(
    async (vitalKey: string, dayKey: string) => {
      if (!ready || !db || !userId) throw new Error("Not ready");
      const matches = (await db.userVitalEntries
        .where("[userId+vitalKey+dayKey]")
        .equals([userId, vitalKey, dayKey])
        .toArray()) as unknown as VitalEntry[];
      const existing = matches.find((r) => r.deletedAt === null);
      if (!existing) return;
      await softDeleteLocal(db.userVitalEntries, existing.id);
    },
    [db, ready, userId]
  );

  return { setVital, clearVital };
}
