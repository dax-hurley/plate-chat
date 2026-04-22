/** Store-aisle groupings the AI must use (exact labels). */
export const SHOPPING_LIST_SECTIONS = [
  "Produce",
  "Meat & seafood",
  "Dairy & eggs",
  "Bakery",
  "Frozen",
  "Pantry",
  "Canned goods",
  "Condiments & oils",
  "Spices & seasonings",
  "Beverages",
  "Snacks & misc",
  "Non-food / household",
  "Other",
] as const;

export type ShoppingListSection = (typeof SHOPPING_LIST_SECTIONS)[number];

const SECTION_BY_LOWER = new Map(
  SHOPPING_LIST_SECTIONS.map((s) => [s.toLowerCase(), s])
);

/** Map model output to a canonical section from the preset list. */
export function normalizeShoppingSection(raw: string): ShoppingListSection {
  const t = raw.trim();
  if (!t) return "Other";
  const exact = SECTION_BY_LOWER.get(t.toLowerCase());
  if (exact) return exact;
  return "Other";
}

export function groupItemsBySectionOrder<
  T extends { section: string },
>(items: T[]): { section: ShoppingListSection; items: T[] }[] {
  const buckets = new Map<ShoppingListSection, T[]>();
  for (const item of items) {
    const sec = normalizeShoppingSection(item.section);
    if (!buckets.has(sec)) buckets.set(sec, []);
    buckets.get(sec)!.push(item);
  }
  const out: { section: ShoppingListSection; items: T[] }[] = [];
  for (const sec of SHOPPING_LIST_SECTIONS) {
    const arr = buckets.get(sec);
    if (arr && arr.length > 0) out.push({ section: sec, items: arr });
  }
  return out;
}
