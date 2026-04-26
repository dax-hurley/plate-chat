import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useNavigate, Link } from "@tanstack/react-router";
import { useState, useTransition, useRef, useMemo, useEffect } from "react";
import { Pencil, Trash2, Search, BookOpen, Sparkles, Link2, Plus } from "lucide-react";
import { toast } from "sonner";
import { g as authFetch, F as stripRecipeMarkdownImagesAndLinks, G as Route } from "./router-CUOzYYmk.mjs";
import { B as Button, b as buttonVariants } from "./button-DbVXcFD_.mjs";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogDescription, e as DialogFooter } from "./dialog-OkPnLnLD.mjs";
import { L as Label, I as Input } from "./label-BX01hlq_.mjs";
import "@capacitor/core";
import "dexie-react-hooks";
import "dexie";
import { c as useNutritionMutations, a as useMealLibrary, b as useMealLibraryIngredientsForItems } from "./nutrition-BIi3XxN5.mjs";
import { c as cn } from "./utils-H80jjgLf.mjs";
import { C as Card, a as CardHeader, b as CardTitle, c as CardDescription, d as CardContent } from "./card-C4819yjg.mjs";
import { L as LibraryMealItemDetailContent, a as LibraryMealDialog, t as toMealLibraryItemJson, M as MealCookingInstructionsDialog } from "./meal-library-json-CDywx7OK.mjs";
import { a as COACH_MEAL_LIBRARY_PROMPT } from "./coach-nutrition-prompts-3tzCyDz-.mjs";
import "drizzle-zod";
import "drizzle-orm";
import "drizzle-orm/sqlite-core";
import "next-themes";
import "zod";
import "@libsql/client";
import "drizzle-orm/libsql";
import "jose";
import "@ai-sdk/anthropic";
import "ai";
import "node:crypto";
import "@better-auth/core/db";
import "@better-auth/core/env";
import "@better-auth/core/error";
import "@better-auth/kysely-adapter";
import "@better-auth/core/db/adapter";
import "kysely";
import "@better-auth/utils/password";
import "@noble/hashes/hkdf.js";
import "@noble/hashes/sha2.js";
import "@better-auth/core/utils/db";
import "@better-auth/core/utils/json";
import "@better-auth/utils/base64";
import "@better-auth/utils/binary";
import "@better-auth/utils/hmac";
import "@better-auth/core/utils/ip";
import "@better-auth/utils/hash";
import "@better-auth/core/context";
import "@better-auth/core/instrumentation";
import "@better-auth/core/utils/id";
import "defu";
import "@better-auth/core/utils/host";
import "@better-auth/core/utils/is-api-error";
import "@better-auth/core/utils/url";
import "@better-auth/core/api";
import "@better-auth/core/utils/deprecate";
import "@better-auth/utils/random";
import "@better-auth/utils";
import "@noble/ciphers/chacha.js";
import "@noble/ciphers/utils.js";
import "@better-auth/core/social-providers";
import "jose/errors";
import "better-call";
import "@better-auth/telemetry";
import "@better-auth/drizzle-adapter";
import "@base-ui/react/button";
import "class-variance-authority";
import "@base-ui/react/dialog";
import "@base-ui/react/input";
import "./writes-C61wFNCm.mjs";
import "./ids-zMPBJmub.mjs";
import "clsx";
import "tailwind-merge";
import "react-markdown";
import "remark-gfm";
import "./assistant-markdown-BkDNTUMc.mjs";
function ImportRecipeUrlDialog({
  open,
  onOpenChange,
  onSaved
}) {
  const { saveLibraryItem } = useNutritionMutations();
  const [url, setUrl] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  return /* @__PURE__ */ jsx(
    Dialog,
    {
      open,
      onOpenChange: (next) => {
        onOpenChange(next);
        if (!next) {
          setError(null);
        }
      },
      children: /* @__PURE__ */ jsxs(
        DialogContent,
        {
          className: cn(
            "sm:max-w-md",
            "fixed inset-0 z-50 flex h-dvh max-h-dvh w-full max-w-full translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 p-0 shadow-none ring-0",
            "sm:inset-auto sm:top-1/2 sm:left-1/2 sm:h-auto sm:max-h-[min(90dvh,720px)] sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:border sm:p-4 sm:shadow-lg sm:ring-1 sm:ring-foreground/10 sm:gap-4"
          ),
          children: [
            /* @__PURE__ */ jsxs(DialogHeader, { className: "border-border shrink-0 space-y-2 border-b px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 sm:border-0 sm:px-0 sm:pt-0 sm:pb-0", children: [
              /* @__PURE__ */ jsx(DialogTitle, { className: "text-left", children: "Import recipe from the web" }),
              /* @__PURE__ */ jsx(DialogDescription, { className: "text-left", children: "Paste a recipe page URL. We fetch the text, drop images and links, save it to your library, and open the recipe." })
            ] }),
            /* @__PURE__ */ jsxs(
              "form",
              {
                className: "flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-0 sm:pb-0",
                onSubmit: async (e) => {
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
                      body: JSON.stringify({ url: u })
                    });
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok) {
                      const msg = typeof data === "object" && data !== null && "error" in data && typeof data.error === "string" ? data.error : `Import failed (${res.status})`;
                      setError(msg);
                      return;
                    }
                    const ok = data;
                    const name = stripRecipeMarkdownImagesAndLinks(ok.draft.name).trim() || (typeof ok.pageTitle === "string" ? stripRecipeMarkdownImagesAndLinks(ok.pageTitle).trim() : "") || "Imported recipe";
                    const instructions = stripRecipeMarkdownImagesAndLinks(
                      ok.draft.instructions
                    );
                    const ingLines = ok.draft.ingredients.map((line) => stripRecipeMarkdownImagesAndLinks(line.trim())).filter(Boolean);
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
                          sortOrder: i
                        }))
                      });
                      const item = {
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
                          line
                        }))
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
                },
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                    /* @__PURE__ */ jsx(Label, { htmlFor: "import-recipe-url", children: "Recipe URL" }),
                    /* @__PURE__ */ jsx(
                      Input,
                      {
                        id: "import-recipe-url",
                        type: "url",
                        inputMode: "url",
                        autoComplete: "url",
                        placeholder: "https://…",
                        value: url,
                        onChange: (e) => setUrl(e.target.value),
                        disabled: pending
                      }
                    )
                  ] }),
                  error ? /* @__PURE__ */ jsx("p", { className: "text-destructive text-sm leading-snug", role: "alert", children: error }) : null,
                  /* @__PURE__ */ jsxs("div", { className: "mt-auto flex justify-end gap-2 pt-2 sm:mt-0", children: [
                    /* @__PURE__ */ jsx(
                      Button,
                      {
                        type: "button",
                        variant: "outline",
                        disabled: pending,
                        onClick: () => onOpenChange(false),
                        children: "Cancel"
                      }
                    ),
                    /* @__PURE__ */ jsx(Button, { type: "submit", disabled: pending, children: pending ? "Fetching…" : "Import" })
                  ] })
                ]
              }
            )
          ]
        }
      )
    }
  );
}
function LibraryMealCard({ item }) {
  const { deleteLibraryItem } = useNutritionMutations();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, setPending] = useState(false);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(Card, { className: "border-primary/15 overflow-hidden", children: [
      /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsx(CardTitle, { className: "text-lg leading-snug", children: item.name }),
          /* @__PURE__ */ jsxs(CardDescription, { className: "mt-1", children: [
            item.ingredients.length,
            " ingredient",
            item.ingredients.length === 1 ? "" : "s"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex shrink-0 gap-1", children: [
          /* @__PURE__ */ jsx(
            Button,
            {
              type: "button",
              variant: "ghost",
              size: "icon-sm",
              className: "touch-manipulation",
              "aria-label": `Edit ${item.name}`,
              onClick: () => setEditOpen(true),
              children: /* @__PURE__ */ jsx(Pencil, { className: "size-4" })
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              type: "button",
              variant: "ghost",
              size: "icon-sm",
              className: "text-destructive hover:text-destructive touch-manipulation",
              "aria-label": `Delete ${item.name}`,
              onClick: () => setDeleteOpen(true),
              children: /* @__PURE__ */ jsx(Trash2, { className: "size-4" })
            }
          )
        ] })
      ] }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx(LibraryMealItemDetailContent, { item }) })
    ] }) }),
    /* @__PURE__ */ jsx(
      LibraryMealDialog,
      {
        open: editOpen,
        onOpenChange: setEditOpen,
        mode: "edit",
        item,
        createFormKey: 0
      }
    ),
    /* @__PURE__ */ jsx(Dialog, { open: deleteOpen, onOpenChange: setDeleteOpen, children: /* @__PURE__ */ jsxs(DialogContent, { className: "sm:max-w-sm", showCloseButton: true, children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsx(DialogTitle, { children: "Delete this meal?" }),
        /* @__PURE__ */ jsxs(DialogDescription, { children: [
          "“",
          item.name,
          "” will be removed from your library. Weekly plan slots that used it will be cleared."
        ] })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { className: "gap-2 sm:justify-end", children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            type: "button",
            variant: "outline",
            onClick: () => setDeleteOpen(false),
            disabled: pending,
            children: "Cancel"
          }
        ),
        /* @__PURE__ */ jsx(
          Button,
          {
            type: "button",
            variant: "destructive",
            disabled: pending,
            onClick: () => {
              setPending(true);
              (async () => {
                try {
                  await deleteLibraryItem(item.id);
                  setDeleteOpen(false);
                  toast.success("Meal removed");
                } catch {
                  toast.error("Could not delete meal");
                } finally {
                  setPending(false);
                }
              })();
            },
            children: "Delete"
          }
        )
      ] })
    ] }) })
  ] });
}
const SEARCH_DEBOUNCE_MS = 350;
function LibraryMealList({
  initialItems,
  initialQuery
}) {
  const navigate = useNavigate();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(initialQuery);
  const skipNextDebounceRef = useRef(false);
  const itemsKey = useMemo(
    () => initialItems.map((i) => i.id).join(","),
    [initialItems]
  );
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);
  useEffect(() => {
    if (skipNextDebounceRef.current) {
      skipNextDebounceRef.current = false;
      return;
    }
    const t = window.setTimeout(() => {
      const q = query.trim();
      if (q === (initialQuery ?? "").trim()) return;
      startTransition(() => {
        void navigate({
          to: "/app/nutrition/library",
          search: q ? { q } : {},
          replace: true
        });
      });
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [query, initialQuery, navigate]);
  const hasQuery = query.trim().length > 0;
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2 sm:flex-row sm:items-end", children: [
      /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1 space-y-1.5", children: [
        /* @__PURE__ */ jsx(
          "label",
          {
            className: "text-muted-foreground text-xs font-medium",
            htmlFor: "lib-search",
            children: "Search"
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(
            Search,
            {
              className: "text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2",
              "aria-hidden": true
            }
          ),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "lib-search",
              value: query,
              onChange: (e) => setQuery(e.target.value),
              placeholder: "e.g. chicken, oats…",
              className: "min-h-11 pl-9",
              autoComplete: "off",
              "aria-busy": pending
            }
          )
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-xs", children: "Results update as you type." })
      ] }),
      hasQuery ? /* @__PURE__ */ jsx(
        Button,
        {
          type: "button",
          variant: "outline",
          className: "min-h-11 border-primary/20 touch-manipulation",
          disabled: pending,
          onClick: () => {
            skipNextDebounceRef.current = true;
            setQuery("");
            startTransition(() => {
              void navigate({ to: "/app/nutrition/library", search: {} });
            });
          },
          children: "Clear"
        }
      ) : null
    ] }),
    /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-sm", children: initialItems.length === 0 ? "No meals match yet." : `${initialItems.length} saved meal${initialItems.length === 1 ? "" : "s"}` }),
    /* @__PURE__ */ jsx("ul", { className: "space-y-4", children: initialItems.map((item) => /* @__PURE__ */ jsx(LibraryMealCard, { item }, item.id)) }, itemsKey)
  ] });
}
function LibraryPage() {
  const {
    q = ""
  } = Route.useSearch();
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [createFormKey, setCreateFormKey] = useState(0);
  const [importPreviewOpen, setImportPreviewOpen] = useState(false);
  const [importPreviewItem, setImportPreviewItem] = useState(null);
  const [importEditOpen, setImportEditOpen] = useState(false);
  const [importEditItem, setImportEditItem] = useState(null);
  const {
    data: items
  } = useMealLibrary();
  const {
    data: ings
  } = useMealLibraryIngredientsForItems(items.map((i) => i.id));
  const byId = useMemo(() => {
    const m = /* @__PURE__ */ new Map();
    for (const i of ings) {
      const arr = m.get(i.libraryItemId) ?? [];
      arr.push(i);
      m.set(i.libraryItemId, arr);
    }
    return m;
  }, [ings]);
  const jsonItems = useMemo(() => items.map((it) => toMealLibraryItemJson(it, byId.get(it.id) ?? [])), [items, byId]);
  const filtered = useMemo(() => {
    const t = (q ?? "").trim().toLowerCase();
    if (!t) return jsonItems;
    return jsonItems.filter((m) => m.name.toLowerCase().includes(t));
  }, [jsonItems, q]);
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto w-full max-w-xl space-y-6 md:max-w-5xl", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "flex items-center gap-2.5 text-2xl font-semibold tracking-tight", children: [
          /* @__PURE__ */ jsx("span", { className: "bg-primary/15 text-primary ring-primary/15 inline-flex size-10 items-center justify-center rounded-2xl ring-1", children: /* @__PURE__ */ jsx(BookOpen, { className: "size-5", strokeWidth: 2.25, "aria-hidden": true }) }),
          "Recipe library"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mt-2 text-sm", children: "Save recipes or go-to meals and reuse them in your weekly plan." }),
        /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground mt-1 text-sm", children: [
          "Use these meals on the",
          " ",
          /* @__PURE__ */ jsx(Link, { to: "/app/nutrition/plan", className: "text-primary font-medium underline-offset-2 hover:underline", children: "meal plan" }),
          " ",
          "page."
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end sm:gap-2", children: [
        /* @__PURE__ */ jsxs(Link, { to: "/app/coach", search: {
          prompt: COACH_MEAL_LIBRARY_PROMPT
        }, className: cn(buttonVariants({
          variant: "outline"
        }), "inline-flex min-h-12 shrink-0 touch-manipulation items-center justify-center gap-2 text-base shadow-sm"), children: [
          /* @__PURE__ */ jsx(Sparkles, { className: "size-4", "aria-hidden": true }),
          "Create with AI"
        ] }),
        /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", className: "inline-flex min-h-12 touch-manipulation items-center justify-center gap-2 text-base shadow-sm", onClick: () => setImportOpen(true), children: [
          /* @__PURE__ */ jsx(Link2, { className: "size-4", "aria-hidden": true }),
          "Import from web"
        ] }),
        /* @__PURE__ */ jsxs(Button, { type: "button", className: "inline-flex min-h-12 touch-manipulation items-center justify-center gap-2 text-base shadow-sm", onClick: () => {
          setCreateFormKey((k) => k + 1);
          setCreateOpen(true);
        }, children: [
          /* @__PURE__ */ jsx(Plus, { className: "size-4", "aria-hidden": true }),
          "Add meal"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(ImportRecipeUrlDialog, { open: importOpen, onOpenChange: setImportOpen, onSaved: (item) => {
      setImportPreviewItem(item);
      setImportPreviewOpen(true);
    } }),
    /* @__PURE__ */ jsx(MealCookingInstructionsDialog, { open: importPreviewOpen, onOpenChange: (open) => {
      setImportPreviewOpen(open);
      if (!open) setImportPreviewItem(null);
    }, item: importPreviewItem, onEditRecipe: (item) => {
      setImportPreviewOpen(false);
      setImportPreviewItem(null);
      setImportEditItem(item);
      setImportEditOpen(true);
    } }),
    /* @__PURE__ */ jsx(LibraryMealDialog, { open: importEditOpen, onOpenChange: (open) => {
      setImportEditOpen(open);
      if (!open) setImportEditItem(null);
    }, mode: "edit", item: importEditItem ?? void 0, createFormKey: 0 }),
    /* @__PURE__ */ jsx(LibraryMealDialog, { open: createOpen, onOpenChange: setCreateOpen, mode: "create", createFormKey }),
    /* @__PURE__ */ jsx(LibraryMealList, { initialItems: filtered, initialQuery: q ?? "" })
  ] });
}
export {
  LibraryPage as component
};
