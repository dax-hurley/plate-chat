/** Allowed `vitalKey` values for storage and API (snake_case). */
export const VITAL_KEYS = [
  "body_weight_lb",
  "body_fat_pct",
  "resting_hr",
  "sleep_hours",
  "waist_in",
  "blood_pressure_systolic",
  "blood_pressure_diastolic",
] as const;

export type VitalKey = (typeof VITAL_KEYS)[number];

const LABELS: Record<VitalKey, string> = {
  body_weight_lb: "Body weight (lb)",
  body_fat_pct: "Body fat (%)",
  resting_hr: "Resting heart rate (bpm)",
  sleep_hours: "Sleep (hours)",
  waist_in: "Waist (in)",
  blood_pressure_systolic: "Blood pressure — systolic",
  blood_pressure_diastolic: "Blood pressure — diastolic",
};

export function vitalKeyLabel(key: string): string {
  if (VITAL_KEYS.includes(key as VitalKey)) {
    return LABELS[key as VitalKey];
  }
  if (key === "height_in") {
    return "Height (in) — legacy";
  }
  return key;
}

export function isAllowedVitalKey(key: string): key is VitalKey {
  return (VITAL_KEYS as readonly string[]).includes(key);
}
