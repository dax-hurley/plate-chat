export type DistanceUnit = "km" | "mi" | "m";

export function parseDistanceUnit(
  raw: string | null | undefined
): DistanceUnit {
  if (raw === "mi" || raw === "m") return raw;
  return "km";
}

/** Step for session +/- and tap-to-decrement adjustments (in the exercise's unit). */
export function sessionDistanceStep(unit: DistanceUnit): number {
  if (unit === "m") return 10;
  if (unit === "mi") return 0.05;
  return 0.1;
}

export function minPositiveDistance(unit: DistanceUnit): number {
  if (unit === "m") return 1;
  return 0.01;
}

export function roundDistance(n: number, unit: DistanceUnit): number {
  const v = Math.max(0, n);
  if (unit === "m") return Math.round(v);
  return Math.round(v * 1000) / 1000;
}

/** Display distance in the exercise's unit (compact). */
export function formatDistanceAmount(n: number, unit: DistanceUnit): string {
  const r = roundDistance(n, unit);
  if (unit === "m") return `${r} m`;
  const s =
    Math.abs(r - Math.round(r)) < 1e-9
      ? String(Math.round(r))
      : r.toFixed(2).replace(/\.?0+$/, "");
  return `${s} ${unit}`;
}
