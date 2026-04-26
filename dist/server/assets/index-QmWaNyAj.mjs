import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Pencil, Trash2, ChevronUp, ChevronDown, CirclePlus, EllipsisVertical, ClipboardList, Sparkles, Plus } from "lucide-react";
import { A as APP_BRAND_NAME, u as useDb } from "./router-CUOzYYmk.mjs";
import { toast } from "sonner";
import { b as buttonVariants, B as Button } from "./button-DbVXcFD_.mjs";
import { C as ConfirmDialog } from "./confirm-dialog-L0Y1JjA8.mjs";
import { D as Dialog, f as DialogTrigger, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogDescription, e as DialogFooter, g as DialogClose } from "./dialog-OkPnLnLD.mjs";
import { L as Label, I as Input } from "./label-BX01hlq_.mjs";
import "@capacitor/core";
import { b as useWorkoutMutations, f as useRoutineGroups, a as useWorkoutTemplates } from "./workouts-DSVvumuN.mjs";
import "dexie";
import "dexie-react-hooks";
import { c as cn } from "./utils-H80jjgLf.mjs";
import { S as StartWorkoutForm } from "./start-workout-form-Bfua1BiB.mjs";
import { S as Sheet, e as SheetTrigger, a as SheetContent, b as SheetHeader, c as SheetTitle, d as SheetDescription } from "./sheet-VTzMxY9v.mjs";
import { C as Card, a as CardHeader, b as CardTitle, c as CardDescription, d as CardContent } from "./card-C4819yjg.mjs";
import { a as useLocalSession, u as useLiveArray } from "./writes-C61wFNCm.mjs";
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
import "./ids-zMPBJmub.mjs";
import "clsx";
import "tailwind-merge";
const COACH_CREATE_WORKOUT_OR_ROUTINE_PROMPT = `I want to create a new workout or a multi-day routine in the app. Please guide me one step at a time—ask about my goals, schedule, and equipment as needed, then add exercises and save it in ${APP_BRAND_NAME}.`;
function WorkoutRoutineGroupHeader({
  routineGroupId,
  name
}) {
  const { renameRoutineGroup, deleteRoutineGroup } = useWorkoutMutations();
  const [pending, setPending] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  async function onDelete() {
    setDeleteConfirmOpen(false);
    setPending(true);
    try {
      await deleteRoutineGroup(routineGroupId);
      toast.success("Routine removed");
    } catch {
      toast.error("Could not delete routine");
    } finally {
      setPending(false);
    }
  }
  async function onRename(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const nextName = String(fd.get("name") ?? "").trim();
    if (!nextName) return;
    setPending(true);
    try {
      await renameRoutineGroup(routineGroupId, nextName);
      toast.success("Routine renamed");
      setDialogOpen(false);
    } catch {
      toast.error("Could not rename");
    } finally {
      setPending(false);
    }
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-2", children: [
    /* @__PURE__ */ jsx(
      ConfirmDialog,
      {
        open: deleteConfirmOpen,
        onOpenChange: setDeleteConfirmOpen,
        title: `Delete routine “${name}”?`,
        description: 'Workouts stay in your library as "not in a routine."',
        confirmLabel: "Delete",
        cancelLabel: "Cancel",
        confirmVariant: "destructive",
        onConfirm: onDelete
      }
    ),
    /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold tracking-tight", children: name }),
    /* @__PURE__ */ jsxs("div", { className: "flex shrink-0 gap-1", children: [
      /* @__PURE__ */ jsxs(Dialog, { open: dialogOpen, onOpenChange: setDialogOpen, children: [
        /* @__PURE__ */ jsxs(
          DialogTrigger,
          {
            type: "button",
            className: cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "border-primary/20 min-h-9 gap-1.5"
            ),
            children: [
              /* @__PURE__ */ jsx(Pencil, { className: "size-3.5", "aria-hidden": true }),
              "Rename"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-md", children: [
          /* @__PURE__ */ jsxs(DialogHeader, { children: [
            /* @__PURE__ */ jsx(DialogTitle, { children: "Rename routine" }),
            /* @__PURE__ */ jsx(DialogDescription, { children: "This only changes the group name; your workouts are unchanged." })
          ] }),
          /* @__PURE__ */ jsxs("form", { onSubmit: onRename, children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2 py-2", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: `rename-${routineGroupId}`, children: "Name" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  id: `rename-${routineGroupId}`,
                  name: "name",
                  defaultValue: name,
                  required: true,
                  className: "min-h-11",
                  autoComplete: "off"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs(DialogFooter, { className: "gap-2 sm:justify-end", children: [
              /* @__PURE__ */ jsx(
                DialogClose,
                {
                  className: cn(buttonVariants({ variant: "outline" })),
                  children: "Cancel"
                }
              ),
              /* @__PURE__ */ jsx(Button, { type: "submit", disabled: pending, children: "Save" })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(
        Button,
        {
          type: "button",
          variant: "ghost",
          size: "sm",
          className: "text-destructive hover:text-destructive min-h-9 gap-1.5",
          disabled: pending,
          onClick: () => setDeleteConfirmOpen(true),
          children: [
            /* @__PURE__ */ jsx(Trash2, { className: "size-3.5", "aria-hidden": true }),
            "Delete"
          ]
        }
      )
    ] })
  ] });
}
function WorkoutRoutineOrderButtons({
  templateId,
  prevTemplateId,
  nextTemplateId,
  templateOrder,
  prevOrder,
  nextOrder
}) {
  const { updateTemplate } = useWorkoutMutations();
  const [pending, setPending] = useState(false);
  async function move(direction) {
    setPending(true);
    try {
      if (direction === "up" && prevTemplateId && templateOrder != null) {
        await updateTemplate(templateId, {
          routineOrder: prevOrder ?? templateOrder - 1
        });
        await updateTemplate(prevTemplateId, {
          routineOrder: templateOrder
        });
      } else if (direction === "down" && nextTemplateId && templateOrder != null) {
        await updateTemplate(templateId, {
          routineOrder: nextOrder ?? templateOrder + 1
        });
        await updateTemplate(nextTemplateId, {
          routineOrder: templateOrder
        });
      }
    } catch {
      toast.error("Could not reorder");
    } finally {
      setPending(false);
    }
  }
  const canMoveUp = prevTemplateId !== null;
  const canMoveDown = nextTemplateId !== null;
  return /* @__PURE__ */ jsxs("div", { className: "flex shrink-0 gap-1", children: [
    /* @__PURE__ */ jsx(
      Button,
      {
        type: "button",
        variant: "outline",
        size: "sm",
        className: "border-primary/20 size-11 touch-manipulation p-0",
        disabled: !canMoveUp || pending,
        "aria-label": "Move workout up in this routine",
        onClick: () => void move("up"),
        children: /* @__PURE__ */ jsx(ChevronUp, { className: "size-5", "aria-hidden": true })
      }
    ),
    /* @__PURE__ */ jsx(
      Button,
      {
        type: "button",
        variant: "outline",
        size: "sm",
        className: "border-primary/20 size-11 touch-manipulation p-0",
        disabled: !canMoveDown || pending,
        "aria-label": "Move workout down in this routine",
        onClick: () => void move("down"),
        children: /* @__PURE__ */ jsx(ChevronDown, { className: "size-5", "aria-hidden": true })
      }
    )
  ] });
}
function WorkoutRoutineCardActions({
  templateId,
  name,
  mobileExtra
}) {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { className: "hidden flex-col gap-2 md:flex", children: [
      /* @__PURE__ */ jsx(StartWorkoutForm, { templateId, name }),
      /* @__PURE__ */ jsxs(
        Link,
        {
          to: "/app/workouts/$id",
          params: { id: templateId },
          hash: "workout-exercises",
          className: cn(
            buttonVariants({ variant: "outline" }),
            "border-primary/20 inline-flex min-h-11 w-full touch-manipulation items-center justify-center gap-2 text-base"
          ),
          children: [
            /* @__PURE__ */ jsx(Pencil, { className: "size-4 shrink-0", "aria-hidden": true }),
            "Edit exercises"
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        Link,
        {
          to: "/app/workouts/$id",
          params: { id: templateId },
          hash: "workout-exercises",
          className: cn(
            buttonVariants({ variant: "outline" }),
            "border-primary/20 inline-flex min-h-11 w-full touch-manipulation items-center justify-center gap-2 text-base"
          ),
          children: [
            /* @__PURE__ */ jsx(CirclePlus, { className: "size-4 shrink-0", "aria-hidden": true }),
            "Quick add exercise"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex min-h-12 gap-2 md:hidden", children: [
      /* @__PURE__ */ jsx(
        StartWorkoutForm,
        {
          templateId,
          name,
          formClassName: "min-w-0 flex-1",
          buttonClassName: "w-full min-w-0"
        }
      ),
      /* @__PURE__ */ jsxs(Sheet, { children: [
        /* @__PURE__ */ jsx(
          SheetTrigger,
          {
            type: "button",
            "aria-label": "More actions",
            className: cn(
              buttonVariants({ variant: "outline" }),
              "border-primary/20 size-12 shrink-0 touch-manipulation p-0"
            ),
            children: /* @__PURE__ */ jsx(EllipsisVertical, { className: "size-5", "aria-hidden": true })
          }
        ),
        /* @__PURE__ */ jsxs(SheetContent, { side: "bottom", className: "max-h-[min(85dvh,32rem)] gap-0", children: [
          /* @__PURE__ */ jsxs(SheetHeader, { className: "text-left", children: [
            /* @__PURE__ */ jsx(SheetTitle, { className: "pr-10", children: name }),
            /* @__PURE__ */ jsx(SheetDescription, { children: "Quick add or other actions for this routine." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 px-4 pb-6 pt-2", children: [
            /* @__PURE__ */ jsxs(
              Link,
              {
                to: "/app/workouts/$id",
                params: { id: templateId },
                hash: "workout-exercises",
                className: cn(
                  buttonVariants({ variant: "outline" }),
                  "border-primary/20 inline-flex min-h-12 w-full touch-manipulation items-center justify-center gap-2 text-base"
                ),
                children: [
                  /* @__PURE__ */ jsx(Pencil, { className: "size-4 shrink-0", "aria-hidden": true }),
                  "Edit exercises"
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              Link,
              {
                to: "/app/workouts/$id",
                params: { id: templateId },
                hash: "workout-exercises",
                className: cn(
                  buttonVariants({ variant: "outline" }),
                  "border-primary/20 inline-flex min-h-12 w-full touch-manipulation items-center justify-center gap-2 text-base"
                ),
                children: [
                  /* @__PURE__ */ jsx(CirclePlus, { className: "size-4 shrink-0", "aria-hidden": true }),
                  "Quick add exercise"
                ]
              }
            ),
            mobileExtra ? /* @__PURE__ */ jsx("div", { className: "border-border border-t pt-3", children: mobileExtra }) : null
          ] })
        ] })
      ] })
    ] })
  ] });
}
function DeleteTemplateButton({
  templateId,
  name,
  className
}) {
  const { deleteTemplate } = useWorkoutMutations();
  const [pending, setPending] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  async function onDelete() {
    setDialogOpen(false);
    setPending(true);
    try {
      await deleteTemplate(templateId);
      toast.success("Workout deleted");
    } catch {
      toast.error("Could not delete");
    } finally {
      setPending(false);
    }
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      ConfirmDialog,
      {
        open: dialogOpen,
        onOpenChange: setDialogOpen,
        title: `Delete “${name}”?`,
        description: "This cannot be undone.",
        confirmLabel: "Delete",
        cancelLabel: "Cancel",
        confirmVariant: "destructive",
        onConfirm: onDelete
      }
    ),
    /* @__PURE__ */ jsxs(
      Button,
      {
        type: "button",
        variant: "ghost",
        size: "sm",
        className: cn(
          "text-destructive hover:text-destructive min-h-11 shrink-0 gap-1.5",
          className
        ),
        disabled: pending,
        onClick: () => setDialogOpen(true),
        children: [
          /* @__PURE__ */ jsx(Trash2, { className: "size-4", "aria-hidden": true }),
          "Delete"
        ]
      }
    )
  ] });
}
function WorkoutTemplateLibraryCard({ template: t }) {
  const exerciseCount = t.itemCount ?? 0;
  return /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-2", children: [
      /* @__PURE__ */ jsxs(
        Link,
        {
          to: "/app/workouts/$id",
          params: { id: t.id },
          className: "min-h-11 min-w-0 flex-1 touch-manipulation py-0.5",
          children: [
            /* @__PURE__ */ jsx(CardTitle, { className: "text-lg hover:underline", children: t.name }),
            /* @__PURE__ */ jsxs(CardDescription, { children: [
              exerciseCount,
              " exercise",
              exerciseCount === 1 ? "" : "s",
              " · ",
              "Created",
              " ",
              new Date(t.createdAt).toLocaleDateString(void 0, {
                month: "short",
                day: "numeric",
                year: "numeric"
              })
            ] })
          ]
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "hidden shrink-0 md:block", children: /* @__PURE__ */ jsx(DeleteTemplateButton, { templateId: t.id, name: t.name }) })
    ] }) }),
    /* @__PURE__ */ jsx(CardContent, { className: "flex flex-col gap-2 pt-0", children: /* @__PURE__ */ jsx(
      WorkoutRoutineCardActions,
      {
        templateId: t.id,
        name: t.name,
        mobileExtra: /* @__PURE__ */ jsx(
          DeleteTemplateButton,
          {
            templateId: t.id,
            name: t.name,
            className: "min-h-12 w-full justify-center touch-manipulation"
          }
        )
      }
    ) })
  ] }) });
}
function useTemplateItemCounts() {
  const {
    db
  } = useDb();
  const {
    userId
  } = useLocalSession();
  return useLiveArray(async () => {
    if (!db || !userId) return [];
    const items = await db.workoutTemplateItems.filter((r) => r.deletedAt === null).toArray();
    const byT = /* @__PURE__ */ new Map();
    for (const it of items) {
      byT.set(it.templateId, (byT.get(it.templateId) ?? 0) + 1);
    }
    return [...byT.entries()].map(([templateId, count]) => ({
      templateId,
      count
    }));
  }, [db, userId]);
}
function templateSortKey(t) {
  return t.routineOrder ?? Number.MAX_SAFE_INTEGER;
}
function groupedTemplates(templates, groupId) {
  return templates.filter((t) => t.routineGroupId === groupId).sort((a, b) => templateSortKey(a) - templateSortKey(b) || a.createdAt - b.createdAt);
}
function WorkoutsPage() {
  const {
    data: groups
  } = useRoutineGroups();
  const {
    data: templates
  } = useWorkoutTemplates();
  const {
    data: counts
  } = useTemplateItemCounts();
  const countMap = useMemo(() => {
    const m = /* @__PURE__ */ new Map();
    for (const c of counts) m.set(c.templateId, c.count);
    return m;
  }, [counts]);
  const ungrouped = useMemo(() => templates.filter((t) => !t.routineGroupId).sort((a, b) => a.createdAt - b.createdAt), [templates]);
  const totalTemplates = templates.length;
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto w-full max-w-xl space-y-8 sm:max-w-5xl", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "flex items-center gap-2.5 text-2xl font-semibold tracking-tight", children: [
          /* @__PURE__ */ jsx("span", { className: "bg-primary/15 text-primary ring-primary/15 inline-flex size-10 items-center justify-center rounded-2xl ring-1", children: /* @__PURE__ */ jsx(ClipboardList, { className: "size-5", strokeWidth: 2.25, "aria-hidden": true }) }),
          "Workouts"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mt-2 text-sm", children: "Your saved workouts, organized into routines." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end sm:gap-2", children: [
        /* @__PURE__ */ jsxs(Link, { to: "/app/coach", search: {
          prompt: COACH_CREATE_WORKOUT_OR_ROUTINE_PROMPT
        }, className: cn(buttonVariants({
          variant: "outline"
        }), "inline-flex min-h-12 shrink-0 touch-manipulation items-center justify-center gap-2 text-base shadow-sm"), children: [
          /* @__PURE__ */ jsx(Sparkles, { className: "size-4", "aria-hidden": true }),
          "Create with AI"
        ] }),
        /* @__PURE__ */ jsxs(Link, { to: "/app/workouts/new", className: cn(buttonVariants(), "inline-flex min-h-12 shrink-0 touch-manipulation items-center justify-center gap-2 text-base shadow-sm"), children: [
          /* @__PURE__ */ jsx(Plus, { className: "size-4", "aria-hidden": true }),
          "New workout"
        ] })
      ] })
    ] }),
    totalTemplates === 0 ? /* @__PURE__ */ jsx("div", { className: "border-primary/15 bg-card rounded-xl border p-8 text-center shadow-sm", children: /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-sm", children: "You don't have any workouts yet. Create one to get started." }) }) : null,
    groups.map((group) => {
      const groupTemplates = groupedTemplates(templates, group.id);
      return /* @__PURE__ */ jsxs("section", { className: "space-y-4", children: [
        /* @__PURE__ */ jsx(WorkoutRoutineGroupHeader, { routineGroupId: group.id, name: group.name }),
        groupTemplates.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-sm", children: "No workouts in this routine yet." }) : /* @__PURE__ */ jsx("ul", { className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-3", children: groupTemplates.map((t, idx) => {
          const prev = groupTemplates[idx - 1] ?? null;
          const next = groupTemplates[idx + 1] ?? null;
          return /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2 sm:items-stretch", children: [
            /* @__PURE__ */ jsx(WorkoutTemplateLibraryCard, { template: {
              id: t.id,
              name: t.name,
              createdAt: t.createdAt,
              itemCount: countMap.get(t.id) ?? 0
            } }),
            groupTemplates.length > 1 ? /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(WorkoutRoutineOrderButtons, { templateId: t.id, templateOrder: t.routineOrder, prevTemplateId: prev?.id ?? null, prevOrder: prev?.routineOrder ?? null, nextTemplateId: next?.id ?? null, nextOrder: next?.routineOrder ?? null }) }) : null
          ] }, t.id);
        }) })
      ] }, group.id);
    }),
    ungrouped.length > 0 ? /* @__PURE__ */ jsxs("section", { className: "space-y-4", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold tracking-tight", children: groups.length > 0 ? "Not in a routine" : "Your workouts" }),
      /* @__PURE__ */ jsx("ul", { className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-3", children: ungrouped.map((t) => /* @__PURE__ */ jsx(WorkoutTemplateLibraryCard, { template: {
        id: t.id,
        name: t.name,
        createdAt: t.createdAt,
        itemCount: countMap.get(t.id) ?? 0
      } }, t.id)) })
    ] }) : null
  ] });
}
export {
  WorkoutsPage as component
};
