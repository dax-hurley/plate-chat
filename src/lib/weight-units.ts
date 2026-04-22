export type WeightUnit = "lb" | "kg";

export function parseWeightUnit(
  raw: string | null | undefined
): WeightUnit {
  if (raw === "kg") return "kg";
  return "lb";
}

/** Effective unit for a template line (optional per-item override). */
export function resolveTemplateItemWeightUnit(item: {
  weightUnit: string | null;
  exercise: { weightUnit?: string | null };
}): WeightUnit {
  return parseWeightUnit(item.weightUnit ?? item.exercise.weightUnit);
}

export function sessionWeightStep(unit: WeightUnit): number {
  return unit === "kg" ? 1 : 2.5;
}

/** Half-increment friendly display (lb and kg). */
export function formatLoadNumber(n: number): string {
  const r = Math.round(Math.max(0, n) * 2) / 2;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

export function formatWeightWithUnit(n: number, unit: WeightUnit): string {
  return `${formatLoadNumber(n)} ${unit}`;
}
