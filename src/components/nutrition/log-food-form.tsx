import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Beef,
  Check,
  Droplets,
  Flame,
  Plus,
  PlusCircle,
  Salad,
  Wheat,
} from "lucide-react";
import { toast } from "sonner";

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
import { DAILY_FOOD_LOG_MEAL_NAME } from "@/lib/nutrition-constants";
import { mondayOfWeekContaining, dayKeysDistance } from "@/lib/date-key";
import { computeMealPlanSlotLabels } from "@/lib/meal-slot-labels";
import {
  type Meal,
  useLocalSession,
  useMealLibrary,
  useMealsOnDay,
  useNutritionMutations,
  usePlanForWeek,
  usePlanSlots,
} from "@/lib/stores";
import { useDb } from "@/lib/client/db/provider";
import { insertLocal } from "@/lib/client/db/writes";
import { newId } from "@/lib/stores/ids";
import { cn } from "@/lib/utils";
import {
  AppSubNav,
  appSubNavTriggerClassName,
} from "@/components/app/app-sub-nav";
import type { PlannedSlotQuickAdd } from "@/types/meal-log-plan";

type AddTab = "plan" | "manual";

function parseNum(raw: string): number {
  const n = Number(String(raw).replace(",", ".").trim());
  return Number.isFinite(n) ? n : 0;
}

function MacroHint({
  calories,
  proteinG,
  carbsG,
  fatG,
}: {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}) {
  return (
    <p className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs tabular-nums">
      <span className="inline-flex items-center gap-0.5">
        <Flame className="text-chart-2 size-3" aria-hidden />
        {calories} cal
      </span>
      <span className="inline-flex items-center gap-0.5">
        <Beef className="text-chart-1 size-3" aria-hidden />
        {proteinG.toFixed(0)}g
      </span>
      <span className="inline-flex items-center gap-0.5">
        <Wheat className="text-chart-4 size-3" aria-hidden />
        {carbsG.toFixed(0)}g
      </span>
      <span className="inline-flex items-center gap-0.5">
        <Droplets className="text-chart-3 size-3" aria-hidden />
        {fatG.toFixed(0)}g
      </span>
    </p>
  );
}

