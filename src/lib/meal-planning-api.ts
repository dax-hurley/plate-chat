import { resolveShoppingListForMealPlan } from "@/lib/ai-shopping-list";
import { computeMealPlanSlotLabels } from "@/lib/meal-slot-labels";
import type { MealPlanWithSlots } from "@/lib/services/meal-plan";

type LibraryItemRow = {
  id: string;
  name: string;
  instructions: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  ingredients: { id: string; sortOrder: number; line: string }[];
};

/** Slots + metadata without resolving the shopping list (for streaming UI). */
export function jsonMealPlanBase(plan: MealPlanWithSlots) {
  const labelById = computeMealPlanSlotLabels(plan.slots);
  return {
    id: plan.id,
    weekStartDayKey: plan.weekStartDayKey,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
    slots: plan.slots.map((s) => ({
      id: s.id,
      dayIndex: s.dayIndex,
      slotIndex: s.slotIndex,
      slotKind: s.slotKind === "snack" ? ("snack" as const) : ("meal" as const),
      label: labelById.get(s.id) ?? s.label,
      libraryItemId: s.libraryItemId,
      libraryItem: s.libraryItem
        ? jsonMealLibraryItem({
            ...s.libraryItem,
            ingredients: s.libraryItem.ingredients ?? [],
          })
        : null,
    })),
  };
}

export function jsonMealLibraryItem(item: LibraryItemRow) {
  return {
    id: item.id,
    name: item.name,
    instructions: item.instructions,
    calories: item.calories,
    proteinG: item.proteinG,
    carbsG: item.carbsG,
    fatG: item.fatG,
    ingredients: item.ingredients.map((i) => ({
      id: i.id,
      sortOrder: i.sortOrder,
      line: i.line,
    })),
  };
}

export async function jsonMealPlan(plan: MealPlanWithSlots) {
  const shoppingList = await resolveShoppingListForMealPlan(plan);
  return {
    ...jsonMealPlanBase(plan),
    shoppingList,
  };
}
