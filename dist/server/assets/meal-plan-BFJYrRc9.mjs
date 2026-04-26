import { useCallback } from "react";
import { c as updateLocal, i as insertLocal, s as softDeleteLocal, a as useLocalSession, b as useLiveOne, u as useLiveArray } from "./writes-C61wFNCm.mjs";
import { E as computeMealPlanSlotLabels, u as useDb, e as pullSyncCollections } from "./router-CUOzYYmk.mjs";
import { n as newId, a as nowMs } from "./ids-zMPBJmub.mjs";
const DEFAULT_SLOTS_PER_DAY = 3;
const DEFAULT_MEAL_LABELS = ["Breakfast", "Lunch", "Dinner"];
const MAX_MEAL_SLOTS_PER_DAY = 12;
const MAX_SNACK_SLOTS_PER_DAY = 10;
async function countAssignedSlots(db, planId) {
  const rows = await db.mealPlanSlots.where("planId").equals(planId).toArray();
  return rows.filter(
    (r) => r.deletedAt == null && r.libraryItemId != null && r.libraryItemId !== ""
  ).length;
}
async function pickCanonicalMealPlanForWeek(db, userId, weekStartDayKey) {
  const plans = await db.mealPlans.where("[userId+weekStartDayKey]").equals([userId, weekStartDayKey]).toArray();
  const alive = plans.filter((p) => p.deletedAt == null);
  if (alive.length === 0) return null;
  if (alive.length === 1) return alive[0];
  const scored = await Promise.all(
    alive.map(async (plan) => ({
      plan,
      assigned: await countAssignedSlots(db, plan.id)
    }))
  );
  scored.sort((a, b) => {
    if (b.assigned !== a.assigned) return b.assigned - a.assigned;
    const ad = a.plan._dirty;
    const bd = b.plan._dirty;
    if ((ad ?? 0) !== (bd ?? 0)) return (ad ?? 0) - (bd ?? 0);
    const br = b.plan.rev ?? 0;
    const ar = a.plan.rev ?? 0;
    if (br !== ar) return br - ar;
    return b.plan.updatedAt - a.plan.updatedAt;
  });
  return scored[0].plan;
}
async function dedupeMealPlanDuplicates(db, userId, weekStartDayKey, keepPlanId) {
  const plans = await db.mealPlans.where("[userId+weekStartDayKey]").equals([userId, weekStartDayKey]).toArray();
  for (const p of plans) {
    if (p.deletedAt != null || p.id === keepPlanId) continue;
    const slotRows = await db.mealPlanSlots.where("planId").equals(p.id).toArray();
    await db.transaction("rw", db.mealPlanSlots, db.mealPlans, async () => {
      for (const s of slotRows) {
        await db.mealPlanSlots.delete(s.id);
      }
      await db.mealPlans.delete(p.id);
    });
  }
}
function isAlive(r) {
  return r.deletedAt == null;
}
async function listPlanSlots(db, planId) {
  const rows = await db.mealPlanSlots.toArray();
  return rows.filter(
    (r) => isAlive(r) && r.planId === planId
  );
}
async function ensureDefaultSlotsForPlan(db, userId, planId) {
  const existing = await listPlanSlots(db, planId);
  const byDay = /* @__PURE__ */ new Map();
  for (const s of existing) {
    if (!byDay.has(s.dayIndex)) byDay.set(s.dayIndex, /* @__PURE__ */ new Set());
    byDay.get(s.dayIndex).add(s.slotIndex);
  }
  for (let d = 0; d < 7; d++) {
    const have = byDay.get(d) ?? /* @__PURE__ */ new Set();
    for (let si = 0; si < DEFAULT_SLOTS_PER_DAY; si++) {
      if (!have.has(si)) {
        const atCompound = await db.mealPlanSlots.where("[planId+dayIndex+slotIndex]").equals([planId, d, si]).toArray();
        const tomb = atCompound.find((r) => r.deletedAt != null);
        if (tomb) {
          await updateLocal(db.mealPlanSlots, tomb.id, {
            deletedAt: null,
            slotKind: "meal",
            label: DEFAULT_MEAL_LABELS[si] ?? `Meal ${si + 1}`,
            libraryItemId: null
          });
        } else {
          await insertLocal(db.mealPlanSlots, {
            id: newId(),
            userId,
            planId,
            dayIndex: d,
            slotIndex: si,
            slotKind: "meal",
            label: DEFAULT_MEAL_LABELS[si] ?? `Meal ${si + 1}`,
            libraryItemId: null
          });
        }
      }
    }
  }
  for (const s of await listPlanSlots(
    db,
    planId
  )) {
    if (s.slotIndex === 0 && s.label === "Meal") {
      await updateLocal(db.mealPlanSlots, s.id, {
        label: DEFAULT_MEAL_LABELS[0]
      });
    }
  }
  for (const s of await listPlanSlots(
    db,
    planId
  )) {
    if (s.slotKind === "meal" && /^snack/i.test(s.label.trim())) {
      await updateLocal(db.mealPlanSlots, s.id, {
        slotKind: "snack"
      });
    }
  }
  for (let d = 0; d < 7; d++) {
    await persistSlotLabelsForDay(db, planId, d);
  }
}
async function shiftSlotIndicesRight(db, planId, dayIndex, fromIndex) {
  const rows = await listPlanSlots(
    db,
    planId
  );
  const hit = rows.filter(
    (r) => r.dayIndex === dayIndex && r.slotIndex >= fromIndex
  );
  const sorted = [...hit].sort((a, b) => b.slotIndex - a.slotIndex);
  for (const r of sorted) {
    await updateLocal(db.mealPlanSlots, r.id, {
      slotIndex: r.slotIndex + 1
    });
  }
}
async function persistSlotLabelsForDay(db, planId, dayIndex) {
  const rows = await listPlanSlots(
    db,
    planId
  );
  const daySlots = rows.filter((r) => r.dayIndex === dayIndex);
  const map = computeMealPlanSlotLabels(daySlots);
  for (const s of daySlots) {
    const label = map.get(s.id);
    if (label && label !== s.label) {
      await updateLocal(db.mealPlanSlots, s.id, {
        label
      });
    }
  }
}
async function addMealSlotForDay(db, userId, input) {
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
    const maxIdx = sorted.length > 0 ? Math.max(...sorted.map((s) => s.slotIndex)) : -1;
    await insertLocal(db.mealPlanSlots, {
      id: newId(),
      userId,
      planId,
      dayIndex: input.dayIndex,
      slotIndex: maxIdx + 1,
      slotKind: "snack",
      label: "Snack",
      libraryItemId: null
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
        libraryItemId: null
      });
    } else {
      const lastMeal = mealSlots[mealSlots.length - 1];
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
        libraryItemId: null
      });
    }
  }
  await persistSlotLabelsForDay(db, planId, input.dayIndex);
  await updateLocal(db.mealPlans, planId, { updatedAt: nowMs() });
}
async function removeMealSlot(db, userId, slotId) {
  const row = await db.mealPlanSlots.get(
    slotId
  );
  if (!row || row.deletedAt != null) throw new Error("Slot not found");
  const plan = await db.mealPlans.get(
    row.planId
  );
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
  await updateLocal(db.mealPlans, row.planId, { updatedAt: nowMs() });
}
async function setPlanLibraryAssignmentsBySlotIds(db, userId, planId, assignments) {
  const slots = await listPlanSlots(db, planId);
  if (assignments.length !== slots.length) {
    throw new Error("Each plan slot must appear exactly once");
  }
  const assignMap = new Map(
    assignments.map((a) => [a.slotId.trim(), a.libraryItemId])
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
        (id) => id != null && id !== ""
      )
    )
  ];
  if (libraryIds.length > 0) {
    for (const lid of libraryIds) {
      const it = await db.mealLibraryItems.get(
        lid
      );
      if (!it || it.deletedAt != null || it.userId !== userId) {
        throw new Error("Library meal not found");
      }
    }
  }
  for (const s of slots) {
    const libId = assignMap.get(s.id) ?? null;
    await updateLocal(db.mealPlanSlots, s.id, {
      libraryItemId: libId
    });
  }
  await clearAiShoppingListCacheClient(db, planId);
  await updateLocal(db.mealPlans, planId, { updatedAt: nowMs() });
}
async function clearAiShoppingListCacheClient(db, planId) {
  await updateLocal(db.mealPlans, planId, {
    aiShoppingListJson: "[]",
    shoppingListSourceHash: null
  });
}
function usePlanForWeek(weekStartDayKey) {
  const { db } = useDb();
  const { userId } = useLocalSession();
  return useLiveOne(
    async () => {
      if (!db || !userId) return null;
      return pickCanonicalMealPlanForWeek(db, userId, weekStartDayKey);
    },
    [db, userId, weekStartDayKey]
  );
}
function usePlanSlots(planId) {
  const { db } = useDb();
  return useLiveArray(
    async () => {
      if (!db || !planId) return [];
      const rows = await db.mealPlanSlots.where("planId").equals(planId).toArray();
      return rows.filter((r) => r.deletedAt === null).sort(
        (a, b) => a.dayIndex - b.dayIndex || a.slotIndex - b.slotIndex
      );
    },
    [db, planId]
  );
}
function useMealPlanMutations() {
  const { db, ready } = useDb();
  const { userId } = useLocalSession();
  const ensurePlan = useCallback(
    async (weekStartDayKey) => {
      if (!ready || !db || !userId) throw new Error("Not ready");
      await pullSyncCollections([
        "mealLibraryItems",
        "mealLibraryIngredients",
        "mealPlans",
        "mealPlanSlots"
      ]);
      let canonical = await pickCanonicalMealPlanForWeek(
        db,
        userId,
        weekStartDayKey
      );
      if (canonical) {
        await ensureDefaultSlotsForPlan(db, userId, canonical.id);
        await dedupeMealPlanDuplicates(
          db,
          userId,
          weekStartDayKey,
          canonical.id
        );
        return canonical.id;
      }
      const id = newId();
      await insertLocal(db.mealPlans, {
        id,
        userId,
        weekStartDayKey,
        createdAt: nowMs(),
        aiShoppingListJson: "[]",
        shoppingListSourceHash: null
      });
      await ensureDefaultSlotsForPlan(db, userId, id);
      canonical = await pickCanonicalMealPlanForWeek(
        db,
        userId,
        weekStartDayKey
      );
      if (canonical && canonical.id !== id) {
        const slotRows = await db.mealPlanSlots.where("planId").equals(id).toArray();
        await db.transaction("rw", db.mealPlanSlots, db.mealPlans, async () => {
          for (const s of slotRows) {
            await db.mealPlanSlots.delete(s.id);
          }
          await db.mealPlans.delete(id);
        });
        await dedupeMealPlanDuplicates(
          db,
          userId,
          weekStartDayKey,
          canonical.id
        );
        return canonical.id;
      }
      await dedupeMealPlanDuplicates(db, userId, weekStartDayKey, id);
      return id;
    },
    [db, ready, userId]
  );
  const addMealPlanSlot = useCallback(
    async (weekStartDayKey, dayIndex, kind) => {
      if (!ready || !db || !userId) throw new Error("Not ready");
      await addMealSlotForDay(db, userId, {
        weekStartDayKey,
        dayIndex,
        kind
      });
    },
    [db, ready, userId]
  );
  const removeMealPlanSlot = useCallback(
    async (slotId) => {
      if (!ready || !db || !userId) throw new Error("Not ready");
      await removeMealSlot(db, userId, slotId);
    },
    [db, ready, userId]
  );
  const saveMealPlanLibraryAssignments = useCallback(
    async (planId, assignments) => {
      if (!ready || !db || !userId) throw new Error("Not ready");
      await setPlanLibraryAssignmentsBySlotIds(
        db,
        userId,
        planId,
        assignments
      );
    },
    [db, ready, userId]
  );
  const setSlotMeal = useCallback(
    async (planId, dayIndex, slotIndex, input) => {
      if (!ready || !db || !userId) throw new Error("Not ready");
      const matches = await db.mealPlanSlots.where("[planId+dayIndex+slotIndex]").equals([planId, dayIndex, slotIndex]).toArray();
      const alive = matches.find((r) => r.deletedAt === null);
      if (alive) {
        await updateLocal(db.mealPlanSlots, alive.id, {
          slotKind: input.slotKind,
          label: input.label,
          libraryItemId: input.libraryItemId
        });
        return;
      }
      const tomb = matches.find((r) => r.deletedAt != null);
      if (tomb) {
        await updateLocal(db.mealPlanSlots, tomb.id, {
          deletedAt: null,
          slotKind: input.slotKind,
          label: input.label,
          libraryItemId: input.libraryItemId
        });
        return;
      }
      await insertLocal(db.mealPlanSlots, {
        id: newId(),
        userId,
        planId,
        dayIndex,
        slotIndex,
        slotKind: input.slotKind,
        label: input.label,
        libraryItemId: input.libraryItemId
      });
    },
    [db, ready, userId]
  );
  const clearSlot = useCallback(
    async (planId, dayIndex, slotIndex) => {
      if (!ready || !db) throw new Error("Not ready");
      const matches = await db.mealPlanSlots.where("[planId+dayIndex+slotIndex]").equals([planId, dayIndex, slotIndex]).toArray();
      const alive = matches.find((r) => r.deletedAt === null);
      if (!alive) return;
      await softDeleteLocal(db.mealPlanSlots, alive.id);
    },
    [db, ready]
  );
  return {
    ensurePlan,
    setSlotMeal,
    clearSlot,
    addMealPlanSlot,
    removeMealPlanSlot,
    saveMealPlanLibraryAssignments
  };
}
export {
  MAX_MEAL_SLOTS_PER_DAY as M,
  usePlanForWeek as a,
  usePlanSlots as b,
  MAX_SNACK_SLOTS_PER_DAY as c,
  useMealPlanMutations as u
};