function PlanQuickAddSection({
  mealPlanWeekStart,
  hasPlannedLibraryMealsThisWeek,
  plannedSlotsForDay,
  loggedLibraryItemIds,
  onAddFromLibrary,
  pending,
}: {
  mealPlanWeekStart: string;
  hasPlannedLibraryMealsThisWeek: boolean;
  plannedSlotsForDay: PlannedSlotQuickAdd[];
  loggedLibraryItemIds: string[];
  onAddFromLibrary: (libraryItemId: string) => void | Promise<void>;
  pending: boolean;
}) {
  const loggedSet = useMemo(
    () => new Set(loggedLibraryItemIds),
    [loggedLibraryItemIds]
  );
  const planLink = {
    to: "/app/nutrition/plan" as const,
    search: { week: mealPlanWeekStart },
  };

  if (!hasPlannedLibraryMealsThisWeek) {
    return (
      <div className="border-border/80 bg-muted/20 rounded-xl border border-dashed p-4 text-sm">
        <p className="text-muted-foreground">
          No recipes are assigned in your meal plan for this week yet. Set them
          up in <Link {...planLink} className="text-primary font-medium underline">Meal plan</Link>
          , then you can add them here in one tap.
        </p>
      </div>
    );
  }

  if (plannedSlotsForDay.length === 0) {
    return (
      <div className="border-border/80 bg-muted/20 rounded-xl border border-dashed p-4 text-sm">
        <p className="text-muted-foreground">
          Nothing is planned for this day in your weekly plan. Add meals for
          this day in{" "}
          <Link {...planLink} className="text-primary font-medium underline">
            Meal plan
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {plannedSlotsForDay.map((slot) => {
        const alreadyLogged = loggedSet.has(slot.libraryItem.id);
        return (
          <li key={slot.slotId}>
            <div
              className={cn(
                "border-border/80 bg-card flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4",
                alreadyLogged && "border-primary/25 bg-primary/[0.04]"
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground text-xs font-medium">
                  {slot.label}
                </p>
                <p className="text-foreground font-semibold leading-snug">
                  {slot.libraryItem.name}
                </p>
                <MacroHint
                  calories={slot.libraryItem.calories}
                  proteinG={slot.libraryItem.proteinG}
                  carbsG={slot.libraryItem.carbsG}
                  fatG={slot.libraryItem.fatG}
                />
              </div>
              {alreadyLogged ? (
                <div
                  className="text-primary flex min-h-11 shrink-0 items-center justify-center gap-2 px-2 sm:justify-end"
                  aria-label={`${slot.libraryItem.name} already added to log`}
                >
                  <Check className="size-5 shrink-0" strokeWidth={2.5} aria-hidden />
                  <span className="text-sm font-medium">Added</span>
                </div>
              ) : (
                <Button
                  type="button"
                  className="min-h-11 w-full shrink-0 touch-manipulation sm:w-auto"
                  disabled={pending}
                  onClick={() => void onAddFromLibrary(slot.libraryItem.id)}
                >
                  <PlusCircle className="size-4" aria-hidden />
                  Add to log
                </Button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function AddModeTabs({
  tab,
  onTabChange,
}: {
  tab: AddTab;
  onTabChange: (t: AddTab) => void;
}) {
  return (
    <AppSubNav className="w-full" aria-label="How to add to your log">
      <button
        type="button"
        role="tab"
        aria-selected={tab === "plan"}
        className={cn(appSubNavTriggerClassName(tab === "plan"))}
        onClick={() => onTabChange("plan")}
      >
        Meal plan
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={tab === "manual"}
        className={cn(appSubNavTriggerClassName(tab === "manual"))}
        onClick={() => onTabChange("manual")}
      >
        Manual
      </button>
    </AppSubNav>
  );
}

export function LogFoodForm({ dayKey }: { dayKey: string }) {
  const { db, ready } = useDb();
  const { userId } = useLocalSession();
  const { data: meals } = useMealsOnDay(dayKey);
  const { data: library } = useMealLibrary();
  const { logMeal } = useNutritionMutations();
  const [description, setDescription] = useState("");
  const [calories, setCalories] = useState("");
  const [proteinG, setProteinG] = useState("");
  const [carbsG, setCarbsG] = useState("");
  const [fatG, setFatG] = useState("");
  const [pending, setPending] = useState(false);
  /** `null` = follow the preferred tab for the current day (plan when the week has assignments). */
  const [tab, setTab] = useState<AddTab | null>(null);

  const mealPlanWeekStart = useMemo(
    () => mondayOfWeekContaining(dayKey),
    [dayKey]
  );
  const { data: plan } = usePlanForWeek(mealPlanWeekStart);
  const { data: allSlots } = usePlanSlots(plan?.id ?? null);
  const libById = useMemo(
    () => new Map(library.map((it) => [it.id, it])),
    [library]
  );

  const dayIndex = useMemo(() => {
    const d = dayKeysDistance(mealPlanWeekStart, dayKey);
    if (d == null) return 0;
    return Math.max(0, Math.min(6, d));
  }, [mealPlanWeekStart, dayKey]);

  const labelBySlotId = useMemo(() => {
    return computeMealPlanSlotLabels(
      allSlots.map((s) => ({
        id: s.id,
        dayIndex: s.dayIndex,
        slotIndex: s.slotIndex,
        label: s.label,
        slotKind: s.slotKind,
      }))
    );
  }, [allSlots]);

  const { plannedSlotsForDay, hasPlannedLibraryMealsThisWeek } = useMemo(() => {
    const hasAny = allSlots.some((s) => s.libraryItemId != null);
    const forDay: PlannedSlotQuickAdd[] = [];
    for (const s of allSlots) {
      if (s.dayIndex !== dayIndex || s.libraryItemId == null) continue;
      const item = libById.get(s.libraryItemId);
      if (!item) continue;
      forDay.push({
        slotId: s.id,
        label: labelBySlotId.get(s.id) ?? s.label,
        slotIndex: s.slotIndex,
        libraryItem: {
          id: item.id,
          name: item.name,
          calories: item.calories,
          proteinG: item.proteinG,
          carbsG: item.carbsG,
          fatG: item.fatG,
        },
      });
    }
    forDay.sort((a, b) => a.slotIndex - b.slotIndex);
    return {
      plannedSlotsForDay: forDay,
      hasPlannedLibraryMealsThisWeek: hasAny,
    };
  }, [allSlots, dayIndex, libById, labelBySlotId]);

  const preferredTab: AddTab = hasPlannedLibraryMealsThisWeek
    ? "plan"
    : "manual";
  const addTab = tab ?? preferredTab;

  useEffect(() => {
    setTab(null);
  }, [dayKey]);

  const loggedLibraryItemIds = useMemo(
    () =>
      meals
        .map((m) => m.sourceLibraryItemId)
        .filter((v): v is string => typeof v === "string"),
    [meals]
  );

  const adHocMeal = useMemo(
    () =>
      meals.find(
        (m: Meal) =>
          m.name === DAILY_FOOD_LOG_MEAL_NAME && m.sourceLibraryItemId == null
      ) ?? null,
    [meals]
  );

  function resetForm() {
    setDescription("");
    setCalories("");
    setProteinG("");
    setCarbsG("");
    setFatG("");
  }

  async function onLog(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!ready || !db || !userId) return;
    const desc = description.trim();
    if (!desc) {
      toast.error("Describe your food first.");
      return;
    }
    setPending(true);
    try {
      let mealId = adHocMeal?.id ?? null;
      if (!mealId) {
        mealId = await logMeal({
          dayKey,
          name: DAILY_FOOD_LOG_MEAL_NAME,
          sourceLibraryItemId: null,
          entries: [],
        });
      }
      await insertLocal(db.mealEntries, {
        id: newId(),
        userId,
        mealId,
        description: desc,
        calories: parseNum(calories),
        proteinG: parseNum(proteinG),
        carbsG: parseNum(carbsG),
        fatG: parseNum(fatG),
      });
      resetForm();
      toast.success("Logged");
    } catch {
      toast.error("Could not log food.");
    } finally {
      setPending(false);
    }
  }

  async function onLogFromLibrary(libraryItemId: string) {
    const item = library.find((l) => l.id === libraryItemId);
    if (!item) return;
    setPending(true);
    try {
      const mealId = await logMeal({
        dayKey,
        name: item.name,
        sourceLibraryItemId: item.id,
        entries: [
          {
            description: item.name,
            calories: item.calories,
            proteinG: item.proteinG,
            carbsG: item.carbsG,
            fatG: item.fatG,
          },
        ],
      });
      void mealId;
      toast.success(`Added ${item.name}`);
    } catch {
      toast.error("Could not add meal.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="border-primary/15 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <PlusCircle className="text-primary size-5" aria-hidden />
          Add to today
        </CardTitle>
        <CardDescription>
          Add from your weekly meal plan or enter food and macros manually.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <AddModeTabs tab={addTab} onTabChange={setTab} />
        {addTab === "plan" ? (
          <PlanQuickAddSection
            mealPlanWeekStart={mealPlanWeekStart}
            hasPlannedLibraryMealsThisWeek={hasPlannedLibraryMealsThisWeek}
            plannedSlotsForDay={plannedSlotsForDay}
            loggedLibraryItemIds={loggedLibraryItemIds}
            onAddFromLibrary={onLogFromLibrary}
            pending={pending}
          />
        ) : (
          <div className="space-y-6">
            <form onSubmit={onLog} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="log-desc" className="text-base">
                  Food
                </Label>
                <Input
                  id="log-desc"
                  autoComplete="off"
                  placeholder="e.g. Chicken rice bowl"
                  className="min-h-14 text-base touch-manipulation"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="space-y-1">
                  <Label htmlFor="log-cal" className="text-xs">
                    Calories
                  </Label>
                  <Input
                    id="log-cal"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder="0"
                    className="min-h-12 md:min-h-11"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="log-p" className="text-xs">
                    P (g)
                  </Label>
                  <Input
                    id="log-p"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="any"
                    placeholder="0"
                    className="min-h-12 md:min-h-11"
                    value={proteinG}
                    onChange={(e) => setProteinG(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="log-c" className="text-xs">
                    C (g)
                  </Label>
                  <Input
                    id="log-c"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="any"
                    placeholder="0"
                    className="min-h-12 md:min-h-11"
                    value={carbsG}
                    onChange={(e) => setCarbsG(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="log-f" className="text-xs">
                    F (g)
                  </Label>
                  <Input
                    id="log-f"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="any"
                    placeholder="0"
                    className="min-h-12 md:min-h-11"
                    value={fatG}
                    onChange={(e) => setFatG(e.target.value)}
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={pending}
                className="min-h-12 w-full gap-2 text-base shadow-sm"
              >
                <Plus className="size-4" aria-hidden />
                Log food
              </Button>
            </form>

            {library.length > 0 ? (
              <section className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="flex items-center gap-1.5 text-sm font-semibold">
                    <Salad
                      className="text-primary size-4 shrink-0"
                      aria-hidden
                    />
                    From your library
                  </h3>
                </div>
                <ul className="space-y-2">
                  {library.slice(0, 8).map((it) => (
                    <li
                      key={it.id}
                      className="border-primary/15 bg-card flex items-center justify-between gap-2 rounded-lg border p-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{it.name}</p>
                        <p className="text-muted-foreground text-xs tabular-nums">
                          {Math.round(it.calories)} kcal · P
                          {Math.round(it.proteinG)} · C{Math.round(it.carbsG)} ·
                          F
                          {Math.round(it.fatG)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        disabled={pending}
                        onClick={() => void onLogFromLibrary(it.id)}
                      >
                        <Plus className="size-4" aria-hidden />
                        Add
                      </Button>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
