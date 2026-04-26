import { useCallback } from "react";
import { a as useLocalSession, u as useLiveArray, i as insertLocal, s as softDeleteLocal } from "./writes-C61wFNCm.mjs";
import { u as useDb } from "./router-CUOzYYmk.mjs";
import { n as newId, a as nowMs } from "./ids-zMPBJmub.mjs";
function useScheduledItems(startDayKey, endDayKey) {
  const { db } = useDb();
  const { userId } = useLocalSession();
  return useLiveArray(
    async () => {
      if (!db || !userId) return [];
      const rows = await db.workoutScheduledItems.where("[userId+dayKey]").between([userId, startDayKey], [userId, endDayKey], true, true).toArray();
      return rows.filter((r) => r.deletedAt === null).sort((a, b) => a.dayKey.localeCompare(b.dayKey));
    },
    [db, userId, startDayKey, endDayKey]
  );
}
function useScheduleMutations() {
  const { db, ready } = useDb();
  const { userId } = useLocalSession();
  const scheduleTemplate = useCallback(
    async (templateId, dayKey, notes = null) => {
      if (!ready || !db || !userId) throw new Error("Not ready");
      const id = newId();
      await insertLocal(db.workoutScheduledItems, {
        id,
        userId,
        templateId,
        dayKey,
        notes,
        createdAt: nowMs()
      });
      return id;
    },
    [db, ready, userId]
  );
  const unschedule = useCallback(
    async (id) => {
      if (!ready || !db) throw new Error("Not ready");
      await softDeleteLocal(db.workoutScheduledItems, id);
    },
    [db, ready]
  );
  return { scheduleTemplate, unschedule };
}
export {
  useScheduleMutations as a,
  useScheduledItems as u
};
