import { useCallback } from "react";
import { useLocalSession } from "./session";
import { useDb } from "@/lib/client/db/provider";
import { useLiveArray } from "@/lib/client/db/hooks";
import { insertLocal, softDeleteLocal } from "@/lib/client/db/writes";
import { newId, nowMs } from "./ids";

export interface ScheduledItem {
  id: string;
  userId: string;
  templateId: string;
  dayKey: string;
  notes: string | null;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
  rev: number;
}

export function useScheduledItems(startDayKey: string, endDayKey: string) {
  const { db } = useDb();
  const { userId } = useLocalSession();
  return useLiveArray<ScheduledItem>(
    async () => {
      if (!db || !userId) return [];
      const rows = (await db.workoutScheduledItems
        .where("[userId+dayKey]")
        .between([userId, startDayKey], [userId, endDayKey], true, true)
        .toArray()) as unknown as ScheduledItem[];
      return rows
        .filter((r) => r.deletedAt === null)
        .sort((a, b) => a.dayKey.localeCompare(b.dayKey));
    },
    [db, userId, startDayKey, endDayKey]
  );
}

export function useScheduleMutations() {
  const { db, ready } = useDb();
  const { userId } = useLocalSession();

  const scheduleTemplate = useCallback(
    async (
      templateId: string,
      dayKey: string,
      notes: string | null = null
    ) => {
      if (!ready || !db || !userId) throw new Error("Not ready");
      const id = newId();
      await insertLocal(db.workoutScheduledItems, {
        id,
        userId,
        templateId,
        dayKey,
        notes,
        createdAt: nowMs(),
      });
      return id;
    },
    [db, ready, userId]
  );

  const unschedule = useCallback(
    async (id: string) => {
      if (!ready || !db) throw new Error("Not ready");
      await softDeleteLocal(db.workoutScheduledItems, id);
    },
    [db, ready]
  );

  return { scheduleTemplate, unschedule };
}
