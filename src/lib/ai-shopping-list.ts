import { anthropic } from "@ai-sdk/anthropic";
import { createHash } from "node:crypto";
import { generateText } from "ai";
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { mealPlans } from "@/db/schema";
import {
  groupItemsBySectionOrder,
  SHOPPING_LIST_SECTIONS,
} from "@/lib/shopping-list-sections";
import type { MealShoppingListView } from "@/types/meal-plan";
import type { MealPlanWithSlots } from "@/lib/services/meal-plan";
import { buildShoppingListFormatPrompt } from "@/prompts/shopping-list-format-prompt";
import { shoppingListFromPlan } from "@/lib/services/meal-plan";

/** Bump when AI instructions or stored JSON shape changes. */
const SHOPPING_LIST_AI_VERSION = 3;

type ParsedLineItem = {
  label: string;
  section: string;
  estimatedCostUsd: number;
};

function roundUsd(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100) / 100;
}

/** Strip stray bracket tags from a single line label. */
function normalizeLabel(line: string): string {
  return line
    .replace(/^\[[A-Za-z][^\]]{0,39}\]\s*/, "")
    .trim();
}

function hashAggregatedShoppingList(
  raw: { line: string; count: number }[]
): string {
  return createHash("sha256")
    .update(`v${SHOPPING_LIST_AI_VERSION}:${JSON.stringify(raw)}`)
    .digest("hex");
}

function parseStoredShoppingListJson(
  s: string | null | undefined
): ParsedLineItem[] | null {
  if (s == null || s === "") return null;
  try {
    const v = JSON.parse(s) as unknown;
    if (!Array.isArray(v)) return null;
    if (v.length === 0) return [];
    if (typeof v[0] === "string") return null;
    const out: ParsedLineItem[] = [];
    for (const el of v) {
      if (!el || typeof el !== "object") continue;
      const o = el as Record<string, unknown>;
      const label = typeof o.label === "string" ? normalizeLabel(o.label) : "";
      const section = typeof o.section === "string" ? o.section : "Other";
      const c = o.estimatedCostUsd;
      const estimatedCostUsd =
        typeof c === "number" && Number.isFinite(c) ? roundUsd(c) : 0;
      if (label) out.push({ label, section, estimatedCostUsd });
    }
    return out;
  } catch {
    return null;
  }
}

function aggregateLinesForFallback(
  raw: { line: string; count: number }[]
): string[] {
  return raw.map((r) =>
    r.count > 1 ? `${r.count}× ${r.line}` : r.line
  );
}

function buildFallbackView(
  raw: { line: string; count: number }[]
): MealShoppingListView {
  const lines = aggregateLinesForFallback(raw);
  return {
    aiGenerated: false,
    bySection:
      lines.length > 0
        ? [
            {
              section: "Ingredients",
              items: lines.map((label) => ({
                label,
                estimatedCostUsd: null,
              })),
            },
          ]
        : [],
    totalEstimatedUsd: null,
  };
}

function buildViewFromAiItems(
  items: ParsedLineItem[],
  rawIngredientLines: number
): MealShoppingListView {
  const cleaned: ParsedLineItem[] = items
    .map((i) => ({
      ...i,
      label: normalizeLabel(i.label),
    }))
    .filter((i) => i.label.length > 0);

  if (cleaned.length === 0) {
    return {
      aiGenerated: false,
      bySection: [],
      totalEstimatedUsd: null,
    };
  }

  const grouped = groupItemsBySectionOrder(cleaned);
  const bySection = grouped.map(({ section, items: rows }) => ({
    section,
    items: rows.map(({ label, estimatedCostUsd }) => ({
      label,
      estimatedCostUsd,
    })),
  }));

  let total = 0;
  for (const row of cleaned) {
    total += row.estimatedCostUsd;
  }

  return {
    aiGenerated: rawIngredientLines > 0,
    bySection,
    totalEstimatedUsd: roundUsd(total),
  };
}

