import type { TrainlogDB } from "@/lib/client/db/database";
import type { MealPlan, MealPlanSlot } from "@/lib/stores/meal-plan";

async function countAssignedSlots(
  db: TrainlogDB,
  planId: string
): Promise<number> {
  const rows = (await db.mealPlanSlots
    .where("planId")
    .equals(planId)
    .toArray()) as unknown as MealPlanSlot[];
  return rows.filter(
    (r) => r.deletedAt == null && r.libraryItemId != null && r.libraryItemId !== ""
  ).length;
}

/**
 * The IndexedDB cache can end up with two `meal_plans` rows for the same
 * `(userId, weekStartDayKey)`: a locally minted `ensurePlan` row and a server
 * row from sync/AI, each with a different `id` and a full set of slot rows.
 * The UI was using the first match from the compound index, which is often
 * the empty local plan while assignments live on the other plan. Pick a single
 * canonical plan for the week by preferring the data the user actually cares
 * about (recipes attached), then sync metadata.
 */
export async function pickCanonicalMealPlanForWeek(
  db: TrainlogDB,
  userId: string,
  weekStartDayKey: string
): Promise<MealPlan | null> {
  const plans = (await db.mealPlans
    .where("[userId+weekStartDayKey]")
    .equals([userId, weekStartDayKey])
    .toArray()) as unknown as MealPlan[];
  const alive = plans.filter((p) => p.deletedAt == null);
  if (alive.length === 0) return null;
  if (alive.length === 1) return alive[0]!;

  const scored = await Promise.all(
    alive.map(async (plan) => ({
      plan,
      assigned: await countAssignedSlots(db, plan.id),
    }))
  );
  scored.sort((a, b) => {
    if (b.assigned !== a.assigned) return b.assigned - a.assigned;
    const ad = (a.plan as { _dirty?: 0 | 1 })._dirty;
    const bd = (b.plan as { _dirty?: 0 | 1 })._dirty;
    if ((ad ?? 0) !== (bd ?? 0)) return (ad ?? 0) - (bd ?? 0);
    const br = b.plan.rev ?? 0;
    const ar = a.plan.rev ?? 0;
    if (br !== ar) return br - ar;
    return b.plan.updatedAt - a.plan.updatedAt;
  });
  return scored[0]!.plan;
}

/**
 * Remove extra `meal_plans` (and their slots) for the same week, keeping
 * `keepPlanId`. Uses hard delete so we do not try to push tombstones for
 * never-synced client ghosts (same `(user, week)` can only exist once on
 * server, so the duplicates are local-only or superseded by the canonical
 * id).
 */
export async function dedupeMealPlanDuplicates(
  db: TrainlogDB,
  userId: string,
  weekStartDayKey: string,
  keepPlanId: string
): Promise<void> {
  const plans = (await db.mealPlans
    .where("[userId+weekStartDayKey]")
    .equals([userId, weekStartDayKey])
    .toArray()) as unknown as MealPlan[];
  for (const p of plans) {
    if (p.deletedAt != null || p.id === keepPlanId) continue;
    const slotRows = await db.mealPlanSlots
      .where("planId")
      .equals(p.id)
      .toArray();
    await db.transaction("rw", db.mealPlanSlots, db.mealPlans, async () => {
      for (const s of slotRows) {
        await db.mealPlanSlots.delete(s.id as string);
      }
      await db.mealPlans.delete(p.id);
    });
  }
}
