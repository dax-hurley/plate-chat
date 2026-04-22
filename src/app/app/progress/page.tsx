import { and, asc, eq, inArray } from "drizzle-orm";

import { db } from "@/db/client";
import { exercises, workoutSessions } from "@/db/schema";
import { requireUserId } from "@/lib/auth-user";
import { addDaysKey, formatDayKey } from "@/lib/date-key";
import { getProfileForUser } from "@/lib/services/profile";
import { getLatestVitalMap } from "@/lib/services/progress";
import { ProgressScreen } from "@/components/progress/progress-screen";

async function listExerciseOptions(userId: string) {
  const sessions = await db.query.workoutSessions.findMany({
    where: and(
      eq(workoutSessions.userId, userId),
      eq(workoutSessions.status, "completed")
    ),
    columns: { id: true },
    with: {
      sets: { columns: { exerciseId: true } },
    },
    limit: 500,
  });
  const ids = new Set<string>();
  for (const s of sessions) {
    for (const st of s.sets) ids.add(st.exerciseId);
  }
  if (ids.size === 0) {
    return [] as Array<{
      id: string;
      name: string;
      logKind: string;
      distanceUnit: string | null;
    }>;
  }
  const rows = await db.query.exercises.findMany({
    where: inArray(exercises.id, [...ids]),
    columns: {
      id: true,
      name: true,
      logKind: true,
      distanceUnit: true,
    },
    orderBy: [asc(exercises.name)],
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    logKind: r.logKind,
    distanceUnit: r.distanceUnit,
  }));
}

export default async function ProgressPage() {
  const userId = await requireUserId();

  const today = formatDayKey(new Date());
  const defaultFrom = addDaysKey(today, -29);
  const defaultTo = today;

  const [exerciseOptions, profile, latestVitals] = await Promise.all([
    listExerciseOptions(userId),
    getProfileForUser(userId),
    getLatestVitalMap(userId),
  ]);

  const loseWeightQuickLog = profile.goalPreset === "lose_weight";
  const latestWeight = latestVitals.get("body_weight_lb");
  const quickLogInitialWeightLb =
    latestWeight?.value != null && Number.isFinite(latestWeight.value)
      ? latestWeight.value
      : null;

  return (
    <ProgressScreen
      exercises={exerciseOptions}
      defaultExerciseId={exerciseOptions[0]?.id ?? ""}
      defaultFrom={defaultFrom}
      defaultTo={defaultTo}
      loseWeightQuickLog={loseWeightQuickLog}
      quickLogInitialWeightLb={quickLogInitialWeightLb}
    />
  );
}
