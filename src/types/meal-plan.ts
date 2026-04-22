import type { MealLibraryItemJson } from "./meal-library";

export type MealShoppingListLineView = {
  label: string;
  /** Set when AI provides an estimate; omitted for non-AI merged lines */
  estimatedCostUsd: number | null;
};

export type MealShoppingListView = {
  aiGenerated: boolean;
  /** Meals have ingredients but the AI list has not been built yet (user must generate). */
  awaitingAiGeneration?: boolean;
  /** Cached list was for older meals; plan changed since last generation. */
  mealPlanUpdatedSinceShoppingList?: boolean;
  bySection: { section: string; items: MealShoppingListLineView[] }[];
  /** Sum of line estimates when AI-generated; otherwise null */
  totalEstimatedUsd: number | null;
  /** Shown when AI formatting was skipped or failed (merged lines still shown). */
  aiNotice?: string;
};

export type MealPlanViewJson = {
  id: string;
  weekStartDayKey: string;
  shoppingList: MealShoppingListView;
  slots: {
    id: string;
    dayIndex: number;
    slotIndex: number;
    slotKind: "meal" | "snack";
    label: string;
    libraryItemId: string | null;
    libraryItem: MealLibraryItemJson | null;
  }[];
};

/** Meal plan payload for the week grid (shopping list loaded separately). */
export type MealPlanBoardViewJson = Omit<MealPlanViewJson, "shoppingList">;

export type MealPlanLibraryOption = { id: string; name: string };
