/**
 * One-shot user prompt: scraped markdown → strict JSON for recipe import.
 */
export function buildRecipeReformatPrompt(
  pageTitle: string | undefined,
  markdown: string
): string {
  const titleLine =
    pageTitle && pageTitle.trim().length > 0
      ? `Suggested title from the page: ${pageTitle.trim()}`
      : "The page had no clear title; infer a short name from the content.";

  return `You are normalizing recipe text scraped from a website into a clean structure for a meal-tracking app.

${titleLine}

Output a single JSON object and nothing else (no \`\`\` code fences). Keys and types:
- "name": string — concise recipe name.
- "ingredients": array of strings — one ingredient per entry, plain text (amounts in the string). No links or URLs.
- "instructions": string — how to make the recipe. Use markdown: headings optional, **bold** for key times or temperatures, numbered or bullet lists. No links, no image syntax.
- "calories", "proteinG", "carbsG", "fatG": numbers. Use 0 for anything not stated. Pick per-serving values if the page says "per serving"; otherwise use totals for the full recipe. Best reasonable estimate from the text; do not invent nutrition not implied by the page.

Scraped content:
---
${markdown}
---
`;
}
