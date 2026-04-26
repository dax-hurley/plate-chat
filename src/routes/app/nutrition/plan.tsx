import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarRange, CloudOff, Sparkles } from "lucide-react";
import { z } from "zod";

import { useCoachRuntimeOptional } from "@/components/app/coach-runtime";
import { buttonVariants } from "@/components/ui/button";
import { MealPlanBoard } from "@/components/nutrition/meal-plan-board";
import { PlanShoppingListCard } from "@/components/nutrition/plan-shopping-list-card";
import { authFetch } from "@/lib/client/auth-fetch";
import { useOnline } from "@/lib/client/use-online";
import { formatDayKey, mondayOfWeekContaining } from "@/lib/date-key";
import { COACH_MEAL_PLAN_PROMPT } from "@/lib/coach-nutrition-prompts";
import { buildMealPlanBoardView } from "@/lib/meal-plan-board-view";
import {
  useMealLibrary,
  useMealLibraryIngredientsForItems,
} from "@/lib/stores";
import {
  useMealPlanMutations,
  usePlanForWeek,
  usePlanSlots,
} from "@/lib/stores";
import { cn } from "@/lib/utils";
import type { MealPlanLibraryOption } from "@/types/meal-plan";
import type { MealShoppingListView } from "@/types/meal-plan";

const searchSchema = z.object({
  week: z.string().optional(),
});

const EMPTY_SHOPPING: MealShoppingListView = {
  aiGenerated: false,
  bySection: [],
  totalEstimatedUsd: null,
};

export const Route = createFileRoute("/app/nutrition/plan")({
  validateSearch: searchSchema,
  component: PlanPage,
});

function useShoppingListView(
  weekKey: string,
  online: boolean
): { data: MealShoppingListView | null; loading: boolean } {
  const [data, setData] = useState<MealShoppingListView | null>(null);
  const [loading, setLoading] = useState(true);
  const coach = useCoachRuntimeOptional();
  const coachWorking = coach?.coachAgentWorking ?? false;
  const prevCoachWorkingRef = useRef(coachWorking);
  const [coachFinishedBump, setCoachFinishedBump] = useState(0);
  useEffect(() => {
    if (prevCoachWorkingRef.current && !coachWorking) {
      setCoachFinishedBump((n) => n + 1);
    }
    prevCoachWorkingRef.current = coachWorking;
  }, [coachWorking]);

  useEffect(() => {
    if (!online) {
      setData(null);
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    void (async () => {
      try {
        const u = `/api/nutrition/meal-plan/shopping-list?weekStart=${encodeURIComponent(weekKey)}`;
        const res = await authFetch(u);
        if (!alive) return;
        if (!res.ok) {
          setData(null);
          return;
        }
        const j = (await res.json()) as { shoppingList: MealShoppingListView };
        setData(j.shoppingList);
      } catch {
        if (alive) setData(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [weekKey, online, coachFinishedBump]);
  return { data, loading };
}

function PlanPage() {
  const { week: weekParam } = Route.useSearch();
  const online = useOnline();
  const { ensurePlan } = useMealPlanMutations();
  const weekKey = useMemo(() => {
    if (weekParam && /^\d{4}-\d{2}-\d{2}$/.test(weekParam)) {
      return mondayOfWeekContaining(weekParam);
    }
    return mondayOfWeekContaining(formatDayKey());
  }, [weekParam]);

  const thisWeek = useMemo(
    () => mondayOfWeekContaining(formatDayKey()),
    []
  );

  const { data: plan } = usePlanForWeek(weekKey);
  const { data: slots } = usePlanSlots(plan?.id ?? null);
  const { data: library } = useMealLibrary();
  const libIds = useMemo(
    () => [...new Set(slots.map((s) => s.libraryItemId).filter(Boolean))] as string[],
    [slots]
  );
  const { data: allIngs } = useMealLibraryIngredientsForItems(libIds);

  const { data: serverShopping } = useShoppingListView(weekKey, online);
  const [clientShopping, setClientShopping] =
    useState<MealShoppingListView | null>(null);

  useEffect(() => {
    if (serverShopping != null) setClientShopping(serverShopping);
  }, [serverShopping]);

  const shoppingDisplay =
    clientShopping ?? serverShopping ?? EMPTY_SHOPPING;

  useEffect(() => {
    void ensurePlan(weekKey);
  }, [weekKey, ensurePlan]);

  const itemsById = useMemo(() => {
    const m = new Map<
      string,
      {
        item: (typeof library)[0];
        ingredients: (typeof allIngs)[0][];
      }
    >();
    const byLib = new Map<string, (typeof allIngs)[0][]>();
    for (const ing of allIngs) {
      const arr = byLib.get(ing.libraryItemId) ?? [];
      arr.push(ing);
      byLib.set(ing.libraryItemId, arr);
    }
    for (const item of library) m.set(item.id, { item, ingredients: byLib.get(item.id) ?? [] });
    return m;
  }, [library, allIngs]);

  const planBoard = useMemo(() => {
    if (!plan) return null;
    return buildMealPlanBoardView(
      { id: plan.id, weekStartDayKey: plan.weekStartDayKey },
      slots,
      itemsById
    );
  }, [plan, slots, itemsById]);

  const libraryOptions: MealPlanLibraryOption[] = useMemo(
    () => library.map((i) => ({ id: i.id, name: i.name })),
    [library]
  );

  if (!plan || !planBoard) {
    return (
      <p className="text-muted-foreground text-center py-10">Loading…</p>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-6 md:max-w-5xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight">
            <span className="bg-primary/15 text-primary ring-primary/15 inline-flex size-10 items-center justify-center rounded-2xl ring-1">
              <CalendarRange className="size-5" strokeWidth={2.25} aria-hidden />
            </span>
            Meal plan
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Plan the week, tap a meal for details, or use Edit plan to add slots
            and assign recipes.
          </p>
          {weekKey !== thisWeek ? (
            <p className="mt-2 text-sm">
              <Link
                to="/app/nutrition/plan"
                search={{}}
                className="text-primary font-medium underline-offset-4 hover:underline"
              >
                Jump to this week
              </Link>
            </p>
          ) : null}
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end sm:gap-2">
          <Link
            to="/app/coach"
            search={{ prompt: COACH_MEAL_PLAN_PROMPT }}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "inline-flex min-h-12 shrink-0 touch-manipulation items-center justify-center gap-2 text-base shadow-sm"
            )}
          >
            <Sparkles className="size-4" aria-hidden />
            Create with AI
          </Link>
        </div>
      </div>

      {libraryOptions.length === 0 ? (
        <div
          className={cn(
            "border-primary/15 bg-card text-muted-foreground rounded-xl border p-4 text-sm shadow-sm"
          )}
        >
          Your recipe library is empty. Add meals in{" "}
          <Link
            to="/app/nutrition/library"
            className="text-primary font-medium underline"
          >
            Recipe library
          </Link>{" "}
          first, then you can assign them here.
        </div>
      ) : null}

      <MealPlanBoard
        weekStartDayKey={weekKey}
        plan={planBoard}
        libraryOptions={libraryOptions}
      />

      {!online ? (
        <p className="inline-flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
          <CloudOff className="size-4" aria-hidden />
          Offline — shopping list requires a connection to generate or
          refresh.
        </p>
      ) : null}
      <PlanShoppingListCard
        weekStartDayKey={weekKey}
        shoppingList={online ? shoppingDisplay : EMPTY_SHOPPING}
        onListUpdated={(v) => setClientShopping(v)}
      />
    </div>
  );
}
