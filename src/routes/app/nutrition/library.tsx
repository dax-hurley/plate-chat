import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BookOpen, Link2, Plus, Sparkles } from "lucide-react";
import { z } from "zod";

import { ImportRecipeUrlDialog } from "@/components/nutrition/import-recipe-url-dialog";
import { LibraryMealList } from "@/components/nutrition/library-meal-list";
import { LibraryMealDialog } from "@/components/nutrition/library-meal-dialog";
import { MealCookingInstructionsDialog } from "@/components/nutrition/meal-cooking-instructions-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { COACH_MEAL_LIBRARY_PROMPT } from "@/lib/coach-nutrition-prompts";
import { cn } from "@/lib/utils";
import { toMealLibraryItemJson } from "@/lib/meal-library-json";
import { useMealLibrary, useMealLibraryIngredientsForItems } from "@/lib/stores";
import type { MealLibraryItemJson } from "@/types/meal-library";

const searchSchema = z.object({
  q: z.string().optional(),
});

export const Route = createFileRoute("/app/nutrition/library")({
  validateSearch: searchSchema,
  component: LibraryPage,
});

function LibraryPage() {
  const { q = "" } = Route.useSearch();
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [createFormKey, setCreateFormKey] = useState(0);
  const [importPreviewOpen, setImportPreviewOpen] = useState(false);
  const [importPreviewItem, setImportPreviewItem] =
    useState<MealLibraryItemJson | null>(null);
  const [importEditOpen, setImportEditOpen] = useState(false);
  const [importEditItem, setImportEditItem] = useState<MealLibraryItemJson | null>(
    null
  );
  const { data: items } = useMealLibrary();
  const { data: ings } = useMealLibraryIngredientsForItems(
    items.map((i) => i.id)
  );

  const byId = useMemo(() => {
    const m = new Map<string, (typeof ings)[0][]>();
    for (const i of ings) {
      const arr = m.get(i.libraryItemId) ?? [];
      arr.push(i);
      m.set(i.libraryItemId, arr);
    }
    return m;
  }, [ings]);

  const jsonItems = useMemo(
    () =>
      items.map((it) => toMealLibraryItemJson(it, byId.get(it.id) ?? [])),
    [items, byId]
  );

  const filtered = useMemo(() => {
    const t = (q ?? "").trim().toLowerCase();
    if (!t) return jsonItems;
    return jsonItems.filter((m) => m.name.toLowerCase().includes(t));
  }, [jsonItems, q]);

  return (
    <div className="mx-auto w-full max-w-xl space-y-6 md:max-w-5xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight">
            <span className="bg-primary/15 text-primary ring-primary/15 inline-flex size-10 items-center justify-center rounded-2xl ring-1">
              <BookOpen className="size-5" strokeWidth={2.25} aria-hidden />
            </span>
            Recipe library
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Save recipes or go-to meals and reuse them in your weekly plan.
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            Use these meals on the{" "}
            <Link
              to="/app/nutrition/plan"
              className="text-primary font-medium underline-offset-2 hover:underline"
            >
              meal plan
            </Link>{" "}
            page.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end sm:gap-2">
          <Link
            to="/app/coach"
            search={{ prompt: COACH_MEAL_LIBRARY_PROMPT }}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "inline-flex min-h-12 shrink-0 touch-manipulation items-center justify-center gap-2 text-base shadow-sm"
            )}
          >
            <Sparkles className="size-4" aria-hidden />
            Create with AI
          </Link>
          <Button
            type="button"
            variant="outline"
            className="inline-flex min-h-12 touch-manipulation items-center justify-center gap-2 text-base shadow-sm"
            onClick={() => setImportOpen(true)}
          >
            <Link2 className="size-4" aria-hidden />
            Import from web
          </Button>
          <Button
            type="button"
            className="inline-flex min-h-12 touch-manipulation items-center justify-center gap-2 text-base shadow-sm"
            onClick={() => {
              setCreateFormKey((k) => k + 1);
              setCreateOpen(true);
            }}
          >
            <Plus className="size-4" aria-hidden />
            Add meal
          </Button>
        </div>
      </div>

      <ImportRecipeUrlDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onSaved={(item) => {
          setImportPreviewItem(item);
          setImportPreviewOpen(true);
        }}
      />

      <MealCookingInstructionsDialog
        open={importPreviewOpen}
        onOpenChange={(open) => {
          setImportPreviewOpen(open);
          if (!open) setImportPreviewItem(null);
        }}
        item={importPreviewItem}
        onEditRecipe={(item) => {
          setImportPreviewOpen(false);
          setImportPreviewItem(null);
          setImportEditItem(item);
          setImportEditOpen(true);
        }}
      />

      <LibraryMealDialog
        open={importEditOpen}
        onOpenChange={(open) => {
          setImportEditOpen(open);
          if (!open) setImportEditItem(null);
        }}
        mode="edit"
        item={importEditItem ?? undefined}
        createFormKey={0}
      />

      <LibraryMealDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        createFormKey={createFormKey}
      />

      <LibraryMealList
        initialItems={filtered}
        initialQuery={q ?? ""}
      />
    </div>
  );
}
