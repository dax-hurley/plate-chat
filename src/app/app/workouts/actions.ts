"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUserId } from "@/lib/auth-user";
import { parseDayKey } from "@/lib/date-key";
import {
  effectiveTargetDistanceForSession,
  effectiveTargetDurationSecForSession,
  effectiveTemplateWeightForSession,
  getNextOpenSetIndex,
  SESSION_DURATION_STEP_SEC,
  suggestedWeightForSet,
} from "@/lib/workout-session-state";
import { parseExerciseLogKind } from "@/lib/log-kind";
import {
  parseDistanceUnit,
  roundDistance,
  sessionDistanceStep,
} from "@/lib/distance-units";
import * as workouts from "@/lib/services/workouts";
import {
  resolveTemplateItemWeightUnit,
  sessionWeightStep,
} from "@/lib/weight-units";

export async function actionCreateWorkoutRoutineGroup(formData: FormData) {
  const userId = await requireUserId();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name required");
  await workouts.createRoutineGroup(userId, { name });
  revalidatePath("/app/workouts");
  revalidatePath("/app");
  const revalidateTemplateId = String(
    formData.get("revalidateTemplateId") ?? ""
  ).trim();
  if (revalidateTemplateId) {
    revalidatePath(`/app/workouts/${revalidateTemplateId}`);
  }
  
}

