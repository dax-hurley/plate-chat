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
import {
  dedupeMealPlanDuplicates,
  pickCanonicalMealPlanForWeek,
} from "@/lib/client/meal-plan-canonical";
import { pullSyncCollections } from "@/lib/client/db/sync";
import {
  addMealSlotForDay,
  ensureDefaultSlotsForPlan,
  removeMealSlot,
  setPlanLibraryAssignmentsBySlotIds,
} from "@/lib/client/meal-plan-ops";

export interface MealPlan {
  id: string;
  userId: string;
  weekStartDayKey: string;
  createdAt: number;
  aiShoppingListJson: string;
  shoppingListSourceHash: string | null;
  updatedAt: number;
  deletedAt: number | null;
  rev: number;
}

export interface MealPlanSlot {
  id: string;
  userId: string;
  planId: string;
  dayIndex: number;
  slotIndex: number;
  slotKind: "meal" | "snack";
  label: string;
  libraryItemId: string | null;
  updatedAt: number;
  deletedAt: number | null;
  rev: number;
}

export function usePlanForWeek(weekStartDayKey: string) {
  const { db } = useDb();
  const { userId } = useLocalSession();
  return useLiveOne<MealPlan>(
    async () => {
      if (!db || !userId) return null;
      return pickCanonicalMealPlanForWeek(db, userId, weekStartDayKey);
    },
    [db, userId, weekStartDayKey]
  );
}

export function usePlanSlots(planId: string | null) {
  const { db } = useDb();
  return useLiveArray<MealPlanSlot>(
    async () => {
      if (!db || !planId) return [];
      const rows = (await db.mealPlanSlots
        .where("planId")
        .equals(planId)
        .toArray()) as unknown as MealPlanSlot[];
      return rows
        .filter((r) => r.deletedAt === null)
        .sort(
          (a, b) => a.dayIndex - b.dayIndex || a.slotIndex - b.slotIndex
        );
    },
    [db, planId]
  );
}

export function useMealPlanMutations() {
  const { db, ready } = useDb();
  const { userId } = useLocalSession();

  const ensurePlan = useCallback(
    async (weekStartDayKey: string) => {
      if (!ready || !db || !userId) throw new Error("Not ready");
      await pullSyncCollections([
        "mealLibraryItems",
        "mealLibraryIngredients",
        "mealPlans",
        "mealPlanSlots",
      ]);
      let canonical = await pickCanonicalMealPlanForWeek(
        db,
        userId,
        weekStartDayKey
      );
      if (canonical) {
        await ensureDefaultSlotsForPlan(db, userId, canonical.id);
        await dedupeMealPlanDuplicates(
          db,
          userId,
          weekStartDayKey,
          canonical.id
        );
        return canonical.id;
      }
      const id = newId();
      await insertLocal(db.mealPlans, {
        id,
        userId,
        weekStartDayKey,
        createdAt: nowMs(),
        aiShoppingListJson: "[]",
        shoppingListSourceHash: null,
      });
      await ensureDefaultSlotsForPlan(db, userId, id);
      canonical = await pickCanonicalMealPlanForWeek(
        db,
        userId,
        weekStartDayKey
      );
      if (canonical && canonical.id !== id) {
        const slotRows = await db.mealPlanSlots
          .where("planId")
          .equals(id)
          .toArray();
        await db.transaction("rw", db.mealPlanSlots, db.mealPlans, async () => {
          for (const s of slotRows) {
            await db.mealPlanSlots.delete(s.id as string);
          }
          await db.mealPlans.delete(id);
        });
        await dedupeMealPlanDuplicates(
          db,
          userId,
          weekStartDayKey,
          canonical.id
        );
        return canonical.id;
      }
      await dedupeMealPlanDuplicates(db, userId, weekStartDayKey, id);
      return id;
    },
    [db, ready, userId]
  );

  const addMealPlanSlot = useCallback(
    async (
      weekStartDayKey: string,
      dayIndex: number,
      kind: "meal" | "snack"
    ) => {
      if (!ready || !db || !userId) throw new Error("Not ready");
      await addMealSlotForDay(db, userId, {
        weekStartDayKey,
        dayIndex,
        kind,
      });
    },
    [db, ready, userId]
  );

  const removeMealPlanSlot = useCallback(
    async (slotId: string) => {
      if (!ready || !db || !userId) throw new Error("Not ready");
      await removeMealSlot(db, userId, slotId);
    },
    [db, ready, userId]
  );

  const saveMealPlanLibraryAssignments = useCallback(
    async (
      planId: string,
      assignments: { slotId: string; libraryItemId: string | null }[]
    ) => {
      if (!ready || !db || !userId) throw new Error("Not ready");
      await setPlanLibraryAssignmentsBySlotIds(
        db,
        userId,
        planId,
        assignments
      );
    },
    [db, ready, userId]
  );

  const setSlotMeal = useCallback(
    async (
      planId: string,
      dayIndex: number,
      slotIndex: number,
      input: {
        slotKind: "meal" | "snack";
        label: string;
        libraryItemId: string | null;
      }
    ) => {
      if (!ready || !db || !userId) throw new Error("Not ready");
      const matches = (await db.mealPlanSlots
        .where("[planId+dayIndex+slotIndex]")
        .equals([planId, dayIndex, slotIndex])
        .toArray()) as unknown as MealPlanSlot[];
      const alive = matches.find((r) => r.deletedAt === null);
      if (alive) {
        await updateLocal(db.mealPlanSlots, alive.id, {
          slotKind: input.slotKind,
          label: input.label,
          libraryItemId: input.libraryItemId,
        });
        return;
      }
      const tomb = matches.find((r) => r.deletedAt != null);
      if (tomb) {
        await updateLocal(db.mealPlanSlots, tomb.id, {
          deletedAt: null,
          slotKind: input.slotKind,
          label: input.label,
          libraryItemId: input.libraryItemId,
        });
        return;
      }
      await insertLocal(db.mealPlanSlots, {
        id: newId(),
        userId,
        planId,
        dayIndex,
        slotIndex,
        slotKind: input.slotKind,
        label: input.label,
        libraryItemId: input.libraryItemId,
      });
    },
    [db, ready, userId]
  );

  const clearSlot = useCallback(
    async (planId: string, dayIndex: number, slotIndex: number) => {
      if (!ready || !db) throw new Error("Not ready");
      const matches = (await db.mealPlanSlots
        .where("[planId+dayIndex+slotIndex]")
        .equals([planId, dayIndex, slotIndex])
        .toArray()) as unknown as MealPlanSlot[];
      const alive = matches.find((r) => r.deletedAt === null);
      if (!alive) return;
      await softDeleteLocal(db.mealPlanSlots, alive.id);
    },
    [db, ready]
  );

  return {
    ensurePlan,
    setSlotMeal,
    clearSlot,
    addMealPlanSlot,
    removeMealPlanSlot,
    saveMealPlanLibraryAssignments,
  };
}
