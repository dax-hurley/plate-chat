import { resolveShoppingListForMealPlan } from "@/lib/ai-shopping-list";
import type { MealPlanWithSlots } from "@/lib/services/meal-plan";

import { ShoppingListCard } from "./shopping-list-card";

export async function MealPlanShoppingListSection({
  plan,
}: {
  plan: MealPlanWithSlots;
}) {
  const shoppingList = await resolveShoppingListForMealPlan(plan);
  return (
    <ShoppingListCard planId={plan.id} shoppingList={shoppingList} />
  );
}