export async function actionRenameWorkoutRoutineGroup(formData: FormData) {
  const userId = await requireUserId();
  const routineGroupId = String(formData.get("routineGroupId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  if (!routineGroupId || !name) throw new Error("Name required");
  await workouts.renameRoutineGroup(userId, routineGroupId, name);
  revalidatePath("/app/workouts");
  revalidatePath("/app");
  const revalidateTemplateId = String(
    formData.get("revalidateTemplateId") ?? ""
  ).trim();
  if (revalidateTemplateId) {
    revalidatePath(`/app/workouts/${revalidateTemplateId}`);
  }
  
}

export async function actionDeleteWorkoutRoutineGroup(routineGroupId: string) {
  const userId = await requireUserId();
  await workouts.deleteRoutineGroup(userId, routineGroupId);
  revalidatePath("/app/workouts");
  revalidatePath("/app");
  
}

export async function actionSetTemplateRoutineGroup(input: {
  templateId: string;
  routineGroupId: string | null;
}) {
  const userId = await requireUserId();
  await workouts.setTemplateRoutineGroup(
    userId,
    input.templateId,
    input.routineGroupId
  );
  revalidatePath("/app/workouts");
  revalidatePath("/app");
  revalidatePath(`/app/workouts/${input.templateId}`);
  
}

export async function actionMoveTemplateWithinRoutine(
  templateId: string,
  direction: "up" | "down"
) {
  const userId = await requireUserId();
  await workouts.moveTemplateWithinRoutine(userId, templateId, direction);
  revalidatePath("/app/workouts");
  revalidatePath("/app");
  revalidatePath(`/app/workouts/${templateId}`);
  
}

export async function actionCreateTemplate(formData: FormData) {
  const userId = await requireUserId();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name required");
  const notes = String(formData.get("notes") ?? "").trim() || undefined;
  const t = await workouts.createTemplate(userId, { name, notes });

  const scheduleMode = String(formData.get("scheduleMode") ?? "none").trim();
  const planDate = String(formData.get("planDate") ?? "").trim();
  const scheduleNote =
    String(formData.get("scheduleNote") ?? "").trim() || undefined;

  if (scheduleMode === "once" && planDate) {
    if (!parseDayKey(planDate)) throw new Error("Invalid calendar date");
    await workouts.createScheduledWorkout(userId, {
      templateId: t.id,
      dayKey: planDate,
      notes: scheduleNote,
    });
  } else if (scheduleMode === "repeat") {
    if (!planDate || !parseDayKey(planDate)) {
      throw new Error("Pick a start date for the weekly repeat");
    }
    const byDay = formData
      .getAll("byDay")
      .map((v) => Number(v))
      .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
    const untilRaw = String(formData.get("repeatUntil") ?? "").trim();
    const intervalWeeks = Math.max(
      1,
      Math.round(Number(formData.get("repeatInterval") ?? 1) || 1)
    );
    await workouts.createRecurringWorkoutRule(userId, {
      templateId: t.id,
      byDay,
      startDayKey: planDate,
      untilDayKey: untilRaw || undefined,
      intervalWeeks,
      notes: scheduleNote,
    });
  }

  revalidatePath("/app/workouts");
  revalidatePath("/app/workouts/calendar");
  revalidatePath("/app");
  redirect(`/app/workouts/${t.id}`);
  
}

export async function actionCreateExercise(formData: FormData) {
  const userId = await requireUserId();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name required");
  const muscleGroup =
    String(formData.get("muscleGroup") ?? "").trim() || undefined;
  const ex = await workouts.createExercise(userId, { name, muscleGroup });
  revalidatePath("/app/workouts");
  return ex;
  
}

/** Create a lift and append it to the template in one step (gym-friendly). */
export async function actionCreateExerciseForTemplate(formData: FormData) {
  const userId = await requireUserId();
  const templateId = String(formData.get("templateId") ?? "").trim();
  if (!templateId) throw new Error("Missing template");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name required");
  const muscleGroup =
    String(formData.get("muscleGroup") ?? "").trim() || undefined;
  const targetSets = Number(formData.get("targetSets") ?? 3) || 3;
  const logKindRaw = String(formData.get("logKind") ?? "reps").trim();
  const logKind = parseExerciseLogKind(logKindRaw);
  const targetReps = Number(formData.get("targetReps") ?? 5) || 5;
  const targetDurationSec = Math.max(
    1,
    Math.round(Number(formData.get("targetDurationSec") ?? 60) || 60)
  );
  const logTimeForDistance =
    logKind === "distance" &&
    String(formData.get("logTimeForDistanceSets") ?? "") === "1";
  const targetDurationForDistance = Math.max(
    1,
    Math.round(Number(formData.get("targetDurationSecForDistance") ?? 60) || 60)
  );
  const targetDistanceRaw = Number(formData.get("targetDistance") ?? 1);
  const targetDistance = Number.isFinite(targetDistanceRaw)
    ? targetDistanceRaw
    : 1;
  const distanceUnitRaw = String(formData.get("distanceUnit") ?? "km").trim();
  const distanceUnit =
    distanceUnitRaw === "mi" || distanceUnitRaw === "m" ? distanceUnitRaw : "km";
  const dw = String(formData.get("defaultWeight") ?? "").trim();
  const defaultWeight = dw === "" ? null : Number(dw);

  const wuRaw = String(formData.get("weightUnit") ?? "lb").trim();
  const trackWeight =
    logKind === "reps"
      ? true
      : String(formData.get("trackWeight") ?? "") === "1";
  const ex = await workouts.createExercise(userId, {
    name,
    muscleGroup,
    logKind,
    defaultDurationSec:
      logKind === "time"
        ? targetDurationSec
        : logKind === "distance" && logTimeForDistance
          ? targetDurationForDistance
          : null,
    defaultDistance:
      logKind === "distance" && !logTimeForDistance ? targetDistance : null,
    distanceUnit: logKind === "distance" ? distanceUnit : undefined,
    weightUnit: wuRaw === "kg" ? "kg" : "lb",
    trackWeight,
  });
  const t = await workouts.getTemplate(userId, templateId);
  const nextOrder =
    (t?.items.reduce((m, i) => Math.max(m, i.order), -1) ?? -1) + 1;
  const dUnit = parseDistanceUnit(ex.distanceUnit);
  const roundedTargetDist =
    logKind === "distance" && !logTimeForDistance
      ? roundDistance(
          Math.max(
            dUnit === "m" ? 1 : 0.01,
            Number(targetDistance)
          ),
          dUnit
        )
      : undefined;
  await workouts.addTemplateItem(userId, {
    templateId,
    exerciseId: ex.id,
    order: nextOrder,
    targetSets,
    targetReps:
      logKind === "time" || logKind === "distance" ? undefined : targetReps,
    targetDurationSec:
      logKind === "time"
        ? targetDurationSec
        : logKind === "distance" && logTimeForDistance
          ? targetDurationForDistance
          : undefined,
    targetDistance:
      logKind === "distance" && !logTimeForDistance
        ? roundedTargetDist ?? targetDistance
        : undefined,
    defaultWeight:
      trackWeight && Number.isFinite(defaultWeight as number)
        ? (defaultWeight as number)
        : null,
    weightUnit: null,
    trackWeight,
    logTimeForDistanceSets: logTimeForDistance,
  });
  revalidatePath(`/app/workouts/${templateId}`);
  revalidatePath("/app/workouts");
  redirect(`/app/workouts/${templateId}`);
  
}

export async function actionAddTemplateItem(input: {
  templateId: string;
  exerciseId: string;
  targetSets?: number;
  targetReps?: number;
  targetDurationSec?: number | null;
  defaultWeight?: number | null;
  weightUnit?: "lb" | "kg" | null;
}) {
  const userId = await requireUserId();
  const t = await workouts.getTemplate(userId, input.templateId);
  const nextOrder =
    (t?.items.reduce((m, i) => Math.max(m, i.order), -1) ?? -1) + 1;
  await workouts.addTemplateItem(userId, {
    templateId: input.templateId,
    exerciseId: input.exerciseId,
    order: nextOrder,
    targetSets: input.targetSets,
    targetReps: input.targetReps,
    targetDurationSec: input.targetDurationSec,
    defaultWeight: input.defaultWeight,
    weightUnit: input.weightUnit,
  });
  revalidatePath(`/app/workouts/${input.templateId}`);
  revalidatePath("/app/workouts");
  
}

export async function actionRemoveTemplateItem(
  templateId: string,
  itemId: string
) {
  const userId = await requireUserId();
  await workouts.deleteTemplateItem(userId, itemId, templateId);
  revalidatePath(`/app/workouts/${templateId}`);
  
}

export async function actionUpdateWorkoutExerciseInTemplate(
  formData: FormData
) {
  const userId = await requireUserId();
  const templateId = String(formData.get("templateId") ?? "").trim();
  const itemId = String(formData.get("itemId") ?? "").trim();
  const exerciseId = String(formData.get("exerciseId") ?? "").trim();
  if (!templateId || !itemId || !exerciseId) {
    throw new Error("Missing template or exercise");
  }

  const tmplRow = await workouts.getTemplate(userId, templateId);
  const existingLine = tmplRow?.items.find((i) => i.id === itemId);
  if (!existingLine) throw new Error("Template line not found");
  const lineLogKind = parseExerciseLogKind(existingLine.exercise.logKind);

  const targetSets = Math.max(
    1,
    Math.round(Number(formData.get("targetSets") ?? 3) || 3)
  );
  const targetRepsRaw = formData.get("targetReps");
  const targetDurationRaw = formData.get("targetDurationSec");
  const targetReps =
    targetRepsRaw != null && String(targetRepsRaw).trim() !== ""
      ? Math.max(1, Math.round(Number(targetRepsRaw)))
      : null;
  const targetDurationSec =
    targetDurationRaw != null && String(targetDurationRaw).trim() !== ""
      ? Math.max(1, Math.round(Number(targetDurationRaw)))
      : null;
  const targetDistanceRaw = formData.get("targetDistance");
  const targetDistance =
    targetDistanceRaw != null && String(targetDistanceRaw).trim() !== ""
      ? Number(targetDistanceRaw)
      : null;
  const trackWeight =
    lineLogKind === "reps"
      ? true
      : String(formData.get("trackWeight") ?? "") === "1";

  const logTimeForDistanceSets =
    lineLogKind === "distance" &&
    String(formData.get("logTimeForDistanceSets") ?? "") === "1";

  const dw = String(formData.get("defaultWeight") ?? "").trim();
  const defaultWeightParsed = dw === "" ? null : Number(dw);
  const defaultWeight =
    trackWeight && Number.isFinite(defaultWeightParsed as number)
      ? (defaultWeightParsed as number)
      : null;

  const tw = String(formData.get("templateWeightUnit") ?? "").trim();
  const templateWeightUnit =
    tw === "" ? null : tw === "kg" || tw === "lb" ? tw : null;

  const wantsProg =
    String(formData.get("progressiveOverloadEnabled") ?? "") === "1";
  const progEligible =
    lineLogKind === "reps" ? trackWeight : true;
  const progEnabled = wantsProg && progEligible;
  const progIncRaw = String(
    formData.get("progressiveOverloadIncrement") ?? ""
  ).trim();
  const progressiveOverloadIncrement =
    progIncRaw === "" ? null : Number(progIncRaw);
  const progressiveOverloadRequireFullCompletion =
    String(
      formData.get("progressiveOverloadRequireFullCompletion") ?? ""
    ) === "1";

  await workouts.updateTemplateItem(userId, {
    templateId,
    itemId,
    targetSets,
    targetReps: targetReps ?? undefined,
    targetDurationSec: targetDurationSec ?? undefined,
    targetDistance:
      targetDistance != null && Number.isFinite(targetDistance)
        ? targetDistance
        : undefined,
    defaultWeight,
    weightUnit: templateWeightUnit,
    progressiveOverloadEnabled: progEnabled,
    progressiveOverloadIncrement:
      progEnabled && Number.isFinite(progressiveOverloadIncrement as number)
        ? (progressiveOverloadIncrement as number)
        : null,
    progressiveOverloadRequireFullCompletion: progEnabled
      ? progressiveOverloadRequireFullCompletion
      : false,
    trackWeight,
    logTimeForDistanceSets,
  });

  const canEditExercise = String(formData.get("canEditExercise") ?? "") === "1";
  if (canEditExercise) {
    const name = String(formData.get("exerciseName") ?? "").trim();
    if (!name) throw new Error("Exercise name required");
    const muscleGroup =
      String(formData.get("exerciseMuscleGroup") ?? "").trim() || null;
    const ew = String(formData.get("exerciseWeightUnit") ?? "").trim();
    const exerciseWeightUnit =
      ew === "kg" || ew === "lb" ? ew : undefined;
    await workouts.updateCustomExercise(userId, exerciseId, {
      name,
      muscleGroup,
      ...(exerciseWeightUnit !== undefined
        ? { weightUnit: exerciseWeightUnit }
        : {}),
      trackWeight:
        lineLogKind === "reps" ? true : trackWeight,
    });
  }

  revalidatePath(`/app/workouts/${templateId}`);
  revalidatePath("/app/workouts");
  
}

export async function actionDeleteTemplate(templateId: string) {
  const userId = await requireUserId();
  await workouts.deleteTemplate(userId, templateId);
  revalidatePath("/app/workouts");
  revalidatePath("/app");
  
}

export async function actionStartWorkout(templateId: string) {
  const userId = await requireUserId();
  const result = await workouts.startWorkoutFromTemplate(userId, templateId);
  revalidatePath("/app");
  revalidatePath("/app/workouts");
  revalidatePath("/app/workouts/calendar");
  redirect(`/app/workouts/session/${result.session.id}`);
  
}

export async function actionLogSet(input: {
  sessionId: string;
  exerciseId: string;
  setIndex: number;
  weight: number;
  reps?: number;
  durationSec?: number;
  distance?: number;
}) {
  const userId = await requireUserId();
  await workouts.logSet(userId, input);
  revalidatePath(`/app/workouts/session/${input.sessionId}`);
  revalidatePath("/app");
  
}

export async function actionLogSetForm(formData: FormData) {
  const sessionId = String(formData.get("sessionId") ?? "").trim();
  const exerciseId = String(formData.get("exerciseId") ?? "").trim();
  const setIndex = Number(formData.get("setIndex") ?? 1);
  const repsRaw = formData.get("reps");
  const durationRaw = formData.get("durationSec");
  const distanceRaw = formData.get("distance");
  const reps =
    repsRaw != null && String(repsRaw).trim() !== ""
      ? Number(repsRaw)
      : undefined;
  const durationSec =
    durationRaw != null && String(durationRaw).trim() !== ""
      ? Number(durationRaw)
      : undefined;
  const distance =
    distanceRaw != null && String(distanceRaw).trim() !== ""
      ? Number(distanceRaw)
      : undefined;
  const weight = Number(formData.get("weight") ?? 0);
  if (!sessionId || !exerciseId || !Number.isFinite(weight)) {
    throw new Error("Invalid set");
  }
  if (
    !Number.isFinite(reps) &&
    !Number.isFinite(durationSec) &&
    !Number.isFinite(distance)
  ) {
    throw new Error("Invalid set");
  }
  await actionLogSet({
    sessionId,
    exerciseId,
    setIndex,
    weight,
    reps: Number.isFinite(reps as number) ? Math.round(reps as number) : undefined,
    durationSec: Number.isFinite(durationSec as number)
      ? Math.round(durationSec as number)
      : undefined,
    distance: Number.isFinite(distance as number)
      ? Number(distance as number)
      : undefined,
  });
}

export async function actionAdjustSessionExerciseWeight(
  sessionId: string,
  exerciseId: string,
  direction: "up" | "down"
) {
  const userId = await requireUserId();
  const session = await workouts.getSession(userId, sessionId);
  const item = session?.template?.items.find(
    (i) => i.exercise.id === exerciseId
  );
  if (!item) throw new Error("Exercise not in session");
  const unit = resolveTemplateItemWeightUnit({
    weightUnit: item.weightUnit,
    exercise: { weightUnit: item.exercise.weightUnit },
  });
  const step = sessionWeightStep(unit);
  const delta = direction === "up" ? step : -step;
  await workouts.adjustSessionExerciseWorkingWeight(userId, {
    sessionId,
    exerciseId,
    delta,
  });
  revalidatePath(`/app/workouts/session/${sessionId}`);
  revalidatePath("/app");
  
}

export async function actionAdjustSessionExerciseDuration(
  sessionId: string,
  exerciseId: string,
  direction: "up" | "down"
) {
  const userId = await requireUserId();
  const delta =
    direction === "up" ? SESSION_DURATION_STEP_SEC : -SESSION_DURATION_STEP_SEC;
  await workouts.adjustSessionExerciseWorkingDuration(userId, {
    sessionId,
    exerciseId,
    delta,
  });
  revalidatePath(`/app/workouts/session/${sessionId}`);
  revalidatePath("/app");
  
}

export async function actionAdjustSessionExerciseTargetDistance(
  sessionId: string,
  exerciseId: string,
  direction: "up" | "down"
) {
  const userId = await requireUserId();
  const session = await workouts.getSession(userId, sessionId);
  const item = session?.template?.items.find(
    (i) => i.exercise.id === exerciseId
  );
  if (!item) throw new Error("Exercise not in session");
  const dUnit = parseDistanceUnit(item.exercise.distanceUnit);
  const step = sessionDistanceStep(dUnit);
  const delta = direction === "up" ? step : -step;
  await workouts.adjustSessionExerciseWorkingDistance(userId, {
    sessionId,
    exerciseId,
    delta,
  });
  revalidatePath(`/app/workouts/session/${sessionId}`);
  revalidatePath("/app");
  
}

/** Log the next open slot at target reps or time (circle board). */
export async function actionFillSetSlot(
  sessionId: string,
  exerciseId: string,
  setIndex: number
) {
  const userId = await requireUserId();
  const session = await workouts.getSession(userId, sessionId);
  if (!session?.template) throw new Error("Invalid session");
  const item = session.template.items.find(
    (i) => i.exercise.id === exerciseId
  );
  if (!item) throw new Error("Exercise not in workout");

  const exSets = session.sets.filter((s) => s.exerciseId === exerciseId);
  const next = getNextOpenSetIndex(
    item.targetSets,
    exSets.map((s) => s.setIndex)
  );
  if (next !== setIndex) throw new Error("Log sets in order");

  const pref =
    session.exercisePrefs?.find((p) => p.exerciseId === exerciseId) ?? null;
  const lk = parseExerciseLogKind(item.exercise.logKind);
  const timeMode = lk === "time";
  const distanceMode = lk === "distance";
  if (distanceMode && item.logTimeForDistanceSets) {
    throw new Error("Log this set using the stopwatch");
  }
  const weight = item.trackWeight
    ? suggestedWeightForSet(
        effectiveTemplateWeightForSession(pref, item.defaultWeight),
        exSets.map((s) => ({ setIndex: s.setIndex, weight: s.weight })),
        setIndex
      )
    : 0;
  const targetDuration = effectiveTargetDurationSecForSession(pref, item);
  const targetDist = effectiveTargetDistanceForSession(pref, item);
  const dUnit = parseDistanceUnit(item.exercise.distanceUnit);

  await workouts.upsertWorkoutSet(userId, {
    sessionId,
    exerciseId,
    setIndex,
    weight,
    reps:
      timeMode || distanceMode
        ? null
        : Math.max(1, item.targetReps ?? 5),
    durationSec: timeMode ? targetDuration : null,
    distance:
      distanceMode && !item.logTimeForDistanceSets
        ? roundDistance(
            Math.max(
              dUnit === "m" ? 1 : 0.01,
              targetDist
            ),
            dUnit
          )
        : null,
  });
  revalidatePath(`/app/workouts/session/${sessionId}`);
  revalidatePath("/app");
  
}

/** Log a distance-template set using stopwatch time (`durationSec`) instead of distance. */
export async function actionLogDistanceTimeFromStopwatch(
  sessionId: string,
  exerciseId: string,
  setIndex: number,
  durationSec: number
) {
  const userId = await requireUserId();
  const session = await workouts.getSession(userId, sessionId);
  if (!session?.template) throw new Error("Invalid session");
  const item = session.template.items.find(
    (i) => i.exercise.id === exerciseId
  );
  if (!item) throw new Error("Exercise not in workout");
  const lk = parseExerciseLogKind(item.exercise.logKind);
  if (lk !== "distance" || !item.logTimeForDistanceSets) {
    throw new Error("Stopwatch logging is not enabled for this exercise");
  }

  const exSets = session.sets.filter((s) => s.exerciseId === exerciseId);
  const next = getNextOpenSetIndex(
    item.targetSets,
    exSets.map((s) => s.setIndex)
  );
  if (next !== setIndex) throw new Error("Log sets in order");

  const pref =
    session.exercisePrefs?.find((p) => p.exerciseId === exerciseId) ?? null;
  const weight = item.trackWeight
    ? suggestedWeightForSet(
        effectiveTemplateWeightForSession(pref, item.defaultWeight),
        exSets.map((s) => ({ setIndex: s.setIndex, weight: s.weight })),
        setIndex
      )
    : 0;

  const targetDuration = effectiveTargetDurationSecForSession(pref, item);
  const raw = Math.round(Number(durationSec));
  if (!Number.isFinite(raw)) throw new Error("Invalid duration");
  const clamped = Math.min(Math.max(1, raw), targetDuration);

  await workouts.upsertWorkoutSet(userId, {
    sessionId,
    exerciseId,
    setIndex,
    weight,
    reps: null,
    durationSec: clamped,
  });
  revalidatePath(`/app/workouts/session/${sessionId}`);
  revalidatePath("/app");
  
}

/** Log a timed set with an explicit hold duration (seconds), ≤ session target. */
export async function actionLogTimedSet(
  sessionId: string,
  exerciseId: string,
  setIndex: number,
  durationSec: number
) {
  const userId = await requireUserId();
  const session = await workouts.getSession(userId, sessionId);
  if (!session?.template) throw new Error("Invalid session");
  const item = session.template.items.find(
    (i) => i.exercise.id === exerciseId
  );
  if (!item) throw new Error("Exercise not in workout");

  const lk = parseExerciseLogKind(item.exercise.logKind);
  if (lk !== "time") throw new Error("Not a time-based exercise");

  const exSets = session.sets.filter((s) => s.exerciseId === exerciseId);
  const next = getNextOpenSetIndex(
    item.targetSets,
    exSets.map((s) => s.setIndex)
  );
  if (next !== setIndex) throw new Error("Log sets in order");

  const pref =
    session.exercisePrefs?.find((p) => p.exerciseId === exerciseId) ?? null;
  const weight = item.trackWeight
    ? suggestedWeightForSet(
        effectiveTemplateWeightForSession(pref, item.defaultWeight),
        exSets.map((s) => ({ setIndex: s.setIndex, weight: s.weight })),
        setIndex
      )
    : 0;

  const targetDuration = effectiveTargetDurationSecForSession(pref, item);
  const raw = Math.round(Number(durationSec));
  if (!Number.isFinite(raw)) throw new Error("Invalid duration");
  const clamped = Math.min(Math.max(1, raw), targetDuration);

  await workouts.upsertWorkoutSet(userId, {
    sessionId,
    exerciseId,
    setIndex,
    weight,
    reps: null,
    durationSec: clamped,
  });
  revalidatePath(`/app/workouts/session/${sessionId}`);
  revalidatePath("/app");
  
}

export async function actionDecrementSetReps(
  sessionId: string,
  exerciseId: string,
  setIndex: number
) {
  const userId = await requireUserId();
  const session = await workouts.getSession(userId, sessionId);
  if (!session?.template) throw new Error("Invalid session");
  const row = session.sets.find(
    (s) => s.exerciseId === exerciseId && s.setIndex === setIndex
  );
  if (!row) throw new Error("Set not found");

  const item = session.template.items.find(
    (i) => i.exercise.id === exerciseId
  );
  const lk = item ? parseExerciseLogKind(item.exercise.logKind) : "reps";
  const dUnit = item
    ? parseDistanceUnit(item.exercise.distanceUnit)
    : "km";

  if (row.durationSec != null) {
    await workouts.upsertWorkoutSet(userId, {
      sessionId,
      exerciseId,
      setIndex,
      weight: row.weight,
      durationSec: row.durationSec - 1,
    });
  } else if (row.distance != null && lk === "distance") {
    const step = sessionDistanceStep(dUnit);
    const next = roundDistance(row.distance - step, dUnit);
    await workouts.upsertWorkoutSet(userId, {
      sessionId,
      exerciseId,
      setIndex,
      weight: row.weight,
      distance: next,
    });
  } else {
    await workouts.upsertWorkoutSet(userId, {
      sessionId,
      exerciseId,
      setIndex,
      reps: (row.reps ?? 1) - 1,
      weight: row.weight,
    });
  }
  revalidatePath(`/app/workouts/session/${sessionId}`);
  revalidatePath("/app");
  
}

export async function actionCompleteWorkout(sessionId: string) {
  const userId = await requireUserId();
  await workouts.completeWorkout(userId, sessionId);
  revalidatePath("/app");
  revalidatePath("/app/workouts");
  revalidatePath(`/app/workouts/session/${sessionId}`);
  
}

export async function actionAbandonWorkout(sessionId: string) {
  const userId = await requireUserId();
  await workouts.abandonWorkout(userId, sessionId);
  revalidatePath("/app");
  revalidatePath("/app/workouts");
  
}
