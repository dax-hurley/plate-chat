import Dexie from "dexie";
import { useLocalSession } from "./session";
import { useDb } from "@/lib/client/db/provider";
import { useLiveArray, useLiveOne } from "@/lib/client/db/hooks";

/**
 * Read-only store for coach conversations. The server is the sole writer —
 * `/api/coach/chat` streams response tokens and persists the full message
 * history; clients see it via pull-only replication.
 */
export interface CoachConversation {
  id: string;
  userId: string;
  title: string;
  messages: string;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
  rev: number;
}

export function useCoachConversations() {
  const { db } = useDb();
  const { userId } = useLocalSession();
  return useLiveArray<CoachConversation>(
    async () => {
      if (!db || !userId) return [];
      const rows = (await db.coachConversations
        .where("[userId+updatedAt]")
        .between([userId, Dexie.minKey], [userId, Dexie.maxKey])
        .reverse()
        .toArray()) as unknown as CoachConversation[];
      return rows.filter((r) => r.deletedAt === null);
    },
    [db, userId]
  );
}

export function useCoachConversation(id: string | null) {
  const { db } = useDb();
  return useLiveOne<CoachConversation>(
    async () => {
      if (!db || !id) return null;
      return ((await db.coachConversations.get(id)) as unknown as
        | CoachConversation
        | undefined) ?? null;
    },
    [db, id]
  );
}
