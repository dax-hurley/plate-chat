import Dexie from "dexie";
import { useCallback } from "react";
import { useLocalSession } from "./session";
import { useDb } from "@/lib/client/db/provider";
import { useLiveArray } from "@/lib/client/db/hooks";
import {
  insertLocal,
  softDeleteLocal,
  updateLocal,
} from "@/lib/client/db/writes";
import { newId, nowMs } from "./ids";

export interface Meal {
  id: string;
  userId: string;
  dayKey: string;
  loggedAt: number;
  name: string;
  sourceLibraryItemId: string | null;
  updatedAt: number;
  deletedAt: number | null;
  rev: number;
}

export interface MealEntry {
  id: string;
  userId: string;
  mealId: string;
  description: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  updatedAt: number;
  deletedAt: number | null;
  rev: number;
}

export interface MealLibraryItem {
  id: string;
  userId: string;
  name: string;
  instructions: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
  rev: number;
}

export interface MealLibraryIngredient {
  id: string;
  userId: string;
  libraryItemId: string;
  sortOrder: number;
  line: string;
  updatedAt: number;
  deletedAt: number | null;
  rev: number;
}

export function useMealsOnDay(dayKey: string) {
  const { db } = useDb();
  const { userId } = useLocalSession();
  return useLiveArray<Meal>(
    async () => {
      if (!db || !userId) return [];
      const rows = (await db.meals
        .where("[userId+dayKey+loggedAt]")
        .between(
          [userId, dayKey, 0],
          [userId, dayKey, Number.MAX_SAFE_INTEGER]
        )
        .toArray()) as unknown as Meal[];
      return rows
        .filter((r) => r.deletedAt === null)
        .sort((a, b) => a.loggedAt - b.loggedAt);
    },
    [db, userId, dayKey]
  );
}

export function useMealEntries(mealId: string | null) {
  const { db } = useDb();
  return useLiveArray<MealEntry>(
    async () => {
      if (!db || !mealId) return [];
      const rows = (await db.mealEntries
        .where("mealId")
        .equals(mealId)
        .toArray()) as unknown as MealEntry[];
      return rows.filter((r) => r.deletedAt === null);
    },
    [db, mealId]
  );
}

export function useMealLibrary() {
  const { db } = useDb();
  const { userId } = useLocalSession();
  return useLiveArray<MealLibraryItem>(
    async () => {
      if (!db || !userId) return [];
      const rows = (await db.mealLibraryItems
        .where("[userId+name]")
        .between([userId, ""], [userId, "\uffff"])
        .toArray()) as unknown as MealLibraryItem[];
      return rows.filter((r) => r.deletedAt === null);
    },
    [db, userId]
  );
}

export function useMealLibraryIngredients(libraryItemId: string | null) {
  const { db } = useDb();
  return useLiveArray<MealLibraryIngredient>(
    async () => {
      if (!db || !libraryItemId) return [];
      const rows = (await db.mealLibraryIngredients
        .where("[libraryItemId+sortOrder]")
        .between([libraryItemId, Dexie.minKey], [libraryItemId, Dexie.maxKey])
        .toArray()) as unknown as MealLibraryIngredient[];
      return rows.filter((r) => r.deletedAt === null);
    },
    [db, libraryItemId]
  );
}

/** All ingredient lines for a set of library items (e.g. meal plan slot joins). */
export function useMealLibraryIngredientsForItems(libraryItemIds: string[]) {
  const { db } = useDb();
  const idKey = [...new Set(libraryItemIds)].sort().join(",");
  return useLiveArray<MealLibraryIngredient>(
    async () => {
      if (!db || libraryItemIds.length === 0) return [];
      const set = new Set(libraryItemIds);
      const rows = (await db.mealLibraryIngredients
        .toArray()) as unknown as MealLibraryIngredient[];
      return rows
        .filter(
          (r) => r.deletedAt === null && set.has(r.libraryItemId)
        )
        .sort(
          (a, b) =>
            a.libraryItemId.localeCompare(b.libraryItemId) ||
            a.sortOrder - b.sortOrder
        );
    },
    [db, idKey]
  );
}

export function useNutritionMutations() {
  const { db, ready } = useDb();
  const { userId } = useLocalSession();

  const logMeal = useCallback(
    async (input: {
      dayKey: string;
      name: string;
      sourceLibraryItemId?: string | null;
      entries?: Array<
        Omit<MealEntry, "id" | "userId" | "mealId" | "updatedAt" | "deletedAt" | "rev">
      >;
    }) => {
      if (!ready || !db || !userId) throw new Error("Not ready");
      const mealId = newId();
      await insertLocal(db.meals, {
        id: mealId,
        userId,
        dayKey: input.dayKey,
        loggedAt: nowMs(),
        name: input.name,
        sourceLibraryItemId: input.sourceLibraryItemId ?? null,
      });
      for (const e of input.entries ?? []) {
        await insertLocal(db.mealEntries, {
          id: newId(),
          userId,
          mealId,
          description: e.description,
          calories: e.calories,
          proteinG: e.proteinG,
          carbsG: e.carbsG,
          fatG: e.fatG,
        });
      }
      return mealId;
    },
    [db, ready, userId]
  );

  const deleteMeal = useCallback(
    async (id: string) => {
      if (!ready || !db) throw new Error("Not ready");
      await softDeleteLocal(db.meals, id);
    },
    [db, ready]
  );

  const saveLibraryItem = useCallback(
    async (
      input: Omit<
        MealLibraryItem,
        "id" | "userId" | "updatedAt" | "deletedAt" | "rev" | "createdAt"
      > & {
        id?: string;
        ingredients?: Array<{ line: string; sortOrder: number }>;
      }
    ) => {
      if (!ready || !db || !userId) throw new Error("Not ready");
      const id = input.id ?? newId();
      const existing = await db.mealLibraryItems.get(id);
      if (existing) {
        await updateLocal(db.mealLibraryItems, id, {
          name: input.name,
          instructions: input.instructions,
          calories: input.calories,
          proteinG: input.proteinG,
          carbsG: input.carbsG,
          fatG: input.fatG,
        });
      } else {
        await insertLocal(db.mealLibraryItems, {
          id,
          userId,
          name: input.name,
          instructions: input.instructions,
          calories: input.calories,
          proteinG: input.proteinG,
          carbsG: input.carbsG,
          fatG: input.fatG,
          createdAt: nowMs(),
        });
      }
      if (input.ingredients) {
        const existingIng = await db.mealLibraryIngredients
          .where("[libraryItemId+sortOrder]")
          .between([id, Dexie.minKey], [id, Dexie.maxKey])
          .toArray();
        for (const row of existingIng) {
          if (row.deletedAt === null) {
            await softDeleteLocal(db.mealLibraryIngredients, row.id as string);
          }
        }
        for (const ing of input.ingredients) {
          await insertLocal(db.mealLibraryIngredients, {
            id: newId(),
            userId,
            libraryItemId: id,
            sortOrder: ing.sortOrder,
            line: ing.line,
          });
        }
      }
      return id;
    },
    [db, ready, userId]
  );

  const deleteLibraryItem = useCallback(
    async (id: string) => {
      if (!ready || !db) throw new Error("Not ready");
      await softDeleteLocal(db.mealLibraryItems, id);
    },
    [db, ready]
  );

  return { logMeal, deleteMeal, saveLibraryItem, deleteLibraryItem };
}
