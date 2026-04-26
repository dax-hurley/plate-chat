import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { reformatScrapedRecipeWithLlm } from "@/lib/ai-reformat-recipe";
import { buildRecipeDraftFromMarkdown } from "@/lib/recipe-import-draft";
import { stripRecipeMarkdownImagesAndLinks } from "@/lib/recipe-markdown-strip";
import { scrapeUrlToMarkdown } from "@/lib/services/firecrawl-scrape";
import { authenticateBearer } from "@/server/auth/device-tokens";

const bodySchema = z.object({
  url: z.string().min(1),
});

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

async function handlePost({ request }: { request: Request }): Promise<Response> {
  const claims = await authenticateBearer(request);
  if (!claims) return json({ error: "Unauthorized" }, { status: 401 });

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return json({ error: "Expected { url: string }" }, { status: 400 });
  }

  const scraped = await scrapeUrlToMarkdown(parsed.data.url);
  if (!scraped.ok) {
    if (scraped.error.includes("Invalid URL")) {
      return json({ error: scraped.error }, { status: 400 });
    }
    const misconfigured =
      scraped.error.includes("FIRECRAWL_API_KEY") ||
      scraped.error.includes("not configured");
    const status = misconfigured
      ? 503
      : scraped.status === 402 || scraped.status === 429
        ? scraped.status
        : 502;
    return json({ error: scraped.error }, { status });
  }

  const cleanedMarkdown = stripRecipeMarkdownImagesAndLinks(scraped.markdown);

  const llmDraft = await reformatScrapedRecipeWithLlm({
    pageTitle: scraped.title,
    markdown: cleanedMarkdown,
  });

  const heurDraft = (() => {
    const draftRaw = buildRecipeDraftFromMarkdown(cleanedMarkdown, scraped.title);
    return {
      ...draftRaw,
      instructions: stripRecipeMarkdownImagesAndLinks(draftRaw.instructions),
      ingredients: draftRaw.ingredients.map((line) =>
        stripRecipeMarkdownImagesAndLinks(line)
      ),
    };
  })();

  const draft = llmDraft ?? heurDraft;
  const draftSource: "llm" | "heuristic" = llmDraft != null ? "llm" : "heuristic";

  return json({
    sourceUrl: scraped.sourceUrl,
    pageTitle: scraped.title,
    truncated: scraped.truncated,
    markdown: cleanedMarkdown,
    draft,
    draftSource,
  });
}

export const Route = createFileRoute("/api/nutrition/import-recipe-url")({
  server: {
    handlers: {
      POST: handlePost,
    },
  },
});
