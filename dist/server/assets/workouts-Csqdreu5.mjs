import { useCallback } from "react";
import { u as useLocalSession } from "./session-CyYyvQL9.mjs";
import { u as useDb } from "./router-kvjOiOR_.mjs";
import { u as useLiveArray, a as useLiveOne } from "./hooks-Ccy1wbDZ.mjs";
import { i as insertLocal, u as updateLocal, s as softDeleteLocal } from "./writes-CNff-rob.mjs";
import { n as newId, a as nowMs } from "./ids-zMPBJmub.mjs";
function useRoutineGroups() {
  const { db } = useDb();
  const { userId } = useLocalSession();
  return useLiveArray(
    async () => {
      if (!db || !userId) return [];
      const rows = await db.workoutRoutineGroups.where("userId").equals(userId).filter((r) => r.deletedAt === null).toArray();
      return rows.sort(
        (a, b) => a.sortOrder - b.sortOrder || a.createdAt - b.createdAt
      );
    },
    [db, userId]
  );
}
function useWorkoutTemplates() {
  const { db } = useDb();
  const { userId } = useLocalSession();
  return useLiveArray(
    async () => {
      if (!db || !userId) return [];
      const rows = await db.workoutTemplates.where("userId").equals(userId).filter((r) => r.deletedAt === null).toArray();
      return rows.sort((a, b) => {
        const ao = a.routineOrder ?? Number.MAX_SAFE_INTEGER;
        const bo = b.routineOrder ?? Number.MAX_SAFE_INTEGER;
        return ao - bo || a.createdAt - b.createdAt;
      });
    },
    [db, userId]
  );
}
function useWorkoutTemplate(id) {
  const { db } = useDb();
  return useLiveOne(
    async () => {
      if (!db || !id) return null;
      return await db.workoutTemplates.get(id) ?? null;
    },
    [db, id]
  );
}
function useTemplateItems(templateId) {
  const { db } = useDb();
  return useLiveArray(
    async () => {
      if (!db || !templateId) return [];
      const rows = await db.workoutTemplateItems.where("templateId").equals(templateId).filter((r) => r.deletedAt === null).toArray();
      return rows.sort((a, b) => a.order - b.order);
    },
    [db, templateId]
  );
}
function useExercises() {
  const { db } = useDb();
  const { userId } = useLocalSession();
  return useLiveArray(
    async () => {
      if (!db) return [];
      const rows = await db.exercises.filter(
        (r) => r.deletedAt === null && (r.userId === userId || r.userId === null)
      ).toArray();
      return rows.sort((a, b) => a.name.localeCompare(b.name));
    },
    [db, userId]
  );
}
function useSession(id) {
  const { db } = useDb();
  return useLiveOne(
    async () => {
      if (!db || !id) return null;
      return await db.workoutSessions.get(id) ?? null;
    },
    [db, id]
  );
}
function useActiveSession() {
  const { db } = useDb();
  const { userId } = useLocalSession();
  return useLiveOne(
    async () => {
      if (!db || !userId) return null;
      const rows = await db.workoutSessions.where("[userId+status+startedAt]").between(
        [userId, "active", 0],
        [userId, "active", Number.MAX_SAFE_INTEGER]
      ).reverse().toArray();
      return rows.find((r) => r.deletedAt === null) ?? null;
    },
    [db, userId]
  );
}
function useSessionSets(sessionId) {
  const { db } = useDb();
  return useLiveArray(
    async () => {
      if (!db || !sessionId) return [];
      const rows = await db.workoutSets.where("sessionId").equals(sessionId).filter((r) => r.deletedAt === null).toArray();
      return rows.sort((a, b) => a.setIndex - b.setIndex);
    },
    [db, sessionId]
  );
}
function useWorkoutMutations() {
  const { db, ready } = useDb();
  const { userId } = useLocalSession();
  const createRoutineGroup = useCallback(
    async (name) => {
      if (!ready || !db || !userId) throw new Error("Not ready");
      const id = newId();
      await insertLocal(db.workoutRoutineGroups, {
        id,
        userId,
        name,
        sortOrder: 0,
        createdAt: nowMs()
      });
      return id;
    },
    [db, ready, userId]
  );
  const renameRoutineGroup = useCallback(
    async (id, name) => {
      if (!ready || !db) throw new Error("Not ready");
      await updateLocal(db.workoutRoutineGroups, id, { name });
    },
    [db, ready]
  );
  const deleteRoutineGroup = useCallback(
    async (id) => {
      if (!ready || !db) throw new Error("Not ready");
      await softDeleteLocal(db.workoutRoutineGroups, id);
    },
    [db, ready]
  );
  const createTemplate = useCallback(
    async (input) => {
      if (!ready || !db || !userId) throw new Error("Not ready");
      const id = newId();
      await insertLocal(db.workoutTemplates, {
        id,
        userId,
        ...input,
        createdAt: nowMs()
      });
      return id;
    },
    [db, ready, userId]
  );
  const updateTemplate = useCallback(
    async (id, patch) => {
      if (!ready || !db) throw new Error("Not ready");
      await updateLocal(db.workoutTemplates, id, patch);
    },
    [db, ready]
  );
  const deleteTemplate = useCallback(
    async (id) => {
      if (!ready || !db) throw new Error("Not ready");
      await softDeleteLocal(db.workoutTemplates, id);
    },
    [db, ready]
  );
  const addTemplateItem = useCallback(
    async (input) => {
      if (!ready || !db || !userId) throw new Error("Not ready");
      const id = newId();
      await insertLocal(db.workoutTemplateItems, { id, userId, ...input });
      return id;
    },
    [db, ready, userId]
  );
  const updateTemplateItem = useCallback(
    async (id, patch) => {
      if (!ready || !db) throw new Error("Not ready");
      await updateLocal(db.workoutTemplateItems, id, patch);
    },
    [db, ready]
  );
  const deleteTemplateItem = useCallback(
    async (id) => {
      if (!ready || !db) throw new Error("Not ready");
      await softDeleteLocal(db.workoutTemplateItems, id);
    },
    [db, ready]
  );
  const createExercise = useCallback(
    async (input) => {
      if (!ready || !db || !userId) throw new Error("Not ready");
      const id = newId();
      await insertLocal(db.exercises, {
        id,
        userId,
        ...input,
        createdAt: nowMs()
      });
      return id;
    },
    [db, ready, userId]
  );
  const startSession = useCallback(
    async (templateId) => {
      if (!ready || !db || !userId) throw new Error("Not ready");
      const id = newId();
      await insertLocal(db.workoutSessions, {
        id,
        userId,
        templateId,
        startedAt: nowMs(),
        endedAt: null,
        status: "active"
      });
      return id;
    },
    [db, ready, userId]
  );
  const finishSession = useCallback(
    async (id) => {
      if (!ready || !db) throw new Error("Not ready");
      await updateLocal(db.workoutSessions, id, {
        status: "completed",
        endedAt: nowMs()
      });
    },
    [db, ready]
  );
  const logSet = useCallback(
    async (input) => {
      if (!ready || !db || !userId) throw new Error("Not ready");
      const id = newId();
      await insertLocal(db.workoutSets, {
        id,
        userId,
        ...input,
        completedAt: input.completedAt ?? nowMs()
      });
      return id;
    },
    [db, ready, userId]
  );
  const deleteSet = useCallback(
    async (id) => {
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
    deleteSet
  };
}
export {
  useRoutineGroups as a,
  useActiveSession as b,
  useWorkoutMutations as c,
  useWorkoutTemplate as d,
  useTemplateItems as e,
  useExercises as f,
  useSession as g,
  useSessionSets as h,
  useWorkoutTemplates as u
};
