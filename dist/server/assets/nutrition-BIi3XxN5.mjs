import Dexie from "dexie";
import { useCallback } from "react";
import { a as useLocalSession, u as useLiveArray, i as insertLocal, s as softDeleteLocal, c as updateLocal } from "./writes-C61wFNCm.mjs";
import { u as useDb } from "./router-CUOzYYmk.mjs";
import { n as newId, a as nowMs } from "./ids-zMPBJmub.mjs";
function useMealsOnDay(dayKey) {
  const { db } = useDb();
  const { userId } = useLocalSession();
  return useLiveArray(
    async () => {
      if (!db || !userId) return [];
      const rows = await db.meals.where("[userId+dayKey+loggedAt]").between(
        [userId, dayKey, 0],
        [userId, dayKey, Number.MAX_SAFE_INTEGER]
      ).toArray();
      return rows.filter((r) => r.deletedAt === null).sort((a, b) => a.loggedAt - b.loggedAt);
    },
    [db, userId, dayKey]
  );
}
function useMealLibrary() {
  const { db } = useDb();
  const { userId } = useLocalSession();
  return useLiveArray(
    async () => {
      if (!db || !userId) return [];
      const rows = await db.mealLibraryItems.where("[userId+name]").between([userId, ""], [userId, "￿"]).toArray();
      return rows.filter((r) => r.deletedAt === null);
    },
    [db, userId]
  );
}
function useMealLibraryIngredientsForItems(libraryItemIds) {
  const { db } = useDb();
  const idKey = [...new Set(libraryItemIds)].sort().join(",");
  return useLiveArray(
    async () => {
      if (!db || libraryItemIds.length === 0) return [];
      const set = new Set(libraryItemIds);
      const rows = await db.mealLibraryIngredients.toArray();
      return rows.filter(
        (r) => r.deletedAt === null && set.has(r.libraryItemId)
      ).sort(
        (a, b) => a.libraryItemId.localeCompare(b.libraryItemId) || a.sortOrder - b.sortOrder
      );
    },
    [db, idKey]
  );
}
function useNutritionMutations() {
  const { db, ready } = useDb();
  const { userId } = useLocalSession();
  const logMeal = useCallback(
    async (input) => {
      if (!ready || !db || !userId) throw new Error("Not ready");
      const mealId = newId();
      await insertLocal(db.meals, {
        id: mealId,
        userId,
        dayKey: input.dayKey,
        loggedAt: nowMs(),
        name: input.name,
        sourceLibraryItemId: input.sourceLibraryItemId ?? null
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
          fatG: e.fatG
        });
      }
      return mealId;
    },
    [db, ready, userId]
  );
  const deleteMeal = useCallback(
    async (id) => {
      if (!ready || !db) throw new Error("Not ready");
      await softDeleteLocal(db.meals, id);
    },
    [db, ready]
  );
  const saveLibraryItem = useCallback(
    async (input) => {
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
          fatG: input.fatG
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
          createdAt: nowMs()
        });
      }
      if (input.ingredients) {
        const existingIng = await db.mealLibraryIngredients.where("[libraryItemId+sortOrder]").between([id, Dexie.minKey], [id, Dexie.maxKey]).toArray();
        for (const row of existingIng) {
          if (row.deletedAt === null) {
            await softDeleteLocal(db.mealLibraryIngredients, row.id);
          }
        }
        for (const ing of input.ingredients) {
          await insertLocal(db.mealLibraryIngredients, {
            id: newId(),
            userId,
            libraryItemId: id,
            sortOrder: ing.sortOrder,
            line: ing.line
          });
        }
      }
      return id;
    },
    [db, ready, userId]
  );
  const deleteLibraryItem = useCallback(
    async (id) => {
      if (!ready || !db) throw new Error("Not ready");
      await softDeleteLocal(db.mealLibraryItems, id);
    },
    [db, ready]
  );
  return { logMeal, deleteMeal, saveLibraryItem, deleteLibraryItem };
}
export {
  useMealLibrary as a,
  useMealLibraryIngredientsForItems as b,
  useNutritionMutations as c,
  useMealsOnDay as u
};
