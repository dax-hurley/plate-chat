import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { Pencil, ArrowLeft, ListTree } from "lucide-react";
import { toast } from "sonner";
import { A as AutocompleteCombobox } from "./autocomplete-combobox-Bz_SOWqH.mjs";
import { B as Button, b as buttonVariants } from "./button-DbVXcFD_.mjs";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogDescription, e as DialogFooter, f as DialogTrigger } from "./dialog-OkPnLnLD.mjs";
import { L as Label, I as Input } from "./label-BX01hlq_.mjs";
import "@capacitor/core";
import { b as useWorkoutMutations, c as useWorkoutTemplate, d as useTemplateItems, e as useExercises, f as useRoutineGroups } from "./workouts-DSVvumuN.mjs";
import "dexie";
import { v as parseExerciseLogKind, w as parseDistanceUnit, x as roundDistance, y as minPositiveDistance, z as formatDistanceAmount, B as formatLoadNumber, C as resolveTemplateItemWeightUnit, D as Route } from "./router-CUOzYYmk.mjs";
import "dexie-react-hooks";
import { C as ConfirmDialog } from "./confirm-dialog-L0Y1JjA8.mjs";
import { f as formatDurationSeconds } from "./format-duration-DOYRzqf7.mjs";
import { c as cn } from "./utils-H80jjgLf.mjs";
import { C as Card, a as CardHeader, b as CardTitle, d as CardContent, c as CardDescription } from "./card-C4819yjg.mjs";
import "react-dom";
import "@base-ui/react/button";
import "class-variance-authority";
import "@base-ui/react/dialog";
import "@base-ui/react/input";
import "./writes-C61wFNCm.mjs";
import "./ids-zMPBJmub.mjs";
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
import "clsx";
import "tailwind-merge";
const ADD_ROUTINE = "__add_routine__";
function AssignWorkoutToRoutineSelect({
  templateId,
  currentRoutineGroupId,
  routineOptions
}) {
  const { updateTemplate, createRoutineGroup } = useWorkoutMutations();
  const [pending, setPending] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState("");
  const comboboxOptions = useMemo(() => {
    const routineRows = routineOptions.map((g) => ({
      value: g.id,
      label: g.name,
      group: "Routines"
    }));
    return [
      ...routineRows,
      {
        value: ADD_ROUTINE,
        label: "Add new routine…",
        group: "New"
      }
    ];
  }, [routineOptions]);
  async function onRoutinePick(next) {
    if (next === ADD_ROUTINE) {
      setNewRoutineName("");
      setAddOpen(true);
      return;
    }
    const nextGroup = next;
    if (nextGroup === currentRoutineGroupId) return;
    setPending(true);
    try {
      await updateTemplate(templateId, { routineGroupId: nextGroup });
      toast.success("Routine updated");
    } catch {
      toast.error("Could not update routine");
    } finally {
      setPending(false);
    }
  }
  async function onCreateRoutine(e) {
    e.preventDefault();
    const name = newRoutineName.trim();
    if (!name) return;
    setPending(true);
    try {
      const id = await createRoutineGroup(name);
      await updateTemplate(templateId, { routineGroupId: id });
      setAddOpen(false);
      setNewRoutineName("");
      toast.success("Routine created and workout assigned");
    } catch {
      toast.error("Could not create routine");
    } finally {
      setPending(false);
    }
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx(Label, { htmlFor: `routine-combo-${templateId}`, className: "sr-only", children: "Assign this workout to a routine" }),
      /* @__PURE__ */ jsx(
        AutocompleteCombobox,
        {
          id: `routine-combo-${templateId}`,
          "aria-label": "Assign to routine",
          options: comboboxOptions,
          value: currentRoutineGroupId,
          onValueChange: onRoutinePick,
          allowNone: true,
          noneLabel: "Not in a routine",
          disabled: pending,
          placeholder: currentRoutineGroupId == null ? "Not in a routine — search to change" : "Search routines…",
          emptyText: "No routines match.",
          inputClassName: "min-h-12 text-base"
        }
      )
    ] }),
    /* @__PURE__ */ jsx(Dialog, { open: addOpen, onOpenChange: setAddOpen, children: /* @__PURE__ */ jsx(DialogContent, { className: "sm:max-w-md", children: /* @__PURE__ */ jsxs("form", { onSubmit: onCreateRoutine, children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsx(DialogTitle, { children: "New routine" }),
        /* @__PURE__ */ jsx(DialogDescription, { children: "Create a routine group and assign this workout to it." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2 py-2", children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: `new-routine-${templateId}`, children: "Name" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            id: `new-routine-${templateId}`,
            value: newRoutineName,
            onChange: (e) => setNewRoutineName(e.target.value),
            placeholder: "e.g. Push / pull / legs",
            className: "min-h-11 text-base",
            autoComplete: "off",
            autoFocus: true
          }
        )
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { className: "gap-2 sm:gap-0", children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            type: "button",
            variant: "outline",
            onClick: () => setAddOpen(false),
            disabled: pending,
            children: "Cancel"
          }
        ),
        /* @__PURE__ */ jsx(Button, { type: "submit", disabled: pending || !newRoutineName.trim(), children: pending ? "Creating…" : "Create and assign" })
      ] })
    ] }) }) })
  ] });
}
function parseOptionalNumber(raw) {
  const t = String(raw ?? "").trim();
  if (t === "") return null;
  const n = Number(t.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}
function parseRestBetweenSetsSec(raw) {
  const t = String(raw ?? "").trim();
  if (t === "") return null;
  const n = Number.parseInt(t, 10);
  if (!Number.isFinite(n) || n < 0 || n > 3600) return null;
  return n > 0 ? n : null;
}
function TemplateItemEditDialog({
  item
}) {
  const { updateTemplateItem, createExercise } = useWorkoutMutations();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [trackLoad, setTrackLoad] = useState(item.trackWeight);
  const [logTimeDist, setLogTimeDist] = useState(item.logTimeForDistanceSets);
  const lk = parseExerciseLogKind(item.exercise.logKind);
  const timeMode = lk === "time";
  const distanceMode = lk === "distance";
  const canEditExercise = item.exercise.userId != null;
  const dUnit = parseDistanceUnit(item.exercise.distanceUnit);
  const defaultDuration = Math.max(
    1,
    Math.round(
      item.targetDurationSec ?? item.exercise.defaultDurationSec ?? 60
    )
  );
  const defaultTargetDist = roundDistance(
    Math.max(
      minPositiveDistance(dUnit),
      Number(
        item.targetDistance ?? item.exercise.defaultDistance ?? (dUnit === "m" ? 400 : 1)
      )
    ),
    dUnit
  );
  const templateUnitSelectValue = item.weightUnit === "lb" || item.weightUnit === "kg" ? item.weightUnit : "";
  const exerciseUnit = item.exercise.weightUnit === "kg" ? "kg" : "lb";
  const showProgressiveOverloadSection = timeMode || distanceMode || lk === "reps" && trackLoad;
  async function onSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setPending(true);
    try {
      const targetSets = Math.max(
        1,
        Math.round(Number(fd.get("targetSets")) || 1)
      );
      const targetReps = lk === "reps" ? Math.max(1, Math.round(Number(fd.get("targetReps")) || 1)) : null;
      const targetDurationSec = timeMode || distanceMode && logTimeDist ? Math.max(1, Math.round(Number(fd.get("targetDurationSec")) || 60)) : null;
      const targetDistance = distanceMode && !logTimeDist ? roundDistance(
        Math.max(
          minPositiveDistance(dUnit),
          Number(fd.get("targetDistance")) || 0
        ),
        dUnit
      ) : null;
      const defaultWeight = lk === "reps" || trackLoad ? parseOptionalNumber(fd.get("defaultWeight")) : null;
      const templateWeightUnit = (() => {
        if (!(lk === "reps" || trackLoad)) return null;
        const v = String(fd.get("templateWeightUnit") ?? "");
        return v === "lb" || v === "kg" ? v : null;
      })();
      const progressiveOverloadEnabled = showProgressiveOverloadSection && String(fd.get("progressiveOverloadEnabled") ?? "") === "1";
      const progressiveOverloadIncrement = showProgressiveOverloadSection ? parseOptionalNumber(fd.get("progressiveOverloadIncrement")) : null;
      const progressiveOverloadRequireFullCompletion = showProgressiveOverloadSection && String(fd.get("progressiveOverloadRequireFullCompletion") ?? "") === "1";
      const restBetweenSetsSec = parseRestBetweenSetsSec(
        fd.get("restBetweenSetsSec")
      );
      await updateTemplateItem(item.id, {
        targetSets,
        targetReps,
        targetDurationSec,
        targetDistance,
        defaultWeight,
        weightUnit: templateWeightUnit,
        trackWeight: lk === "reps" ? true : trackLoad,
        logTimeForDistanceSets: distanceMode ? logTimeDist : false,
        progressiveOverloadEnabled,
        progressiveOverloadIncrement,
        progressiveOverloadRequireFullCompletion,
        isWarmup: item.isWarmup,
        restBetweenSetsSec
      });
      if (canEditExercise) {
        const exerciseName = String(fd.get("exerciseName") ?? "").trim();
        const exerciseMuscleGroup = String(
          fd.get("exerciseMuscleGroup") ?? ""
        ).trim();
        const exerciseWeightUnit = String(fd.get("exerciseWeightUnit") ?? "");
        const eu = exerciseWeightUnit === "kg" ? "kg" : "lb";
        await createExercise({
          name: exerciseName || item.exercise.name,
          muscleGroup: exerciseMuscleGroup || item.exercise.muscleGroup || null,
          logKind: item.exercise.logKind ?? "reps",
          defaultDurationSec: item.exercise.defaultDurationSec ?? null,
          defaultDistance: item.exercise.defaultDistance ?? null,
          distanceUnit: item.exercise.distanceUnit ?? "mi",
          weightUnit: eu,
          trackWeight: true,
          isCustom: true
        });
      }
      setOpen(false);
      toast.success("Exercise saved", { description: "Workout updated." });
    } catch {
      toast.error("Could not save changes");
    } finally {
      setPending(false);
    }
  }
  return /* @__PURE__ */ jsxs(
    Dialog,
    {
      open,
      onOpenChange: (next) => {
        setOpen(next);
        if (next) {
          setTrackLoad(item.trackWeight);
          setLogTimeDist(item.logTimeForDistanceSets);
        }
      },
      children: [
        /* @__PURE__ */ jsxs(
          DialogTrigger,
          {
            type: "button",
            disabled: pending,
            className: cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "min-h-11 shrink-0 touch-manipulation gap-1.5"
            ),
            children: [
              /* @__PURE__ */ jsx(Pencil, { className: "size-3.5", "aria-hidden": true }),
              "Edit"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(DialogContent, { className: "max-h-[min(90dvh,36rem)] overflow-y-auto sm:max-w-md", children: [
          /* @__PURE__ */ jsxs(DialogHeader, { children: [
            /* @__PURE__ */ jsx(DialogTitle, { children: "Edit exercise" }),
            /* @__PURE__ */ jsx(DialogDescription, { children: canEditExercise ? "Update this lift and how it appears in this workout." : "This preset can only be adjusted for sets, reps, time, distance, and default load in this routine." })
          ] }),
          /* @__PURE__ */ jsxs("form", { onSubmit, className: "grid gap-4", children: [
            canEditExercise ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx(Label, { htmlFor: `ex-name-${item.id}`, children: "Exercise name" }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    id: `ex-name-${item.id}`,
                    name: "exerciseName",
                    required: true,
                    defaultValue: item.exercise.name,
                    className: "min-h-11 text-base",
                    autoComplete: "off"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx(Label, { htmlFor: `ex-muscle-${item.id}`, children: "Muscle group (optional)" }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    id: `ex-muscle-${item.id}`,
                    name: "exerciseMuscleGroup",
                    defaultValue: item.exercise.muscleGroup ?? "",
                    placeholder: "Chest, legs…",
                    className: "min-h-11 text-base"
                  }
                )
              ] })
            ] }) : null,
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: `sets-${item.id}`, children: "Sets" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  id: `sets-${item.id}`,
                  name: "targetSets",
                  type: "number",
                  inputMode: "numeric",
                  min: 1,
                  required: true,
                  defaultValue: item.targetSets,
                  className: "min-h-11"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: `rest-${item.id}`, children: "Rest after each set (seconds)" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  id: `rest-${item.id}`,
                  name: "restBetweenSetsSec",
                  type: "number",
                  inputMode: "numeric",
                  min: 0,
                  max: 3600,
                  defaultValue: item.restBetweenSetsSec != null && item.restBetweenSetsSec > 0 ? String(item.restBetweenSetsSec) : "",
                  placeholder: "Blank = no rest timer",
                  className: "min-h-11"
                }
              ),
              /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-xs", children: "In the live workout, starts after you log a set for this exercise." })
            ] }),
            timeMode ? /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: `dur-${item.id}`, children: "Target duration per set (seconds)" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  id: `dur-${item.id}`,
                  name: "targetDurationSec",
                  type: "number",
                  inputMode: "numeric",
                  min: 1,
                  required: true,
                  defaultValue: defaultDuration,
                  className: "min-h-11"
                }
              ),
              /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground text-xs", children: [
                "Shown in the workout as",
                " ",
                formatDurationSeconds(defaultDuration),
                " per set."
              ] })
            ] }) : distanceMode ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 rounded-lg border border-dashed border-emerald-500/25 bg-emerald-500/[0.06] p-3 dark:bg-emerald-950/20", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    id: `logt-${item.id}`,
                    type: "checkbox",
                    checked: logTimeDist,
                    onChange: (e) => setLogTimeDist(e.target.checked),
                    className: "border-input text-primary mt-1 size-4 shrink-0 rounded"
                  }
                ),
                /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1 space-y-1", children: [
                  /* @__PURE__ */ jsx(
                    Label,
                    {
                      htmlFor: `logt-${item.id}`,
                      className: "text-foreground font-medium",
                      children: "Log time (stopwatch) instead of distance"
                    }
                  ),
                  /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-xs", children: "Each set records your elapsed time. Use for intervals and pace work where distance isn't the focus." })
                ] })
              ] }),
              logTimeDist ? /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx(Label, { htmlFor: `dur-dist-${item.id}`, children: "Target time per set (seconds)" }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    id: `dur-dist-${item.id}`,
                    name: "targetDurationSec",
                    type: "number",
                    inputMode: "numeric",
                    min: 1,
                    required: true,
                    defaultValue: defaultDuration,
                    className: "min-h-11"
                  }
                )
              ] }) : /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxs(Label, { htmlFor: `dist-${item.id}`, children: [
                  "Target distance per set (",
                  dUnit,
                  ")"
                ] }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    id: `dist-${item.id}`,
                    name: "targetDistance",
                    type: "number",
                    inputMode: "decimal",
                    min: minPositiveDistance(dUnit),
                    step: "any",
                    required: true,
                    defaultValue: defaultTargetDist,
                    className: "min-h-11"
                  }
                ),
                /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground text-xs", children: [
                  "Shown in the workout as",
                  " ",
                  formatDistanceAmount(defaultTargetDist, dUnit),
                  " per set."
                ] })
              ] })
            ] }) : /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: `reps-${item.id}`, children: "Target reps per set" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  id: `reps-${item.id}`,
                  name: "targetReps",
                  type: "number",
                  inputMode: "numeric",
                  min: 1,
                  required: true,
                  defaultValue: item.targetReps ?? 5,
                  className: "min-h-11"
                }
              )
            ] }),
            lk === "reps" ? null : /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 rounded-lg border border-dashed border-primary/20 bg-muted/20 p-3", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  id: `track-w-${item.id}`,
                  type: "checkbox",
                  checked: trackLoad,
                  onChange: (e) => setTrackLoad(e.target.checked),
                  className: "border-input text-primary mt-1 size-4 shrink-0 rounded"
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1 space-y-1", children: [
                /* @__PURE__ */ jsx(
                  Label,
                  {
                    htmlFor: `track-w-${item.id}`,
                    className: "text-foreground font-medium",
                    children: "Track load (weight)"
                  }
                ),
                /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-xs", children: "Turn on for weighted carries, sled pushes, or machines with a load setting. Leave off for pace-only cardio and most distance work." })
              ] })
            ] }),
            lk === "reps" || trackLoad ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx(Label, { htmlFor: `wt-${item.id}`, children: "Default load (optional)" }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    id: `wt-${item.id}`,
                    name: "defaultWeight",
                    type: "number",
                    inputMode: "decimal",
                    step: "any",
                    placeholder: "e.g. 135",
                    defaultValue: item.defaultWeight != null && Number.isFinite(item.defaultWeight) ? String(item.defaultWeight) : "",
                    className: "min-h-11"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx(Label, { htmlFor: `twu-${item.id}`, children: "Weight unit in this workout" }),
                /* @__PURE__ */ jsxs(
                  "select",
                  {
                    id: `twu-${item.id}`,
                    name: "templateWeightUnit",
                    defaultValue: templateUnitSelectValue,
                    className: "border-input bg-background ring-offset-background focus-visible:ring-ring flex min-h-11 w-full rounded-md border px-3 py-2 text-base shadow-xs focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
                    children: [
                      /* @__PURE__ */ jsxs("option", { value: "", children: [
                        "Same as exercise (",
                        exerciseUnit,
                        ")"
                      ] }),
                      /* @__PURE__ */ jsx("option", { value: "lb", children: "lb (imperial)" }),
                      /* @__PURE__ */ jsx("option", { value: "kg", children: "kg (metric)" })
                    ]
                  }
                )
              ] })
            ] }) : null,
            showProgressiveOverloadSection ? /* @__PURE__ */ jsxs("div", { className: "border-border space-y-3 rounded-lg border border-dashed p-3", children: [
              /* @__PURE__ */ jsx("p", { className: "text-foreground text-sm font-medium", children: "Exercise progress" }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    id: `po-en-${item.id}`,
                    name: "progressiveOverloadEnabled",
                    type: "checkbox",
                    value: "1",
                    defaultChecked: item.progressiveOverloadEnabled,
                    className: "border-input text-primary mt-1 size-4 shrink-0 rounded"
                  }
                ),
                /* @__PURE__ */ jsx("div", { className: "min-w-0 flex-1 space-y-1", children: /* @__PURE__ */ jsx(Label, { htmlFor: `po-en-${item.id}`, className: "font-medium", children: lk === "reps" ? "Increase default load after each session" : timeMode ? "Increase target hold time after each session" : logTimeDist ? "Increase goal time after each session" : "Increase target distance after each session" }) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx(Label, { htmlFor: `po-inc-${item.id}`, children: lk === "reps" ? "Increment per session (load)" : timeMode || logTimeDist ? "Increment per session (seconds)" : "Increment per session (distance)" }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    id: `po-inc-${item.id}`,
                    name: "progressiveOverloadIncrement",
                    type: "number",
                    inputMode: "decimal",
                    step: "any",
                    min: 0,
                    placeholder: "e.g. 2.5",
                    defaultValue: item.progressiveOverloadIncrement != null && Number.isFinite(item.progressiveOverloadIncrement) ? String(item.progressiveOverloadIncrement) : "",
                    className: "min-h-11"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    id: `po-full-${item.id}`,
                    name: "progressiveOverloadRequireFullCompletion",
                    type: "checkbox",
                    value: "1",
                    defaultChecked: item.progressiveOverloadRequireFullCompletion,
                    className: "border-input text-primary mt-1 size-4 shrink-0 rounded"
                  }
                ),
                /* @__PURE__ */ jsx("div", { className: "min-w-0 flex-1 space-y-1", children: /* @__PURE__ */ jsx(
                  Label,
                  {
                    htmlFor: `po-full-${item.id}`,
                    className: "font-medium",
                    children: "Only when every set hits target reps, hold time, or distance"
                  }
                ) })
              ] })
            ] }) : null,
            canEditExercise ? /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: `ewu-${item.id}`, children: "Exercise library unit" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  id: `ewu-${item.id}`,
                  name: "exerciseWeightUnit",
                  defaultValue: exerciseUnit,
                  className: "border-input bg-background ring-offset-background focus-visible:ring-ring flex min-h-11 w-full rounded-md border px-3 py-2 text-base shadow-xs focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "lb", children: "lb (imperial)" }),
                    /* @__PURE__ */ jsx("option", { value: "kg", children: "kg (metric)" })
                  ]
                }
              )
            ] }) : null,
            /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [
              /* @__PURE__ */ jsx(
                Button,
                {
                  type: "button",
                  variant: "outline",
                  disabled: pending,
                  onClick: () => setOpen(false),
                  children: "Cancel"
                }
              ),
              /* @__PURE__ */ jsx(Button, { type: "submit", disabled: pending, className: "min-h-11", children: pending ? "Saving…" : "Save" })
            ] })
          ] })
        ] })
      ]
    }
  );
}
function groupedLibrary(exercises) {
  const presets = exercises.filter((e) => e.userId == null);
  const custom = exercises.filter((e) => e.userId != null);
  const byMuscle = /* @__PURE__ */ new Map();
  for (const e of presets) {
    const key = (e.muscleGroup ?? "Other").trim() || "Other";
    const arr = byMuscle.get(key) ?? [];
    arr.push(e);
    byMuscle.set(key, arr);
  }
  const muscleKeys = [...byMuscle.keys()].sort((a, b) => a.localeCompare(b));
  for (const k of muscleKeys) {
    byMuscle.get(k).sort((a, b) => a.name.localeCompare(b.name));
  }
  custom.sort((a, b) => a.name.localeCompare(b.name));
  return { byMuscle, muscleKeys, custom };
}
function TemplateEditor({
  templateId,
  items,
  exercises
}) {
  const { addTemplateItem, deleteTemplateItem, updateTemplateItem } = useWorkoutMutations();
  const [pending, setPending] = useState(false);
  const [removeItemId, setRemoveItemId] = useState(null);
  const { byMuscle, muscleKeys, custom } = groupedLibrary(exercises);
  const sorted = useMemo(
    () => [...items].sort((a, b) => a.order - b.order),
    [items]
  );
  const workoutItems = useMemo(
    () => sorted.filter((i) => i.isWarmup !== true),
    [sorted]
  );
  const warmupItems = useMemo(
    () => sorted.filter((i) => i.isWarmup === true),
    [sorted]
  );
  function nextOrderForInsert(excludeItemId) {
    const list = excludeItemId ? items.filter((i) => i.id !== excludeItemId) : items;
    if (list.length === 0) return 0;
    return Math.max(0, ...list.map((i) => i.order)) + 1;
  }
  const exerciseMap = useMemo(() => {
    const m = /* @__PURE__ */ new Map();
    for (const e of exercises) m.set(e.id, e);
    return m;
  }, [exercises]);
  const comboboxOptions = useMemo(() => {
    const out = [];
    for (const muscle of muscleKeys) {
      for (const ex of byMuscle.get(muscle)) {
        out.push({
          value: ex.id,
          label: ex.name,
          group: muscle,
          description: ex.weightUnit === "kg" ? "kg" : "lb"
        });
      }
    }
    for (const ex of custom) {
      out.push({
        value: ex.id,
        label: ex.name,
        group: "My exercises",
        description: ex.weightUnit === "kg" ? "kg" : "lb"
      });
    }
    return out;
  }, [byMuscle, muscleKeys, custom]);
  async function onAddFromLibrary(exerciseId, isWarmup) {
    if (!exerciseId) return;
    setPending(true);
    try {
      const ex = exerciseMap.get(exerciseId);
      const lk = parseExerciseLogKind(ex?.logKind);
      await addTemplateItem({
        templateId,
        exerciseId,
        order: nextOrderForInsert(),
        targetSets: 3,
        targetReps: lk === "reps" ? 8 : null,
        targetDurationSec: lk === "time" ? ex?.defaultDurationSec ?? 60 : null,
        targetDistance: lk === "distance" ? ex?.defaultDistance ?? 1 : null,
        defaultWeight: null,
        weightUnit: null,
        trackWeight: ex?.trackWeight ?? true,
        logTimeForDistanceSets: false,
        progressiveOverloadEnabled: false,
        progressiveOverloadIncrement: null,
        progressiveOverloadRequireFullCompletion: false,
        isWarmup,
        restBetweenSetsSec: null
      });
      toast.success("Exercise added");
    } catch {
      toast.error("Could not add exercise");
    } finally {
      setPending(false);
    }
  }
  async function moveToWarmup(item) {
    if (item.isWarmup) return;
    setPending(true);
    try {
      await updateTemplateItem(item.id, {
        isWarmup: true,
        order: nextOrderForInsert(item.id)
      });
      toast.success("Moved to warm-up");
    } catch {
      toast.error("Could not move exercise");
    } finally {
      setPending(false);
    }
  }
  async function moveToWorkout(item) {
    if (!item.isWarmup) return;
    setPending(true);
    try {
      await updateTemplateItem(item.id, {
        isWarmup: false,
        order: nextOrderForInsert(item.id)
      });
      toast.success("Moved to main workout");
    } catch {
      toast.error("Could not move exercise");
    } finally {
      setPending(false);
    }
  }
  function itemRow(item, displayIndex, which) {
    const ex = exerciseMap.get(item.exerciseId);
    if (!ex) return null;
    const lk = parseExerciseLogKind(ex.logKind);
    const dUnit = parseDistanceUnit(ex.distanceUnit);
    const distanceOrTimeSummary = lk === "distance" ? item.logTimeForDistanceSets ? formatDurationSeconds(
      Math.max(1, Math.round(item.targetDurationSec ?? 60))
    ) : formatDistanceAmount(
      roundDistance(
        Number(
          item.targetDistance ?? ex.defaultDistance ?? (dUnit === "m" ? 400 : 1)
        ),
        dUnit
      ),
      dUnit
    ) : "";
    const editableItem = {
      id: item.id,
      order: item.order,
      targetSets: item.targetSets,
      targetReps: item.targetReps,
      targetDurationSec: item.targetDurationSec,
      targetDistance: item.targetDistance,
      defaultWeight: item.defaultWeight,
      weightUnit: item.weightUnit,
      trackWeight: item.trackWeight,
      progressiveOverloadEnabled: item.progressiveOverloadEnabled,
      progressiveOverloadIncrement: item.progressiveOverloadIncrement,
      progressiveOverloadRequireFullCompletion: item.progressiveOverloadRequireFullCompletion,
      logTimeForDistanceSets: item.logTimeForDistanceSets,
      isWarmup: item.isWarmup,
      restBetweenSetsSec: item.restBetweenSetsSec ?? null,
      exercise: ex
    };
    return /* @__PURE__ */ jsxs(
      "li",
      {
        className: "flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-3",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsxs("p", { className: "font-medium", children: [
              displayIndex + 1,
              ". ",
              ex.name
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground text-xs", children: [
              lk === "time" ? `${item.targetSets}×${formatDurationSeconds(
                Math.max(1, Math.round(item.targetDurationSec ?? 60))
              )}` : lk === "distance" ? `${item.targetSets}×${distanceOrTimeSummary}` : `${item.targetSets}×${item.targetReps ?? "—"}`,
              item.trackWeight && item.defaultWeight != null ? ` · ${formatLoadNumber(
                item.defaultWeight
              )} ${resolveTemplateItemWeightUnit({
                weightUnit: item.weightUnit,
                exercise: { weightUnit: ex.weightUnit }
              })}` : "",
              item.progressiveOverloadEnabled ? /* @__PURE__ */ jsxs("span", { className: "text-primary", children: [
                " ",
                "· auto",
                lk === "time" || lk === "distance" && item.logTimeForDistanceSets ? ` +${item.progressiveOverloadIncrement ?? "?"}s` : lk === "distance" ? ` +${item.progressiveOverloadIncrement ?? "?"} ${dUnit}` : ` +${item.progressiveOverloadIncrement ?? "?"}`
              ] }) : null
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex shrink-0 flex-wrap items-center justify-end gap-2", children: [
            which === "workout" ? /* @__PURE__ */ jsx(
              Button,
              {
                type: "button",
                variant: "secondary",
                size: "sm",
                className: "min-h-11 shrink-0 touch-manipulation",
                disabled: pending,
                onClick: () => void moveToWarmup(item),
                children: "To warm-up"
              }
            ) : /* @__PURE__ */ jsx(
              Button,
              {
                type: "button",
                variant: "secondary",
                size: "sm",
                className: "min-h-11 shrink-0 touch-manipulation",
                disabled: pending,
                onClick: () => void moveToWorkout(item),
                children: "To main workout"
              }
            ),
            /* @__PURE__ */ jsx(TemplateItemEditDialog, { item: editableItem }),
            /* @__PURE__ */ jsx(
              Button,
              {
                type: "button",
                variant: "outline",
                size: "sm",
                className: "min-h-11 shrink-0 touch-manipulation",
                disabled: pending,
                onClick: () => setRemoveItemId(item.id),
                children: "Remove"
              }
            )
          ] })
        ]
      },
      item.id
    );
  }
  const addCombo = (isWarmup, idSuffix) => exercises.length > 0 ? /* @__PURE__ */ jsxs("div", { className: "space-y-2 pt-1", children: [
    /* @__PURE__ */ jsx(Label, { htmlFor: `${templateId}-add-${idSuffix}`, children: isWarmup ? "Add to warm-up" : "Add to main workout" }),
    /* @__PURE__ */ jsx(
      AutocompleteCombobox,
      {
        id: `${templateId}-add-${idSuffix}`,
        "aria-label": isWarmup ? "Add exercise to warm-up" : "Add exercise to main workout",
        options: comboboxOptions,
        value: null,
        onValueChange: (v) => {
          if (v) void onAddFromLibrary(v, isWarmup);
        },
        clearAfterSelect: true,
        disabled: pending,
        placeholder: "Search exercises…",
        emptyText: "No exercises match your search.",
        inputClassName: "min-h-12 text-base"
      }
    )
  ] }) : null;
  const removeTarget = removeItemId ? items.find((i) => i.id === removeItemId) : void 0;
  const removeExerciseName = removeTarget ? exerciseMap.get(removeTarget.exerciseId)?.name ?? "Exercise" : "";
  return /* @__PURE__ */ jsxs("div", { className: "space-y-8", children: [
    /* @__PURE__ */ jsx(
      ConfirmDialog,
      {
        open: removeItemId != null,
        onOpenChange: (open) => {
          if (!open) setRemoveItemId(null);
        },
        title: "Remove exercise?",
        description: removeExerciseName ? `${removeExerciseName} will be removed from this workout template.` : void 0,
        confirmLabel: "Remove",
        cancelLabel: "Cancel",
        confirmVariant: "destructive",
        onConfirm: async () => {
          if (!removeItemId) return;
          const id = removeItemId;
          setRemoveItemId(null);
          try {
            await deleteTemplateItem(id);
            toast.success("Exercise removed");
          } catch {
            toast.error("Could not remove exercise");
          }
        }
      }
    ),
    /* @__PURE__ */ jsxs("div", { id: "workout-exercises", className: "scroll-mt-6 space-y-6", children: [
      /* @__PURE__ */ jsxs("section", { className: "space-y-3", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-medium", children: "Main workout" }),
        workoutItems.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-sm", children: items.length === 0 ? "Use the field below to add exercises." : "No main lifts here yet—add below or move lifts from the warm-up list." }) : /* @__PURE__ */ jsx("ol", { className: "space-y-2", children: workoutItems.map((item, idx) => itemRow(item, idx, "workout")) }),
        addCombo(false, "main")
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "space-y-3", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-medium", children: "Warm-up" }),
        warmupItems.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-sm", children: items.length === 0 ? "Add warm-up moves below, or add main lifts and use “To warm-up”." : "No warm-up lifts yet—add below or use “To warm-up” on a main lift." }) : /* @__PURE__ */ jsx("ol", { className: "space-y-2", children: warmupItems.map((item, idx) => itemRow(item, idx, "warmup")) }),
        addCombo(true, "warmup")
      ] })
    ] })
  ] });
}
function TemplatePage() {
  const {
    id
  } = Route.useParams();
  const {
    data: template
  } = useWorkoutTemplate(id);
  const {
    data: items
  } = useTemplateItems(id);
  const {
    data: exercises
  } = useExercises();
  const {
    data: groups
  } = useRoutineGroups();
  const {
    updateTemplate
  } = useWorkoutMutations();
  const [nameDraft, setNameDraft] = useState(null);
  const [notesDraft, setNotesDraft] = useState(null);
  useEffect(() => {
    if (template) {
      setNameDraft(null);
      setNotesDraft(null);
    }
  }, [template?.id]);
  const displayedName = nameDraft ?? template?.name ?? "";
  const displayedNotes = notesDraft ?? template?.notes ?? "";
  const routineOptions = useMemo(() => groups.map((g) => ({
    id: g.id,
    name: g.name
  })), [groups]);
  if (!template) return /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-center py-10", children: "Loading…" });
  async function saveName() {
    if (!template) return;
    const next = (nameDraft ?? template.name).trim();
    if (!next || next === template.name) {
      setNameDraft(null);
      return;
    }
    try {
      await updateTemplate(template.id, {
        name: next
      });
      setNameDraft(null);
      toast.success("Name saved", {
        description: "Workout updated."
      });
    } catch {
      toast.error("Could not save name");
    }
  }
  async function saveNotes() {
    if (!template) return;
    const raw = notesDraft ?? template.notes ?? "";
    const next = raw.trim() === "" ? null : raw.trim();
    if (next === (template.notes ?? null)) {
      setNotesDraft(null);
      return;
    }
    try {
      await updateTemplate(template.id, {
        notes: next
      });
      setNotesDraft(null);
      toast.success("Notes saved", {
        description: "Workout updated."
      });
    } catch {
      toast.error("Could not save notes");
    }
  }
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-xl space-y-8", children: [
    /* @__PURE__ */ jsxs(Link, { to: "/app/workouts", className: cn(buttonVariants({
      variant: "ghost",
      size: "sm"
    }), "min-h-11 -ml-2 inline-flex items-center gap-2"), children: [
      /* @__PURE__ */ jsx(ArrowLeft, { className: "size-4", "aria-hidden": true }),
      "Workouts"
    ] }),
    /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("h1", { className: "flex items-center gap-2.5 text-2xl font-semibold tracking-tight", children: [
      /* @__PURE__ */ jsx("span", { className: "bg-primary/15 text-primary ring-primary/15 inline-flex size-10 items-center justify-center rounded-2xl ring-1", children: /* @__PURE__ */ jsx(ListTree, { className: "size-5", strokeWidth: 2.25, "aria-hidden": true }) }),
      template.name
    ] }) }),
    /* @__PURE__ */ jsxs(Card, { className: "border-primary/15", children: [
      /* @__PURE__ */ jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Details" }) }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4 pt-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "template-name", children: "Name" }),
          /* @__PURE__ */ jsx(Input, { id: "template-name", value: displayedName, className: "min-h-12 text-base", onChange: (e) => setNameDraft(e.target.value), onBlur: saveName })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "border-border/60 space-y-2 border-t pt-4", children: [
          /* @__PURE__ */ jsx("p", { className: "text-foreground text-sm font-medium", children: "Routine" }),
          /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-sm", children: "Group this workout with others in a rotation, keep it unassigned, or add a new routine from the field below." }),
          /* @__PURE__ */ jsx(AssignWorkoutToRoutineSelect, { templateId: template.id, currentRoutineGroupId: template.routineGroupId ?? null, routineOptions })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(TemplateEditor, { templateId: template.id, items, exercises }),
    /* @__PURE__ */ jsxs(Card, { className: "border-primary/15", children: [
      /* @__PURE__ */ jsxs(CardHeader, { className: "pb-3", children: [
        /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Notes" }),
        /* @__PURE__ */ jsx(CardDescription, { children: "Reminders for this workout—form cues, warm-up flow, or equipment." })
      ] }),
      /* @__PURE__ */ jsx(CardContent, { className: "pt-0", children: /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "template-notes", className: "sr-only", children: "Notes" }),
        /* @__PURE__ */ jsx(Input, { id: "template-notes", value: displayedNotes, placeholder: "Warm-up tips, etc.", className: "min-h-12 text-base", onChange: (e) => setNotesDraft(e.target.value), onBlur: saveNotes })
      ] }) })
    ] })
  ] });
}
export {
  TemplatePage as component
};
