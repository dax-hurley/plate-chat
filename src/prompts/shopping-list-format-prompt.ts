/**
 * Prompt to turn aggregated recipe lines into a structured US grocery list with sections and costs.
 * `sectionList` is typically bullet lines like `- "Produce"` (see SHOPPING_LIST_SECTIONS).
 */
export function buildShoppingListFormatPrompt(
  weekStartDayKey: string,
  rawBlock: string,
  sectionList: string
): string {
  return `You format grocery lists for real-world shopping (US supermarkets, typical package sizes, rough mid-range prices).

WEEK STARTING (Monday): ${weekStartDayKey}

RAW RECIPE INGREDIENT LINES (the × count is how many planned meals use that line):
${rawBlock}

Produce a shopping list with:
- Practical purchase units (e.g. pasta as a box, oil as a bottle).
- Merge overlapping needs into one line where appropriate.
- Assign EVERY line to exactly one section from this list (use the label verbatim):
${sectionList}

For each purchase line, estimate a typical US retail price in USD for that package (positive number, two decimals ok). This is a rough ballpark, not exact.

Return ONLY valid JSON with this shape (no markdown):
{"items":[{"label":"string","section":"Produce","estimatedCostUsd":3.49},...]}`;
}
