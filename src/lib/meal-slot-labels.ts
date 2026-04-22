/** Labels for main meal slots (breakfast → lunches → dinner), excluding snacks. */
export function labelForMealSlot(mealIndex: number, mealCount: number): string {
  if (mealCount <= 0) return "Meal";
  if (mealCount === 1) return "Dinner";
  if (mealCount === 2) {
    return mealIndex === 0 ? "Breakfast" : "Dinner";
  }
  if (mealCount === 3) {
    return ["Breakfast", "Lunch", "Dinner"][mealIndex] ?? "Meal";
  }
  if (mealIndex === 0) return "Breakfast";
  if (mealIndex === mealCount - 1) return "Dinner";
  const midIndex = mealIndex - 1;
  return midIndex === 0 ? "Lunch" : `Lunch ${midIndex + 1}`;
}

/** Snack slots: Snack, Snack 2, … */
export function labelForSnackSlot(snackIndex: number): string {
  return snackIndex === 0 ? "Snack" : `Snack ${snackIndex + 1}`;
}

export type SlotForLabeling = {
  id: string;
  dayIndex: number;
  slotIndex: number;
  label: string;
  slotKind?: string | null;
};

/** Derives display labels from slot kind + order within each day. */
export function computeMealPlanSlotLabels<T extends SlotForLabeling>(
  slots: T[]
): Map<string, string> {
  const byDay = new Map<number, T[]>();
  for (const s of slots) {
    if (!byDay.has(s.dayIndex)) byDay.set(s.dayIndex, []);
    byDay.get(s.dayIndex)!.push(s);
  }
  const out = new Map<string, string>();
  for (const [, daySlots] of byDay) {
    const sorted = [...daySlots].sort((a, b) => a.slotIndex - b.slotIndex);
    const meals: T[] = [];
    const snacks: T[] = [];
    for (const s of sorted) {
      const kind = effectiveSlotKind(s);
      if (kind === "snack") snacks.push(s);
      else meals.push(s);
    }
    meals.forEach((s, i) => {
      out.set(s.id, labelForMealSlot(i, meals.length));
    });
    snacks.forEach((s, i) => {
      out.set(s.id, labelForSnackSlot(i));
    });
  }
  return out;
}

function effectiveSlotKind(s: SlotForLabeling): "meal" | "snack" {
  if (s.slotKind === "snack") return "snack";
  if (s.slotKind === "meal") return "meal";
  return /^Snack\b/i.test(s.label.trim()) ? "snack" : "meal";
}
