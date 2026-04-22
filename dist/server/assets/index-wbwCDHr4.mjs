import { jsx, jsxs } from "react/jsx-runtime";
import { useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { u as useWorkoutTemplates, a as useRoutineGroups, b as useActiveSession, c as useWorkoutMutations } from "./workouts-Csqdreu5.mjs";
import "./session-CyYyvQL9.mjs";
import "./router-kvjOiOR_.mjs";
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
import "./hooks-Ccy1wbDZ.mjs";
import "dexie-react-hooks";
import "./writes-CNff-rob.mjs";
import "./ids-zMPBJmub.mjs";
function WorkoutsIndex() {
  const navigate = useNavigate();
  const {
    data: templates,
    loading
  } = useWorkoutTemplates();
  const {
    data: groups
  } = useRoutineGroups();
  const {
    data: active
  } = useActiveSession();
  const {
    createRoutineGroup,
    createTemplate,
    startSession,
    deleteTemplate
  } = useWorkoutMutations();
  const [groupName, setGroupName] = useState("");
  const [newName, setNewName] = useState("");
  if (loading) return /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Loading…" });
  const grouped = /* @__PURE__ */ new Map();
  for (const t of templates) {
    const key = t.routineGroupId ?? null;
    const arr = grouped.get(key) ?? [];
    arr.push(t);
    grouped.set(key, arr);
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    active ? /* @__PURE__ */ jsxs("div", { className: "rounded-xl border bg-primary/5 p-4 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Workout in progress" }),
        /* @__PURE__ */ jsx("div", { className: "font-medium", children: "Resume to continue logging sets." })
      ] }),
      /* @__PURE__ */ jsx(Link, { to: "/app/workouts/session/$sessionId", params: {
        sessionId: active.id
      }, className: "rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm", children: "Resume" })
    ] }) : null,
    /* @__PURE__ */ jsxs("section", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-sm font-medium text-muted-foreground", children: "New routine" }),
      /* @__PURE__ */ jsxs("form", { onSubmit: async (e) => {
        e.preventDefault();
        if (!groupName.trim()) return;
        await createRoutineGroup(groupName.trim());
        setGroupName("");
      }, className: "flex gap-2", children: [
        /* @__PURE__ */ jsx("input", { value: groupName, onChange: (e) => setGroupName(e.target.value), placeholder: "Routine name (e.g. Push/Pull/Legs)", className: "flex-1 rounded-md border bg-background px-3 py-2" }),
        /* @__PURE__ */ jsx("button", { className: "rounded-md bg-secondary px-3 py-2 text-sm", children: "Add" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-sm font-medium text-muted-foreground", children: "New workout" }),
      /* @__PURE__ */ jsxs("form", { onSubmit: async (e) => {
        e.preventDefault();
        if (!newName.trim()) return;
        const id = await createTemplate({
          name: newName.trim(),
          notes: null,
          routineGroupId: null,
          routineOrder: null
        });
        setNewName("");
        await navigate({
          to: "/app/workouts/$id",
          params: {
            id
          }
        });
      }, className: "flex gap-2", children: [
        /* @__PURE__ */ jsx("input", { value: newName, onChange: (e) => setNewName(e.target.value), placeholder: "Workout name (e.g. Push Day)", className: "flex-1 rounded-md border bg-background px-3 py-2" }),
        /* @__PURE__ */ jsx("button", { className: "rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm", children: "Create" })
      ] })
    ] }),
    groups.length > 0 ? /* @__PURE__ */ jsx("div", { className: "space-y-6", children: groups.map((g) => /* @__PURE__ */ jsxs("section", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx("h3", { className: "font-medium", children: g.name }),
      /* @__PURE__ */ jsx(TemplateList, { items: grouped.get(g.id) ?? [], onDelete: deleteTemplate, onStart: async (tid) => {
        const sid = await startSession(tid);
        await navigate({
          to: "/app/workouts/session/$sessionId",
          params: {
            sessionId: sid
          }
        });
      } })
    ] }, g.id)) }) : null,
    /* @__PURE__ */ jsxs("section", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx("h3", { className: "font-medium", children: "Unassigned" }),
      /* @__PURE__ */ jsx(TemplateList, { items: grouped.get(null) ?? [], onDelete: deleteTemplate, onStart: async (tid) => {
        const sid = await startSession(tid);
        await navigate({
          to: "/app/workouts/session/$sessionId",
          params: {
            sessionId: sid
          }
        });
      } })
    ] })
  ] });
}
function TemplateList({
  items,
  onDelete,
  onStart
}) {
  if (items.length === 0) {
    return /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "No workouts yet." });
  }
  return /* @__PURE__ */ jsx("ul", { className: "space-y-2", children: items.map((t) => /* @__PURE__ */ jsxs("li", { className: "rounded-xl border bg-card p-3 flex items-center justify-between gap-2", children: [
    /* @__PURE__ */ jsxs(Link, { to: "/app/workouts/$id", params: {
      id: t.id
    }, className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ jsx("div", { className: "font-medium truncate", children: t.name }),
      t.notes ? /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground truncate", children: t.notes }) : null
    ] }),
    /* @__PURE__ */ jsx("button", { onClick: () => onStart(t.id), className: "rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm", children: "Start" }),
    /* @__PURE__ */ jsx("button", { onClick: () => {
      if (confirm(`Delete ${t.name}?`)) void onDelete(t.id);
    }, className: "rounded-md border px-3 py-1.5 text-sm text-destructive", children: "×" })
  ] }, t.id)) });
}
export {
  WorkoutsIndex as component
};
