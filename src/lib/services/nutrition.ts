import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { mealEntries, meals } from "@/db/schema";
import { DAILY_FOOD_LOG_MEAL_NAME } from "@/lib/nutrition-constants";

export { DAILY_FOOD_LOG_MEAL_NAME };

export async function listMealsForDay(userId: string, dayKey: string) {
  return db.query.meals.findMany({
    where: and(eq(meals.userId, userId), eq(meals.dayKey, dayKey)),
    orderBy: [asc(meals.loggedAt)],
    with: { entries: true },
  });
}

export async function getDailyTotals(userId: string, dayKey: string) {
  const list = await listMealsForDay(userId, dayKey);
  let calories = 0;
  let proteinG = 0;
  let carbsG = 0;
  let fatG = 0;
  for (const meal of list) {
    for (const e of meal.entries) {
      calories += e.calories;
      proteinG += e.proteinG;
      carbsG += e.carbsG;
      fatG += e.fatG;
    }
  }
  return { calories, proteinG, carbsG, fatG };
}

export async function createMeal(
  userId: string,
  input: {
    dayKey: string;
    name: string;
    loggedAt?: Date;
    /** When logging from the meal library / plan quick-add. */
    sourceLibraryItemId?: string | null;
  }
) {
  const now = input.loggedAt ?? new Date();
  const [row] = await db
    .insert(meals)
    .values({
      userId,
      dayKey: input.dayKey,
      name: input.name.trim(),
      loggedAt: now,
      sourceLibraryItemId: input.sourceLibraryItemId ?? null,
    })
    .returning();
  return row;
}

export async function addMealEntry(
  userId: string,
  input: {
    mealId: string;
    description?: string;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  }
) {
  const meal = await db.query.meals.findFirst({
    where: and(eq(meals.id, input.mealId), eq(meals.userId, userId)),
  });
  if (!meal) throw new Error("Meal not found");
  const [row] = await db
    .insert(mealEntries)
    .values({
      mealId: input.mealId,
      description: input.description?.trim() ?? "",
      calories: Math.round(input.calories),
      proteinG: input.proteinG,
      carbsG: input.carbsG,
      fatG: input.fatG,
    })
    .returning();
  return row;
}

export async function deleteMeal(userId: string, mealId: string) {
  await db
    .delete(meals)
    .where(and(eq(meals.id, mealId), eq(meals.userId, userId)));
}

export async function getOrCreateDailyFoodLogMeal(userId: string, dayKey: string) {
  const existing = await db.query.meals.findFirst({
    where: and(
      eq(meals.userId, userId),
      eq(meals.dayKey, dayKey),
      eq(meals.name, DAILY_FOOD_LOG_MEAL_NAME)
    ),
    orderBy: [asc(meals.loggedAt)],
  });
  if (existing) return existing;
  return createMeal(userId, { dayKey, name: DAILY_FOOD_LOG_MEAL_NAME });
}

export async function deleteMealEntry(userId: string, entryId: string) {
  const entry = await db.query.mealEntries.findFirst({
    where: eq(mealEntries.id, entryId),
    with: { meal: true },
  });
  if (!entry?.meal || entry.meal.userId !== userId) {
    throw new Error("Entry not found");
  }
  const mealId = entry.mealId;
  await db.delete(mealEntries).where(eq(mealEntries.id, entryId));
  const remaining = await db.query.mealEntries.findMany({
    where: eq(mealEntries.mealId, mealId),
  });
  if (remaining.length === 0) {
    await db.delete(meals).where(and(eq(meals.id, mealId), eq(meals.userId, userId)));
  }
}
