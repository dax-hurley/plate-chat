/** Serializable recipe library row for client components (from `jsonMealLibraryItem`). */
export type MealLibraryItemJson = {
  id: string;
  name: string;
  instructions: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  ingredients: { id: string; sortOrder: number; line: string }[];
};
