import Markdown, {
  defaultUrlTransform,
  type Components,
} from "react-markdown";
import remarkGfm from "remark-gfm";

import { markdownComponents } from "@/components/assistant-markdown";
import { cn } from "@/lib/utils";

/** Turn per-line ingredient rows into a markdown list so GFM renders cleanly. */
export function recipeIngredientsToMarkdown(
  ingredients: readonly { line: string }[]
): string {
  return ingredients
    .map((i) => i.line.trim())
    .filter(Boolean)
    .map((l) => (/^[-*+]\s/.test(l) || /^\d+\.\s/.test(l) ? l : `- ${l}`))
    .join("\n");
}

const recipeMarkdownComponents: Components = {
  ...markdownComponents,
  a: ({ children, className }) => (
    <span className={cn("text-foreground", className)}>{children}</span>
  ),
  img: () => null,
};

/** Renders stored recipe text as markdown (no clickable links or images). */
export function RecipeMarkdown({ markdown }: { markdown: string }) {
  if (!markdown.trim()) return null;

  return (
    <div
      className={cn(
        "recipe-md assistant-md min-w-0 break-words text-foreground/90",
        "[&_p]:!text-sm [&_li]:!text-sm [&_ul]:!text-sm [&_ol]:!text-sm [&_td]:!text-sm [&_th]:!text-sm [&_strong]:!text-sm"
      )}
    >
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={recipeMarkdownComponents}
        urlTransform={(url) => {
          if (/^(javascript|data|vbscript):/i.test(url)) return "";
          return defaultUrlTransform(url);
        }}
      >
        {markdown}
      </Markdown>
    </div>
  );
}
