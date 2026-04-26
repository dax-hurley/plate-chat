import type { MealLibraryIngredient, MealLibraryItem } from "@/lib/stores/nutrition";
import type { MealLibraryItemJson } from "@/types/meal-library";

/** Client-only serializer (avoids pulling server-only `meal-planning-api` into bundles). */
export function toMealLibraryItemJson(
  item: MealLibraryItem,
  ingredients: MealLibraryIngredient[]
): MealLibraryItemJson {
  return {
    id: item.id,
    name: item.name,
    instructions: item.instructions,
    calories: item.calories,
    proteinG: item.proteinG,
    carbsG: item.carbsG,
    fatG: item.fatG,
    ingredients: ingredients
      .filter((i) => i.deletedAt == null)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((i) => ({
        id: i.id,
        sortOrder: i.sortOrder,
        line: i.line,
      })),
  };
}
