/** Stored on `user_profiles.goalPreset` and in API/MCP/coach tools. */
export const GOAL_PRESET_VALUES = [
  "lose_weight",
  "gain_muscle",
  "build_strength",
  "custom",
] as const;

export type GoalPreset = (typeof GOAL_PRESET_VALUES)[number];

export function isGoalPreset(s: string | null | undefined): s is GoalPreset {
  return (
    s != null && (GOAL_PRESET_VALUES as readonly string[]).includes(s)
  );
}

export function parseGoalPreset(s: string | null | undefined): GoalPreset {
  return isGoalPreset(s) ? s : "custom";
}

export function goalPresetLabel(p: GoalPreset): string {
  switch (p) {
    case "lose_weight":
      return "Lose Weight";
    case "gain_muscle":
      return "Gain Muscle";
    case "build_strength":
      return "Build Strength";
    case "custom":
      return "Custom";
  }
}

/**
 * Single line for coach system prompts and tool docs: exact API tokens + labels.
 * Keeps AI from inventing values like "lose weight" or "muscle_gain".
 */
export function goalPresetValidValuesForAi(): string {
  const pairs = GOAL_PRESET_VALUES.map(
    (v) => `${v} (${goalPresetLabel(v)})`
  ).join(", ");
  return `goalPreset must be exactly one of these four snake_case strings: ${pairs}. Do not use synonyms, display names, or alternate spellings.`;
}
