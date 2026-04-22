import { useCallback } from "react";
import { useLocalSession } from "./session";
import { useDb } from "@/lib/client/db/provider";
import { useLiveArray, useLiveOne } from "@/lib/client/db/hooks";
import {
  insertLocal,
  softDeleteLocal,
  updateLocal,
} from "@/lib/client/db/writes";
import { newId, nowMs } from "./ids";

export interface RoutineGroup {
  id: string;
  userId: string;
  name: string;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
  rev: number;
}

export interface WorkoutTemplate {
  id: string;
  userId: string;
  name: string;
  notes: string | null;
  routineGroupId: string | null;
  routineOrder: number | null;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
  rev: number;
}

export interface TemplateItem {
  id: string;
  userId: string;
  templateId: string;
  exerciseId: string;
  order: number;
  targetSets: number;
  targetReps: number | null;
  targetDurationSec: number | null;
  targetDistance: number | null;
  defaultWeight: number | null;
  weightUnit: string | null;
  progressiveOverloadEnabled: boolean;
  progressiveOverloadIncrement: number | null;
  progressiveOverloadRequireFullCompletion: boolean;
  trackWeight: boolean;
  logTimeForDistanceSets: boolean;
  updatedAt: number;
  deletedAt: number | null;
  rev: number;
}

export interface Exercise {
  id: string;
  userId: string | null;
  name: string;
  muscleGroup: string | null;
  logKind: "reps" | "time" | "distance";
  defaultDurationSec: number | null;
  defaultDistance: number | null;
  distanceUnit: string;
  weightUnit: string;
  trackWeight: boolean;
  isCustom: boolean;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
  rev: number;
}

export interface WorkoutSession {
  id: string;
  userId: string;
  templateId: string | null;
  startedAt: number;
  endedAt: number | null;
  status: "active" | "completed" | "discarded";
  updatedAt: number;
  deletedAt: number | null;
  rev: number;
}

export interface WorkoutSet {
  id: string;
  userId: string;
  sessionId: string;
  exerciseId: string;
  setIndex: number;
  reps: number | null;
  durationSec: number | null;
  distance: number | null;
  weight: number;
  rpe: number | null;
  completedAt: number;
  updatedAt: number;
  deletedAt: number | null;
  rev: number;
}

/* --------------------------------------------------------------------------
 * Reads
 * ----------------------------------------------------------------------- */

export function useRoutineGroups() {
  const { db } = useDb();
  const { userId } = useLocalSession();
  return useLiveArray<RoutineGroup>(
    async () => {
      if (!db || !userId) return [];
      const rows = (await db.workoutRoutineGroups
        .where("userId")
        .equals(userId)
        .filter((r) => r.deletedAt === null)
        .toArray()) as unknown as RoutineGroup[];
      return rows.sort(
        (a, b) => a.sortOrder - b.sortOrder || a.createdAt - b.createdAt
      );
    },
    [db, userId]
  );
}

export function useWorkoutTemplates() {
  const { db } = useDb();
  const { userId } = useLocalSession();
  return useLiveArray<WorkoutTemplate>(
    async () => {
      if (!db || !userId) return [];
      const rows = (await db.workoutTemplates
        .where("userId")
        .equals(userId)
        .filter((r) => r.deletedAt === null)
        .toArray()) as unknown as WorkoutTemplate[];
      return rows.sort((a, b) => {
        const ao = a.routineOrder ?? Number.MAX_SAFE_INTEGER;
        const bo = b.routineOrder ?? Number.MAX_SAFE_INTEGER;
        return ao - bo || a.createdAt - b.createdAt;
      });
    },
    [db, userId]
  );
}

export function useWorkoutTemplate(id: string | null) {
  const { db } = useDb();
  return useLiveOne<WorkoutTemplate>(
    async () => {
      if (!db || !id) return null;
      return ((await db.workoutTemplates.get(id)) as unknown as
        | WorkoutTemplate
        | undefined) ?? null;
    },
    [db, id]
  );
}

export function useTemplateItems(templateId: string | null) {
  const { db } = useDb();
  return useLiveArray<TemplateItem>(
    async () => {
      if (!db || !templateId) return [];
      const rows = (await db.workoutTemplateItems
        .where("templateId")
        .equals(templateId)
        .filter((r) => r.deletedAt === null)
        .toArray()) as unknown as TemplateItem[];
      return rows.sort((a, b) => a.order - b.order);
    },
    [db, templateId]
  );
}

export function useExercises() {
  const { db } = useDb();
  const { userId } = useLocalSession();
  return useLiveArray<Exercise>(
    async () => {
      if (!db) return [];
      const rows = (await db.exercises
        .filter(
          (r) =>
            r.deletedAt === null && (r.userId === userId || r.userId === null)
        )
        .toArray()) as unknown as Exercise[];
      return rows.sort((a, b) => a.name.localeCompare(b.name));
    },
    [db, userId]
  );
}

export function useSession(id: string | null) {
  const { db } = useDb();
  return useLiveOne<WorkoutSession>(
    async () => {
      if (!db || !id) return null;
      return ((await db.workoutSessions.get(id)) as unknown as
        | WorkoutSession
        | undefined) ?? null;
    },
    [db, id]
  );
}

export function useActiveSession() {
  const { db } = useDb();
  const { userId } = useLocalSession();
  return useLiveOne<WorkoutSession>(
    async () => {
      if (!db || !userId) return null;
      const rows = (await db.workoutSessions
        .where("[userId+status+startedAt]")
        .between(
          [userId, "active", 0],
          [userId, "active", Number.MAX_SAFE_INTEGER]
        )
        .reverse()
        .toArray()) as unknown as WorkoutSession[];
      return rows.find((r) => r.deletedAt === null) ?? null;
    },
    [db, userId]
  );
}

