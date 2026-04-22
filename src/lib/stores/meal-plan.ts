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
      const rows = (await db.mealPlans
        .where("[userId+weekStartDayKey]")
        .equals([userId, weekStartDayKey])
        .toArray()) as unknown as MealPlan[];
      return rows.find((r) => r.deletedAt === null) ?? null;
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
      const existing = (await db.mealPlans
        .where("[userId+weekStartDayKey]")
        .equals([userId, weekStartDayKey])
        .toArray()) as unknown as MealPlan[];
      const alive = existing.find((r) => r.deletedAt === null);
      if (alive) return alive.id;
      const id = newId();
      await insertLocal(db.mealPlans, {
        id,
        userId,
        weekStartDayKey,
        createdAt: nowMs(),
        aiShoppingListJson: "[]",
        shoppingListSourceHash: null,
      });
      return id;
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

  return { ensurePlan, setSlotMeal, clearSlot };
}
