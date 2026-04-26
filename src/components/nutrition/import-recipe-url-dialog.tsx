import { useState } from "react";
import { toast } from "sonner";

import { authFetch } from "@/lib/client/auth-fetch";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { stripRecipeMarkdownImagesAndLinks } from "@/lib/recipe-markdown-strip";
import { useNutritionMutations } from "@/lib/stores";
import { cn } from "@/lib/utils";
import type { MealLibraryItemJson } from "@/types/meal-library";

type ApiOk = {
  sourceUrl: string;
  pageTitle?: string;
  draft: {
    name: string;
    instructions: string;
    ingredients: string[];
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
};

export function ImportRecipeUrlDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (item: MealLibraryItemJson) => void;
}) {
  const { saveLibraryItem } = useNutritionMutations();
  const [url, setUrl] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setError(null);
        }
      }}
    >
      <DialogContent
        className={cn(
          "sm:max-w-md",
          "fixed inset-0 z-50 flex h-dvh max-h-dvh w-full max-w-full translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 p-0 shadow-none ring-0",
          "sm:inset-auto sm:top-1/2 sm:left-1/2 sm:h-auto sm:max-h-[min(90dvh,720px)] sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:border sm:p-4 sm:shadow-lg sm:ring-1 sm:ring-foreground/10 sm:gap-4"
        )}
      >
        <DialogHeader className="border-border shrink-0 space-y-2 border-b px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 sm:border-0 sm:px-0 sm:pt-0 sm:pb-0">
          <DialogTitle className="text-left">Import recipe from the web</DialogTitle>
          <DialogDescription className="text-left">
            Paste a recipe page URL. We fetch the text, drop images and links, save it
            to your library, and open the recipe.
          </DialogDescription>
        </DialogHeader>
        <form
          id="import-recipe-url-form"
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
          onSubmit={async (e) => {
            e.preventDefault();
            const u = url.trim();
            if (!u) {
              toast.error("Enter a URL");
              return;
            }
            setPending(true);
            setError(null);
            try {
              const res = await authFetch("/api/nutrition/import-recipe-url", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: u }),
              });
              const data = (await res.json().catch(() => ({}))) as
                | ApiOk
                | { error?: string };
              if (!res.ok) {
                const msg =
                  typeof data === "object" &&
                  data !== null &&
                  "error" in data &&
                  typeof data.error === "string"
                    ? data.error
                    : `Import failed (${res.status})`;
                setError(msg);
                return;
              }
              const ok = data as ApiOk;
              const name =
                stripRecipeMarkdownImagesAndLinks(ok.draft.name).trim() ||
                (typeof ok.pageTitle === "string"
                  ? stripRecipeMarkdownImagesAndLinks(ok.pageTitle).trim()
                  : "") ||
                "Imported recipe";
              const instructions = stripRecipeMarkdownImagesAndLinks(
                ok.draft.instructions
              );
              const ingLines = ok.draft.ingredients
                .map((line) => stripRecipeMarkdownImagesAndLinks(line.trim()))
                .filter(Boolean);

              try {
                const id = await saveLibraryItem({
                  name,
                  instructions,
                  calories: ok.draft.calories,
                  proteinG: ok.draft.proteinG,
                  carbsG: ok.draft.carbsG,
                  fatG: ok.draft.fatG,
                  ingredients: ingLines.map((line, i) => ({
                    line,
                    sortOrder: i,
                  })),
                });

                const item: MealLibraryItemJson = {
                  id,
                  name,
                  instructions,
                  calories: ok.draft.calories,
                  proteinG: ok.draft.proteinG,
                  carbsG: ok.draft.carbsG,
                  fatG: ok.draft.fatG,
                  ingredients: ingLines.map((line, i) => ({
                    id: `${id}-ing-${i}`,
                    sortOrder: i,
                    line,
                  })),
                };

                setUrl("");
                onOpenChange(false);
                toast.success("Recipe saved to your library");
                onSaved(item);
              } catch {
                toast.error("Could not save recipe to your library");
              }
            } catch {
              setError("Network error — try again.");
            } finally {
              setPending(false);
            }
          }}
        >
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-1 sm:px-0">
            <div className="space-y-2">
              <Label htmlFor="import-recipe-url">Recipe URL</Label>
              <Input
                id="import-recipe-url"
                type="url"
                inputMode="url"
                autoComplete="url"
                placeholder="https://…"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={pending}
              />
            </div>
            {error ? (
              <p className="text-destructive text-sm leading-snug" role="alert">
                {error}
              </p>
            ) : null}
          </div>
        </form>
        <DialogFooter
          className={cn(
            "m-0 mt-0 shrink-0 gap-2 bg-popover",
            "max-sm:mx-0 max-sm:mb-0 max-sm:rounded-none max-sm:pt-4 max-sm:pb-[max(1rem,env(safe-area-inset-bottom))]",
            "sm:justify-stretch sm:space-x-0"
          )}
        >
          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full sm:flex-1"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="import-recipe-url-form"
            className="min-h-11 w-full sm:flex-1"
            disabled={pending}
          >
            {pending ? "Fetching…" : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
