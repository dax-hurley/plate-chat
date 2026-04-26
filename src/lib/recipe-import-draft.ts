/**
 * Best-effort structured fields from scraped recipe markdown (no LLM).
 */

export type RecipeImportDraft = {
  name: string;
  instructions: string;
  ingredients: string[];
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

function firstH1Title(markdown: string): string | undefined {
  const m = markdown.match(/^#\s+(.+)$/m);
  if (!m?.[1]) return undefined;
  const t = m[1].trim();
  return t.length > 0 ? t : undefined;
}

/** Split markdown into blocks starting at ## or ### headings (line-start). */
function sectionBlocks(markdown: string): { heading: string; body: string }[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: { heading: string; body: string }[] = [];
  let currentHeading = "";
  let currentBody: string[] = [];

  const flush = () => {
    const body = currentBody.join("\n").trim();
    if (currentHeading || body) {
      blocks.push({ heading: currentHeading, body });
    }
    currentBody = [];
  };

  for (const line of lines) {
    const hm = line.match(/^#{2,3}\s+(.+)$/);
    if (hm) {
      flush();
      currentHeading = hm[1]?.trim() ?? "";
    } else {
      currentBody.push(line);
    }
  }
  flush();
  return blocks;
}

function headingKind(h: string): "ingredients" | "instructions" | "other" {
  const n = h.toLowerCase();
  if (
    /\bingredients?\b/.test(n) ||
    /\bwhat you need\b/.test(n) ||
    /\bshopping\b/.test(n)
  ) {
    return "ingredients";
  }
  if (
    /\binstructions?\b/.test(n) ||
    /\bdirections?\b/.test(n) ||
    /\bmethod\b/.test(n) ||
    /\bsteps?\b/.test(n) ||
    /\bhow to\b/.test(n) ||
    /\bpreparation\b/.test(n)
  ) {
    return "instructions";
  }
  return "other";
}

function linesToIngredientList(body: string): string[] {
  const out: string[] = [];
  for (const line of body.split("\n")) {
    const t = line
      .replace(/^[\s>*-]*(?:\d+\.|[-*+])\s+/, "")
      .replace(/^\[[ x]\]\s+/i, "")
      .trim();
    if (t.length > 0) out.push(t);
  }
  return out;
}

function extractMacrosFromText(text: string): Pick<
  RecipeImportDraft,
  "calories" | "proteinG" | "carbsG" | "fatG"
> {
  let calories = 0;
  let proteinG = 0;
  let carbsG = 0;
  let fatG = 0;

  const calM =
    text.match(/\b(\d{1,5})\s*(?:kcal|calories?)\b/i) ??
    text.match(/\b(?:calories?|energy)\s*[:(]?\s*(\d{1,5})\b/i);
  if (calM?.[1]) calories = Math.round(Number(calM[1])) || 0;

  const p =
    text.match(/\b(\d{1,4}(?:\.\d+)?)\s*g\s*(?:of\s+)?protein\b/i) ??
    text.match(/\bprotein\s*[:(]?\s*(\d{1,4}(?:\.\d+)?)\s*g\b/i);
  if (p?.[1]) proteinG = Number(p[1]) || 0;

  const c =
    text.match(/\b(\d{1,4}(?:\.\d+)?)\s*g\s*(?:of\s+)?(?:carbs?|carbohydrate)s?\b/i) ??
    text.match(/\b(?:carbs?|carbohydrate)s?\s*[:(]?\s*(\d{1,4}(?:\.\d+)?)\s*g\b/i);
  if (c?.[1]) carbsG = Number(c[1]) || 0;

  const f =
    text.match(/\b(\d{1,4}(?:\.\d+)?)\s*g\s*(?:of\s+)?fat\b/i) ??
    text.match(/\bfat\s*[:(]?\s*(\d{1,4}(?:\.\d+)?)\s*g\b/i);
  if (f?.[1]) fatG = Number(f[1]) || 0;

  return { calories, proteinG, carbsG, fatG };
}

export function buildRecipeDraftFromMarkdown(
  markdown: string,
  titleHint?: string
): RecipeImportDraft {
  const normalized = markdown.replace(/\r\n/g, "\n").trim();
  const macros = extractMacrosFromText(normalized);
  /** Drop leading `# Title` so `sectionBlocks` doesn't treat it as preamble. */
  const forSections = normalized.replace(/^#\s+[^\n]+\n+/, "").trim();
  const blocks = sectionBlocks(forSections.length > 0 ? forSections : normalized);
  const ingBlocks: string[] = [];
  const instBlocks: string[] = [];

  for (const b of blocks) {
    const kind = headingKind(b.heading);
    if (kind === "ingredients" && b.body.trim()) {
      const lines = linesToIngredientList(b.body);
      if (lines.length > 0) ingBlocks.push(...lines);
    } else if (kind === "instructions" && b.body.trim()) {
      instBlocks.push(b.body.trim());
    }
  }

  const h1 = firstH1Title(normalized);
  let name =
    (titleHint?.trim() && titleHint.trim().length > 0 ? titleHint.trim() : undefined) ??
    h1 ??
    "Imported recipe";

  let instructions = instBlocks.join("\n\n").trim();
  let ingredients = ingBlocks;

  if (ingredients.length === 0 && instructions.length === 0) {
    instructions = normalized;
  } else if (ingredients.length === 0 && instructions.length > 0) {
    /* keep instructions only */
  } else if (ingredients.length > 0 && instructions.length === 0) {
    const withoutIng = blocks
      .filter((b) => headingKind(b.heading) !== "ingredients")
      .map((b) => b.body.trim())
      .filter(Boolean)
      .join("\n\n");
    instructions = withoutIng || normalized;
  }

  return {
    name,
    instructions,
    ingredients,
    calories: macros.calories,
    proteinG: macros.proteinG,
    carbsG: macros.carbsG,
    fatG: macros.fatG,
  };
}
