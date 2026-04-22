export type ExerciseLogKind = "reps" | "time" | "distance";

export function parseExerciseLogKind(
  raw: string | null | undefined
): ExerciseLogKind {
  if (raw === "time") return "time";
  if (raw === "distance") return "distance";
  return "reps";
}
