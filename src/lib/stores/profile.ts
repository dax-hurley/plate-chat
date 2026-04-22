import { useCallback } from "react";
import { useLocalSession } from "./session";
import { useDb } from "@/lib/client/db/provider";
import { useLiveOne } from "@/lib/client/db/hooks";
import { insertLocal, updateLocal } from "@/lib/client/db/writes";

export interface UserProfile {
  userId: string;
  heightIn: number | null;
  goalPreset: "lose_weight" | "gain_muscle" | "build_strength" | "custom";
  fitnessGoals: string | null;
  preferences: string | null;
  goalCalories: number | null;
  goalProteinG: number | null;
  goalCarbsG: number | null;
  goalFatG: number | null;
  updatedAt: number;
  deletedAt: number | null;
  rev: number;
}

export function useProfile() {
  const { db } = useDb();
  const { userId } = useLocalSession();
  return useLiveOne<UserProfile>(
    async () => {
      if (!db || !userId) return null;
      const row = (await db.userProfiles.get(userId)) as unknown as
        | UserProfile
        | undefined;
      return row && row.deletedAt === null ? row : null;
    },
    [db, userId]
  );
}

export function useProfileMutations() {
  const { db, ready } = useDb();
  const { userId } = useLocalSession();

  const saveProfile = useCallback(
    async (patch: Partial<UserProfile>) => {
      if (!ready || !db || !userId) throw new Error("Not ready");
      const existing = await db.userProfiles.get(userId);
      if (existing) {
        await updateLocal(db.userProfiles, userId, patch);
        return;
      }
      await insertLocal(db.userProfiles, {
        userId,
        heightIn: null,
        goalPreset: "custom",
        fitnessGoals: null,
        preferences: null,
        goalCalories: null,
        goalProteinG: null,
        goalCarbsG: null,
        goalFatG: null,
        ...patch,
      });
    },
    [db, ready, userId]
  );

  return { saveProfile };
}
