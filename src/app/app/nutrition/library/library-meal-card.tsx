"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { MealLibraryItemJson } from "@/types/meal-library";

import { actionDeleteLibraryItem } from "../meal-planning-actions";
import { LibraryMealItemDetailContent } from "./library-meal-item-detail-content";
import { LibraryMealDialog } from "./library-meal-dialog";

export function LibraryMealCard({ item }: { item: MealLibraryItemJson }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <li>
        <Card className="border-primary/15 overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-lg leading-snug">{item.name}</CardTitle>
                <CardDescription className="mt-1">
                  {item.ingredients.length} ingredient
                  {item.ingredients.length === 1 ? "" : "s"}
                </CardDescription>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="touch-manipulation"
                  aria-label={`Edit ${item.name}`}
                  onClick={() => setEditOpen(true)}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-destructive hover:text-destructive touch-manipulation"
                  aria-label={`Delete ${item.name}`}
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <LibraryMealItemDetailContent item={item} />
          </CardContent>
        </Card>
      </li>

      <LibraryMealDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        item={item}
        createFormKey={0}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm" showCloseButton>
          <DialogHeader>
            <DialogTitle>Delete this meal?</DialogTitle>
            <DialogDescription>
              “{item.name}” will be removed from your library. Weekly plan slots
              that used it will be cleared.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  await actionDeleteLibraryItem(item.id);
                  setDeleteOpen(false);
                  router.refresh();
                });
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
