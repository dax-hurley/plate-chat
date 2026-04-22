import { jsx, jsxs } from "react/jsx-runtime";
import { useNavigate, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { g as useSession, e as useTemplateItems, h as useSessionSets, f as useExercises, c as useWorkoutMutations } from "./workouts-Csqdreu5.mjs";
import { c as Route } from "./router-kvjOiOR_.mjs";
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
function SessionPage() {
  const {
    sessionId
  } = Route.useParams();
  const navigate = useNavigate();
  const {
    data: session
  } = useSession(sessionId);
  const {
    data: plan
  } = useTemplateItems(session?.templateId ?? null);
  const {
    data: sets
  } = useSessionSets(sessionId);
  const {
    data: exercises
  } = useExercises();
  const {
    logSet,
    deleteSet,
    finishSession
  } = useWorkoutMutations();
  const exerciseMap = useMemo(() => {
    const m = /* @__PURE__ */ new Map();
    for (const e of exercises) m.set(e.id, {
      id: e.id,
      name: e.name
    });
    return m;
  }, [exercises]);
  const setsByExercise = useMemo(() => {
    const m = /* @__PURE__ */ new Map();
    for (const s of sets) {
      const arr = m.get(s.exerciseId) ?? [];
      arr.push(s);
      m.set(s.exerciseId, arr);
    }
    return m;
  }, [sets]);
  if (!session) return /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Loading…" });
  const exerciseOrder = plan.length > 0 ? plan.map((p) => p.exerciseId) : Array.from(setsByExercise.keys());
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsx(Link, { to: "/app/workouts", className: "text-sm text-muted-foreground", children: "← Back" }),
      session.status === "active" ? /* @__PURE__ */ jsx("button", { onClick: async () => {
        await finishSession(session.id);
        await navigate({
          to: "/app/workouts"
        });
      }, className: "rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm", children: "Finish workout" }) : /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground capitalize", children: session.status })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Started" }),
      /* @__PURE__ */ jsx("div", { className: "font-medium", children: new Date(session.startedAt).toLocaleString() })
    ] }),
    exerciseOrder.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "No exercises yet. Use the form below to log sets." }) : /* @__PURE__ */ jsx("div", { className: "space-y-4", children: exerciseOrder.map((exId) => {
      const ex = exerciseMap.get(exId);
      const planItem = plan.find((p) => p.exerciseId === exId);
      const exSets = setsByExercise.get(exId) ?? [];
      return /* @__PURE__ */ jsx(ExerciseBlock, { name: ex?.name ?? "Exercise", exerciseId: exId, target: planItem?.targetSets ?? null, sets: exSets, disabled: session.status !== "active", onLog: async (reps, weight) => {
        await logSet({
          sessionId: session.id,
          exerciseId: exId,
          setIndex: exSets.length,
          reps,
          durationSec: null,
          distance: null,
          weight,
          rpe: null
        });
      }, onDelete: (sid) => deleteSet(sid) }, exId);
    }) })
  ] });
}
function ExerciseBlock({
  name,
  target,
  sets,
  onLog,
  onDelete,
  disabled
}) {
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  return /* @__PURE__ */ jsxs("section", { className: "rounded-xl border bg-card p-3 space-y-2", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsx("h3", { className: "font-medium", children: name }),
      target ? /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
        sets.length,
        " / ",
        target,
        " sets"
      ] }) : /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
        sets.length,
        " sets"
      ] })
    ] }),
    sets.length > 0 ? /* @__PURE__ */ jsx("ul", { className: "space-y-1", children: sets.map((s, i) => /* @__PURE__ */ jsxs("li", { className: "flex items-center justify-between text-sm", children: [
      /* @__PURE__ */ jsxs("span", { children: [
        "Set ",
        i + 1,
        ": ",
        s.reps ?? "–",
        " reps @ ",
        s.weight
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: () => onDelete(s.id), disabled, className: "text-xs text-destructive disabled:opacity-60", children: "Remove" })
    ] }, s.id)) }) : null,
    disabled ? null : /* @__PURE__ */ jsxs("form", { onSubmit: async (e) => {
      e.preventDefault();
      const r = Number(reps);
      const w = Number(weight);
      if (!Number.isFinite(r) || !Number.isFinite(w)) return;
      await onLog(r, w);
      setReps("");
      setWeight("");
    }, className: "flex gap-2 pt-2", children: [
      /* @__PURE__ */ jsx("input", { value: reps, onChange: (e) => setReps(e.target.value), inputMode: "numeric", placeholder: "Reps", className: "w-24 rounded-md border bg-background px-2 py-1 text-sm" }),
      /* @__PURE__ */ jsx("input", { value: weight, onChange: (e) => setWeight(e.target.value), inputMode: "decimal", placeholder: "Weight", className: "w-24 rounded-md border bg-background px-2 py-1 text-sm" }),
      /* @__PURE__ */ jsx("button", { className: "rounded-md bg-primary text-primary-foreground px-3 py-1 text-sm", children: "Log" })
    ] })
  ] });
}
export {
  SessionPage as component
};
