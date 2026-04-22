"use server";

import { revalidatePath } from "next/cache";

import { requireUserId } from "@/lib/auth-user";
import { parseGoalPreset } from "@/lib/profile-goal-preset";
import * as profile from "@/lib/services/profile";

export async function actionSaveProfile(formData: FormData) {
  const userId = await requireUserId();
    const nameRaw = String(formData.get("name") ?? "").trim();
    const heightRaw = String(formData.get("heightIn") ?? "").trim();
    const goalPresetRaw = String(formData.get("goalPreset") ?? "").trim();
    const goalsRaw = String(formData.get("fitnessGoals") ?? "");
    const prefRaw = String(formData.get("preferences") ?? "");
    const goalCaloriesRaw = String(formData.get("goalCalories") ?? "").trim();
    const goalProteinGRaw = String(formData.get("goalProteinG") ?? "").trim();
    const goalCarbsGRaw = String(formData.get("goalCarbsG") ?? "").trim();
    const goalFatGRaw = String(formData.get("goalFatG") ?? "").trim();

    const heightIn: number | null =
      heightRaw === ""
        ? null
        : (() => {
            const n = Number(heightRaw);
            return Number.isFinite(n) && n > 0 ? n : null;
          })();

    const goalCalories: number | null =
      goalCaloriesRaw === ""
        ? null
        : (() => {
            const n = Number(goalCaloriesRaw);
            if (!Number.isFinite(n) || n < 0 || n > 50000) return null;
            return Math.round(n);
          })();
    function parseGramGoal(raw: string): number | null {
      if (raw === "") return null;
      const n = Number(raw.replace(",", "."));
      if (!Number.isFinite(n) || n < 0 || n > 1000) return null;
      return Math.round(n * 10) / 10;
    }
    const goalProteinG = parseGramGoal(goalProteinGRaw);
    const goalCarbsG = parseGramGoal(goalCarbsGRaw);
    const goalFatG = parseGramGoal(goalFatGRaw);

    await profile.updateUserProfile(userId, {
      name: nameRaw === "" ? null : nameRaw,
      heightIn,
      goalPreset: parseGoalPreset(goalPresetRaw || undefined),
      fitnessGoals: goalsRaw.trim() === "" ? null : goalsRaw.trim(),
      preferences: prefRaw.trim() === "" ? null : prefRaw.trim(),
      goalCalories,
      goalProteinG,
      goalCarbsG,
      goalFatG,
    });

    revalidatePath("/app/profile");
  
}