export function useSessionSets(sessionId: string | null) {
  const { db } = useDb();
  return useLiveArray<WorkoutSet>(
    async () => {
      if (!db || !sessionId) return [];
      const rows = (await db.workoutSets
        .where("sessionId")
        .equals(sessionId)
        .filter((r) => r.deletedAt === null)
        .toArray()) as unknown as WorkoutSet[];
      return rows.sort((a, b) => a.setIndex - b.setIndex);
    },
    [db, sessionId]
  );
}

/* --------------------------------------------------------------------------
 * Mutations
 * ----------------------------------------------------------------------- */

export function useWorkoutMutations() {
  const { db, ready } = useDb();
  const { userId } = useLocalSession();

  const createRoutineGroup = useCallback(
    async (name: string) => {
      if (!ready || !db || !userId) throw new Error("Not ready");
      const id = newId();
      await insertLocal(db.workoutRoutineGroups, {
        id,
        userId,
        name,
        sortOrder: 0,
        createdAt: nowMs(),
      });
      return id;
    },
    [db, ready, userId]
  );

  const renameRoutineGroup = useCallback(
    async (id: string, name: string) => {
      if (!ready || !db) throw new Error("Not ready");
      await updateLocal(db.workoutRoutineGroups, id, { name });
    },
    [db, ready]
  );

  const deleteRoutineGroup = useCallback(
    async (id: string) => {
      if (!ready || !db) throw new Error("Not ready");
      await softDeleteLocal(db.workoutRoutineGroups, id);
    },
    [db, ready]
  );

  const createTemplate = useCallback(
    async (
      input: Omit<
        WorkoutTemplate,
        "id" | "userId" | "updatedAt" | "deletedAt" | "rev" | "createdAt"
      >
    ) => {
      if (!ready || !db || !userId) throw new Error("Not ready");
      const id = newId();
      await insertLocal(db.workoutTemplates, {
        id,
        userId,
        ...input,
        createdAt: nowMs(),
      });
      return id;
    },
    [db, ready, userId]
  );

  const updateTemplate = useCallback(
    async (id: string, patch: Partial<WorkoutTemplate>) => {
      if (!ready || !db) throw new Error("Not ready");
      await updateLocal(db.workoutTemplates, id, patch);
    },
    [db, ready]
  );

  const deleteTemplate = useCallback(
    async (id: string) => {
      if (!ready || !db) throw new Error("Not ready");
      await softDeleteLocal(db.workoutTemplates, id);
    },
    [db, ready]
  );

  const addTemplateItem = useCallback(
    async (
      input: Omit<
        TemplateItem,
        "id" | "userId" | "updatedAt" | "deletedAt" | "rev"
      >
    ) => {
      if (!ready || !db || !userId) throw new Error("Not ready");
      const id = newId();
      await insertLocal(db.workoutTemplateItems, { id, userId, ...input });
      return id;
    },
    [db, ready, userId]
  );

  const updateTemplateItem = useCallback(
    async (id: string, patch: Partial<TemplateItem>) => {
      if (!ready || !db) throw new Error("Not ready");
      await updateLocal(db.workoutTemplateItems, id, patch);
    },
    [db, ready]
  );

  const deleteTemplateItem = useCallback(
    async (id: string) => {
      if (!ready || !db) throw new Error("Not ready");
      await softDeleteLocal(db.workoutTemplateItems, id);
    },
    [db, ready]
  );

  const createExercise = useCallback(
    async (
      input: Omit<
        Exercise,
        "id" | "userId" | "updatedAt" | "deletedAt" | "rev" | "createdAt"
      >
    ) => {
      if (!ready || !db || !userId) throw new Error("Not ready");
      const id = newId();
      await insertLocal(db.exercises, {
        id,
        userId,
        ...input,
        createdAt: nowMs(),
      });
      return id;
    },
    [db, ready, userId]
  );

  const startSession = useCallback(
    async (templateId: string | null) => {
      if (!ready || !db || !userId) throw new Error("Not ready");
      const id = newId();
      await insertLocal(db.workoutSessions, {
        id,
        userId,
        templateId,
        startedAt: nowMs(),
        endedAt: null,
        status: "active",
      });
      return id;
    },
    [db, ready, userId]
  );

  const finishSession = useCallback(
    async (id: string) => {
      if (!ready || !db) throw new Error("Not ready");
      await updateLocal(db.workoutSessions, id, {
        status: "completed",
        endedAt: nowMs(),
      });
    },
    [db, ready]
  );

  const logSet = useCallback(
    async (
      input: Omit<
        WorkoutSet,
        "id" | "userId" | "updatedAt" | "deletedAt" | "rev" | "completedAt"
      > & { completedAt?: number }
    ) => {
      if (!ready || !db || !userId) throw new Error("Not ready");
      const id = newId();
      await insertLocal(db.workoutSets, {
        id,
        userId,
        ...input,
        completedAt: input.completedAt ?? nowMs(),
      });
      return id;
    },
    [db, ready, userId]
  );

  const deleteSet = useCallback(
    async (id: string) => {
      if (!ready || !db) throw new Error("Not ready");
      await softDeleteLocal(db.workoutSets, id);
    },
    [db, ready]
  );

  return {
    createRoutineGroup,
    renameRoutineGroup,
    deleteRoutineGroup,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    addTemplateItem,
    updateTemplateItem,
    deleteTemplateItem,
    createExercise,
    startSession,
    finishSession,
    logSet,
    deleteSet,
  };
}
