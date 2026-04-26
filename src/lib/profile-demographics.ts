/** Stored in `user_profiles.sex` */
export const PROFILE_SEX_VALUES = [
  "male",
  "female",
  "transgender_man",
  "transgender_woman",
  "nonbinary",
  "other",
  "prefer_not_to_say",
] as const;
export type ProfileSex = (typeof PROFILE_SEX_VALUES)[number];

const PROFILE_SEX_FOR_COACH: Record<ProfileSex, string> = {
  male: "man",
  female: "woman",
  transgender_man: "transgender man",
  transgender_woman: "transgender woman",
  nonbinary: "nonbinary",
  other: "other (catch-all)",
  prefer_not_to_say: "prefer not to say",
};

/** Human-readable label for prompts (not stored). */
export function formatProfileSexForCoach(
  s: ProfileSex | null | undefined
): string {
  if (s == null) return "(not set)";
  return PROFILE_SEX_FOR_COACH[s];
}

/** Stored in `user_profiles.activityLevel` */
export const ACTIVITY_LEVEL_VALUES = [
  "sedentary",
  "light",
  "moderate",
  "active",
  "very_active",
] as const;
export type ActivityLevel = (typeof ACTIVITY_LEVEL_VALUES)[number];

export function parseProfileSex(
  v: string | null | undefined
): ProfileSex | null {
  if (v == null || v === "") return null;
  return PROFILE_SEX_VALUES.includes(v as ProfileSex) ? (v as ProfileSex) : null;
}

export function parseActivityLevel(
  v: string | null | undefined
): ActivityLevel | null {
  if (v == null || v === "") return null;
  return ACTIVITY_LEVEL_VALUES.includes(v as ActivityLevel)
    ? (v as ActivityLevel)
    : null;
}
