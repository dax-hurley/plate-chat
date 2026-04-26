import { computeMealPlanSlotLabels } from "@/lib/meal-slot-labels";
import { toMealLibraryItemJson } from "@/lib/meal-library-json";
import type { MealPlan, MealPlanSlot } from "@/lib/stores/meal-plan";
import type { MealLibraryIngredient, MealLibraryItem } from "@/lib/stores/nutrition";
import type { MealPlanBoardViewJson } from "@/types/meal-plan";

/**
 * Shapes a weekly plan + local library rows for the meal plan board.
 */
export function buildMealPlanBoardView(
  plan: Pick<MealPlan, "id" | "weekStartDayKey">,
  slots: MealPlanSlot[],
  itemsById: Map<
    string,
    { item: MealLibraryItem; ingredients: MealLibraryIngredient[] }
  >
): MealPlanBoardViewJson {
  const labelById = computeMealPlanSlotLabels(
    slots.map((s) => ({
      id: s.id,
      dayIndex: s.dayIndex,
      slotIndex: s.slotIndex,
      label: s.label,
      slotKind: s.slotKind,
    }))
  );
  const outSlots = slots.map((s) => {
    const lib = s.libraryItemId ? itemsById.get(s.libraryItemId) : undefined;
    return {
      id: s.id,
      dayIndex: s.dayIndex,
      slotIndex: s.slotIndex,
      slotKind: s.slotKind === "snack" ? ("snack" as const) : ("meal" as const),
      label: labelById.get(s.id) ?? s.label,
      libraryItemId: s.libraryItemId,
      libraryItem:
        lib != null
          ? toMealLibraryItemJson(lib.item, lib.ingredients)
          : null,
    };
  });
  return {
    id: plan.id,
    weekStartDayKey: plan.weekStartDayKey,
    slots: outSlots,
  };
}
