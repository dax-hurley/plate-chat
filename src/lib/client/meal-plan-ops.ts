import { pickCanonicalMealPlanForWeek } from "@/lib/client/meal-plan-canonical";
import type { TrainlogDB } from "@/lib/client/db/database";
import { insertLocal, softDeleteLocal, updateLocal } from "@/lib/client/db/writes";
import { newId, nowMs } from "@/lib/stores/ids";
import type { MealPlan, MealPlanSlot } from "@/lib/stores/meal-plan";
import { computeMealPlanSlotLabels } from "@/lib/meal-slot-labels";
import {
  MAX_MEAL_SLOTS_PER_DAY,
  MAX_SNACK_SLOTS_PER_DAY,
  DEFAULT_MEAL_LABELS,
  DEFAULT_SLOTS_PER_DAY,
} from "@/lib/meal-plan-constants";

function isAlive(
  r: { deletedAt: number | null } | unknown
): r is { deletedAt: null } {
  return (r as { deletedAt: number | null }).deletedAt == null;
}

export async function listPlanSlots(
  db: TrainlogDB,
  planId: string
): Promise<MealPlanSlot[]> {
  const rows = (await db.mealPlanSlots.toArray()) as unknown as MealPlanSlot[];
  return rows.filter(
    (r) => isAlive(r) && (r as { planId: string }).planId === planId
  );
}

/**
 * Back-fill breakfast/lunch/dinner for older or empty plans.
 */
export async function ensureDefaultSlotsForPlan(
  db: TrainlogDB,
  userId: string,
  planId: string
) {
  const existing = (await listPlanSlots(db, planId)) as Array<
    MealPlanSlot & { dayIndex: number; slotIndex: number }
  >;
  const byDay = new Map<number, Set<number>>();
  for (const s of existing) {
    if (!byDay.has(s.dayIndex)) byDay.set(s.dayIndex, new Set());
    byDay.get(s.dayIndex)!.add(s.slotIndex);
  }
  for (let d = 0; d < 7; d++) {
    const have = byDay.get(d) ?? new Set();
    for (let si = 0; si < DEFAULT_SLOTS_PER_DAY; si++) {
      if (!have.has(si)) {
        const atCompound = (await db.mealPlanSlots
          .where("[planId+dayIndex+slotIndex]")
          .equals([planId, d, si])
          .toArray()) as unknown as MealPlanSlot[];
        const tomb = atCompound.find((r) => r.deletedAt != null);
        if (tomb) {
          await updateLocal(db.mealPlanSlots, tomb.id, {
            deletedAt: null,
            slotKind: "meal",
            label: DEFAULT_MEAL_LABELS[si] ?? `Meal ${si + 1}`,
            libraryItemId: null,
          } as Record<string, unknown>);
        } else {
          await insertLocal(db.mealPlanSlots, {
            id: newId(),
            userId,
            planId,
            dayIndex: d,
            slotIndex: si,
            slotKind: "meal" as const,
            label: DEFAULT_MEAL_LABELS[si] ?? `Meal ${si + 1}`,
            libraryItemId: null,
          } as unknown as Record<string, unknown>);
        }
      }
    }
  }
  for (const s of (await listPlanSlots(
    db,
    planId
  )) as MealPlanSlot[]) {
    if (s.slotIndex === 0 && s.label === "Meal") {
      await updateLocal(db.mealPlanSlots, s.id, {
        label: DEFAULT_MEAL_LABELS[0],
      } as Record<string, unknown>);
    }
  }
  for (const s of (await listPlanSlots(
    db,
    planId
  )) as MealPlanSlot[]) {
    if (s.slotKind === "meal" && /^snack/i.test(s.label.trim())) {
      await updateLocal(db.mealPlanSlots, s.id, {
        slotKind: "snack",
      } as Record<string, unknown>);
    }
  }
  for (let d = 0; d < 7; d++) {
    await persistSlotLabelsForDay(db, planId, d);
  }
}

export async function shiftSlotIndicesRight(
  db: TrainlogDB,
  planId: string,
  dayIndex: number,
  fromIndex: number
) {
  const rows = (await listPlanSlots(
    db,
    planId
  )) as MealPlanSlot[];
  const hit = rows.filter(
    (r) => r.dayIndex === dayIndex && r.slotIndex >= fromIndex
  );
  const sorted = [...hit].sort((a, b) => b.slotIndex - a.slotIndex);
  for (const r of sorted) {
    await updateLocal(db.mealPlanSlots, r.id, {
      slotIndex: r.slotIndex + 1,
    } as Record<string, unknown>);
  }
}

export async function persistSlotLabelsForDay(
  db: TrainlogDB,
  planId: string,
  dayIndex: number
) {
  const rows = (await listPlanSlots(
    db,
    planId
  )) as MealPlanSlot[];
  const daySlots = rows.filter((r) => r.dayIndex === dayIndex);
  const map = computeMealPlanSlotLabels(daySlots);
  for (const s of daySlots) {
    const label = map.get(s.id);
    if (label && label !== s.label) {
      await updateLocal(db.mealPlanSlots, s.id, {
        label,
      } as Record<string, unknown>);
    }
  }
}

