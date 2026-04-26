import { Beef, Droplets, Flame, Wheat } from "lucide-react";

import type { MealLibraryItemJson } from "@/types/meal-library";

import {
  RecipeMarkdown,
  recipeIngredientsToMarkdown,
} from "./recipe-markdown";

/** Same body as `LibraryMealCard` (macros, instructions, ingredients) — no chrome or actions. */
export function LibraryMealItemDetailContent({
  item,
}: {
  item: MealLibraryItemJson;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="from-chart-2/12 border-chart-2/20 rounded-lg border bg-gradient-to-br px-2.5 py-2">
          <p className="text-muted-foreground flex items-center gap-1 text-[0.65rem] font-medium">
            <Flame className="text-chart-2 size-3" aria-hidden />
            Cal
          </p>
          <p className="text-base font-semibold tabular-nums">{item.calories}</p>
        </div>
        <div className="from-chart-1/15 border-chart-1/20 rounded-lg border bg-gradient-to-br px-2.5 py-2">
          <p className="text-muted-foreground flex items-center gap-1 text-[0.65rem] font-medium">
            <Beef className="text-chart-1 size-3" aria-hidden />
            P
          </p>
          <p className="text-base font-semibold tabular-nums">
            {item.proteinG.toFixed(0)}g
          </p>
        </div>
        <div className="from-chart-4/15 border-chart-4/20 rounded-lg border bg-gradient-to-br px-2.5 py-2">
          <p className="text-muted-foreground flex items-center gap-1 text-[0.65rem] font-medium">
            <Wheat className="text-chart-4 size-3" aria-hidden />
            C
          </p>
          <p className="text-base font-semibold tabular-nums">
            {item.carbsG.toFixed(0)}g
          </p>
        </div>
        <div className="from-chart-3/15 border-chart-3/20 rounded-lg border bg-gradient-to-br px-2.5 py-2">
          <p className="text-muted-foreground flex items-center gap-1 text-[0.65rem] font-medium">
            <Droplets className="text-chart-3 size-3" aria-hidden />
            F
          </p>
          <p className="text-base font-semibold tabular-nums">
            {item.fatG.toFixed(0)}g
          </p>
        </div>
      </div>

      {item.instructions.trim().length > 0 ? (
        <div>
          <p className="text-muted-foreground mb-1 text-xs font-medium">
            Instructions
          </p>
          <RecipeMarkdown markdown={item.instructions} />
        </div>
      ) : null}

      {item.ingredients.length > 0 ? (
        <div>
          <p className="text-muted-foreground mb-1.5 text-xs font-medium">
            Ingredients
          </p>
          <RecipeMarkdown
            markdown={recipeIngredientsToMarkdown(
              [...item.ingredients].sort((a, b) => a.sortOrder - b.sortOrder)
            )}
          />
        </div>
      ) : null}
    </div>
  );
}
