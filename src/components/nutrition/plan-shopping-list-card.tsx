import { useMemo, useState } from "react";
import { ClipboardCopy, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authFetch } from "@/lib/client/auth-fetch";
import { ShoppingSectionIcon } from "@/lib/shopping-list-section-icons";
import type { MealShoppingListView } from "@/types/meal-plan";

function buildCopyText(list: MealShoppingListView): string {
  const fmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });
  const lines: string[] = [];
  for (const { section, items } of list.bySection) {
    lines.push(section);
    for (const { label, estimatedCostUsd } of items) {
      if (estimatedCostUsd != null) {
        lines.push(`• ${label} — ${fmt.format(estimatedCostUsd)}`);
      } else {
        lines.push(`• ${label}`);
      }
    }
    lines.push("");
  }
  if (list.aiGenerated && list.totalEstimatedUsd != null) {
    lines.push(`Estimated total: ${fmt.format(list.totalEstimatedUsd)}`);
  }
  return lines.join("\n").trim();
}

function shoppingListUrl(weekStartDayKey: string) {
  const u = new URL(
    "/api/nutrition/meal-plan/shopping-list",
    window.location.origin
  );
  u.searchParams.set("weekStart", weekStartDayKey);
  return u.pathname + u.search;
}

export function PlanShoppingListCard({
  weekStartDayKey,
  shoppingList,
  onListUpdated,
}: {
  weekStartDayKey: string;
  shoppingList: MealShoppingListView;
  onListUpdated: (v: MealShoppingListView) => void;
}) {
  const [busy, setBusy] = useState(false);
  const shoppingText = useMemo(
    () => buildCopyText(shoppingList),
    [shoppingList]
  );

  const fmt = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }),
    []
  );

  const lineCount = shoppingList.bySection.reduce(
    (acc, s) => acc + s.items.length,
    0
  );

  const defaultOpenSections = useMemo(
    () => shoppingList.bySection.map((_, i) => `section-${i}`),
    [shoppingList.bySection]
  );

  async function runPostGenerate() {
    setBusy(true);
    try {
      const res = await authFetch(shoppingListUrl(weekStartDayKey), {
        method: "POST",
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(err.error ?? "Couldn’t update the shopping list");
        return;
      }
      const data = (await res.json()) as { shoppingList: MealShoppingListView };
      onListUpdated(data.shoppingList);
      toast.success("Shopping list updated");
    } catch {
      toast.error("Couldn’t update the shopping list");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="border-primary/15 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
          <ClipboardCopy className="text-chart-2 size-5 shrink-0" aria-hidden />
          Shopping list
          {shoppingList.aiGenerated ? (
            <span
              className="border-primary/20 bg-primary/5 text-primary inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5"
              aria-label="AI-generated shopping list"
              title="Sections, quantities, and price estimates from your meal plan"
            >
              <Sparkles className="size-3.5 shrink-0" aria-hidden />
              <span className="text-[0.65rem] font-semibold uppercase tracking-wide">
                AI
              </span>
            </span>
          ) : null}
        </CardTitle>
        <CardDescription>
          {shoppingList.awaitingAiGeneration
            ? shoppingList.mealPlanUpdatedSinceShoppingList
              ? "Your meal plan changed. Generate a new list so it matches what you’re cooking this week."
              : "Your meals have ingredients. Generate a store-style list with sections and rough price estimates when you’re ready."
            : shoppingList.aiGenerated
              ? "Grouped by store section with rough US price estimates. Tap a section to expand or collapse."
              : "Ingredient lines from your assigned meals (combined where the same line appears more than once)."}
        </CardDescription>
        {shoppingList.aiNotice ? (
          <p className="text-amber-700 dark:text-amber-500/90 mt-2 text-sm leading-snug">
            {shoppingList.aiNotice}
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {shoppingList.awaitingAiGeneration ? (
          <div className="space-y-3">
            <Button
              type="button"
              className="w-full touch-manipulation sm:w-auto"
              disabled={busy}
              onClick={() => {
                void runPostGenerate();
              }}
            >
              <Sparkles
                className={`size-4 ${busy ? "animate-pulse" : ""}`}
                aria-hidden
              />
              {busy ? "Generating…" : "Generate shopping list"}
            </Button>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {shoppingList.mealPlanUpdatedSinceShoppingList ? (
                <>
                  This shopping list hasn’t been generated for your current meal
                  plan. Generate again to refresh sections and price estimates.
                </>
              ) : (
                <>
                  The list is not generated yet. You can keep editing your meal
                  plan; generation runs only when you use the button above.
                </>
              )}
            </p>
          </div>
        ) : lineCount === 0 ? (
          <p className="text-muted-foreground text-sm">
            Assign meals above to build a list.
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button
                type="button"
                variant="outline"
                className="border-primary/20 w-full touch-manipulation sm:w-auto"
                disabled={busy || lineCount === 0}
                title={
                  lineCount === 0
                    ? "Assign meals first"
                    : "Clear cached list and run AI again (or refresh merged lines)"
                }
                onClick={() => {
                  void runPostGenerate();
                }}
              >
                <RefreshCw
                  className={`size-4 ${busy ? "animate-spin" : ""}`}
                  aria-hidden
                />
                Regenerate list
              </Button>
            </div>

            <Accordion
              type="multiple"
              defaultValue={defaultOpenSections}
              className="w-full"
            >
              {shoppingList.bySection.map((sec, i) => (
                <AccordionItem
                  key={`${sec.section}-${i}`}
                  value={`section-${i}`}
                  className="border-border/60 border-b last:border-b-0"
                >
                  <AccordionTrigger className="text-foreground py-3 hover:no-underline">
                    <div className="flex min-w-0 flex-1 items-center gap-2.5 pr-2">
                      <ShoppingSectionIcon section={sec.section} />
                      <span className="text-muted-foreground min-w-0 flex-1 truncate text-left text-xs font-semibold tracking-wide uppercase">
                        {sec.section}
                      </span>
                      <span className="text-muted-foreground shrink-0 text-[0.65rem] font-normal tabular-nums">
                        {sec.items.length}{" "}
                        {sec.items.length === 1 ? "item" : "items"}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-0">
                    <ul className="space-y-1.5 pb-1 text-sm">
                      {sec.items.map((row, j) => (
                        <li
                          key={`${sec.section}-${row.label}-${j}`}
                          className="border-border/60 flex items-baseline justify-between gap-3 border-b border-dotted pb-1.5 pl-1 last:border-0"
                        >
                          <span className="text-foreground min-w-0 flex-1 leading-snug">
                            {row.label}
                          </span>
                          {row.estimatedCostUsd != null ? (
                            <span className="text-muted-foreground shrink-0 tabular-nums">
                              {fmt.format(row.estimatedCostUsd)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/50 shrink-0 text-xs">
                              —
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {shoppingList.aiGenerated &&
            shoppingList.totalEstimatedUsd != null ? (
              <div className="border-border flex items-baseline justify-between gap-3 border-t pt-3">
                <span className="text-foreground text-sm font-semibold">
                  Estimated total
                </span>
                <span className="text-foreground text-base font-semibold tabular-nums">
                  {fmt.format(shoppingList.totalEstimatedUsd)}
                </span>
              </div>
            ) : null}

            {shoppingList.aiGenerated ? (
              <p className="text-muted-foreground text-[0.7rem] leading-relaxed">
                Dollar amounts are AI ballpark estimates for a typical US
                supermarket; your store, brand, and sales will differ.
              </p>
            ) : null}

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button
                type="button"
                variant="outline"
                className="border-primary/20 w-full touch-manipulation sm:w-auto"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(shoppingText);
                  } catch {
                    /* ignore */
                  }
                }}
              >
                <ClipboardCopy className="size-4" aria-hidden />
                Copy list
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
