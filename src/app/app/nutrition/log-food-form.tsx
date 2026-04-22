"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
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

import {
  AppSubNav,
  appSubNavTriggerClassName,
} from "@/components/app/app-sub-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { PlannedSlotQuickAdd } from "@/types/meal-log-plan";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { actionAddMealFromLibrary, actionLogFood } from "./actions";

type AddTab = "plan" | "manual";

function fieldId(prefix: string, base: string) {
  return `${base}-${prefix}`;
}

function LogFoodFields({
  idPrefix,
  dayKey,
}: {
  idPrefix: string;
  dayKey: string;
}) {
  return (
    <>
      <input type="hidden" name="dayKey" value={dayKey} />
      <div className="space-y-2">
        <Label htmlFor={fieldId(idPrefix, "desc")} className="text-base">
          Food
        </Label>
        <Input
          id={fieldId(idPrefix, "desc")}
          name="description"
          placeholder="e.g. Chicken rice bowl, Greek yogurt"
          className="min-h-14 text-base touch-manipulation"
          autoComplete="off"
        />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="space-y-1">
          <Label className="text-xs" htmlFor={fieldId(idPrefix, "cal")}>
            Calories
          </Label>
          <Input
            id={fieldId(idPrefix, "cal")}
            name="calories"
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="0"
            className="min-h-12 md:min-h-11"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs" htmlFor={fieldId(idPrefix, "p")}>
            Protein (g)
          </Label>
          <Input
            id={fieldId(idPrefix, "p")}
            name="proteinG"
            type="number"
            inputMode="decimal"
            step="0.1"
            min={0}
            placeholder="0"
            className="min-h-12 md:min-h-11"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs" htmlFor={fieldId(idPrefix, "c")}>
            Carbs (g)
          </Label>
          <Input
            id={fieldId(idPrefix, "c")}
            name="carbsG"
            type="number"
            inputMode="decimal"
            step="0.1"
            min={0}
            placeholder="0"
            className="min-h-12 md:min-h-11"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs" htmlFor={fieldId(idPrefix, "f")}>
            Fat (g)
          </Label>
          <Input
            id={fieldId(idPrefix, "f")}
            name="fatG"
            type="number"
            inputMode="decimal"
            step="0.1"
            min={0}
            placeholder="0"
            className="min-h-12 md:min-h-11"
          />
        </div>
      </div>
    </>
  );
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
  dayKey,
  mealPlanWeekStart,
  hasPlannedLibraryMealsThisWeek,
  plannedSlotsForDay,
  loggedLibraryItemIds,
  onAdded,
  compact,
}: {
  dayKey: string;
  mealPlanWeekStart: string;
  hasPlannedLibraryMealsThisWeek: boolean;
  plannedSlotsForDay: PlannedSlotQuickAdd[];
  loggedLibraryItemIds: string[];
  onAdded: () => void;
  compact?: boolean;
}) {
  const loggedSet = useMemo(
    () => new Set(loggedLibraryItemIds),
    [loggedLibraryItemIds]
  );
  const planHref = `/app/nutrition/plan?week=${encodeURIComponent(mealPlanWeekStart)}`;

  if (!hasPlannedLibraryMealsThisWeek) {
    return (
      <div
        className={cn(
          "border-border/80 bg-muted/20 rounded-xl border border-dashed p-4 text-sm",
          compact && "p-3"
        )}
      >
        <p className="text-muted-foreground">
          No recipes are assigned in your meal plan for this week yet. Set them
          up in{" "}
          <Link href={planHref} className="text-primary font-medium underline">
            Meal plan
          </Link>
          , then you can log them here in one tap.
        </p>
      </div>
    );
  }

  if (plannedSlotsForDay.length === 0) {
    return (
      <div
        className={cn(
          "border-border/80 bg-muted/20 rounded-xl border border-dashed p-4 text-sm",
          compact && "p-3"
        )}
      >
        <p className="text-muted-foreground">
          Nothing is planned for this day in your weekly plan. Add meals for this
          day in{" "}
          <Link href={planHref} className="text-primary font-medium underline">
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
                <form
                  action={async (fd) => {
                    try {
                      await actionAddMealFromLibrary(fd);
                      toast.success(`Added “${slot.libraryItem.name}” to your log`);
                      onAdded();
                    } catch (e) {
                      toast.error(
                        e instanceof Error ? e.message : "Could not add meal"
                      );
                    }
                  }}
                  className="contents"
                >
                  <input type="hidden" name="dayKey" value={dayKey} />
                  <input
                    type="hidden"
                    name="libraryItemId"
                    value={slot.libraryItem.id}
                  />
                  <Button
                    type="submit"
                    className="min-h-11 w-full shrink-0 touch-manipulation sm:w-auto"
                  >
                    <PlusCircle className="size-4" aria-hidden />
                    Add to log
                  </Button>
                </form>
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

export function LogFoodForm({
  dayKey,
  defaultTab,
  hasPlannedLibraryMealsThisWeek,
  plannedSlotsForDay,
  mealPlanWeekStart,
  loggedLibraryItemIds,
}: {
  dayKey: string;
  defaultTab: AddTab;
  hasPlannedLibraryMealsThisWeek: boolean;
  plannedSlotsForDay: PlannedSlotQuickAdd[];
  mealPlanWeekStart: string;
  loggedLibraryItemIds: string[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<AddTab>(defaultTab);
  const [open, setOpen] = useState(false);

  async function submitFood(formData: FormData) {
    const label = String(formData.get("description") ?? "").trim() || "Food";
    try {
      await actionLogFood(formData);
      toast.success(`Logged “${label}”`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not log food");
    }
  }

  return (
    <>
      <div className="bg-card border-primary/10 hidden flex-col gap-4 rounded-xl border p-4 shadow-sm md:flex">
        <h2 className="text-foreground flex items-center gap-2 text-lg font-semibold">
          <Salad className="text-primary size-5" aria-hidden />
          Log food
        </h2>
        <AddModeTabs tab={tab} onTabChange={setTab} />
        {tab === "plan" ? (
          <PlanQuickAddSection
            dayKey={dayKey}
            mealPlanWeekStart={mealPlanWeekStart}
            hasPlannedLibraryMealsThisWeek={hasPlannedLibraryMealsThisWeek}
            plannedSlotsForDay={plannedSlotsForDay}
            loggedLibraryItemIds={loggedLibraryItemIds}
            onAdded={() => router.refresh()}
          />
        ) : (
          <form
            action={async (fd) => {
              await submitFood(fd);
            }}
            className="flex flex-col gap-4"
          >
            <LogFoodFields idPrefix="desktop" dayKey={dayKey} />
            <Button type="submit" className="min-h-12 w-full gap-2 text-base shadow-sm">
              <PlusCircle className="size-4" aria-hidden />
              Log food
            </Button>
          </form>
        )}
      </div>

      <div className="md:hidden">
        <Button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "fixed right-4 z-30 flex size-14 touch-manipulation items-center justify-center rounded-full p-0 shadow-lg",
            "bottom-[calc(var(--app-mobile-tab-bar-height)+1rem)]"
          )}
          aria-label="Log food"
        >
          <Plus className="size-7" strokeWidth={2.5} aria-hidden />
        </Button>

        <Sheet
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
          }}
        >
          <SheetContent
            side="bottom"
            className="max-h-[min(92dvh,40rem)] gap-0 overflow-y-auto"
          >
            <SheetHeader className="text-left">
              <SheetTitle className="flex items-center gap-2 text-lg">
                <Salad className="text-primary size-5" aria-hidden />
                Log food
              </SheetTitle>
              <SheetDescription>
                Add from your weekly meal plan or enter food and macros
                manually.
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-4 px-4 pb-8 pt-2">
              <AddModeTabs tab={tab} onTabChange={setTab} />
              {tab === "plan" ? (
                <PlanQuickAddSection
                  dayKey={dayKey}
                  mealPlanWeekStart={mealPlanWeekStart}
                  hasPlannedLibraryMealsThisWeek={
                    hasPlannedLibraryMealsThisWeek
                  }
                  plannedSlotsForDay={plannedSlotsForDay}
                  loggedLibraryItemIds={loggedLibraryItemIds}
                  onAdded={() => {
                    router.refresh();
                  }}
                  compact
                />
              ) : (
                <form
                  action={async (fd) => {
                    await submitFood(fd);
                    setOpen(false);
                  }}
                  className="flex flex-col gap-4"
                >
                  <LogFoodFields idPrefix="mobile" dayKey={dayKey} />
                  <Button
                    type="submit"
                    className="min-h-14 w-full gap-2 text-base shadow-sm"
                  >
                    <PlusCircle className="size-5" aria-hidden />
                    Log food
                  </Button>
                </form>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
