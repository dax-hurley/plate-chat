import { and, asc, eq, gte, inArray, like } from "drizzle-orm";

import { db, type Database } from "@/db/client";
import {
  MAX_MEAL_SLOTS_PER_DAY,
  MAX_SNACK_SLOTS_PER_DAY,
} from "@/lib/meal-plan-constants";
import { computeMealPlanSlotLabels } from "@/lib/meal-slot-labels";
import {
  mealLibraryItems,
  mealPlanSlots,
  mealPlans,
} from "@/db/schema";

/** Default meals per calendar day when creating a new weekly plan. */
export const DEFAULT_SLOTS_PER_DAY = 3;

/** Labels for the first three slots each day (Breakfast, Lunch, Dinner). */
export const DEFAULT_MEAL_LABELS = ["Breakfast", "Lunch", "Dinner"] as const;

export type MealPlanWithSlots = NonNullable<
  Awaited<ReturnType<typeof getPlanForWeek>>
>;

export function shoppingListFromPlan(plan: MealPlanWithSlots) {
  const items = plan.slots
    .map((s) => s.libraryItem)
    .filter((x): x is NonNullable<typeof x> => x != null);
  return aggregateShoppingList(
    items.map((i) => ({ ingredients: i.ingredients }))
  );
}

export function aggregateShoppingList(
  libraryItems: {
    ingredients: { line: string }[];
  }[]
): { line: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const item of libraryItems) {
    for (const ing of item.ingredients) {
      const line = ing.line.trim();
      if (!line) continue;
      counts.set(line, (counts.get(line) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .sort(([a], [b]) => a.localeCompare(b, undefined, { sensitivity: "base" }))
    .map(([line, count]) => ({ line, count }));
}

type MealPlanTx = Pick<Database, "query" | "update">;

async function shiftSlotIndicesRight(
  dbh: MealPlanTx,
  planId: string,
  dayIndex: number,
  fromIndex: number
) {
  const rows = await dbh.query.mealPlanSlots.findMany({
    where: and(
      eq(mealPlanSlots.planId, planId),
      eq(mealPlanSlots.dayIndex, dayIndex),
      gte(mealPlanSlots.slotIndex, fromIndex)
    ),
  });
  const sorted = [...rows].sort((a, b) => b.slotIndex - a.slotIndex);
  for (const r of sorted) {
    await dbh
      .update(mealPlanSlots)
      .set({ slotIndex: r.slotIndex + 1 })
      .where(eq(mealPlanSlots.id, r.id));
  }
}

async function persistSlotLabelsForDay(
  dbh: MealPlanTx,
  planId: string,
  dayIndex: number
) {
  const slots = await dbh.query.mealPlanSlots.findMany({
    where: and(
      eq(mealPlanSlots.planId, planId),
      eq(mealPlanSlots.dayIndex, dayIndex)
    ),
  });
  const map = computeMealPlanSlotLabels(slots);
  for (const s of slots) {
    const label = map.get(s.id);
    if (label && label !== s.label) {
      await dbh
        .update(mealPlanSlots)
        .set({ label })
        .where(eq(mealPlanSlots.id, s.id));
    }
  }
}

export async function getPlanByIdForUser(userId: string, planId: string) {
  return db.query.mealPlans.findFirst({
    where: and(eq(mealPlans.id, planId), eq(mealPlans.userId, userId)),
    with: {
      slots: {
        orderBy: [asc(mealPlanSlots.dayIndex), asc(mealPlanSlots.slotIndex)],
        with: {
          libraryItem: {
            with: {
              ingredients: {
                orderBy: (ing, { asc: a }) => [a(ing.sortOrder)],
              },
            },
          },
        },
      },
    },
  });
}

export async function getPlanForWeek(userId: string, weekStartDayKey: string) {
  return db.query.mealPlans.findFirst({
    where: and(
      eq(mealPlans.userId, userId),
      eq(mealPlans.weekStartDayKey, weekStartDayKey)
    ),
    with: {
      slots: {
        orderBy: [asc(mealPlanSlots.dayIndex), asc(mealPlanSlots.slotIndex)],
        with: {
          libraryItem: {
            with: {
              ingredients: {
                orderBy: (ing, { asc: a }) => [a(ing.sortOrder)],
              },
            },
          },
        },
      },
    },
  });
}

export async function getOrCreatePlanForWeek(
  userId: string,
  weekStartDayKey: string
) {
  let plan = await getPlanForWeek(userId, weekStartDayKey);
  if (plan) {
    await ensureDefaultSlotsForPlan(plan.id);
    plan = await getPlanForWeek(userId, weekStartDayKey);
    return plan!;
  }

  const now = new Date();
  const [inserted] = await db
    .insert(mealPlans)
    .values({
      userId,
      weekStartDayKey,
      updatedAt: now,
    })
    .returning();

  await insertDefaultWeekSlots(inserted.id);

  return getPlanForWeek(userId, weekStartDayKey);
}

function insertDefaultWeekSlots(planId: string) {
  const rows: {
    planId: string;
    dayIndex: number;
    slotIndex: number;
    slotKind: "meal";
    label: string;
    libraryItemId: null;
  }[] = [];
  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    for (let slotIndex = 0; slotIndex < DEFAULT_SLOTS_PER_DAY; slotIndex++) {
      rows.push({
        planId,
        dayIndex,
        slotIndex,
        slotKind: "meal",
        label: DEFAULT_MEAL_LABELS[slotIndex] ?? `Meal ${slotIndex + 1}`,
        libraryItemId: null,
      });
    }
  }
  return db.insert(mealPlanSlots).values(rows);
}

/** Ensures each day has Breakfast / Lunch / Dinner rows; adds missing slots for older plans. */
async function ensureDefaultSlotsForPlan(planId: string) {
  const existing = await db.query.mealPlanSlots.findMany({
    where: eq(mealPlanSlots.planId, planId),
  });
  const byDay = new Map<number, Set<number>>();
  for (const s of existing) {
    if (!byDay.has(s.dayIndex)) byDay.set(s.dayIndex, new Set());
    byDay.get(s.dayIndex)!.add(s.slotIndex);
  }
  const missing: {
    planId: string;
    dayIndex: number;
    slotIndex: number;
    slotKind: "meal";
    label: string;
    libraryItemId: null;
  }[] = [];
  for (let d = 0; d < 7; d++) {
    const have = byDay.get(d) ?? new Set();
    for (let si = 0; si < DEFAULT_SLOTS_PER_DAY; si++) {
      if (!have.has(si)) {
        missing.push({
          planId,
          dayIndex: d,
          slotIndex: si,
          slotKind: "meal",
          label: DEFAULT_MEAL_LABELS[si] ?? `Meal ${si + 1}`,
          libraryItemId: null,
        });
      }
    }
  }
  if (missing.length > 0) await db.insert(mealPlanSlots).values(missing);

  await db
    .update(mealPlanSlots)
    .set({ label: DEFAULT_MEAL_LABELS[0] })
    .where(
      and(
        eq(mealPlanSlots.planId, planId),
        eq(mealPlanSlots.slotIndex, 0),
        eq(mealPlanSlots.label, "Meal")
      )
    );

  await db
    .update(mealPlanSlots)
    .set({ slotKind: "snack" })
    .where(
      and(
        eq(mealPlanSlots.planId, planId),
        like(mealPlanSlots.label, "Snack%")
      )
    );

  for (let d = 0; d < 7; d++) {
    await persistSlotLabelsForDay(db, planId, d);
  }
}

export async function setSlotLibraryItem(
  userId: string,
  input: { slotId: string; libraryItemId: string | null }
) {
  const slot = await db.query.mealPlanSlots.findFirst({
    where: eq(mealPlanSlots.id, input.slotId),
    with: { plan: true },
  });
  if (!slot || slot.plan.userId !== userId) throw new Error("Slot not found");

  if (input.libraryItemId) {
    const item = await db.query.mealLibraryItems.findFirst({
      where: and(
        eq(mealLibraryItems.id, input.libraryItemId),
        eq(mealLibraryItems.userId, userId)
      ),
    });
    if (!item) throw new Error("Library meal not found");
  }

  const now = new Date();
  await db
    .update(mealPlanSlots)
    .set({ libraryItemId: input.libraryItemId })
    .where(eq(mealPlanSlots.id, input.slotId));

  await db
    .update(mealPlans)
    .set({ updatedAt: now })
    .where(eq(mealPlans.id, slot.planId));

  return getPlanForWeek(userId, slot.plan.weekStartDayKey);
}

/**
 * Sets library meal for every slot on a plan in one transaction (full snapshot from the client).
 */
export async function setPlanLibraryAssignmentsBySlotIds(
  userId: string,
  planId: string,
  assignments: { slotId: string; libraryItemId: string | null }[]
) {
  const pid = planId.trim();
  if (!pid) throw new Error("Invalid plan");

  const plan = await getPlanByIdForUser(userId, pid);
  if (!plan) throw new Error("Plan not found");

  const assignMap = new Map(
    assignments.map((a) => [a.slotId.trim(), a.libraryItemId] as const)
  );
  if (assignMap.size !== assignments.length) {
    throw new Error("Duplicate slot in assignments");
  }
  if (assignMap.size !== plan.slots.length) {
    throw new Error("Each plan slot must appear exactly once");
  }
  for (const s of plan.slots) {
    if (!assignMap.has(s.id)) throw new Error("Missing slot assignment");
  }

  const libraryIds = [
    ...new Set(
      [...assignMap.values()].filter(
        (id): id is string => id != null && id !== ""
      )
    ),
  ];

  await db.transaction(async (tx) => {
    if (libraryIds.length > 0) {
      const found = await tx.query.mealLibraryItems.findMany({
        where: and(
          eq(mealLibraryItems.userId, userId),
          inArray(mealLibraryItems.id, libraryIds)
        ),
      });
      if (found.length !== libraryIds.length) {
        throw new Error("Library meal not found");
      }
    }

    const now = new Date();
    for (const s of plan.slots) {
      const libId = assignMap.get(s.id) ?? null;
      await tx
        .update(mealPlanSlots)
        .set({ libraryItemId: libId })
        .where(eq(mealPlanSlots.id, s.id));
    }

    await tx
      .update(mealPlans)
      .set({ updatedAt: now })
      .where(eq(mealPlans.id, pid));
  });

  return getPlanByIdForUser(userId, pid);
}

/** Back-compat: target one slot by week + day + slot index (default slot 0 = first meal of the day). */
export async function setPlanSlot(
  userId: string,
  input: {
    weekStartDayKey: string;
    dayIndex: number;
    slotIndex?: number;
    libraryItemId: string | null;
  }
) {
  if (input.dayIndex < 0 || input.dayIndex > 6) {
    throw new Error("dayIndex must be 0–6");
  }
  const slotIndex = input.slotIndex ?? 0;
  if (slotIndex < 0 || slotIndex > 50) throw new Error("slotIndex out of range");

  const plan = await getOrCreatePlanForWeek(userId, input.weekStartDayKey);
  if (!plan) throw new Error("Plan not found");

  const slot = plan.slots.find(
    (s) => s.dayIndex === input.dayIndex && s.slotIndex === slotIndex
  );
  if (!slot) throw new Error("Slot not found");

  return setSlotLibraryItem(userId, {
    slotId: slot.id,
    libraryItemId: input.libraryItemId,
  });
}

/**
 * Assign many library meals to slots in one week in a single round trip.
 * Entries are applied in order; duplicate (dayIndex, slotIndex) rows use the last value.
 */
export async function setPlanSlotsBatch(
  userId: string,
  input: {
    weekStartDayKey: string;
    assignments: {
      dayIndex: number;
      slotIndex?: number;
      libraryItemId: string | null;
    }[];
  }
) {
  const weekStartDayKey = input.weekStartDayKey.trim();
  const plan = await getOrCreatePlanForWeek(userId, weekStartDayKey);
  if (!plan) throw new Error("Plan not found");

  if (input.assignments.length === 0) {
    return plan;
  }

  const slotByKey = new Map<string, (typeof plan.slots)[number]>();
  for (const s of plan.slots) {
    slotByKey.set(`${s.dayIndex}:${s.slotIndex}`, s);
  }

  const resolved: {
    slotId: string;
    libraryItemId: string | null;
  }[] = [];

  for (const a of input.assignments) {
    if (a.dayIndex < 0 || a.dayIndex > 6) {
      throw new Error("dayIndex must be 0–6");
    }
    const slotIndex = a.slotIndex ?? 0;
    if (slotIndex < 0 || slotIndex > 50) throw new Error("slotIndex out of range");

    const slot = slotByKey.get(`${a.dayIndex}:${slotIndex}`);
    if (!slot) throw new Error("Slot not found");

    resolved.push({
      slotId: slot.id,
      libraryItemId: a.libraryItemId,
    });
  }

  const libraryIds = [
    ...new Set(
      resolved
        .map((r) => r.libraryItemId)
        .filter((id): id is string => id != null && id !== "")
    ),
  ];

  await db.transaction(async (tx) => {
    if (libraryIds.length > 0) {
      const found = await tx.query.mealLibraryItems.findMany({
        where: and(
          eq(mealLibraryItems.userId, userId),
          inArray(mealLibraryItems.id, libraryIds)
        ),
      });
      if (found.length !== libraryIds.length) {
        throw new Error("Library meal not found");
      }
    }

    const now = new Date();
    for (const r of resolved) {
      await tx
        .update(mealPlanSlots)
        .set({ libraryItemId: r.libraryItemId })
        .where(eq(mealPlanSlots.id, r.slotId));
    }

    await tx
      .update(mealPlans)
      .set({ updatedAt: now })
      .where(eq(mealPlans.id, plan.id));
  });

  return getPlanForWeek(userId, weekStartDayKey);
}

export async function addMealSlotForDay(
  userId: string,
  input: { weekStartDayKey: string; dayIndex: number; kind: "meal" | "snack" }
) {
  if (input.dayIndex < 0 || input.dayIndex > 6) {
    throw new Error("dayIndex must be 0–6");
  }
  const plan = await getOrCreatePlanForWeek(userId, input.weekStartDayKey);
  if (!plan) throw new Error("Plan not found");

  await db.transaction(async (tx) => {
    const daySlots = await tx.query.mealPlanSlots.findMany({
      where: and(
        eq(mealPlanSlots.planId, plan.id),
        eq(mealPlanSlots.dayIndex, input.dayIndex)
      ),
    });
    const sorted = [...daySlots].sort((a, b) => a.slotIndex - b.slotIndex);

    if (input.kind === "snack") {
      const snackCount = sorted.filter((s) => s.slotKind === "snack").length;
      if (snackCount >= MAX_SNACK_SLOTS_PER_DAY) {
        throw new Error(
          `At most ${MAX_SNACK_SLOTS_PER_DAY} snacks per day in the meal plan.`
        );
      }
      const maxIdx =
        sorted.length > 0
          ? Math.max(...sorted.map((s) => s.slotIndex))
          : -1;
      await tx.insert(mealPlanSlots).values({
        planId: plan.id,
        dayIndex: input.dayIndex,
        slotIndex: maxIdx + 1,
        slotKind: "snack",
        label: "Snack",
        libraryItemId: null,
      });
    } else {
      const mealSlots = sorted.filter((s) => s.slotKind !== "snack");
      if (mealSlots.length >= MAX_MEAL_SLOTS_PER_DAY) {
        throw new Error(
          `At most ${MAX_MEAL_SLOTS_PER_DAY} meals per day (breakfast through extra lunches and dinner).`
        );
      }
      if (mealSlots.length === 0) {
        if (sorted.length > 0) {
          await shiftSlotIndicesRight(tx, plan.id, input.dayIndex, 0);
        }
        await tx.insert(mealPlanSlots).values({
          planId: plan.id,
          dayIndex: input.dayIndex,
          slotIndex: 0,
          slotKind: "meal",
          label: "Dinner",
          libraryItemId: null,
        });
      } else {
        const lastMeal = mealSlots[mealSlots.length - 1]!;
        const insertAt = lastMeal.slotIndex;
        await shiftSlotIndicesRight(tx, plan.id, input.dayIndex, insertAt);
        await tx.insert(mealPlanSlots).values({
          planId: plan.id,
          dayIndex: input.dayIndex,
          slotIndex: insertAt,
          slotKind: "meal",
          label: "Meal",
          libraryItemId: null,
        });
      }
    }

    await persistSlotLabelsForDay(tx, plan.id, input.dayIndex);

    await tx
      .update(mealPlans)
      .set({ updatedAt: new Date() })
      .where(eq(mealPlans.id, plan.id));
  });

  return getPlanForWeek(userId, input.weekStartDayKey);
}

export async function updateMealSlotLabel(
  userId: string,
  input: { slotId: string; label: string }
) {
  const label = input.label.trim();
  if (!label) throw new Error("Label required");

  const slot = await db.query.mealPlanSlots.findFirst({
    where: eq(mealPlanSlots.id, input.slotId),
    with: { plan: true },
  });
  if (!slot || slot.plan.userId !== userId) throw new Error("Slot not found");

  const now = new Date();
  await db
    .update(mealPlanSlots)
    .set({ label })
    .where(eq(mealPlanSlots.id, input.slotId));

  await db
    .update(mealPlans)
    .set({ updatedAt: now })
    .where(eq(mealPlans.id, slot.planId));

  return getPlanForWeek(userId, slot.plan.weekStartDayKey);
}

export async function removeMealSlot(userId: string, slotId: string) {
  const slot = await db.query.mealPlanSlots.findFirst({
    where: eq(mealPlanSlots.id, slotId),
    with: { plan: true },
  });
  if (!slot || slot.plan.userId !== userId) throw new Error("Slot not found");

  const sameDay = await db.query.mealPlanSlots.findMany({
    where: and(
      eq(mealPlanSlots.planId, slot.planId),
      eq(mealPlanSlots.dayIndex, slot.dayIndex)
    ),
  });
  const mealCount = sameDay.filter((s) => s.slotKind !== "snack").length;
  const removingMeal = slot.slotKind !== "snack";
  if (removingMeal && mealCount <= 3) {
    throw new Error(
      "Keep at least three meals: breakfast, lunch, and dinner."
    );
  }

  const now = new Date();
  await db.transaction(async (tx) => {
    await tx.delete(mealPlanSlots).where(eq(mealPlanSlots.id, slotId));
    await persistSlotLabelsForDay(tx, slot.planId, slot.dayIndex);
    await tx
      .update(mealPlans)
      .set({ updatedAt: now })
      .where(eq(mealPlans.id, slot.planId));
  });

  return getPlanForWeek(userId, slot.plan.weekStartDayKey);
}

/** Clears cached AI shopping list so the next load recomputes (AI or fallback). */
export async function clearAiShoppingListCache(
  userId: string,
  planId: string
) {
  const row = await db.query.mealPlans.findFirst({
    where: eq(mealPlans.id, planId),
  });
  if (!row || row.userId !== userId) throw new Error("Plan not found");
  await db
    .update(mealPlans)
    .set({
      aiShoppingListJson: "[]",
      shoppingListSourceHash: null,
    })
    .where(eq(mealPlans.id, planId));
}