export async function addMealSlotForDay(
  db: TrainlogDB,
  userId: string,
  input: { weekStartDayKey: string; dayIndex: number; kind: "meal" | "snack" }
) {
  if (input.dayIndex < 0 || input.dayIndex > 6) {
    throw new Error("dayIndex must be 0–6");
  }
  const plan = await pickCanonicalMealPlanForWeek(
    db,
    userId,
    input.weekStartDayKey
  );
  if (!plan) throw new Error("Plan not found");
  const planId = plan.id;
  const daySlots = (await listPlanSlots(db, planId)).filter(
    (r) => r.dayIndex === input.dayIndex
  );
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
    await insertLocal(db.mealPlanSlots, {
      id: newId(),
      userId,
      planId,
      dayIndex: input.dayIndex,
      slotIndex: maxIdx + 1,
      slotKind: "snack",
      label: "Snack",
      libraryItemId: null,
    } as unknown as Record<string, unknown>);
  } else {
    const mealSlots = sorted.filter((s) => s.slotKind !== "snack");
    if (mealSlots.length >= MAX_MEAL_SLOTS_PER_DAY) {
      throw new Error(
        `At most ${MAX_MEAL_SLOTS_PER_DAY} meals per day (breakfast through extra lunches and dinner).`
      );
    }
    if (mealSlots.length === 0) {
      if (sorted.length > 0) {
        await shiftSlotIndicesRight(db, planId, input.dayIndex, 0);
      }
      await insertLocal(db.mealPlanSlots, {
        id: newId(),
        userId,
        planId,
        dayIndex: input.dayIndex,
        slotIndex: 0,
        slotKind: "meal",
        label: "Dinner",
        libraryItemId: null,
      } as unknown as Record<string, unknown>);
    } else {
      const lastMeal = mealSlots[mealSlots.length - 1]!;
      const insertAt = lastMeal.slotIndex;
      await shiftSlotIndicesRight(db, planId, input.dayIndex, insertAt);
      await insertLocal(db.mealPlanSlots, {
        id: newId(),
        userId,
        planId,
        dayIndex: input.dayIndex,
        slotIndex: insertAt,
        slotKind: "meal",
        label: "Meal",
        libraryItemId: null,
      } as unknown as Record<string, unknown>);
    }
  }

  await persistSlotLabelsForDay(db, planId, input.dayIndex);
  await updateLocal(db.mealPlans, planId, { updatedAt: nowMs() } as Record<
    string,
    unknown
  >);
}

export async function removeMealSlot(db: TrainlogDB, userId: string, slotId: string) {
  const row = (await db.mealPlanSlots.get(
    slotId
  )) as unknown as MealPlanSlot | undefined;
  if (!row || row.deletedAt != null) throw new Error("Slot not found");
  const plan = (await db.mealPlans.get(
    row.planId
  )) as unknown as MealPlan | undefined;
  if (!plan || plan.deletedAt != null || plan.userId !== userId) {
    throw new Error("Slot not found");
  }
  const sameDay = (await listPlanSlots(db, row.planId)).filter(
    (s) => s.dayIndex === row.dayIndex
  );
  const mealCount = sameDay.filter((s) => s.slotKind !== "snack").length;
  const removingMeal = row.slotKind !== "snack";
  if (removingMeal && mealCount <= 3) {
    throw new Error(
      "Keep at least three meals: breakfast, lunch, and dinner."
    );
  }
  await softDeleteLocal(db.mealPlanSlots, slotId);
  await persistSlotLabelsForDay(db, row.planId, row.dayIndex);
  await updateLocal(db.mealPlans, row.planId, { updatedAt: nowMs() } as Record<
    string,
    unknown
  >);
}

export async function setPlanLibraryAssignmentsBySlotIds(
  db: TrainlogDB,
  userId: string,
  planId: string,
  assignments: { slotId: string; libraryItemId: string | null }[]
) {
  const slots = await listPlanSlots(db, planId);
  if (assignments.length !== slots.length) {
    throw new Error("Each plan slot must appear exactly once");
  }
  const assignMap = new Map(
    assignments.map((a) => [a.slotId.trim(), a.libraryItemId] as const)
  );
  if (assignMap.size !== assignments.length) {
    throw new Error("Duplicate slot in assignments");
  }
  for (const s of slots) {
    if (!assignMap.has(s.id)) throw new Error("Missing slot assignment");
  }
  const libraryIds = [
    ...new Set(
      [...assignMap.values()].filter(
        (id): id is string => id != null && id !== ""
      )
    ),
  ];
  if (libraryIds.length > 0) {
    for (const lid of libraryIds) {
      const it = (await db.mealLibraryItems.get(
        lid
      )) as unknown as { userId: string; deletedAt: number | null } | undefined;
      if (!it || it.deletedAt != null || it.userId !== userId) {
        throw new Error("Library meal not found");
      }
    }
  }
  for (const s of slots) {
    const libId = assignMap.get(s.id) ?? null;
    await updateLocal(db.mealPlanSlots, s.id, {
      libraryItemId: libId,
    } as Record<string, unknown>);
  }
  await clearAiShoppingListCacheClient(db, planId);
  await updateLocal(db.mealPlans, planId, { updatedAt: nowMs() } as Record<
    string,
    unknown
  >);
}

export async function clearAiShoppingListCacheClient(
  db: TrainlogDB,
  planId: string
) {
  await updateLocal(db.mealPlans, planId, {
    aiShoppingListJson: "[]",
    shoppingListSourceHash: null,
  } as Record<string, unknown>);
}
