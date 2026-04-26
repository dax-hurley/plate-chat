import { useCallback } from "react";
import { a as useLocalSession, b as useLiveOne, c as updateLocal, i as insertLocal } from "./writes-C61wFNCm.mjs";
import { u as useDb } from "./router-CUOzYYmk.mjs";
function useProfile() {
  const { db } = useDb();
  const { userId } = useLocalSession();
  return useLiveOne(
    async () => {
      if (!db || !userId) return null;
      const row = await db.userProfiles.get(userId);
      return row && row.deletedAt === null ? row : null;
    },
    [db, userId]
  );
}
function useProfileMutations() {
  const { db, ready } = useDb();
  const { userId } = useLocalSession();
  const saveProfile = useCallback(
    async (patch) => {
      if (!ready || !db || !userId) throw new Error("Not ready");
      const existing = await db.userProfiles.get(userId);
      if (existing) {
        await updateLocal(db.userProfiles, userId, patch);
        return;
      }
      await insertLocal(db.userProfiles, {
        userId,
        heightIn: null,
        sex: null,
        activityLevel: null,
        ageYears: null,
        onboardingCompletedAt: null,
        goalPreset: "custom",
        fitnessGoals: null,
        preferences: null,
        goalCalories: null,
        goalProteinG: null,
        goalCarbsG: null,
        goalFatG: null,
        ...patch
      });
    },
    [db, ready, userId]
  );
  return { saveProfile };
}
export {
  useProfile as a,
  useProfileMutations as u
};
