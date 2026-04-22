"use server";

import { revalidatePath } from "next/cache";

import { requireUserId } from "@/lib/auth-user";
import * as mealLibrary from "@/lib/services/meal-library";
import { generateShoppingListForMealPlan } from "@/lib/ai-shopping-list";
import * as mealPlan from "@/lib/services/meal-plan";

function revalidateNutritionPlanning() {
  revalidatePath("/app/nutrition/library");
  revalidatePath("/app/nutrition/plan", "page");
}

export async function actionCreateLibraryItem(formData: FormData) {
  const userId = await requireUserId();
    const name = String(formData.get("name") ?? "").trim();
    if (!name) throw new Error("Name required");
    const instructions = String(formData.get("instructions") ?? "").trim();
    const calories = Number(formData.get("calories") ?? 0);
    const proteinG = Number(formData.get("proteinG") ?? 0);
    const carbsG = Number(formData.get("carbsG") ?? 0);
    const fatG = Number(formData.get("fatG") ?? 0);
    const rawLines = String(formData.get("ingredientLines") ?? "");
    const ingredients = rawLines
      .split("\n")
      .map((l) => ({ line: l.trim() }))
      .filter((i) => i.line.length > 0);

    await mealLibrary.createLibraryItem(userId, {
      name,
      instructions,
      calories: Number.isFinite(calories) ? calories : 0,
      proteinG: Number.isFinite(proteinG) ? proteinG : 0,
      carbsG: Number.isFinite(carbsG) ? carbsG : 0,
      fatG: Number.isFinite(fatG) ? fatG : 0,
      ingredients,
    });
    revalidateNutritionPlanning();
  
}

export async function actionUpdateLibraryItem(formData: FormData) {
  const userId = await requireUserId();
    const id = String(formData.get("id") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();
    if (!id || !name) throw new Error("Missing fields");
    const instructions = String(formData.get("instructions") ?? "").trim();
    const calories = Number(formData.get("calories") ?? 0);
    const proteinG = Number(formData.get("proteinG") ?? 0);
    const carbsG = Number(formData.get("carbsG") ?? 0);
    const fatG = Number(formData.get("fatG") ?? 0);
    const rawLines = String(formData.get("ingredientLines") ?? "");
    const ingredients = rawLines
      .split("\n")
      .map((l) => ({ line: l.trim() }))
      .filter((i) => i.line.length > 0);

    const row = await mealLibrary.updateLibraryItem(userId, id, {
      name,
      instructions,
      calories: Number.isFinite(calories) ? calories : 0,
      proteinG: Number.isFinite(proteinG) ? proteinG : 0,
      carbsG: Number.isFinite(carbsG) ? carbsG : 0,
      fatG: Number.isFinite(fatG) ? fatG : 0,
      ingredients,
    });
    if (!row) throw new Error("Not found");
    revalidateNutritionPlanning();
  
}

export async function actionDeleteLibraryItem(id: string) {
  const userId = await requireUserId();
    await mealLibrary.deleteLibraryItem(userId, id);
    revalidateNutritionPlanning();
  
}

/** Use plain args when calling from client handlers; FormData is unreliable outside `<form action>`. */
export async function actionSetMealPlanSlot(
  slotId: string,
  libraryItemId: string | null
) {
  const userId = await requireUserId();
    const sid = slotId.trim();
    if (!sid) throw new Error("Invalid slot");
    const lib =
      libraryItemId != null && String(libraryItemId).trim().length > 0
        ? String(libraryItemId).trim()
        : null;

    await mealPlan.setSlotLibraryItem(userId, { slotId: sid, libraryItemId: lib });
    revalidateNutritionPlanning();
  
}

export async function actionAddMealPlanSlot(
  weekStartDayKey: string,
  dayIndex: number,
  kind: "meal" | "snack" = "meal"
) {
  const userId = await requireUserId();
    const w = weekStartDayKey.trim();
    if (!w || !Number.isInteger(dayIndex)) {
      throw new Error("Invalid day");
    }
    await mealPlan.addMealSlotForDay(userId, {
      weekStartDayKey: w,
      dayIndex,
      kind,
    });
    revalidateNutritionPlanning();
  
}

export async function actionRemoveMealPlanSlot(slotId: string) {
  const userId = await requireUserId();
    const sid = slotId.trim();
    if (!sid) throw new Error("Invalid slot");
    await mealPlan.removeMealSlot(userId, sid);
    revalidateNutritionPlanning();
  
}

export async function actionRenameMealSlot(slotId: string, label: string) {
  const userId = await requireUserId();
    const sid = slotId.trim();
    if (!sid) throw new Error("Invalid slot");
    await mealPlan.updateMealSlotLabel(userId, { slotId: sid, label });
    revalidateNutritionPlanning();
  
}

export async function actionGenerateShoppingList(planId: string): Promise<
  { ok: true } | { ok: false; error: string }
> {
  try {
    const userId = await requireUserId();
    const id = planId.trim();
    if (!id) {
      return { ok: false, error: "Invalid meal plan." };
    }
    const plan = await mealPlan.getPlanByIdForUser(userId, id);
    if (!plan) {
      return { ok: false, error: "Meal plan not found." };
    }
    await generateShoppingListForMealPlan(plan);
    revalidateNutritionPlanning();
    return { ok: true };
  } catch (e) {
    console.error("[actionGenerateShoppingList]", e);
    return {
      ok: false,
      error: "Couldn’t generate the shopping list. Try again.",
    };
  }
}

export async function actionSaveMealPlanLibraryAssignments(
  planId: string,
  assignments: { slotId: string; libraryItemId: string | null }[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const userId = await requireUserId();
    const id = planId.trim();
    if (!id) {
      return { ok: false, error: "Invalid meal plan." };
    }
    await mealPlan.setPlanLibraryAssignmentsBySlotIds(
      userId,
      id,
      assignments
    );
    await mealPlan.clearAiShoppingListCache(userId, id);
    const planFresh = await mealPlan.getPlanByIdForUser(userId, id);
    if (!planFresh) {
      return { ok: false, error: "Meal plan not found." };
    }
    await generateShoppingListForMealPlan(planFresh);
    revalidateNutritionPlanning();
    return { ok: true };
  } catch (e) {
    console.error("[actionSaveMealPlanLibraryAssignments]", e);
    return {
      ok: false,
      error:
        e instanceof Error ? e.message : "Could not save the meal plan.",
    };
  }
}

export async function actionRegenerateShoppingList(planId: string): Promise<
  { ok: true } | { ok: false; error: string }
> {
  try {
    const userId = await requireUserId();
    const id = planId.trim();
    if (!id) {
      return { ok: false, error: "Invalid meal plan." };
    }
    await mealPlan.clearAiShoppingListCache(userId, id);
    const plan = await mealPlan.getPlanByIdForUser(userId, id);
    if (!plan) {
      return { ok: false, error: "Meal plan not found." };
    }
    await generateShoppingListForMealPlan(plan);
    revalidateNutritionPlanning();
    return { ok: true };
  } catch (e) {
    console.error("[actionRegenerateShoppingList]", e);
    return {
      ok: false,
      error: "Couldn’t refresh the shopping list. Try again.",
    };
  }
}
