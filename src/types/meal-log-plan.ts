/** One planned slot with a library meal, for quick-add on the daily log. */
export type PlannedSlotQuickAdd = {
  slotId: string;
  label: string;
  slotIndex: number;
  libraryItem: {
    id: string;
    name: string;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
};