async function generateStructuredShoppingList(
  raw: { line: string; count: number }[],
  weekStartDayKey: string
): Promise<ParsedLineItem[]> {
  if (raw.length === 0) return [];

  const modelId =
    process.env.ANTHROPIC_QUICK_MODEL?.trim() ||
    process.env.ANTHROPIC_MODEL?.trim() ||
    "claude-haiku-4-5";

  const rawBlock = aggregateLinesForFallback(raw).join("\n");

  const sectionList = SHOPPING_LIST_SECTIONS.map((s) => `- "${s}"`).join("\n");
  const prompt = buildShoppingListFormatPrompt(
    weekStartDayKey,
    rawBlock,
    sectionList
  );

  const { text } = await generateText({
    model: anthropic(modelId),
    prompt,
    maxOutputTokens: 4096,
  });

  const trimmed = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");
  const parsed = JSON.parse(trimmed) as { items?: unknown };
  const items = parsed.items;
  if (!Array.isArray(items)) return [];

  const out: ParsedLineItem[] = [];
  for (const el of items) {
    if (!el || typeof el !== "object") continue;
    const o = el as Record<string, unknown>;
    const label = typeof o.label === "string" ? normalizeLabel(o.label) : "";
    const section = typeof o.section === "string" ? o.section : "Other";
    const c = o.estimatedCostUsd;
    const estimatedCostUsd =
      typeof c === "number" && Number.isFinite(c) ? roundUsd(c) : 0;
    if (label) out.push({ label, section, estimatedCostUsd });
  }
  return out;
}

/**
 * Cached AI list or merged fallback when AI is unavailable — never calls the model.
 * When AI is configured and the plan has ingredients but no cached list for the current
 * meals, returns `awaitingAiGeneration` so the UI can prompt for explicit generation.
 */
export async function resolveShoppingListForMealPlan(
  plan: MealPlanWithSlots
): Promise<MealShoppingListView> {
  const raw = shoppingListFromPlan(plan);
  const hash = hashAggregatedShoppingList(raw);

  const storedHash = plan.shoppingListSourceHash ?? null;
  const storedParsed = parseStoredShoppingListJson(plan.aiShoppingListJson);

  const cacheOk =
    storedHash === hash &&
    storedParsed !== null &&
    !(raw.length > 0 && storedParsed.length === 0);

  if (cacheOk) {
    return buildViewFromAiItems(storedParsed, raw.length);
  }

  if (raw.length === 0) {
    await db
      .update(mealPlans)
      .set({
        aiShoppingListJson: "[]",
        shoppingListSourceHash: hash,
      })
      .where(eq(mealPlans.id, plan.id));
    return {
      aiGenerated: false,
      bySection: [],
      totalEstimatedUsd: null,
    };
  }

  const fallbackWithNotice = (notice: string): MealShoppingListView => ({
    ...buildFallbackView(raw),
    aiNotice: notice,
  });

  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn(
      "[ai-shopping-list] ANTHROPIC_API_KEY not set; using merged lines only"
    );
    return fallbackWithNotice(
      "AI formatting isn’t available. Showing merged ingredient lines."
    );
  }

  return {
    aiGenerated: false,
    awaitingAiGeneration: true,
    mealPlanUpdatedSinceShoppingList:
      storedHash != null && storedHash !== hash,
    bySection: [],
    totalEstimatedUsd: null,
  };
}

/**
 * Runs AI formatting (or merged fallback) and persists when successful.
 * Use after an explicit user or tool action to generate or refresh the list.
 */
export async function generateShoppingListForMealPlan(
  plan: MealPlanWithSlots
): Promise<MealShoppingListView> {
  const raw = shoppingListFromPlan(plan);
  const hash = hashAggregatedShoppingList(raw);

  if (raw.length === 0) {
    await db
      .update(mealPlans)
      .set({
        aiShoppingListJson: "[]",
        shoppingListSourceHash: hash,
      })
      .where(eq(mealPlans.id, plan.id));
    return {
      aiGenerated: false,
      bySection: [],
      totalEstimatedUsd: null,
    };
  }

  const fallbackWithNotice = (notice: string): MealShoppingListView => ({
    ...buildFallbackView(raw),
    aiNotice: notice,
  });

  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn(
      "[ai-shopping-list] ANTHROPIC_API_KEY not set; using merged lines only"
    );
    return fallbackWithNotice(
      "AI formatting isn’t available. Showing merged ingredient lines."
    );
  }

  try {
    const items = await generateStructuredShoppingList(raw, plan.weekStartDayKey);
    const preview = buildViewFromAiItems(items, raw.length);
    const lineCount = preview.bySection.reduce(
      (acc, s) => acc + s.items.length,
      0
    );
    if (items.length === 0 || lineCount === 0) {
      return fallbackWithNotice(
        "Couldn’t parse the AI shopping list. Showing merged ingredient lines instead."
      );
    }

    await db
      .update(mealPlans)
      .set({
        aiShoppingListJson: JSON.stringify(items),
        shoppingListSourceHash: hash,
      })
      .where(eq(mealPlans.id, plan.id));

    return preview;
  } catch (err) {
    console.error("[ai-shopping-list] generation failed:", err);
    return fallbackWithNotice(
      "Couldn’t generate the AI shopping list. Showing merged ingredient lines instead."
    );
  }
}
