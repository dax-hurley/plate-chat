import { formatProfileSexForCoach } from "@/lib/profile-demographics";
import {
  goalPresetLabel,
  goalPresetValidValuesForAi,
} from "@/lib/profile-goal-preset";
import type { UserProfileBundle } from "@/lib/services/profile";

/** Injected into the coach system prompt so the model always sees current profile. */
export function formatProfileForCoachPrompt(p: UserProfileBundle): string {
  const goalsLine =
    p.goalPreset === "custom"
      ? `Goals (custom): ${p.fitnessGoals?.trim() ? p.fitnessGoals.trim() : "(not set)"}`
      : `Additional goals (beyond ${goalPresetLabel(p.goalPreset)}): ${p.fitnessGoals?.trim() ? p.fitnessGoals.trim() : "(not set)"}`;
  return [
    "## User profile (authoritative)",
    "Use get_user_profile and update_user_profile when you need to read or change this data.",
    goalPresetValidValuesForAi(),
    `- Name: ${p.name?.trim() ? p.name.trim() : "(not set)"}`,
    `- Height (in): ${p.heightIn != null && Number.isFinite(p.heightIn) ? String(p.heightIn) : "(not set)"}`,
    `- Sex: ${formatProfileSexForCoach(p.sex)}`,
    `- Activity level: ${p.activityLevel ?? "(not set)"}`,
    `- Age (years): ${p.ageYears != null ? String(p.ageYears) : "(not set)"}`,
    `- Primary fitness goal (preset): ${goalPresetLabel(p.goalPreset)}`,
    `- ${goalsLine}`,
    `- Preferences (food, equipment, etc.): ${p.preferences?.trim() ? p.preferences.trim() : "(not set)"}`,
    `- Daily macro targets: calories ${p.goalCalories != null ? `${p.goalCalories} kcal` : "(not set)"}; protein ${p.goalProteinG != null ? `${p.goalProteinG} g` : "(not set)"}; carbs ${p.goalCarbsG != null ? `${p.goalCarbsG} g` : "(not set)"}; fat ${p.goalFatG != null ? `${p.goalFatG} g` : "(not set)"}`,
  ].join("\n");
}
