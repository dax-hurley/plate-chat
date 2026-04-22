import Dexie from "dexie";
import { u as useLocalSession } from "./session-CyYyvQL9.mjs";
import { u as useDb } from "./router-kvjOiOR_.mjs";
import { u as useLiveArray, a as useLiveOne } from "./hooks-Ccy1wbDZ.mjs";
function useCoachConversations() {
  const { db } = useDb();
  const { userId } = useLocalSession();
  return useLiveArray(
    async () => {
      if (!db || !userId) return [];
      const rows = await db.coachConversations.where("[userId+updatedAt]").between([userId, Dexie.minKey], [userId, Dexie.maxKey]).reverse().toArray();
      return rows.filter((r) => r.deletedAt === null);
    },
    [db, userId]
  );
}
function useCoachConversation(id) {
  const { db } = useDb();
  return useLiveOne(
    async () => {
      if (!db || !id) return null;
      return await db.coachConversations.get(id) ?? null;
    },
    [db, id]
  );
}
export {
  useCoachConversation as a,
  useCoachConversations as u
};
