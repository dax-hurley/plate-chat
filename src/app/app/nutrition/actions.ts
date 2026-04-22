"use server";

import { revalidatePath } from "next/cache";

import { requireUserId } from "@/lib/auth-user";
import * as mealLibrary from "@/lib/services/meal-library";
import * as nutrition from "@/lib/services/nutrition";

export async function actionLogFood(formData: FormData) {
  const userId = await requireUserId();
    const dayKey = String(formData.get("dayKey") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const calories = Number(formData.get("calories") ?? 0);
    const proteinG = Number(formData.get("proteinG") ?? 0);
    const carbsG = Number(formData.get("carbsG") ?? 0);
    const fatG = Number(formData.get("fatG") ?? 0);
    if (!dayKey) throw new Error("Missing date");
    const hasNumbers =
      (Number.isFinite(calories) && calories > 0) ||
      (Number.isFinite(proteinG) && proteinG > 0) ||
      (Number.isFinite(carbsG) && carbsG > 0) ||
      (Number.isFinite(fatG) && fatG > 0);
    if (!description && !hasNumbers) {
      throw new Error("Enter what you ate or at least one macro");
    }
    const meal = await nutrition.getOrCreateDailyFoodLogMeal(userId, dayKey);
    await nutrition.addMealEntry(userId, {
      mealId: meal.id,
      description: description || "Food",
      calories: Number.isFinite(calories) ? Math.round(calories) : 0,
      proteinG: Number.isFinite(proteinG) ? proteinG : 0,
      carbsG: Number.isFinite(carbsG) ? carbsG : 0,
      fatG: Number.isFinite(fatG) ? fatG : 0,
    });
    revalidatePath("/app/nutrition");
  
}

export async function actionAddMealFromLibrary(formData: FormData) {
  const userId = await requireUserId();
    const dayKey = String(formData.get("dayKey") ?? "").trim();
    const libraryItemId = String(formData.get("libraryItemId") ?? "").trim();
    if (!dayKey || !libraryItemId) throw new Error("Missing fields");
    const item = await mealLibrary.getLibraryItem(userId, libraryItemId);
    if (!item) throw new Error("Meal not found");
    const meal = await nutrition.createMeal(userId, {
      dayKey,
      name: item.name,
      sourceLibraryItemId: libraryItemId,
    });
    await nutrition.addMealEntry(userId, {
      mealId: meal.id,
      description: item.name,
      calories: item.calories,
      proteinG: item.proteinG,
      carbsG: item.carbsG,
      fatG: item.fatG,
    });
    revalidatePath("/app/nutrition");
  
}

export async function actionDeleteMealEntry(entryId: string) {
  const userId = await requireUserId();
    await nutrition.deleteMealEntry(userId, entryId);
    revalidatePath("/app/nutrition");
  
}
