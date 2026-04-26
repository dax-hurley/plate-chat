/**
 * Default meals per calendar day when creating a new weekly plan.
 */
export const DEFAULT_SLOTS_PER_DAY = 3;

/** Labels for the first three slots each day (Breakfast, Lunch, Dinner). */
export const DEFAULT_MEAL_LABELS = ["Breakfast", "Lunch", "Dinner"] as const;

/**
 * Max main (non-snack) slots per day: breakfast, up to 10th Lunch between lunch
 * and dinner, and dinner (12 total).
 */
export const MAX_MEAL_SLOTS_PER_DAY = 12;

export const MAX_SNACK_SLOTS_PER_DAY = 10;
