import { BookOpen } from "lucide-react";

import { requireUserId } from "@/lib/auth-user";
import { jsonMealLibraryItem } from "@/lib/meal-planning-api";
import { listLibraryItems } from "@/lib/services/meal-library";

import { LibraryMealList } from "./library-meal-list";

function firstString(
  v: string | string[] | undefined
): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && v[0] !== undefined) return v[0];
  return undefined;
}

export default async function MealLibraryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const userId = await requireUserId();
  const sp = await searchParams;
  const q = firstString(sp.q)?.trim();
  const rows = await listLibraryItems(userId, q || undefined);
  const initialItems = rows.map((i) =>
    jsonMealLibraryItem({ ...i, ingredients: i.ingredients ?? [] })
  );

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

      <LibraryMealList
        initialItems={initialItems}
        initialQuery={q ?? ""}
      />
    </div>
  );
}
