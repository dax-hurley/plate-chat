import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { z } from "zod";

import type { RecipeImportDraft } from "@/lib/recipe-import-draft";
import { buildRecipeReformatPrompt } from "@/prompts/recipe-reformat-prompt";
import { stripRecipeMarkdownImagesAndLinks } from "@/lib/recipe-markdown-strip";

const LlmRecipeDraftZ = z.object({
  name: z.string(),
  ingredients: z.array(z.string()),
  instructions: z.string(),
  calories: z.coerce.number().min(0).max(500_000),
  proteinG: z.coerce.number().min(0).max(20_000),
  carbsG: z.coerce.number().min(0).max(20_000),
  fatG: z.coerce.number().min(0).max(20_000),
});

const MAX_MARKDOWN = 32_000;

function truncateMarkdown(markdown: string): string {
  if (markdown.length <= MAX_MARKDOWN) return markdown;
  return (
    markdown.slice(0, MAX_MARKDOWN) + "\n\n[… content truncated for processing …]"
  );
}

function safeJsonParseObject(raw: string): unknown {
  const trimmed = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");
  return JSON.parse(trimmed) as unknown;
}

/**
 * Use Claude to restructure scraped text into a consistent recipe draft.
 * Returns `null` if AI is not configured, input is empty, or parsing/validation fails (caller may fall back to heuristics).
 */
export async function reformatScrapedRecipeWithLlm(input: {
  pageTitle: string | undefined;
  /** Already stripped of images and bare links. */
  markdown: string;
}): Promise<RecipeImportDraft | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const md = input.markdown.trim();
  if (!md) return null;

  const modelId =
    process.env.ANTHROPIC_QUICK_MODEL?.trim() ||
    process.env.ANTHROPIC_MODEL?.trim() ||
    "claude-haiku-4-5";
  const prompt = buildRecipeReformatPrompt(
    input.pageTitle,
    truncateMarkdown(md)
  );

  let text: string;
  try {
    const res = await generateText({
      model: anthropic(modelId),
      prompt,
      maxOutputTokens: 8192,
    });
    text = res.text;
  } catch (e) {
    console.warn(
      "[ai-reformat-recipe] generateText failed:",
      e instanceof Error ? e.message : e
    );
    return null;
  }

  let parsed: unknown;
  try {
    parsed = safeJsonParseObject(text);
  } catch (e) {
    console.warn(
      "[ai-reformat-recipe] JSON parse failed:",
      e instanceof Error ? e.message : e
    );
    return null;
  }

  const v = LlmRecipeDraftZ.safeParse(parsed);
  if (!v.success) {
    console.warn("[ai-reformat-recipe] Zod validation failed:", v.error.flatten());
    return null;
  }

  const o = v.data;
  const name = stripRecipeMarkdownImagesAndLinks(o.name).trim() || "Imported recipe";
  const instructions = stripRecipeMarkdownImagesAndLinks(o.instructions).trim();
  const ingredients = o.ingredients
    .map((line) => stripRecipeMarkdownImagesAndLinks(String(line).trim()))
    .filter((line) => line.length > 0);

  if (!instructions && ingredients.length === 0) {
    return null;
  }

  return {
    name,
    instructions:
      instructions ||
      (ingredients.length > 0
        ? "Follow ingredient prep as described on the page."
        : "Add cooking steps if you have them."),
    ingredients,
    calories: Number.isFinite(o.calories) ? Math.round(o.calories) : 0,
    proteinG: Number.isFinite(o.proteinG) ? o.proteinG : 0,
    carbsG: Number.isFinite(o.carbsG) ? o.carbsG : 0,
    fatG: Number.isFinite(o.fatG) ? o.fatG : 0,
  };
}
