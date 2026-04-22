import { jsx, jsxs } from "react/jsx-runtime";
import { useNavigate, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { d as useWorkoutTemplate, e as useTemplateItems, f as useExercises, c as useWorkoutMutations } from "./workouts-Csqdreu5.mjs";
import { R as Route } from "./router-kvjOiOR_.mjs";
import "./session-CyYyvQL9.mjs";
import "./hooks-Ccy1wbDZ.mjs";
import "dexie-react-hooks";
import "./writes-CNff-rob.mjs";
import "./ids-zMPBJmub.mjs";
import "dexie";
import "@capacitor/core";
import "drizzle-zod";
import "drizzle-orm";
import "drizzle-orm/sqlite-core";
import "jose";
import "@libsql/client";
import "drizzle-orm/libsql";
import "@ai-sdk/anthropic";
import "ai";
import "zod";
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
function TemplatePage() {
  const {
    id
  } = Route.useParams();
  const navigate = useNavigate();
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
    updateTemplate,
    addTemplateItem,
    updateTemplateItem,
    deleteTemplateItem,
    startSession
  } = useWorkoutMutations();
  const [name, setName] = useState(null);
  const [notes, setNotes] = useState(null);
  const displayedName = name ?? template?.name ?? "";
  const displayedNotes = notes ?? template?.notes ?? "";
  const exerciseMap = useMemo(() => {
    const m = /* @__PURE__ */ new Map();
    for (const e of exercises) m.set(e.id, e.name);
    return m;
  }, [exercises]);
  if (!template) return /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Loading…" });
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsx(Link, { to: "/app/workouts", className: "text-sm text-muted-foreground", children: "← Back" }),
      /* @__PURE__ */ jsx("button", { onClick: async () => {
        const sid = await startSession(id);
        await navigate({
          to: "/app/workouts/session/$sessionId",
          params: {
            sessionId: sid
          }
        });
      }, className: "rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm", children: "Start workout" })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx("input", { className: "w-full text-2xl font-semibold bg-transparent border-b py-1", value: displayedName, onChange: (e) => setName(e.target.value), onBlur: () => {
        if (name !== null && name !== template.name) {
          void updateTemplate(id, {
            name
          });
        }
      } }),
      /* @__PURE__ */ jsx("textarea", { className: "w-full rounded-md border bg-background px-3 py-2 text-sm", placeholder: "Notes", value: displayedNotes, onChange: (e) => setNotes(e.target.value), onBlur: () => {
        if (notes !== null && notes !== (template.notes ?? "")) {
          void updateTemplate(id, {
            notes: notes || null
          });
        }
      } })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-sm font-medium text-muted-foreground", children: "Exercises" }),
      items.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "No exercises yet." }) : /* @__PURE__ */ jsx("ul", { className: "space-y-2", children: items.map((it, idx) => /* @__PURE__ */ jsxs("li", { className: "rounded-xl border bg-card p-3 flex items-center gap-3", children: [
        /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground w-6", children: [
          idx + 1,
          "."
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsx("div", { className: "font-medium truncate", children: exerciseMap.get(it.exerciseId) ?? "Exercise" }),
          /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
            it.targetSets,
            " sets",
            it.targetReps ? ` × ${it.targetReps} reps` : "",
            it.defaultWeight ? ` @ ${it.defaultWeight}${it.weightUnit ?? ""}` : ""
          ] })
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: () => {
          const next = prompt("Target sets", String(it.targetSets));
          if (!next) return;
          const n = Number(next);
          if (!Number.isFinite(n) || n < 1) return;
          void updateTemplateItem(it.id, {
            targetSets: n
          });
        }, className: "rounded-md border px-2 py-1 text-xs", children: "Edit" }),
        /* @__PURE__ */ jsx("button", { onClick: () => {
          if (confirm("Remove exercise?")) void deleteTemplateItem(it.id);
        }, className: "rounded-md border px-2 py-1 text-xs text-destructive", children: "×" })
      ] }, it.id)) }),
      /* @__PURE__ */ jsx(AddExerciseForm, { onAdd: async (exerciseId) => {
        const order = items.length;
        await addTemplateItem({
          templateId: id,
          exerciseId,
          order,
          targetSets: 3,
          targetReps: 8,
          targetDurationSec: null,
          targetDistance: null,
          defaultWeight: null,
          weightUnit: "lb",
          progressiveOverloadEnabled: false,
          progressiveOverloadIncrement: null,
          progressiveOverloadRequireFullCompletion: false,
          trackWeight: true,
          logTimeForDistanceSets: false
        });
      }, exercises })
    ] })
  ] });
}
function AddExerciseForm({
  onAdd,
  exercises
}) {
  const [selected, setSelected] = useState("");
  return /* @__PURE__ */ jsxs("form", { onSubmit: async (e) => {
    e.preventDefault();
    if (!selected) return;
    await onAdd(selected);
    setSelected("");
  }, className: "flex gap-2", children: [
    /* @__PURE__ */ jsxs("select", { value: selected, onChange: (e) => setSelected(e.target.value), className: "flex-1 rounded-md border bg-background px-3 py-2", children: [
      /* @__PURE__ */ jsx("option", { value: "", children: "Add exercise…" }),
      exercises.map((e) => /* @__PURE__ */ jsx("option", { value: e.id, children: e.name }, e.id))
    ] }),
    /* @__PURE__ */ jsx("button", { type: "submit", disabled: !selected, className: "rounded-md bg-secondary px-3 py-2 text-sm disabled:opacity-60", children: "Add" })
  ] });
}
export {
  TemplatePage as component
};
