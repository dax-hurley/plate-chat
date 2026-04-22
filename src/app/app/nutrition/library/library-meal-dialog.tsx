"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MealLibraryItemJson } from "@/types/meal-library";

import {
  actionCreateLibraryItem,
  actionUpdateLibraryItem,
} from "../meal-planning-actions";

function MacroGrid({
  idPrefix,
  calories,
  setCalories,
  proteinG,
  setProteinG,
  carbsG,
  setCarbsG,
  fatG,
  setFatG,
}: {
  idPrefix: string;
  calories: string;
  setCalories: (v: string) => void;
  proteinG: string;
  setProteinG: (v: string) => void;
  carbsG: string;
  setCarbsG: (v: string) => void;
  fatG: string;
  setFatG: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="space-y-1">
        <Label className="text-xs" htmlFor={`${idPrefix}-cal`}>
          Calories
        </Label>
        <Input
          id={`${idPrefix}-cal`}
          name="calories"
          inputMode="numeric"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
          className="tabular-nums"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs" htmlFor={`${idPrefix}-p`}>
          Protein (g)
        </Label>
        <Input
          id={`${idPrefix}-p`}
          name="proteinG"
          inputMode="decimal"
          value={proteinG}
          onChange={(e) => setProteinG(e.target.value)}
          className="tabular-nums"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs" htmlFor={`${idPrefix}-c`}>
          Carbs (g)
        </Label>
        <Input
          id={`${idPrefix}-c`}
          name="carbsG"
          inputMode="decimal"
          value={carbsG}
          onChange={(e) => setCarbsG(e.target.value)}
          className="tabular-nums"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs" htmlFor={`${idPrefix}-f`}>
          Fat (g)
        </Label>
        <Input
          id={`${idPrefix}-f`}
          name="fatG"
          inputMode="decimal"
          value={fatG}
          onChange={(e) => setFatG(e.target.value)}
          className="tabular-nums"
        />
      </div>
    </div>
  );
}

function CreateMealForm({
  formKey,
  onClose,
}: {
  formKey: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [instructions, setInstructions] = useState("");
  const [ingredientLines, setIngredientLines] = useState("");
  const [calories, setCalories] = useState("0");
  const [proteinG, setProteinG] = useState("0");
  const [carbsG, setCarbsG] = useState("0");
  const [fatG, setFatG] = useState("0");
  const idPrefix = `create-${formKey}`;

  return (
    <form
      className="space-y-4"
      action={async (fd) => {
        await actionCreateLibraryItem(fd);
        onClose();
        router.refresh();
      }}
    >
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-name`}>Name</Label>
        <Input
          id={`${idPrefix}-name`}
          name="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Greek yogurt bowl"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-inst`}>Cooking instructions</Label>
        <textarea
          id={`${idPrefix}-inst`}
          name="instructions"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={4}
          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-24 w-full rounded-lg border px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Steps, times, temperatures…"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-ing`}>Ingredients</Label>
        <textarea
          id={`${idPrefix}-ing`}
          name="ingredientLines"
          value={ingredientLines}
          onChange={(e) => setIngredientLines(e.target.value)}
          rows={5}
          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-28 w-full rounded-lg border px-3 py-2 font-mono text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
          placeholder={"2 eggs\n1 cup oats\n…"}
        />
      </div>
      <MacroGrid
        idPrefix={idPrefix}
        calories={calories}
        setCalories={setCalories}
        proteinG={proteinG}
        setProteinG={setProteinG}
        carbsG={carbsG}
        setCarbsG={setCarbsG}
        fatG={fatG}
        setFatG={setFatG}
      />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">Save meal</Button>
      </div>
    </form>
  );
}

function EditMealForm({
  item,
  onClose,
}: {
  item: MealLibraryItemJson;
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(item.name);
  const [instructions, setInstructions] = useState(item.instructions);
  const [ingredientLines, setIngredientLines] = useState(
    [...item.ingredients]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((i) => i.line)
      .join("\n")
  );
  const [calories, setCalories] = useState(String(item.calories));
  const [proteinG, setProteinG] = useState(String(item.proteinG));
  const [carbsG, setCarbsG] = useState(String(item.carbsG));
  const [fatG, setFatG] = useState(String(item.fatG));
  const idPrefix = `edit-${item.id}`;

  return (
    <form
      className="space-y-4"
      action={async (fd) => {
        fd.set("id", item.id);
        await actionUpdateLibraryItem(fd);
        onClose();
        router.refresh();
      }}
    >
      <input type="hidden" name="id" value={item.id} />
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-name`}>Name</Label>
        <Input
          id={`${idPrefix}-name`}
          name="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Greek yogurt bowl"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-inst`}>Cooking instructions</Label>
        <textarea
          id={`${idPrefix}-inst`}
          name="instructions"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={4}
          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-24 w-full rounded-lg border px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Steps, times, temperatures…"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-ing`}>Ingredients</Label>
        <textarea
          id={`${idPrefix}-ing`}
          name="ingredientLines"
          value={ingredientLines}
          onChange={(e) => setIngredientLines(e.target.value)}
          rows={5}
          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-28 w-full rounded-lg border px-3 py-2 font-mono text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
          placeholder={"2 eggs\n1 cup oats\n…"}
        />
      </div>
      <MacroGrid
        idPrefix={idPrefix}
        calories={calories}
        setCalories={setCalories}
        proteinG={proteinG}
        setProteinG={setProteinG}
        carbsG={carbsG}
        setCarbsG={setCarbsG}
        fatG={fatG}
        setFatG={setFatG}
      />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">Save changes</Button>
      </div>
    </form>
  );
}

export function LibraryMealDialog({
  open,
  onOpenChange,
  mode,
  item,
  createFormKey,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  item?: MealLibraryItemJson;
  /** Increment when opening &quot;Add meal&quot; so the create form remounts with empty fields. */
  createFormKey: number;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "fixed inset-0 z-50 flex h-dvh max-h-dvh w-full max-w-full translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 p-0 shadow-none ring-0",
          "sm:inset-auto sm:top-1/2 sm:left-1/2 sm:h-auto sm:max-h-[min(90dvh,720px)] sm:min-h-0 sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:border sm:p-4 sm:shadow-lg sm:ring-1 sm:ring-foreground/10 sm:gap-4"
        )}
      >
        <DialogHeader className="border-border bg-popover shrink-0 space-y-2 border-b px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pr-14 pb-3 sm:rounded-t-xl sm:border-0 sm:bg-transparent sm:px-0 sm:pt-0 sm:pr-10 sm:pb-0">
          <DialogTitle className="text-foreground text-left">
            {mode === "create" ? "Add meal to library" : "Edit meal"}
          </DialogTitle>
          <DialogDescription className="text-left">
            One ingredient per line for shopping lists. Macros can be per
            serving or for the full recipe—whatever you prefer to track.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-0 sm:py-0 sm:pb-0">
          {open && mode === "create" ? (
            <CreateMealForm
              key={createFormKey}
              formKey={createFormKey}
              onClose={() => onOpenChange(false)}
            />
          ) : null}
          {open && mode === "edit" && item ? (
            <EditMealForm
              key={item.id}
              item={item}
              onClose={() => onOpenChange(false)}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
