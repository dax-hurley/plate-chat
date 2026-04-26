import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { MealLibraryItemJson } from "@/types/meal-library";

import { LibraryMealItemDetailContent } from "./library-meal-item-detail-content";

type MealCookingInstructionsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: MealLibraryItemJson | null;
  onEditRecipe?: (item: MealLibraryItemJson) => void;
};

export function MealCookingInstructionsDialog({
  open,
  onOpenChange,
  item,
  onEditRecipe,
}: MealCookingInstructionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "fixed inset-0 z-50 flex h-dvh max-h-dvh w-full max-w-full translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 p-0 shadow-none ring-0",
          "sm:inset-auto sm:top-1/2 sm:left-1/2 sm:h-auto sm:max-h-[min(85vh,40rem)] sm:min-h-0 sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:border sm:p-4 sm:shadow-lg sm:ring-1 sm:ring-foreground/10"
        )}
      >
        {item ? (
          <>
            <DialogHeader className="border-border flex shrink-0 flex-row items-start gap-3 space-y-0 border-b bg-popover px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pr-14 pb-3 sm:rounded-t-xl sm:pr-4">
              <div className="min-w-0 flex-1 space-y-1 pr-2">
                <DialogTitle className="text-foreground text-left text-lg leading-snug">
                  {item.name}
                </DialogTitle>
                <p className="text-muted-foreground text-left text-sm">
                  {item.ingredients.length} ingredient
                  {item.ingredients.length === 1 ? "" : "s"}
                </p>
              </div>
              {onEditRecipe ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="touch-manipulation mt-0.5 shrink-0 gap-1.5"
                  onClick={() => {
                    onEditRecipe(item);
                  }}
                >
                  <Pencil className="size-4" aria-hidden />
                  Edit
                </Button>
              ) : null}
            </DialogHeader>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              <LibraryMealItemDetailContent item={item} />
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
