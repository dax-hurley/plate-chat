import { Beef, BookOpen, Droplets, Flame, PencilLine, Wheat } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireUserId } from "@/lib/auth-user";
import { listLibraryItems } from "@/lib/services/meal-library";

import {
  actionCreateLibraryItem,
  actionDeleteLibraryItem,
  actionUpdateLibraryItem,
} from "../meal-planning-actions";

function ingredientsToText(
  ingredients: { line: string }[] | undefined
): string {
  return (ingredients ?? []).map((i) => i.line).join("\n");
}

export default async function MealLibraryPage() {
  const userId = await requireUserId();
  const items = await listLibraryItems(userId);

  return (
    <div className="mx-auto w-full max-w-xl space-y-6 md:max-w-5xl">
      <div>
        <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight">
          <span className="bg-primary/15 text-primary ring-primary/15 inline-flex size-10 items-center justify-center rounded-2xl ring-1">
            <BookOpen className="size-5" strokeWidth={2.25} aria-hidden />
          </span>
          Meal library
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Save recipes or go-to meals and reuse them in your weekly plan.
        </p>
      </div>

      <Card className="border-primary/15">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Add a meal</CardTitle>
          <CardDescription>
            Name, macros, and optional instructions / ingredients.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <form action={actionCreateLibraryItem} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="library-name">Name</Label>
              <Input
                id="library-name"
                name="name"
                placeholder="e.g. Chicken rice bowl"
                required
                className="min-h-12 text-base"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor="library-cal" className="text-xs">
                  <Flame className="text-chart-2 mr-1 inline size-3" aria-hidden />
                  Calories
                </Label>
                <Input
                  id="library-cal"
                  name="calories"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  placeholder="0"
                  className="min-h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="library-p" className="text-xs">
                  <Beef className="text-chart-1 mr-1 inline size-3" aria-hidden />
                  Protein (g)
                </Label>
                <Input
                  id="library-p"
                  name="proteinG"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min={0}
                  placeholder="0"
                  className="min-h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="library-c" className="text-xs">
                  <Wheat className="text-chart-4 mr-1 inline size-3" aria-hidden />
                  Carbs (g)
                </Label>
                <Input
                  id="library-c"
                  name="carbsG"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min={0}
                  placeholder="0"
                  className="min-h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="library-f" className="text-xs">
                  <Droplets className="text-chart-3 mr-1 inline size-3" aria-hidden />
                  Fat (g)
                </Label>
                <Input
                  id="library-f"
                  name="fatG"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min={0}
                  placeholder="0"
                  className="min-h-11"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="library-ingredients">
                Ingredients (one per line)
              </Label>
              <textarea
                id="library-ingredients"
                name="ingredientLines"
                rows={4}
                placeholder={"2 cups rice\n6 oz chicken breast\n1 tbsp olive oil"}
                className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 w-full rounded-lg border px-2.5 py-2 text-sm outline-none transition-colors focus-visible:ring-3"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="library-instructions">Instructions (optional)</Label>
              <textarea
                id="library-instructions"
                name="instructions"
                rows={3}
                placeholder="Short notes about prep, cooking, etc."
                className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 w-full rounded-lg border px-2.5 py-2 text-sm outline-none transition-colors focus-visible:ring-3"
              />
            </div>
            <Button
              type="submit"
              className="min-h-12 w-full gap-2 text-base shadow-sm"
            >
              Add to library
            </Button>
          </form>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Your meals</h2>
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nothing saved yet. Add a meal above.
          </p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {items.map((item) => (
              <li key={item.id}>
                <details className="border-primary/15 bg-card group rounded-xl border p-4 shadow-sm">
                  <summary className="flex cursor-pointer items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium leading-snug">{item.name}</p>
                      <p className="text-muted-foreground text-xs tabular-nums">
                        {item.calories} kcal · P {Math.round(item.proteinG)}g · C{" "}
                        {Math.round(item.carbsG)}g · F {Math.round(item.fatG)}g
                      </p>
                    </div>
                    <span className="text-muted-foreground text-xs font-medium group-open:hidden">
                      Edit
                    </span>
                  </summary>
                  <form
                    action={actionUpdateLibraryItem}
                    className="mt-4 space-y-3"
                  >
                    <input type="hidden" name="id" value={item.id} />
                    <div className="space-y-1.5">
                      <Label
                        htmlFor={`edit-${item.id}-name`}
                        className="text-xs"
                      >
                        Name
                      </Label>
                      <Input
                        id={`edit-${item.id}-name`}
                        name="name"
                        defaultValue={item.name}
                        required
                        className="min-h-11"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <div className="space-y-1">
                        <Label
                          htmlFor={`edit-${item.id}-cal`}
                          className="text-xs"
                        >
                          Cal
                        </Label>
                        <Input
                          id={`edit-${item.id}-cal`}
                          name="calories"
                          type="number"
                          defaultValue={item.calories}
                          className="min-h-11"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label
                          htmlFor={`edit-${item.id}-p`}
                          className="text-xs"
                        >
                          P
                        </Label>
                        <Input
                          id={`edit-${item.id}-p`}
                          name="proteinG"
                          type="number"
                          step="0.1"
                          defaultValue={item.proteinG}
                          className="min-h-11"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label
                          htmlFor={`edit-${item.id}-c`}
                          className="text-xs"
                        >
                          C
                        </Label>
                        <Input
                          id={`edit-${item.id}-c`}
                          name="carbsG"
                          type="number"
                          step="0.1"
                          defaultValue={item.carbsG}
                          className="min-h-11"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label
                          htmlFor={`edit-${item.id}-f`}
                          className="text-xs"
                        >
                          F
                        </Label>
                        <Input
                          id={`edit-${item.id}-f`}
                          name="fatG"
                          type="number"
                          step="0.1"
                          defaultValue={item.fatG}
                          className="min-h-11"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor={`edit-${item.id}-ing`}
                        className="text-xs"
                      >
                        Ingredients
                      </Label>
                      <textarea
                        id={`edit-${item.id}-ing`}
                        name="ingredientLines"
                        rows={3}
                        defaultValue={ingredientsToText(item.ingredients)}
                        className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 w-full rounded-lg border px-2.5 py-2 text-sm outline-none transition-colors focus-visible:ring-3"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor={`edit-${item.id}-notes`}
                        className="text-xs"
                      >
                        Instructions
                      </Label>
                      <textarea
                        id={`edit-${item.id}-notes`}
                        name="instructions"
                        rows={2}
                        defaultValue={item.instructions}
                        className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 w-full rounded-lg border px-2.5 py-2 text-sm outline-none transition-colors focus-visible:ring-3"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="submit"
                        className="min-h-11 flex-1 gap-2 shadow-sm"
                      >
                        <PencilLine className="size-4" aria-hidden />
                        Save
                      </Button>
                    </div>
                  </form>
                  <form
                    action={actionDeleteLibraryItem.bind(null, item.id)}
                    className="mt-2"
                  >
                    <Button
                      type="submit"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive min-h-11 w-full"
                    >
                      Delete meal
                    </Button>
                  </form>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
