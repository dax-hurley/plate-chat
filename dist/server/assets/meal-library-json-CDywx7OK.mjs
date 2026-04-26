import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { toast } from "sonner";
import { B as Button } from "./button-DbVXcFD_.mjs";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogDescription } from "./dialog-OkPnLnLD.mjs";
import { L as Label, I as Input } from "./label-BX01hlq_.mjs";
import { c as cn } from "./utils-H80jjgLf.mjs";
import "@capacitor/core";
import "./router-CUOzYYmk.mjs";
import "dexie-react-hooks";
import "dexie";
import { c as useNutritionMutations } from "./nutrition-BIi3XxN5.mjs";
import { Flame, Beef, Wheat, Droplets, Pencil } from "lucide-react";
import Markdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import { m as markdownComponents } from "./assistant-markdown-BkDNTUMc.mjs";
function MacroGrid({
  idPrefix,
  calories,
  setCalories,
  proteinG,
  setProteinG,
  carbsG,
  setCarbsG,
  fatG,
  setFatG
}) {
  return /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 sm:grid-cols-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(Label, { className: "text-xs", htmlFor: `${idPrefix}-cal`, children: "Calories" }),
      /* @__PURE__ */ jsx(
        Input,
        {
          id: `${idPrefix}-cal`,
          inputMode: "numeric",
          value: calories,
          onChange: (e) => setCalories(e.target.value),
          className: "tabular-nums"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(Label, { className: "text-xs", htmlFor: `${idPrefix}-p`, children: "Protein (g)" }),
      /* @__PURE__ */ jsx(
        Input,
        {
          id: `${idPrefix}-p`,
          inputMode: "decimal",
          value: proteinG,
          onChange: (e) => setProteinG(e.target.value),
          className: "tabular-nums"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(Label, { className: "text-xs", htmlFor: `${idPrefix}-c`, children: "Carbs (g)" }),
      /* @__PURE__ */ jsx(
        Input,
        {
          id: `${idPrefix}-c`,
          inputMode: "decimal",
          value: carbsG,
          onChange: (e) => setCarbsG(e.target.value),
          className: "tabular-nums"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx(Label, { className: "text-xs", htmlFor: `${idPrefix}-f`, children: "Fat (g)" }),
      /* @__PURE__ */ jsx(
        Input,
        {
          id: `${idPrefix}-f`,
          inputMode: "decimal",
          value: fatG,
          onChange: (e) => setFatG(e.target.value),
          className: "tabular-nums"
        }
      )
    ] })
  ] });
}
function CreateMealForm({
  formKey,
  onClose
}) {
  const { saveLibraryItem } = useNutritionMutations();
  const [name, setName] = useState("");
  const [instructions, setInstructions] = useState("");
  const [ingredientLines, setIngredientLines] = useState("");
  const [calories, setCalories] = useState("0");
  const [proteinG, setProteinG] = useState("0");
  const [carbsG, setCarbsG] = useState("0");
  const [fatG, setFatG] = useState("0");
  const [pending, setPending] = useState(false);
  const idPrefix = `create-${formKey}`;
  return /* @__PURE__ */ jsxs(
    "form",
    {
      className: "space-y-4",
      onSubmit: async (e) => {
        e.preventDefault();
        if (!name.trim()) {
          toast.error("Name is required");
          return;
        }
        setPending(true);
        try {
          const lines = ingredientLines.split("\n").map((l) => l.trim()).filter(Boolean);
          await saveLibraryItem({
            name: name.trim(),
            instructions: instructions.trim(),
            calories: Number(calories) || 0,
            proteinG: Number(proteinG) || 0,
            carbsG: Number(carbsG) || 0,
            fatG: Number(fatG) || 0,
            ingredients: lines.map((line, i) => ({ line, sortOrder: i }))
          });
          toast.success("Meal saved");
          onClose();
        } catch {
          toast.error("Could not save meal");
        } finally {
          setPending(false);
        }
      },
      children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: `${idPrefix}-name`, children: "Name" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: `${idPrefix}-name`,
              required: true,
              value: name,
              onChange: (e) => setName(e.target.value),
              placeholder: "e.g. Greek yogurt bowl"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: `${idPrefix}-inst`, children: "Cooking instructions" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              id: `${idPrefix}-inst`,
              value: instructions,
              onChange: (e) => setInstructions(e.target.value),
              rows: 4,
              className: "border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-24 w-full rounded-lg border px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
              placeholder: "Steps, times, temperatures…"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: `${idPrefix}-ing`, children: "Ingredients" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              id: `${idPrefix}-ing`,
              value: ingredientLines,
              onChange: (e) => setIngredientLines(e.target.value),
              rows: 5,
              className: "border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-28 w-full rounded-lg border px-3 py-2 font-mono text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
              placeholder: "2 eggs\n1 cup oats\n…"
            }
          )
        ] }),
        /* @__PURE__ */ jsx(
          MacroGrid,
          {
            idPrefix,
            calories,
            setCalories,
            proteinG,
            setProteinG,
            carbsG,
            setCarbsG,
            fatG,
            setFatG
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [
          /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: onClose, disabled: pending, children: "Cancel" }),
          /* @__PURE__ */ jsx(Button, { type: "submit", disabled: pending, children: pending ? "Saving…" : "Save meal" })
        ] })
      ]
    }
  );
}
function EditMealForm({
  item,
  onClose
}) {
  const { saveLibraryItem } = useNutritionMutations();
  const [name, setName] = useState(item.name);
  const [instructions, setInstructions] = useState(item.instructions);
  const [ingredientLines, setIngredientLines] = useState(
    [...item.ingredients].sort((a, b) => a.sortOrder - b.sortOrder).map((i) => i.line).join("\n")
  );
  const [calories, setCalories] = useState(String(item.calories));
  const [proteinG, setProteinG] = useState(String(item.proteinG));
  const [carbsG, setCarbsG] = useState(String(item.carbsG));
  const [fatG, setFatG] = useState(String(item.fatG));
  const [pending, setPending] = useState(false);
  const idPrefix = `edit-${item.id}`;
  return /* @__PURE__ */ jsxs(
    "form",
    {
      className: "space-y-4",
      onSubmit: async (e) => {
        e.preventDefault();
        if (!name.trim()) {
          toast.error("Name is required");
          return;
        }
        setPending(true);
        try {
          const lines = ingredientLines.split("\n").map((l) => l.trim()).filter(Boolean);
          await saveLibraryItem({
            id: item.id,
            name: name.trim(),
            instructions: instructions.trim(),
            calories: Number(calories) || 0,
            proteinG: Number(proteinG) || 0,
            carbsG: Number(carbsG) || 0,
            fatG: Number(fatG) || 0,
            ingredients: lines.map((line, i) => ({ line, sortOrder: i }))
          });
          toast.success("Meal updated");
          onClose();
        } catch {
          toast.error("Could not save changes");
        } finally {
          setPending(false);
        }
      },
      children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: `${idPrefix}-name`, children: "Name" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: `${idPrefix}-name`,
              required: true,
              value: name,
              onChange: (e) => setName(e.target.value),
              placeholder: "e.g. Greek yogurt bowl"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: `${idPrefix}-inst`, children: "Cooking instructions" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              id: `${idPrefix}-inst`,
              value: instructions,
              onChange: (e) => setInstructions(e.target.value),
              rows: 4,
              className: "border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-24 w-full rounded-lg border px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
              placeholder: "Steps, times, temperatures…"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: `${idPrefix}-ing`, children: "Ingredients" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              id: `${idPrefix}-ing`,
              value: ingredientLines,
              onChange: (e) => setIngredientLines(e.target.value),
              rows: 5,
              className: "border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-28 w-full rounded-lg border px-3 py-2 font-mono text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
              placeholder: "2 eggs\n1 cup oats\n…"
            }
          )
        ] }),
        /* @__PURE__ */ jsx(
          MacroGrid,
          {
            idPrefix,
            calories,
            setCalories,
            proteinG,
            setProteinG,
            carbsG,
            setCarbsG,
            fatG,
            setFatG
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [
          /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: onClose, disabled: pending, children: "Cancel" }),
          /* @__PURE__ */ jsx(Button, { type: "submit", disabled: pending, children: pending ? "Saving…" : "Save changes" })
        ] })
      ]
    }
  );
}
function LibraryMealDialog({
  open,
  onOpenChange,
  mode,
  item,
  createFormKey
}) {
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs(
    DialogContent,
    {
      showCloseButton: true,
      className: cn(
        "fixed inset-0 z-50 flex h-dvh max-h-dvh w-full max-w-full translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 p-0 shadow-none ring-0",
        "sm:inset-auto sm:top-1/2 sm:left-1/2 sm:h-auto sm:max-h-[min(90dvh,720px)] sm:min-h-0 sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:border sm:p-4 sm:shadow-lg sm:ring-1 sm:ring-foreground/10 sm:gap-4"
      ),
      children: [
        /* @__PURE__ */ jsxs(DialogHeader, { className: "border-border bg-popover shrink-0 space-y-2 border-b px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pr-14 pb-3 sm:rounded-t-xl sm:border-0 sm:bg-transparent sm:px-0 sm:pt-0 sm:pr-10 sm:pb-0", children: [
          /* @__PURE__ */ jsx(DialogTitle, { className: "text-foreground text-left", children: mode === "create" ? "Add meal to library" : "Edit meal" }),
          /* @__PURE__ */ jsx(DialogDescription, { className: "text-left", children: "One ingredient per line for shopping lists. Macros can be per serving or for the full recipe—whatever you prefer to track." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-0 sm:py-0 sm:pb-0", children: [
          open && mode === "create" ? /* @__PURE__ */ jsx(
            CreateMealForm,
            {
              formKey: createFormKey,
              onClose: () => onOpenChange(false)
            },
            createFormKey
          ) : null,
          open && mode === "edit" && item ? /* @__PURE__ */ jsx(
            EditMealForm,
            {
              item,
              onClose: () => onOpenChange(false)
            },
            item.id
          ) : null
        ] })
      ]
    }
  ) });
}
function recipeIngredientsToMarkdown(ingredients) {
  return ingredients.map((i) => i.line.trim()).filter(Boolean).map((l) => /^[-*+]\s/.test(l) || /^\d+\.\s/.test(l) ? l : `- ${l}`).join("\n");
}
const recipeMarkdownComponents = {
  ...markdownComponents,
  a: ({ children, className }) => /* @__PURE__ */ jsx("span", { className: cn("text-foreground", className), children }),
  img: () => null
};
function RecipeMarkdown({ markdown }) {
  if (!markdown.trim()) return null;
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: cn(
        "recipe-md assistant-md min-w-0 break-words text-foreground/90",
        "[&_p]:!text-sm [&_li]:!text-sm [&_ul]:!text-sm [&_ol]:!text-sm [&_td]:!text-sm [&_th]:!text-sm [&_strong]:!text-sm"
      ),
      children: /* @__PURE__ */ jsx(
        Markdown,
        {
          remarkPlugins: [remarkGfm],
          components: recipeMarkdownComponents,
          urlTransform: (url) => {
            if (/^(javascript|data|vbscript):/i.test(url)) return "";
            return defaultUrlTransform(url);
          },
          children: markdown
        }
      )
    }
  );
}
function LibraryMealItemDetailContent({
  item
}) {
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2 sm:grid-cols-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "from-chart-2/12 border-chart-2/20 rounded-lg border bg-gradient-to-br px-2.5 py-2", children: [
        /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground flex items-center gap-1 text-[0.65rem] font-medium", children: [
          /* @__PURE__ */ jsx(Flame, { className: "text-chart-2 size-3", "aria-hidden": true }),
          "Cal"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-base font-semibold tabular-nums", children: item.calories })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "from-chart-1/15 border-chart-1/20 rounded-lg border bg-gradient-to-br px-2.5 py-2", children: [
        /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground flex items-center gap-1 text-[0.65rem] font-medium", children: [
          /* @__PURE__ */ jsx(Beef, { className: "text-chart-1 size-3", "aria-hidden": true }),
          "P"
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-base font-semibold tabular-nums", children: [
          item.proteinG.toFixed(0),
          "g"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "from-chart-4/15 border-chart-4/20 rounded-lg border bg-gradient-to-br px-2.5 py-2", children: [
        /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground flex items-center gap-1 text-[0.65rem] font-medium", children: [
          /* @__PURE__ */ jsx(Wheat, { className: "text-chart-4 size-3", "aria-hidden": true }),
          "C"
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-base font-semibold tabular-nums", children: [
          item.carbsG.toFixed(0),
          "g"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "from-chart-3/15 border-chart-3/20 rounded-lg border bg-gradient-to-br px-2.5 py-2", children: [
        /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground flex items-center gap-1 text-[0.65rem] font-medium", children: [
          /* @__PURE__ */ jsx(Droplets, { className: "text-chart-3 size-3", "aria-hidden": true }),
          "F"
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-base font-semibold tabular-nums", children: [
          item.fatG.toFixed(0),
          "g"
        ] })
      ] })
    ] }),
    item.instructions.trim().length > 0 ? /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-1 text-xs font-medium", children: "Instructions" }),
      /* @__PURE__ */ jsx(RecipeMarkdown, { markdown: item.instructions })
    ] }) : null,
    item.ingredients.length > 0 ? /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-1.5 text-xs font-medium", children: "Ingredients" }),
      /* @__PURE__ */ jsx(
        RecipeMarkdown,
        {
          markdown: recipeIngredientsToMarkdown(
            [...item.ingredients].sort((a, b) => a.sortOrder - b.sortOrder)
          )
        }
      )
    ] }) : null
  ] });
}
function MealCookingInstructionsDialog({
  open,
  onOpenChange,
  item,
  onEditRecipe
}) {
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsx(
    DialogContent,
    {
      showCloseButton: true,
      className: cn(
        "fixed inset-0 z-50 flex h-dvh max-h-dvh w-full max-w-full translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 p-0 shadow-none ring-0",
        "sm:inset-auto sm:top-1/2 sm:left-1/2 sm:h-auto sm:max-h-[min(85vh,40rem)] sm:min-h-0 sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:border sm:p-4 sm:shadow-lg sm:ring-1 sm:ring-foreground/10"
      ),
      children: item ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs(DialogHeader, { className: "border-border flex shrink-0 flex-row items-start gap-3 space-y-0 border-b bg-popover px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pr-14 pb-3 sm:rounded-t-xl sm:pr-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1 space-y-1 pr-2", children: [
            /* @__PURE__ */ jsx(DialogTitle, { className: "text-foreground text-left text-lg leading-snug", children: item.name }),
            /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground text-left text-sm", children: [
              item.ingredients.length,
              " ingredient",
              item.ingredients.length === 1 ? "" : "s"
            ] })
          ] }),
          onEditRecipe ? /* @__PURE__ */ jsxs(
            Button,
            {
              type: "button",
              variant: "outline",
              size: "sm",
              className: "touch-manipulation mt-0.5 shrink-0 gap-1.5",
              onClick: () => {
                onEditRecipe(item);
              },
              children: [
                /* @__PURE__ */ jsx(Pencil, { className: "size-4", "aria-hidden": true }),
                "Edit"
              ]
            }
          ) : null
        ] }),
        /* @__PURE__ */ jsx("div", { className: "min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]", children: /* @__PURE__ */ jsx(LibraryMealItemDetailContent, { item }) })
      ] }) : null
    }
  ) });
}
function toMealLibraryItemJson(item, ingredients) {
  return {
    id: item.id,
    name: item.name,
    instructions: item.instructions,
    calories: item.calories,
    proteinG: item.proteinG,
    carbsG: item.carbsG,
    fatG: item.fatG,
    ingredients: ingredients.filter((i) => i.deletedAt == null).sort((a, b) => a.sortOrder - b.sortOrder).map((i) => ({
      id: i.id,
      sortOrder: i.sortOrder,
      line: i.line
    }))
  };
}
export {
  LibraryMealItemDetailContent as L,
  MealCookingInstructionsDialog as M,
  LibraryMealDialog as a,
  toMealLibraryItemJson as t
};
