import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useNavigate, Link } from "@tanstack/react-router";
import { useMemo, createContext, useContext, useState, useCallback, useEffect, useRef, useTransition } from "react";
import { Play, Pause, Square, RotateCcw, Flag, ChevronDown, Minus, Plus, CheckCircle, XCircle, ArrowLeft, Dumbbell } from "lucide-react";
import { v as parseExerciseLogKind, Q as getNextOpenSetIndex, S as suggestedWeightForSet, U as effectiveTemplateWeightForSession, w as parseDistanceUnit, C as resolveTemplateItemWeightUnit, W as baseWeightForSessionAdjust, x as roundDistance, X as effectiveTargetDurationSecForSession, Y as effectiveTargetDistanceForSession, Z as roundWorkingWeight, y as minPositiveDistance, _ as sessionDistanceStep, $ as SESSION_DURATION_STEP_SEC, a0 as sessionWeightStep, u as useDb, z as formatDistanceAmount, B as formatLoadNumber, a1 as Route, a2 as pullSyncCollectionFromScratch, e as pullSyncCollections, t as triggerSync } from "./router-CUOzYYmk.mjs";
import { c as updateLocal, s as softDeleteLocal, i as insertLocal, a as useLocalSession } from "./writes-C61wFNCm.mjs";
import { a as nowMs, n as newId } from "./ids-zMPBJmub.mjs";
import { u as useWorkoutLiveUi, p as patchWorkoutLiveUi, W as WorkoutElapsedTimer, a as WorkoutRestCountdown, g as getWorkoutLiveUi } from "./workout-live-ui-rILdFPTD.mjs";
import { B as Button, b as buttonVariants } from "./button-DbVXcFD_.mjs";
import { f as formatDurationSeconds } from "./format-duration-DOYRzqf7.mjs";
import { c as cn } from "./utils-H80jjgLf.mjs";
import { toast } from "sonner";
import { D as Dialog, f as DialogTrigger, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogDescription } from "./dialog-OkPnLnLD.mjs";
import "@capacitor/core";
import { b as useWorkoutMutations, g as useSession, c as useWorkoutTemplate, d as useTemplateItems, h as useSessionSets, i as useSessionExercisePrefs, e as useExercises } from "./workouts-DSVvumuN.mjs";
import "dexie";
import "dexie-react-hooks";
import "drizzle-zod";
import "drizzle-orm";
import "drizzle-orm/sqlite-core";
import "next-themes";
import "zod";
import "@libsql/client";
import "drizzle-orm/libsql";
import "jose";
import "@ai-sdk/anthropic";
import "ai";
import "node:crypto";
import "@better-auth/core/db";
import "@better-auth/core/env";
import "@better-auth/core/error";
import "@better-auth/kysely-adapter";
import "@better-auth/core/db/adapter";
import "kysely";
import "@better-auth/utils/password";
import "@noble/hashes/hkdf.js";
import "@noble/hashes/sha2.js";
import "@better-auth/core/utils/db";
import "@better-auth/core/utils/json";
import "@better-auth/utils/base64";
import "@better-auth/utils/binary";
import "@better-auth/utils/hmac";
import "@better-auth/core/utils/ip";
import "@better-auth/utils/hash";
import "@better-auth/core/context";
import "@better-auth/core/instrumentation";
import "@better-auth/core/utils/id";
import "defu";
import "@better-auth/core/utils/host";
import "@better-auth/core/utils/is-api-error";
import "@better-auth/core/utils/url";
import "@better-auth/core/api";
import "@better-auth/core/utils/deprecate";
import "@better-auth/utils/random";
import "@better-auth/utils";
import "@noble/ciphers/chacha.js";
import "@noble/ciphers/utils.js";
import "@better-auth/core/social-providers";
import "jose/errors";
import "better-call";
import "@better-auth/telemetry";
import "@better-auth/drizzle-adapter";
import "@base-ui/react/button";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@base-ui/react/dialog";
function isTimeItem(item) {
  return (item.exercise.logKind ?? "reps") === "time";
}
function isDistanceItem(item) {
  return (item.exercise.logKind ?? "reps") === "distance";
}
function prefFor(v, exerciseId) {
  return v.prefs.find((p) => p.exerciseId === exerciseId) ?? null;
}
function itemFor(v, exerciseId) {
  const it = v.items.find((i) => i.exerciseId === exerciseId);
  if (!it) throw new Error("Exercise not in session");
  return it;
}
function targetDurationForActive(v, exerciseId, item) {
  return effectiveTargetDurationSecForSession(prefFor(v, exerciseId), {
    targetDurationSec: item.targetDurationSec,
    exercise: { defaultDurationSec: item.exercise.defaultDurationSec }
  });
}
function targetDistanceForActive(v, exerciseId, item) {
  return effectiveTargetDistanceForSession(prefFor(v, exerciseId), {
    targetDistance: item.targetDistance,
    exercise: {
      defaultDistance: item.exercise.defaultDistance,
      distanceUnit: item.exercise.distanceUnit
    }
  });
}
async function loadWorkoutSessionView(db, _userId, sessionId) {
  const srow = await db.workoutSessions.get(sessionId);
  if (!srow || srow.deletedAt) return null;
  const templateId = srow.templateId;
  if (!templateId) {
    return {
      status: String(srow.status),
      templateId: null,
      items: [],
      sets: [],
      prefs: []
    };
  }
  const rawItems = await db.workoutTemplateItems.where("templateId").equals(templateId).toArray();
  const tItems = rawItems.filter((r) => r.deletedAt === null).sort((a, b) => a.order - b.order);
  const items = [];
  for (const ti of tItems) {
    const ex = await db.exercises.get(
      ti.exerciseId
    );
    if (!ex) continue;
    items.push({ ...ti, isWarmup: Boolean(ti.isWarmup), exercise: ex });
  }
  const allSets = await db.workoutSets.where("sessionId").equals(sessionId).toArray();
  const sets = allSets.filter((r) => r.deletedAt === null);
  const rawPrefs = await db.workoutSessionExercisePrefs.toArray().then(
    (rows) => rows.filter(
      (p) => p.sessionId === sessionId && p.deletedAt == null
    )
  );
  return {
    status: String(srow.status),
    templateId,
    items,
    sets,
    prefs: rawPrefs.map((p) => ({
      id: String(p.id),
      sessionId: String(p.sessionId),
      exerciseId: String(p.exerciseId),
      workingWeight: p.workingWeight ?? null,
      workingDurationSec: p.workingDurationSec ?? null,
      workingDistance: p.workingDistance ?? null
    }))
  };
}
async function findSet(db, sessionId, exerciseId, setIndex) {
  const all = await db.workoutSets.where("sessionId").equals(sessionId).toArray();
  return all.find(
    (r) => r.deletedAt == null && r.exerciseId === exerciseId && r.setIndex === setIndex
  );
}
async function hasHigherSet(db, sessionId, exerciseId, setIndex) {
  const all = await db.workoutSets.where("sessionId").equals(sessionId).toArray();
  return all.some(
    (r) => r.deletedAt == null && r.exerciseId === exerciseId && r.setIndex > setIndex
  );
}
async function clientUpsertWorkoutSet(db, userId, input) {
  const s = await loadWorkoutSessionView(db, userId, input.sessionId);
  if (!s || s.status !== "active") throw new Error("Invalid session");
  const item = itemFor(s, input.exerciseId);
  const timeMode = isTimeItem(item);
  const distanceMode = isDistanceItem(item);
  const durationAsDistance = distanceMode && item.logTimeForDistanceSets;
  const dUnit = parseDistanceUnit(item.exercise.distanceUnit);
  const weight = Number(input.weight);
  const existing = await findSet(
    db,
    input.sessionId,
    input.exerciseId,
    input.setIndex
  );
  if (timeMode || durationAsDistance) {
    const d = input.durationSec != null && Number.isFinite(input.durationSec) ? Math.round(input.durationSec) : null;
    if (existing) {
      if (d !== null && d < 1) {
        const higher = await hasHigherSet(
          db,
          input.sessionId,
          input.exerciseId,
          input.setIndex
        );
        if (higher) {
          const resetD = targetDurationForActive(
            s,
            input.exerciseId,
            item
          );
          await updateLocal(db.workoutSets, existing.id, {
            durationSec: resetD,
            reps: null,
            distance: null,
            weight: existing.weight,
            rpe: existing.rpe ?? null,
            completedAt: nowMs()
          });
          return;
        }
        await softDeleteLocal(db.workoutSets, existing.id);
        return;
      }
      if (d !== null) {
        await updateLocal(db.workoutSets, existing.id, {
          durationSec: d,
          reps: null,
          distance: null,
          weight,
          rpe: input.rpe ?? existing.rpe ?? null,
          completedAt: nowMs()
        });
        return;
      }
      return;
    }
    if (d === null || d < 1) throw new Error("Invalid duration");
    await insertLocal(db.workoutSets, {
      id: newId(),
      userId,
      sessionId: input.sessionId,
      exerciseId: input.exerciseId,
      setIndex: input.setIndex,
      reps: null,
      durationSec: d,
      distance: null,
      weight,
      rpe: input.rpe ?? null,
      completedAt: nowMs()
    });
    return;
  }
  if (distanceMode) {
    const minD = minPositiveDistance(dUnit);
    const dist = input.distance != null && Number.isFinite(input.distance) ? roundDistance(Number(input.distance), dUnit) : null;
    if (existing) {
      if (dist !== null && dist < minD) {
        const higher = await hasHigherSet(
          db,
          input.sessionId,
          input.exerciseId,
          input.setIndex
        );
        if (higher) {
          const resetDist = targetDistanceForActive(
            s,
            input.exerciseId,
            item
          );
          await updateLocal(db.workoutSets, existing.id, {
            distance: resetDist,
            reps: null,
            durationSec: null,
            weight: existing.weight,
            rpe: existing.rpe ?? null,
            completedAt: nowMs()
          });
          return;
        }
        await softDeleteLocal(db.workoutSets, existing.id);
        return;
      }
      if (dist !== null) {
        await updateLocal(db.workoutSets, existing.id, {
          distance: dist,
          reps: null,
          durationSec: null,
          weight,
          rpe: input.rpe ?? existing.rpe ?? null,
          completedAt: nowMs()
        });
        return;
      }
      return;
    }
    if (dist === null || dist < minD) throw new Error("Invalid distance");
    await insertLocal(db.workoutSets, {
      id: newId(),
      userId,
      sessionId: input.sessionId,
      exerciseId: input.exerciseId,
      setIndex: input.setIndex,
      reps: null,
      durationSec: null,
      distance: dist,
      weight,
      rpe: input.rpe ?? null,
      completedAt: nowMs()
    });
    return;
  }
  const reps = input.reps != null && Number.isFinite(input.reps) ? Math.round(input.reps) : NaN;
  if (existing) {
    if (!Number.isFinite(reps)) throw new Error("Invalid reps");
    if (reps < 1) {
      const higher = await hasHigherSet(
        db,
        input.sessionId,
        input.exerciseId,
        input.setIndex
      );
      if (higher) {
        const resetReps = Math.max(1, item.targetReps ?? 5);
        await updateLocal(db.workoutSets, existing.id, {
          reps: resetReps,
          durationSec: null,
          distance: null,
          weight: existing.weight,
          rpe: existing.rpe ?? null,
          completedAt: nowMs()
        });
        return;
      }
      await softDeleteLocal(db.workoutSets, existing.id);
      return;
    }
    await updateLocal(db.workoutSets, existing.id, {
      reps,
      durationSec: null,
      distance: null,
      weight,
      rpe: input.rpe ?? existing.rpe ?? null,
      completedAt: nowMs()
    });
    return;
  }
  if (!Number.isFinite(reps) || reps < 1) throw new Error("Invalid reps");
  await insertLocal(db.workoutSets, {
    id: newId(),
    userId,
    sessionId: input.sessionId,
    exerciseId: input.exerciseId,
    setIndex: input.setIndex,
    reps,
    durationSec: null,
    distance: null,
    weight,
    rpe: input.rpe ?? null,
    completedAt: nowMs()
  });
}
async function clientFillSetSlot(db, userId, sessionId, exerciseId, setIndex) {
  const s = await loadWorkoutSessionView(db, userId, sessionId);
  if (!s?.templateId) throw new Error("Invalid session");
  const item = itemFor(s, exerciseId);
  const exSets = s.sets.filter((x) => x.exerciseId === exerciseId);
  const next = getNextOpenSetIndex(
    item.targetSets,
    exSets.map((x) => x.setIndex)
  );
  if (next !== setIndex) throw new Error("Log sets in order");
  const lk = parseExerciseLogKind(item.exercise.logKind);
  if (lk === "distance" && item.logTimeForDistanceSets) {
    throw new Error("Log this set using the stopwatch");
  }
  const pref = prefFor(s, exerciseId);
  const weight = item.trackWeight ? suggestedWeightForSet(
    effectiveTemplateWeightForSession(pref, item.defaultWeight),
    exSets.map((x) => ({ setIndex: x.setIndex, weight: x.weight })),
    setIndex
  ) : 0;
  const targetDuration = effectiveTargetDurationSecForSession(pref, {
    targetDurationSec: item.targetDurationSec,
    exercise: { defaultDurationSec: item.exercise.defaultDurationSec }
  });
  const targetDist = effectiveTargetDistanceForSession(pref, {
    targetDistance: item.targetDistance,
    exercise: {
      defaultDistance: item.exercise.defaultDistance,
      distanceUnit: item.exercise.distanceUnit
    }
  });
  const dUnit = parseDistanceUnit(item.exercise.distanceUnit);
  await clientUpsertWorkoutSet(db, userId, {
    sessionId,
    exerciseId,
    setIndex,
    weight,
    reps: lk === "time" || lk === "distance" ? null : Math.max(1, item.targetReps ?? 5),
    durationSec: lk === "time" ? targetDuration : null,
    distance: lk === "distance" && !item.logTimeForDistanceSets ? roundDistance(
      Math.max(
        dUnit === "m" ? 1 : 0.01,
        targetDist
      ),
      dUnit
    ) : null
  });
}
async function clientDecrementSetReps(db, userId, sessionId, exerciseId, setIndex) {
  const s = await loadWorkoutSessionView(db, userId, sessionId);
  if (!s) throw new Error("Invalid session");
  const row = s.sets.find(
    (x) => x.exerciseId === exerciseId && x.setIndex === setIndex
  );
  if (!row) throw new Error("Set not found");
  const item = itemFor(s, exerciseId);
  const lk = parseExerciseLogKind(item.exercise.logKind);
  const dUnit = parseDistanceUnit(item.exercise.distanceUnit);
  if (row.durationSec != null) {
    await clientUpsertWorkoutSet(db, userId, {
      sessionId,
      exerciseId,
      setIndex,
      weight: row.weight,
      durationSec: row.durationSec - 1
    });
  } else if (row.distance != null && lk === "distance") {
    const step = sessionDistanceStep(dUnit);
    const next = roundDistance(row.distance - step, dUnit);
    await clientUpsertWorkoutSet(db, userId, {
      sessionId,
      exerciseId,
      setIndex,
      weight: row.weight,
      distance: next
    });
  } else {
    await clientUpsertWorkoutSet(db, userId, {
      sessionId,
      exerciseId,
      setIndex,
      weight: row.weight,
      reps: (row.reps ?? 1) - 1
    });
  }
}
async function clientUpsertSessionPref(db, userId, input) {
  const s = await loadWorkoutSessionView(db, userId, input.sessionId);
  if (!s || s.status !== "active") throw new Error("Invalid session");
  const item = itemFor(s, input.exerciseId);
  const dUnit = parseDistanceUnit(item.exercise.distanceUnit);
  const existing = s.prefs.find((p) => p.exerciseId === input.exerciseId);
  const w = input.workingWeight === void 0 ? existing?.workingWeight ?? null : input.workingWeight === null || !Number.isFinite(input.workingWeight) ? null : roundWorkingWeight(Number(input.workingWeight));
  const d = input.workingDurationSec === void 0 ? existing?.workingDurationSec ?? null : input.workingDurationSec === null || !Number.isFinite(input.workingDurationSec) ? null : Math.max(1, Math.round(Number(input.workingDurationSec)));
  const dist = input.workingDistance === void 0 ? existing?.workingDistance ?? null : input.workingDistance === null || !Number.isFinite(input.workingDistance) ? null : roundDistance(
    Math.max(
      minPositiveDistance(dUnit),
      Number(input.workingDistance)
    ),
    dUnit
  );
  if (existing) {
    await updateLocal(db.workoutSessionExercisePrefs, existing.id, {
      workingWeight: w,
      workingDurationSec: d,
      workingDistance: dist
    });
    return;
  }
  if (w === null && d === null && dist === null) return;
  await insertLocal(db.workoutSessionExercisePrefs, {
    id: newId(),
    userId,
    sessionId: input.sessionId,
    exerciseId: input.exerciseId,
    workingWeight: w,
    workingDurationSec: d,
    workingDistance: dist
  });
}
async function clientAdjustSessionExerciseWeight(db, userId, sessionId, exerciseId, direction) {
  const s = await loadWorkoutSessionView(db, userId, sessionId);
  if (!s) throw new Error("Invalid session");
  const item = itemFor(s, exerciseId);
  if (!item.trackWeight) throw new Error("Weight not tracked");
  const exSets = s.sets.filter((x) => x.exerciseId === exerciseId);
  const unit = resolveTemplateItemWeightUnit({
    weightUnit: item.weightUnit,
    exercise: { weightUnit: item.exercise.weightUnit }
  });
  const step = sessionWeightStep(unit);
  const delta = direction === "up" ? step : -step;
  const pref = prefFor(s, exerciseId);
  const base = baseWeightForSessionAdjust(
    pref,
    item.defaultWeight,
    exSets.map((x) => ({ setIndex: x.setIndex, weight: x.weight }))
  );
  const next = roundWorkingWeight(base + delta);
  await clientUpsertSessionPref(db, userId, {
    sessionId,
    exerciseId,
    workingWeight: next
  });
}
async function clientAdjustSessionExerciseDuration(db, userId, sessionId, exerciseId, direction) {
  const s = await loadWorkoutSessionView(db, userId, sessionId);
  if (!s) throw new Error("Invalid session");
  const item = itemFor(s, exerciseId);
  const can = isTimeItem(item) || isDistanceItem(item) && item.logTimeForDistanceSets;
  if (!can) throw new Error("Not a timed exercise");
  prefFor(s, exerciseId);
  const current = targetDurationForActive(s, exerciseId, item);
  const next = Math.max(
    1,
    Math.round(current + (direction === "up" ? SESSION_DURATION_STEP_SEC : -SESSION_DURATION_STEP_SEC))
  );
  await clientUpsertSessionPref(db, userId, {
    sessionId,
    exerciseId,
    workingDurationSec: next
  });
}
async function clientAdjustSessionExerciseTargetDistance(db, userId, sessionId, exerciseId, direction) {
  const s = await loadWorkoutSessionView(db, userId, sessionId);
  if (!s) throw new Error("Invalid session");
  const item = itemFor(s, exerciseId);
  if (!isDistanceItem(item)) throw new Error("Not a distance exercise");
  prefFor(s, exerciseId);
  const dUnit = parseDistanceUnit(item.exercise.distanceUnit);
  const current = targetDistanceForActive(s, exerciseId, item);
  const step = sessionDistanceStep(dUnit);
  const next = roundDistance(
    Math.max(minPositiveDistance(dUnit), current + (direction === "up" ? step : -step)),
    dUnit
  );
  await clientUpsertSessionPref(db, userId, {
    sessionId,
    exerciseId,
    workingDistance: next
  });
}
async function clientLogTimedSet(db, userId, sessionId, exerciseId, setIndex, durationSec) {
  const s = await loadWorkoutSessionView(db, userId, sessionId);
  if (!s) throw new Error("Invalid session");
  const item = itemFor(s, exerciseId);
  const lk = parseExerciseLogKind(item.exercise.logKind);
  if (lk !== "time") throw new Error("Not a time-based exercise");
  const exSets = s.sets.filter((x) => x.exerciseId === exerciseId);
  const next = getNextOpenSetIndex(
    item.targetSets,
    exSets.map((x) => x.setIndex)
  );
  if (next !== setIndex) throw new Error("Log sets in order");
  const pref = prefFor(s, exerciseId);
  const weight = item.trackWeight ? suggestedWeightForSet(
    effectiveTemplateWeightForSession(pref, item.defaultWeight),
    exSets.map((s2) => ({ setIndex: s2.setIndex, weight: s2.weight })),
    setIndex
  ) : 0;
  const targetDuration = targetDurationForActive(s, exerciseId, item);
  const raw = Math.round(Number(durationSec));
  if (!Number.isFinite(raw)) throw new Error("Invalid duration");
  const clamped = Math.min(Math.max(1, raw), targetDuration);
  await clientUpsertWorkoutSet(db, userId, {
    sessionId,
    exerciseId,
    setIndex,
    weight,
    reps: null,
    durationSec: clamped
  });
}
async function clientLogDistanceTimeFromStopwatch(db, userId, sessionId, exerciseId, setIndex, durationSec) {
  const s = await loadWorkoutSessionView(db, userId, sessionId);
  if (!s) throw new Error("Invalid session");
  const item = itemFor(s, exerciseId);
  const lk = parseExerciseLogKind(item.exercise.logKind);
  if (lk !== "distance" || !item.logTimeForDistanceSets) {
    throw new Error("Stopwatch logging is not enabled for this exercise");
  }
  const exSets = s.sets.filter((x) => x.exerciseId === exerciseId);
  const next = getNextOpenSetIndex(
    item.targetSets,
    exSets.map((x) => x.setIndex)
  );
  if (next !== setIndex) throw new Error("Log sets in order");
  const pref = prefFor(s, exerciseId);
  const weight = item.trackWeight ? suggestedWeightForSet(
    effectiveTemplateWeightForSession(pref, item.defaultWeight),
    exSets.map((s2) => ({ setIndex: s2.setIndex, weight: s2.weight })),
    setIndex
  ) : 0;
  const targetDuration = targetDurationForActive(s, exerciseId, item);
  const raw = Math.round(Number(durationSec));
  if (!Number.isFinite(raw)) throw new Error("Invalid duration");
  const clamped = Math.min(Math.max(1, raw), targetDuration);
  await clientUpsertWorkoutSet(db, userId, {
    sessionId,
    exerciseId,
    setIndex,
    weight,
    reps: null,
    durationSec: clamped
  });
}
const WorkoutSessionActionsContext = createContext(null);
function WorkoutSessionActionsProvider({
  children
}) {
  const { db, ready } = useDb();
  const { userId } = useLocalSession();
  const value = useMemo(() => {
    if (!ready || !db || !userId) return null;
    return {
      fillSetSlot: (sessionId, exerciseId, setIndex) => clientFillSetSlot(db, userId, sessionId, exerciseId, setIndex),
      decrementSetReps: (sessionId, exerciseId, setIndex) => clientDecrementSetReps(
        db,
        userId,
        sessionId,
        exerciseId,
        setIndex
      ),
      adjustSessionExerciseWeight: (sessionId, exerciseId, direction) => clientAdjustSessionExerciseWeight(
        db,
        userId,
        sessionId,
        exerciseId,
        direction
      ),
      adjustSessionExerciseDuration: (sessionId, exerciseId, direction) => clientAdjustSessionExerciseDuration(
        db,
        userId,
        sessionId,
        exerciseId,
        direction
      ),
      adjustSessionExerciseTargetDistance: (sessionId, exerciseId, direction) => clientAdjustSessionExerciseTargetDistance(
        db,
        userId,
        sessionId,
        exerciseId,
        direction
      ),
      logTimedSet: (sessionId, exerciseId, setIndex, durationSec) => clientLogTimedSet(
        db,
        userId,
        sessionId,
        exerciseId,
        setIndex,
        durationSec
      ),
      logDistanceTimeFromStopwatch: (sessionId, exerciseId, setIndex, durationSec) => clientLogDistanceTimeFromStopwatch(
        db,
        userId,
        sessionId,
        exerciseId,
        setIndex,
        durationSec
      )
    };
  }, [db, ready, userId]);
  if (!value) {
    return /* @__PURE__ */ jsx("p", { className: "text-muted-foreground py-10 text-center text-sm", children: "Loading…" });
  }
  return /* @__PURE__ */ jsx(WorkoutSessionActionsContext.Provider, { value, children });
}
function useWorkoutSessionActions() {
  const ctx = useContext(WorkoutSessionActionsContext);
  if (!ctx) {
    throw new Error("useWorkoutSessionActions: actions not available");
  }
  return ctx;
}
function TimeSetCountdown({
  sessionId,
  exerciseId,
  setIndex,
  targetSec,
  pending,
  runAction
}) {
  const actions = useWorkoutSessionActions();
  const [remainingSec, setRemainingSec] = useState(targetSec);
  const [running, setRunning] = useState(false);
  const logDuration = useCallback(
    (seconds) => {
      runAction(
        () => actions.logTimedSet(sessionId, exerciseId, setIndex, seconds)
      );
    },
    [actions, exerciseId, runAction, sessionId, setIndex]
  );
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRemainingSec((r) => {
        if (r <= 1) {
          queueMicrotask(() => {
            setRunning(false);
            logDuration(targetSec);
          });
          return 0;
        }
        return r - 1;
      });
    }, 1e3);
    return () => clearInterval(id);
  }, [running, logDuration, targetSec]);
  const elapsedSec = Math.max(0, targetSec - remainingSec);
  const hasStarted = elapsedSec > 0;
  const progress = targetSec > 0 ? Math.min(100, remainingSec / targetSec * 100) : 0;
  function onStartOrResume() {
    if (pending) return;
    setRunning(true);
  }
  function onPause() {
    if (pending) return;
    setRunning(false);
  }
  function onStopAndLog() {
    if (pending) return;
    setRunning(false);
    const elapsed = Math.max(1, targetSec - remainingSec);
    logDuration(Math.min(elapsed, targetSec));
  }
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: cn(
        "border-primary/25 from-primary/[0.12] shadow-primary/10 w-full min-w-0 rounded-2xl border bg-gradient-to-br via-background to-muted/30 p-4 shadow-md ring-1 ring-black/5 dark:ring-white/10",
        "basis-full"
      ),
      children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1 space-y-2", children: [
          /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground text-[0.65rem] font-semibold uppercase tracking-wider", children: [
            "Set ",
            setIndex,
            " · hold"
          ] }),
          /* @__PURE__ */ jsx(
            "p",
            {
              className: "text-foreground text-4xl font-bold tabular-nums tracking-tight sm:text-5xl",
              "aria-live": "polite",
              children: formatDurationSeconds(remainingSec)
            }
          ),
          /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground text-xs", children: [
            "Target ",
            formatDurationSeconds(targetSec),
            hasStarted ? /* @__PURE__ */ jsxs("span", { className: "text-foreground/90", children: [
              " ",
              "· held ",
              formatDurationSeconds(elapsedSec)
            ] }) : null
          ] }),
          /* @__PURE__ */ jsx("div", { className: "bg-muted h-2.5 overflow-hidden rounded-full", children: /* @__PURE__ */ jsx(
            "div",
            {
              className: "from-primary h-full rounded-full bg-gradient-to-r to-primary/80 transition-[width] duration-1000 ease-linear",
              style: { width: `${progress}%` }
            }
          ) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-center gap-2 sm:flex-col sm:justify-center", children: [
          !running ? /* @__PURE__ */ jsxs(
            Button,
            {
              type: "button",
              size: "lg",
              className: "min-h-12 min-w-[7.5rem] touch-manipulation gap-2 shadow-sm",
              disabled: pending || remainingSec <= 0,
              onClick: onStartOrResume,
              children: [
                /* @__PURE__ */ jsx(Play, { className: "size-5", "aria-hidden": true }),
                hasStarted ? "Resume" : "Start"
              ]
            }
          ) : /* @__PURE__ */ jsxs(
            Button,
            {
              type: "button",
              size: "lg",
              variant: "secondary",
              className: "min-h-12 min-w-[7.5rem] touch-manipulation gap-2 shadow-sm",
              disabled: pending,
              onClick: onPause,
              children: [
                /* @__PURE__ */ jsx(Pause, { className: "size-5", "aria-hidden": true }),
                "Pause"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            Button,
            {
              type: "button",
              size: "lg",
              variant: "outline",
              className: "min-h-12 min-w-[7.5rem] touch-manipulation gap-2 border-dashed",
              disabled: pending || !hasStarted || remainingSec >= targetSec,
              onClick: onStopAndLog,
              children: [
                /* @__PURE__ */ jsx(Square, { className: "size-4", "aria-hidden": true }),
                "Stop & log"
              ]
            }
          )
        ] })
      ] })
    }
  );
}
function DistanceStopwatch({
  sessionId,
  exerciseId,
  setIndex,
  targetLabel,
  logTimeInsteadOfDistance,
  pending,
  runAction
}) {
  const actions = useWorkoutSessionActions();
  const [elapsedSec, setElapsedSec] = useState(0);
  const [running, setRunning] = useState(false);
  const startedAtRef = useRef(null);
  const offsetRef = useRef(0);
  useEffect(() => {
    if (!running) return;
    startedAtRef.current = Date.now();
    const id = setInterval(() => {
      if (startedAtRef.current == null) return;
      const now = Date.now();
      setElapsedSec(offsetRef.current + (now - startedAtRef.current) / 1e3);
    }, 100);
    return () => clearInterval(id);
  }, [running]);
  function onStartResume() {
    if (pending) return;
    if (!running) {
      setRunning(true);
    }
  }
  function onPause() {
    if (pending) return;
    if (running && startedAtRef.current != null) {
      offsetRef.current += (Date.now() - startedAtRef.current) / 1e3;
      setElapsedSec(offsetRef.current);
    }
    startedAtRef.current = null;
    setRunning(false);
  }
  function onReset() {
    if (pending) return;
    startedAtRef.current = null;
    offsetRef.current = 0;
    setElapsedSec(0);
    setRunning(false);
  }
  function onLogSet() {
    if (pending) return;
    onPause();
    if (logTimeInsteadOfDistance) {
      const sec = Math.max(1, Math.floor(elapsedSec));
      runAction(
        () => actions.logDistanceTimeFromStopwatch(
          sessionId,
          exerciseId,
          setIndex,
          sec
        )
      );
    } else {
      runAction(() => actions.fillSetSlot(sessionId, exerciseId, setIndex));
    }
  }
  const displaySec = Math.floor(elapsedSec);
  const centi = Math.floor((elapsedSec - displaySec) * 100);
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: cn(
        "border-emerald-500/25 from-emerald-500/[0.08] shadow-emerald-950/10 w-full min-w-0 rounded-2xl border bg-gradient-to-br via-background to-teal-950/20 p-4 shadow-md ring-1 ring-black/5 dark:ring-white/10 dark:to-teal-950/30",
        "basis-full"
      ),
      children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1 space-y-2", children: [
          /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground text-[0.65rem] font-semibold uppercase tracking-wider", children: [
            "Set ",
            setIndex,
            " · stopwatch"
          ] }),
          /* @__PURE__ */ jsxs(
            "p",
            {
              className: "bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-4xl font-bold tabular-nums tracking-tight text-transparent dark:from-emerald-400 dark:to-teal-300 sm:text-5xl",
              "aria-live": "polite",
              children: [
                formatDurationSeconds(displaySec),
                /* @__PURE__ */ jsxs("span", { className: "text-emerald-600 dark:text-emerald-300/90 text-2xl sm:text-3xl", children: [
                  ".",
                  centi.toString().padStart(2, "0")
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-xs", children: logTimeInsteadOfDistance ? /* @__PURE__ */ jsxs(Fragment, { children: [
            "Goal",
            " ",
            /* @__PURE__ */ jsx("span", { className: "text-foreground font-medium", children: targetLabel }),
            ". Tap Log time to save your stopwatch reading (capped to the goal)."
          ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            "Log",
            " ",
            /* @__PURE__ */ jsx("span", { className: "text-foreground font-medium", children: targetLabel }),
            " ",
            "when you are done — the stopwatch is for your pace only."
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-stretch gap-2 sm:min-w-[10rem]", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap justify-center gap-2 sm:justify-end", children: [
            !running ? /* @__PURE__ */ jsxs(
              Button,
              {
                type: "button",
                size: "lg",
                className: "min-h-11 min-w-[6.5rem] touch-manipulation gap-2 bg-emerald-600 text-white shadow-sm hover:bg-emerald-600/90 dark:bg-emerald-600 dark:hover:bg-emerald-500",
                disabled: pending,
                onClick: onStartResume,
                children: [
                  /* @__PURE__ */ jsx(Play, { className: "size-5", "aria-hidden": true }),
                  displaySec > 0 ? "Resume" : "Start"
                ]
              }
            ) : /* @__PURE__ */ jsxs(
              Button,
              {
                type: "button",
                size: "lg",
                variant: "secondary",
                className: "min-h-11 min-w-[6.5rem] touch-manipulation gap-2",
                disabled: pending,
                onClick: onPause,
                children: [
                  /* @__PURE__ */ jsx(Pause, { className: "size-5", "aria-hidden": true }),
                  "Pause"
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              Button,
              {
                type: "button",
                size: "lg",
                variant: "outline",
                className: "min-h-11 min-w-[6.5rem] touch-manipulation gap-2",
                disabled: pending || elapsedSec === 0 && !running,
                onClick: onReset,
                children: [
                  /* @__PURE__ */ jsx(RotateCcw, { className: "size-4", "aria-hidden": true }),
                  "Reset"
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs(
            Button,
            {
              type: "button",
              size: "lg",
              className: "min-h-12 w-full touch-manipulation gap-2 shadow-md",
              disabled: pending,
              onClick: onLogSet,
              children: [
                /* @__PURE__ */ jsx(Flag, { className: "size-5", "aria-hidden": true }),
                logTimeInsteadOfDistance ? "Log time" : "Log distance"
              ]
            }
          )
        ] })
      ] })
    }
  );
}
function ExerciseSetButtons({
  sessionId,
  item,
  exSets,
  effectiveTargetSec,
  effectiveTargetDist,
  dUnit,
  pending,
  runAction,
  runSetLogAction
}) {
  const actions = useWorkoutSessionActions();
  const lk = parseExerciseLogKind(item.exercise.logKind);
  const timeMode = lk === "time";
  const distanceMode = lk === "distance";
  const logTimeForDistance = distanceMode && item.logTimeForDistanceSets;
  const nextOpen = getNextOpenSetIndex(
    item.targetSets,
    exSets.map((s) => s.setIndex)
  );
  const byIndex = new Map(exSets.map((s) => [s.setIndex, s]));
  const targetSec = effectiveTargetSec;
  const repCircle = "min-h-14 min-w-14 size-14 text-lg md:min-h-[3.25rem] md:min-w-[3.25rem] md:size-[3.25rem] md:text-lg";
  return /* @__PURE__ */ jsx("div", { className: "flex flex-wrap items-center gap-3", children: Array.from({ length: item.targetSets }, (_, i) => {
    const setIndex = i + 1;
    const row = byIndex.get(setIndex);
    const isNextSlot = nextOpen === setIndex;
    const isFuture = !row && !isNextSlot;
    const emptyLabel = timeMode ? formatDurationSeconds(targetSec) : distanceMode ? logTimeForDistance ? formatDurationSeconds(targetSec) : formatDistanceAmount(effectiveTargetDist, dUnit) : String(item.targetReps ?? "—");
    if (!row && isNextSlot && timeMode) {
      return /* @__PURE__ */ jsx(
        TimeSetCountdown,
        {
          sessionId,
          exerciseId: item.exercise.id,
          setIndex,
          targetSec,
          pending,
          runAction: runSetLogAction
        },
        `${item.exercise.id}-${setIndex}-${targetSec}`
      );
    }
    if (!row && isNextSlot && distanceMode) {
      return /* @__PURE__ */ jsx(
        DistanceStopwatch,
        {
          sessionId,
          exerciseId: item.exercise.id,
          setIndex,
          targetLabel: logTimeForDistance ? formatDurationSeconds(targetSec) : formatDistanceAmount(effectiveTargetDist, dUnit),
          logTimeInsteadOfDistance: logTimeForDistance,
          pending,
          runAction: runSetLogAction
        },
        `${item.exercise.id}-${setIndex}-${logTimeForDistance ? `t${targetSec}` : `d${effectiveTargetDist}`}`
      );
    }
    if (row) {
      if (timeMode && row.durationSec != null) {
        return /* @__PURE__ */ jsx(
          "div",
          {
            className: cn(
              "bg-primary text-primary-foreground flex shrink-0 items-center justify-center rounded-full px-2 font-semibold shadow-md ring-1 ring-primary/25 touch-manipulation",
              "min-h-14 min-w-14 text-base md:min-h-[3.25rem] md:min-w-[3.25rem] md:text-lg"
            ),
            title: "Timed set",
            children: formatDurationSeconds(row.durationSec)
          },
          setIndex
        );
      }
      if (distanceMode && logTimeForDistance && row.durationSec != null) {
        return /* @__PURE__ */ jsx(
          "div",
          {
            className: cn(
              "bg-primary text-primary-foreground flex shrink-0 items-center justify-center rounded-full px-2 font-semibold shadow-md ring-1 ring-primary/25 touch-manipulation",
              "min-h-14 min-w-14 text-base md:min-h-[3.25rem] md:min-w-[3.25rem] md:text-lg"
            ),
            title: "Time (distance workout)",
            children: formatDurationSeconds(row.durationSec)
          },
          setIndex
        );
      }
      if (distanceMode && row.distance != null) {
        return /* @__PURE__ */ jsx(
          "div",
          {
            className: cn(
              "bg-primary text-primary-foreground flex shrink-0 items-center justify-center rounded-full px-2 font-semibold shadow-md ring-1 ring-primary/25 touch-manipulation",
              "min-h-14 min-w-[4.5rem] text-base md:min-h-[3.25rem] md:min-w-[4.5rem] md:text-sm"
            ),
            title: "Distance set",
            children: formatDistanceAmount(row.distance, dUnit)
          },
          setIndex
        );
      }
      return /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          disabled: pending,
          "aria-label": `Set ${setIndex}, ${row.reps} reps, tap to decrease`,
          onClick: () => runAction(
            () => actions.decrementSetReps(
              sessionId,
              item.exercise.id,
              setIndex
            )
          ),
          className: cn(
            "bg-primary text-primary-foreground flex shrink-0 items-center justify-center rounded-full font-semibold shadow-md ring-1 ring-primary/25 transition-transform touch-manipulation",
            "hover:bg-primary/92 active:scale-95 disabled:opacity-60",
            repCircle
          ),
          children: row.reps ?? "—"
        },
        setIndex
      );
    }
    return /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        disabled: pending || isFuture,
        "aria-label": isNextSlot ? timeMode ? `Set ${setIndex}, tap to log ${targetSec}s` : distanceMode ? logTimeForDistance ? `Set ${setIndex}, use stopwatch to log time (${formatDurationSeconds(targetSec)} goal)` : `Set ${setIndex}, tap to log ${formatDistanceAmount(effectiveTargetDist, dUnit)}` : `Set ${setIndex}, tap to log ${item.targetReps} reps` : `Set ${setIndex} locked`,
        onClick: () => {
          if (!isNextSlot) return;
          runSetLogAction(
            () => actions.fillSetSlot(sessionId, item.exercise.id, setIndex)
          );
        },
        className: cn(
          "flex shrink-0 items-center justify-center rounded-full font-semibold transition-transform touch-manipulation",
          timeMode || distanceMode ? "min-h-14 min-w-[4.5rem] px-2 text-base md:min-h-[3.25rem] md:min-w-[3.25rem] md:px-1.5 md:text-sm" : repCircle,
          isNextSlot ? "bg-muted text-muted-foreground border-primary/35 hover:border-primary/55 border-2 border-dashed shadow-inner hover:bg-muted/80 active:scale-95" : "bg-muted/40 text-muted-foreground/45 cursor-not-allowed border border-border/40"
        ),
        children: emptyLabel
      },
      setIndex
    );
  }) });
}
function SessionExerciseTargets({
  sessionId,
  exerciseId,
  timeMode,
  distanceMode,
  logTimeForDistanceSets,
  trackWeight,
  sessionLoad,
  holdSec,
  targetDist,
  dUnit,
  weightUnit,
  pending,
  runAction
}) {
  const actions = useWorkoutSessionActions();
  const loadAtMin = sessionLoad <= 0;
  const holdAtMin = holdSec <= 1;
  const distAtMin = targetDist <= minPositiveDistance(dUnit) + 1e-9;
  const unitLabel = weightUnit;
  const showDistanceGoal = distanceMode && !logTimeForDistanceSets;
  const showDurationGoalForDistance = distanceMode && logTimeForDistanceSets;
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4", children: [
    timeMode ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2", children: [
      /* @__PURE__ */ jsx("span", { className: "text-muted-foreground text-xs font-medium uppercase tracking-wide", children: "Hold this session" }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            type: "button",
            variant: "outline",
            size: "icon",
            className: "size-11 shrink-0 touch-manipulation",
            disabled: pending || holdAtMin,
            "aria-label": "Decrease target hold time",
            onClick: () => runAction(
              () => actions.adjustSessionExerciseDuration(
                sessionId,
                exerciseId,
                "down"
              )
            ),
            children: /* @__PURE__ */ jsx(Minus, { className: "size-5", "aria-hidden": true })
          }
        ),
        /* @__PURE__ */ jsx("span", { className: "text-foreground min-w-[3.25rem] text-center text-base font-semibold tabular-nums", children: formatDurationSeconds(holdSec) }),
        /* @__PURE__ */ jsx(
          Button,
          {
            type: "button",
            variant: "outline",
            size: "icon",
            className: "size-11 shrink-0 touch-manipulation",
            disabled: pending,
            "aria-label": "Increase target hold time",
            onClick: () => runAction(
              () => actions.adjustSessionExerciseDuration(
                sessionId,
                exerciseId,
                "up"
              )
            ),
            children: /* @__PURE__ */ jsx(Plus, { className: "size-5", "aria-hidden": true })
          }
        )
      ] })
    ] }) : null,
    showDurationGoalForDistance ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2", children: [
      /* @__PURE__ */ jsx("span", { className: "text-muted-foreground text-xs font-medium uppercase tracking-wide", children: "Goal time this session" }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            type: "button",
            variant: "outline",
            size: "icon",
            className: "size-11 shrink-0 touch-manipulation",
            disabled: pending || holdAtMin,
            "aria-label": "Decrease goal time",
            onClick: () => runAction(
              () => actions.adjustSessionExerciseDuration(
                sessionId,
                exerciseId,
                "down"
              )
            ),
            children: /* @__PURE__ */ jsx(Minus, { className: "size-5", "aria-hidden": true })
          }
        ),
        /* @__PURE__ */ jsx("span", { className: "text-foreground min-w-[3.25rem] text-center text-base font-semibold tabular-nums", children: formatDurationSeconds(holdSec) }),
        /* @__PURE__ */ jsx(
          Button,
          {
            type: "button",
            variant: "outline",
            size: "icon",
            className: "size-11 shrink-0 touch-manipulation",
            disabled: pending,
            "aria-label": "Increase goal time",
            onClick: () => runAction(
              () => actions.adjustSessionExerciseDuration(
                sessionId,
                exerciseId,
                "up"
              )
            ),
            children: /* @__PURE__ */ jsx(Plus, { className: "size-5", "aria-hidden": true })
          }
        )
      ] })
    ] }) : null,
    showDistanceGoal ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2", children: [
      /* @__PURE__ */ jsx("span", { className: "text-muted-foreground text-xs font-medium uppercase tracking-wide", children: "Distance this session" }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            type: "button",
            variant: "outline",
            size: "icon",
            className: "size-11 shrink-0 touch-manipulation",
            disabled: pending || distAtMin,
            "aria-label": "Decrease target distance",
            onClick: () => runAction(
              () => actions.adjustSessionExerciseTargetDistance(
                sessionId,
                exerciseId,
                "down"
              )
            ),
            children: /* @__PURE__ */ jsx(Minus, { className: "size-5", "aria-hidden": true })
          }
        ),
        /* @__PURE__ */ jsx("span", { className: "text-foreground min-w-[4.5rem] text-center text-base font-semibold tabular-nums", children: formatDistanceAmount(targetDist, dUnit) }),
        /* @__PURE__ */ jsx(
          Button,
          {
            type: "button",
            variant: "outline",
            size: "icon",
            className: "size-11 shrink-0 touch-manipulation",
            disabled: pending,
            "aria-label": "Increase target distance",
            onClick: () => runAction(
              () => actions.adjustSessionExerciseTargetDistance(
                sessionId,
                exerciseId,
                "up"
              )
            ),
            children: /* @__PURE__ */ jsx(Plus, { className: "size-5", "aria-hidden": true })
          }
        )
      ] })
    ] }) : null,
    trackWeight ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2", children: [
      /* @__PURE__ */ jsx("span", { className: "text-muted-foreground text-xs font-medium uppercase tracking-wide", children: timeMode || distanceMode ? "Load this session" : "Weight this session" }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            type: "button",
            variant: "outline",
            size: "icon",
            className: "size-11 shrink-0 touch-manipulation",
            disabled: pending || loadAtMin,
            "aria-label": `Decrease session working weight (${unitLabel})`,
            onClick: () => runAction(
              () => actions.adjustSessionExerciseWeight(
                sessionId,
                exerciseId,
                "down"
              )
            ),
            children: /* @__PURE__ */ jsx(Minus, { className: "size-5", "aria-hidden": true })
          }
        ),
        /* @__PURE__ */ jsxs("span", { className: "text-foreground min-w-[4.5rem] text-center text-base font-semibold tabular-nums", children: [
          formatLoadNumber(sessionLoad),
          " ",
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground text-sm font-medium", children: unitLabel })
        ] }),
        /* @__PURE__ */ jsx(
          Button,
          {
            type: "button",
            variant: "outline",
            size: "icon",
            className: "size-11 shrink-0 touch-manipulation",
            disabled: pending,
            "aria-label": `Increase session working weight (${unitLabel})`,
            onClick: () => runAction(
              () => actions.adjustSessionExerciseWeight(sessionId, exerciseId, "up")
            ),
            children: /* @__PURE__ */ jsx(Plus, { className: "size-5", "aria-hidden": true })
          }
        )
      ] })
    ] }) : null
  ] });
}
function SessionTargetsAccordion({
  exerciseName,
  targetLabel,
  defaultWeight,
  weightUnit,
  trackWeight,
  sessionId,
  exerciseId,
  timeMode,
  distanceMode,
  logTimeForDistanceSets,
  sessionLoad,
  holdSec,
  targetDist,
  dUnit,
  pending,
  runAction
}) {
  const [open, setOpen] = useState(false);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-2", children: [
      /* @__PURE__ */ jsx("p", { className: "text-foreground font-heading min-w-0 flex-1 text-base font-semibold tracking-tight", children: exerciseName }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: () => setOpen((v) => !v),
          "aria-expanded": open,
          className: cn(
            "text-muted-foreground hover:text-foreground/90 inline-flex shrink-0 items-center gap-1 rounded-md py-0.5 text-sm tabular-nums outline-none touch-manipulation",
            "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            open && "text-foreground"
          ),
          children: [
            /* @__PURE__ */ jsxs("span", { className: "min-w-0 text-right leading-snug", children: [
              /* @__PURE__ */ jsx("span", { children: targetLabel }),
              trackWeight && defaultWeight != null && Number.isFinite(defaultWeight) ? /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground/90", children: [
                " ",
                "· ",
                formatLoadNumber(defaultWeight),
                " ",
                weightUnit
              ] }) : null
            ] }),
            /* @__PURE__ */ jsx(
              ChevronDown,
              {
                className: cn(
                  "text-muted-foreground size-4 shrink-0 opacity-80 transition-transform duration-200",
                  open && "-rotate-180"
                ),
                "aria-hidden": true
              }
            )
          ]
        }
      )
    ] }),
    open ? /* @__PURE__ */ jsx("div", { className: "border-border/70 mt-3 border-t border-dashed pt-3", children: /* @__PURE__ */ jsx(
      SessionExerciseTargets,
      {
        sessionId,
        exerciseId,
        timeMode,
        distanceMode,
        logTimeForDistanceSets,
        trackWeight,
        sessionLoad,
        holdSec,
        targetDist,
        dUnit,
        weightUnit,
        pending,
        runAction
      }
    ) }) : null
  ] });
}
function WorkoutSessionBoard({
  sessionId,
  items,
  sets,
  exercisePrefs,
  tab,
  onTabChange,
  onSetLogged
}) {
  const [pending, startTransition] = useTransition();
  const ordered = useMemo(
    () => [...items].sort((a, b) => a.order - b.order),
    [items]
  );
  const warmupOrdered = useMemo(
    () => ordered.filter((i) => i.isWarmup === true),
    [ordered]
  );
  const workoutOrdered = useMemo(
    () => ordered.filter((i) => i.isWarmup !== true),
    [ordered]
  );
  const activeList = tab === "warmup" ? warmupOrdered : workoutOrdered;
  const byExercise = useMemo(() => {
    const m = /* @__PURE__ */ new Map();
    for (const s of sets) {
      const list = m.get(s.exerciseId) ?? [];
      list.push(s);
      m.set(s.exerciseId, list);
    }
    for (const list of m.values()) {
      list.sort((a, b) => a.setIndex - b.setIndex);
    }
    return m;
  }, [sets]);
  const prefByExercise = useMemo(() => {
    const m = /* @__PURE__ */ new Map();
    for (const p of exercisePrefs) {
      m.set(p.exerciseId, p);
    }
    return m;
  }, [exercisePrefs]);
  function runAction(fn) {
    startTransition(async () => {
      try {
        await fn();
      } catch (e) {
        console.error(e);
      }
    });
  }
  function runSetLogAction(fn, restAfterLogSec) {
    startTransition(async () => {
      try {
        await fn();
        onSetLogged?.(restAfterLogSec);
      } catch (e) {
        console.error(e);
      }
    });
  }
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: cn(
        "-mx-5 rounded-none border border-border bg-card/90 px-4 pb-6 pt-4 shadow-lg ring-1 ring-foreground/10 backdrop-blur-sm md:mx-0 md:rounded-2xl",
        "from-primary/[0.07] bg-gradient-to-b to-transparent"
      ),
      children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-muted/80 mb-5 flex rounded-xl p-1 ring-1 ring-border/60 md:mb-6", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => onTabChange("workout"),
              className: cn(
                "min-h-12 flex-1 touch-manipulation rounded-lg py-2.5 text-sm font-semibold transition-all md:min-h-11 md:py-2",
                tab === "workout" ? "bg-background text-foreground shadow-sm ring-1 ring-border/70" : "text-muted-foreground hover:text-foreground/80"
              ),
              children: "Workout"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => onTabChange("warmup"),
              className: cn(
                "min-h-12 flex-1 touch-manipulation rounded-lg py-2.5 text-sm font-semibold transition-all md:min-h-11 md:py-2",
                tab === "warmup" ? "bg-background text-foreground shadow-sm ring-1 ring-border/70" : "text-muted-foreground hover:text-foreground/80"
              ),
              children: "Warmup"
            }
          )
        ] }),
        activeList.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-muted-foreground py-10 text-center text-sm", children: tab === "warmup" ? "No warm-up lifts in this template. Edit the workout to add or move exercises into the warm-up list." : ordered.length === 0 ? "No exercises in this template. Add lifts to the workout on the Workouts screen, then start again." : "No main lifts in this template—every exercise is marked as a warm-up. Use the Warmup tab, or edit the workout." }) : /* @__PURE__ */ jsx("ul", { className: "space-y-5 md:space-y-8", children: activeList.map((item) => {
          const exSets = byExercise.get(item.exercise.id) ?? [];
          const pref = prefByExercise.get(item.exercise.id) ?? null;
          const lk = parseExerciseLogKind(item.exercise.logKind);
          const timeMode = lk === "time";
          const distanceMode = lk === "distance";
          const dUnit = parseDistanceUnit(item.exercise.distanceUnit);
          const effectiveTargetSec = effectiveTargetDurationSecForSession(pref, item);
          const effectiveTargetDist = effectiveTargetDistanceForSession(pref, item);
          const sessionLoad = baseWeightForSessionAdjust(
            pref,
            item.defaultWeight,
            exSets.map((s) => ({ setIndex: s.setIndex, weight: s.weight }))
          );
          const targetLabel = timeMode ? `${item.targetSets}×${formatDurationSeconds(effectiveTargetSec)}` : distanceMode ? item.logTimeForDistanceSets ? `${item.targetSets}×${formatDurationSeconds(effectiveTargetSec)}` : `${item.targetSets}×${formatDistanceAmount(effectiveTargetDist, dUnit)}` : `${item.targetSets}×${item.targetReps ?? "—"}`;
          const wUnit = resolveTemplateItemWeightUnit({
            weightUnit: item.weightUnit,
            exercise: { weightUnit: item.exercise.weightUnit }
          });
          return /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs("div", { className: "border-border bg-muted/15 ring-foreground/5 rounded-xl border px-3 py-4 ring-1", children: [
            /* @__PURE__ */ jsx(
              SessionTargetsAccordion,
              {
                exerciseName: item.exercise.name,
                targetLabel,
                defaultWeight: item.defaultWeight,
                weightUnit: wUnit,
                trackWeight: item.trackWeight,
                sessionId,
                exerciseId: item.exercise.id,
                timeMode,
                distanceMode,
                logTimeForDistanceSets: item.logTimeForDistanceSets,
                sessionLoad,
                holdSec: effectiveTargetSec,
                targetDist: effectiveTargetDist,
                dUnit,
                pending,
                runAction
              }
            ),
            /* @__PURE__ */ jsx("div", { className: "mt-4", children: /* @__PURE__ */ jsx(
              ExerciseSetButtons,
              {
                sessionId,
                item,
                exSets,
                effectiveTargetSec,
                effectiveTargetDist,
                dUnit,
                pending,
                runAction,
                runSetLogAction: (fn) => runSetLogAction(
                  fn,
                  Math.max(0, item.restBetweenSetsSec ?? 0)
                )
              }
            ) })
          ] }) }, item.id);
        }) })
      ]
    }
  );
}
function WorkoutSessionFooter({ sessionId }) {
  const navigate = useNavigate();
  const { finishSession, abandonSession } = useWorkoutMutations();
  const [abandonOpen, setAbandonOpen] = useState(false);
  const [pending, setPending] = useState(null);
  async function onFinish() {
    setPending("finish");
    try {
      await finishSession(sessionId);
      toast.success("Workout logged");
      await navigate({ to: "/app/workouts" });
    } catch {
      toast.error("Could not finish workout");
    } finally {
      setPending(null);
    }
  }
  async function onAbandon() {
    setPending("abandon");
    try {
      await abandonSession(sessionId);
      toast.message("Workout abandoned");
      setAbandonOpen(false);
      await navigate({ to: "/app/workouts" });
    } catch {
      toast.error("Could not abandon workout");
    } finally {
      setPending(null);
    }
  }
  return /* @__PURE__ */ jsx("div", { className: "bg-background/95 supports-[backdrop-filter]:bg-background/80 fixed inset-x-0 bottom-[var(--app-mobile-tab-bar-height)] z-40 border-t p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md md:bottom-0 md:left-60 md:p-4 md:pb-[max(1rem,env(safe-area-inset-bottom))]", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto flex max-w-xl flex-col gap-2", children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        className: cn(
          buttonVariants(),
          "inline-flex min-h-12 w-full touch-manipulation items-center justify-center gap-2 text-base font-semibold shadow-sm"
        ),
        disabled: pending !== null,
        onClick: () => void onFinish(),
        children: [
          /* @__PURE__ */ jsx(CheckCircle, { className: "size-5", "aria-hidden": true }),
          pending === "finish" ? "Finishing…" : "Finish workout"
        ]
      }
    ),
    /* @__PURE__ */ jsxs(Dialog, { open: abandonOpen, onOpenChange: setAbandonOpen, children: [
      /* @__PURE__ */ jsxs(
        DialogTrigger,
        {
          type: "button",
          className: cn(
            buttonVariants({ variant: "ghost" }),
            "text-muted-foreground hover:text-foreground min-h-11 w-full touch-manipulation gap-2 text-sm"
          ),
          disabled: pending !== null,
          children: [
            /* @__PURE__ */ jsx(XCircle, { className: "size-4", "aria-hidden": true }),
            "Abandon workout…"
          ]
        }
      ),
      /* @__PURE__ */ jsxs(DialogContent, { className: "gap-4", children: [
        /* @__PURE__ */ jsxs(DialogHeader, { children: [
          /* @__PURE__ */ jsx(DialogTitle, { children: "Abandon this workout?" }),
          /* @__PURE__ */ jsx(DialogDescription, { children: "Your in-progress sets for this session will be discarded. This cannot be undone." })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            className: cn(
              buttonVariants({ variant: "destructive" }),
              "min-h-12 w-full touch-manipulation"
            ),
            disabled: pending === "abandon",
            onClick: () => void onAbandon(),
            children: pending === "abandon" ? "Abandoning…" : "Yes, abandon workout"
          }
        )
      ] })
    ] })
  ] }) });
}
function SessionPage() {
  const {
    sessionId
  } = Route.useParams();
  const navigate = useNavigate();
  const {
    ready
  } = useDb();
  const {
    userId,
    loading: tokenLoading
  } = useLocalSession();
  const {
    data: session,
    loading: sessionLoading
  } = useSession(sessionId);
  const {
    data: template
  } = useWorkoutTemplate(session?.templateId ?? null);
  const {
    data: plan,
    loading: planLoading
  } = useTemplateItems(session?.templateId ?? null);
  const {
    data: sets
  } = useSessionSets(sessionId);
  const {
    data: exercisePrefs
  } = useSessionExercisePrefs(sessionId);
  const {
    data: exercises,
    loading: exercisesLoading
  } = useExercises();
  const liveUi = useWorkoutLiveUi();
  const [boardTab, setBoardTab] = useState("workout");
  const bumpRestTimer = useCallback((restAfterLogSec) => {
    const s = Math.max(0, restAfterLogSec);
    patchWorkoutLiveUi({
      restDeadlineMs: s > 0 ? Date.now() + s * 1e3 : null
    });
  }, []);
  const exerciseMap = useMemo(() => {
    const m = /* @__PURE__ */ new Map();
    for (const e of exercises) m.set(e.id, e);
    return m;
  }, [exercises]);
  const boardItems = useMemo(() => {
    return plan.map((it) => {
      const ex = exerciseMap.get(it.exerciseId);
      if (!ex) return null;
      return {
        id: it.id,
        order: it.order,
        targetSets: it.targetSets,
        targetReps: it.targetReps,
        targetDurationSec: it.targetDurationSec,
        targetDistance: it.targetDistance,
        logTimeForDistanceSets: it.logTimeForDistanceSets,
        defaultWeight: it.defaultWeight,
        weightUnit: it.weightUnit,
        trackWeight: it.trackWeight,
        isWarmup: Boolean(it.isWarmup),
        restBetweenSetsSec: it.restBetweenSetsSec ?? null,
        exercise: {
          id: ex.id,
          name: ex.name,
          logKind: ex.logKind,
          defaultDurationSec: ex.defaultDurationSec,
          defaultDistance: ex.defaultDistance,
          distanceUnit: ex.distanceUnit,
          weightUnit: ex.weightUnit
        }
      };
    }).filter((x) => x !== null);
  }, [plan, exerciseMap]);
  const setRows = useMemo(() => sets.map((s) => ({
    exerciseId: s.exerciseId,
    setIndex: s.setIndex,
    reps: s.reps,
    durationSec: s.durationSec,
    distance: s.distance,
    weight: s.weight
  })), [sets]);
  const prefRows = useMemo(() => exercisePrefs.map((p) => ({
    exerciseId: p.exerciseId,
    workingWeight: p.workingWeight,
    workingDurationSec: p.workingDurationSec,
    workingDistance: p.workingDistance
  })), [exercisePrefs]);
  const currentExerciseName = useMemo(() => {
    const ordered = [...boardItems].sort((a, b) => a.order - b.order);
    const list = boardTab === "warmup" ? ordered.filter((i) => i.isWarmup === true) : ordered.filter((i) => i.isWarmup !== true);
    const sorted = [...list].sort((a, b) => a.order - b.order);
    const byExercise = /* @__PURE__ */ new Map();
    for (const s of setRows) {
      const arr = byExercise.get(s.exerciseId) ?? [];
      arr.push(s);
      byExercise.set(s.exerciseId, arr);
    }
    for (const arr of byExercise.values()) {
      arr.sort((a, b) => a.setIndex - b.setIndex);
    }
    for (const item of sorted) {
      const exSets = byExercise.get(item.exercise.id) ?? [];
      const next = getNextOpenSetIndex(item.targetSets, exSets.map((s) => s.setIndex));
      if (next != null) return item.exercise.name;
    }
    return null;
  }, [boardItems, setRows, boardTab]);
  useEffect(() => {
    if (!session || session.status !== "active") return;
    const store = getWorkoutLiveUi();
    if (store.sessionId != null && store.sessionId !== session.id) {
      patchWorkoutLiveUi({
        sessionId: session.id,
        restDeadlineMs: null,
        currentExerciseName: null
      });
    } else {
      patchWorkoutLiveUi({
        sessionId: session.id
      });
    }
  }, [session?.id, session?.status]);
  useEffect(() => {
    if (!session || session.status !== "active") return;
    patchWorkoutLiveUi({
      currentExerciseName
    });
  }, [session?.id, session?.status, currentExerciseName]);
  useEffect(() => {
    if (session && session.status !== "active" && !sessionLoading) {
      void navigate({
        to: "/app/workouts"
      });
    }
  }, [session, sessionLoading, navigate]);
  const catalogGap = Boolean(session?.templateId && userId) && plan.length > 0 && boardItems.length === 0;
  const [catalogSyncPhase, setCatalogSyncPhase] = useState("idle");
  const runCatalogPull = useCallback(async () => {
    await pullSyncCollectionFromScratch("exercises");
    await pullSyncCollections(["workoutTemplateItems"]);
    triggerSync();
  }, []);
  useEffect(() => {
    if (!catalogGap) {
      setCatalogSyncPhase("idle");
      return;
    }
    if (!ready) return;
    let cancelled = false;
    setCatalogSyncPhase("syncing");
    void (async () => {
      try {
        await runCatalogPull();
      } finally {
        if (!cancelled) setCatalogSyncPhase("done");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [catalogGap, ready, runCatalogPull, session?.templateId]);
  const retryCatalogSync = useCallback(() => {
    setCatalogSyncPhase("syncing");
    void (async () => {
      try {
        await runCatalogPull();
      } finally {
        setCatalogSyncPhase("done");
      }
    })();
  }, [runCatalogPull]);
  const boardDataLoading = Boolean(session?.templateId) && (planLoading || exercisesLoading);
  const catalogStillLoading = catalogGap && catalogSyncPhase !== "done";
  if (!ready || sessionLoading || tokenLoading || boardDataLoading || catalogStillLoading) {
    return /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-center py-10", children: catalogStillLoading ? "Fetching exercise library…" : "Loading…" });
  }
  if (!session || !session.templateId) {
    return /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-center py-10", children: "Session not found." });
  }
  if (session.status !== "active") {
    return /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-center py-10", children: "Redirecting…" });
  }
  const startedAtMs = session.startedAt;
  const initialElapsedSec = Math.max(0, Math.floor((Date.now() - startedAtMs) / 1e3));
  const restDeadlineMs = liveUi.sessionId === session.id ? liveUi.restDeadlineMs : null;
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto w-full max-w-xl space-y-6 pb-48 md:pb-32", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/app/workouts", className: cn(buttonVariants({
        variant: "ghost",
        size: "sm"
      }), "min-h-11 -ml-2 gap-2"), children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "size-4", "aria-hidden": true }),
        "Exit"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-row flex-wrap items-end justify-end gap-x-4 gap-y-1", children: [
        /* @__PURE__ */ jsx(WorkoutElapsedTimer, { startedAtMs, initialElapsedSec }),
        restDeadlineMs != null ? /* @__PURE__ */ jsx(WorkoutRestCountdown, { deadlineMs: restDeadlineMs }) : null
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("h1", { className: "flex items-center gap-2.5 text-2xl font-semibold tracking-tight", children: [
      /* @__PURE__ */ jsx("span", { className: "bg-primary/15 text-primary ring-primary/15 inline-flex size-10 items-center justify-center rounded-2xl ring-1", children: /* @__PURE__ */ jsx(Dumbbell, { className: "size-5", strokeWidth: 2.25, "aria-hidden": true }) }),
      template?.name ?? "Workout"
    ] }) }),
    !userId ? /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-center text-sm", children: "Sign in to log sets." }) : /* @__PURE__ */ jsxs(WorkoutSessionActionsProvider, { children: [
      catalogGap ? /* @__PURE__ */ jsxs("div", { className: "space-y-3 rounded-xl border border-border bg-card/80 px-4 py-5 text-center shadow-sm", children: [
        /* @__PURE__ */ jsx("p", { className: "text-foreground text-sm", children: "This workout uses exercises that are not in this browser yet (usually the preset library). We tried refreshing from the server—if it still fails, check that you are signed in and tap retry." }),
        /* @__PURE__ */ jsx(Button, { type: "button", variant: "secondary", className: "touch-manipulation", disabled: catalogSyncPhase === "syncing", onClick: () => retryCatalogSync(), children: catalogSyncPhase === "syncing" ? "Syncing…" : "Retry sync" })
      ] }) : /* @__PURE__ */ jsx(WorkoutSessionBoard, { sessionId: session.id, items: boardItems, sets: setRows, exercisePrefs: prefRows, tab: boardTab, onTabChange: setBoardTab, onSetLogged: bumpRestTimer }),
      /* @__PURE__ */ jsx(WorkoutSessionFooter, { sessionId: session.id })
    ] })
  ] });
}
export {
  SessionPage as component
};
