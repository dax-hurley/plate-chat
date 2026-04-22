"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MealLibraryItemJson } from "@/types/meal-library";

import { LibraryMealCard } from "./library-meal-card";
import { LibraryMealDialog } from "./library-meal-dialog";

const SEARCH_DEBOUNCE_MS = 350;

export function LibraryMealList({
  initialItems,
  initialQuery,
}: {
  initialItems: MealLibraryItemJson[];
  initialQuery: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(initialQuery);
  const [createOpen, setCreateOpen] = useState(false);
  const [createFormKey, setCreateFormKey] = useState(0);
  const skipNextDebounceRef = useRef(false);

  const itemsKey = useMemo(
    () => initialItems.map((i) => i.id).join(","),
    [initialItems]
  );

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (skipNextDebounceRef.current) {
      skipNextDebounceRef.current = false;
      return;
    }

    const t = window.setTimeout(() => {
      const q = query.trim();
      const params = new URLSearchParams(window.location.search);
      const curQ = (params.get("q") ?? "").trim();
      if (curQ === q) return;

      startTransition(() => {
        router.push(
          q
            ? `/app/nutrition/library?q=${encodeURIComponent(q)}`
            : "/app/nutrition/library"
        );
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(t);
  }, [query, router]);

  const hasQuery = query.trim().length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1 space-y-1.5">
          <label className="text-muted-foreground text-xs font-medium" htmlFor="lib-search">
            Search
          </label>
          <div className="relative">
            <Search
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
              aria-hidden
            />
            <Input
              id="lib-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. chicken, oats…"
              className="min-h-11 pl-9"
              autoComplete="off"
              aria-busy={pending}
            />
          </div>
          <p className="text-muted-foreground text-xs">
            Results update as you type.
          </p>
        </div>
        {hasQuery ? (
          <Button
            type="button"
            variant="outline"
            className="min-h-11 border-primary/20 touch-manipulation"
            disabled={pending}
            onClick={() => {
              skipNextDebounceRef.current = true;
              setQuery("");
              startTransition(() => router.push("/app/nutrition/library"));
            }}
          >
            Clear
          </Button>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          {initialItems.length === 0
            ? "No meals match yet."
            : `${initialItems.length} saved meal${initialItems.length === 1 ? "" : "s"}`}
        </p>
        <Button
          type="button"
          className="touch-manipulation"
          onClick={() => {
            setCreateFormKey((k) => k + 1);
            setCreateOpen(true);
          }}
        >
          <Plus className="size-4" aria-hidden />
          Add meal
        </Button>
      </div>

      <LibraryMealDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        createFormKey={createFormKey}
      />

      <ul key={itemsKey} className="space-y-4">
        {initialItems.map((item) => (
          <LibraryMealCard key={item.id} item={item} />
        ))}
      </ul>
    </div>
  );
}
