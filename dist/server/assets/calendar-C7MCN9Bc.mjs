import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { u as useScheduledItems, a as useScheduleMutations } from "./schedule-xiOFB6SS.mjs";
import { u as useWorkoutTemplates } from "./workouts-Csqdreu5.mjs";
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
function pad(n) {
  return n.toString().padStart(2, "0");
}
function dayKey(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function WorkoutCalendar() {
  const [anchor, setAnchor] = useState(() => /* @__PURE__ */ new Date());
  const {
    startKey,
    endKey,
    days
  } = useMemo(() => {
    const start = new Date(anchor);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 27);
    const days2 = [];
    const cur = new Date(start);
    while (cur <= end) {
      days2.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return {
      startKey: dayKey(start),
      endKey: dayKey(end),
      days: days2
    };
  }, [anchor]);
  const {
    data: items
  } = useScheduledItems(startKey, endKey);
  const {
    data: templates
  } = useWorkoutTemplates();
  const {
    scheduleTemplate,
    unschedule
  } = useScheduleMutations();
  const templateMap = useMemo(() => {
    const m = /* @__PURE__ */ new Map();
    for (const t of templates) m.set(t.id, t.name);
    return m;
  }, [templates]);
  const byDay = useMemo(() => {
    const m = /* @__PURE__ */ new Map();
    for (const it of items) {
      const arr = m.get(it.dayKey) ?? [];
      arr.push(it);
      m.set(it.dayKey, arr);
    }
    return m;
  }, [items]);
  const [pickerDay, setPickerDay] = useState(null);
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsx(Link, { to: "/app/workouts", className: "text-sm text-muted-foreground", children: "← Back to routines" }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("button", { onClick: () => {
          const d = new Date(anchor);
          d.setDate(d.getDate() - 28);
          setAnchor(d);
        }, className: "rounded-md border px-2 py-1 text-sm", children: "←" }),
        /* @__PURE__ */ jsxs("div", { className: "text-sm", children: [
          days[0].toLocaleDateString(),
          " – ",
          days[days.length - 1].toLocaleDateString()
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: () => {
          const d = new Date(anchor);
          d.setDate(d.getDate() + 28);
          setAnchor(d);
        }, className: "rounded-md border px-2 py-1 text-sm", children: "→" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-7 gap-1 text-xs text-muted-foreground", children: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => /* @__PURE__ */ jsx("div", { className: "text-center py-1", children: d }, d)) }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-7 gap-1", children: days.map((d) => {
      const key = dayKey(d);
      const scheduled = byDay.get(key) ?? [];
      const today = key === dayKey(/* @__PURE__ */ new Date());
      return /* @__PURE__ */ jsxs("button", { onClick: () => setPickerDay(key), className: "rounded-md border min-h-20 p-1 text-left text-xs hover:bg-muted " + (today ? "border-primary" : ""), children: [
        /* @__PURE__ */ jsx("div", { className: "font-medium", children: d.getDate() }),
        /* @__PURE__ */ jsx("div", { className: "space-y-0.5", children: scheduled.map((s) => /* @__PURE__ */ jsx("div", { className: "rounded bg-primary/10 px-1 py-0.5 truncate", children: templateMap.get(s.templateId) ?? "Workout" }, s.id)) })
      ] }, key);
    }) }),
    pickerDay ? /* @__PURE__ */ jsxs("div", { className: "rounded-xl border bg-card p-4 space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("h3", { className: "font-medium", children: pickerDay }),
        /* @__PURE__ */ jsx("button", { onClick: () => setPickerDay(null), className: "text-xs text-muted-foreground", children: "Close" })
      ] }),
      /* @__PURE__ */ jsx("ul", { className: "space-y-1", children: (byDay.get(pickerDay) ?? []).map((s) => /* @__PURE__ */ jsxs("li", { className: "flex items-center justify-between text-sm", children: [
        /* @__PURE__ */ jsx("span", { children: templateMap.get(s.templateId) ?? "Workout" }),
        /* @__PURE__ */ jsx("button", { onClick: () => unschedule(s.id), className: "text-xs text-destructive", children: "Remove" })
      ] }, s.id)) }),
      /* @__PURE__ */ jsxs("form", { onSubmit: (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const tid = fd.get("templateId");
        if (!tid) return;
        void scheduleTemplate(tid, pickerDay);
        e.currentTarget.reset();
      }, className: "flex gap-2", children: [
        /* @__PURE__ */ jsxs("select", { name: "templateId", className: "flex-1 rounded-md border bg-background px-3 py-2 text-sm", children: [
          /* @__PURE__ */ jsx("option", { value: "", children: "Schedule a workout…" }),
          templates.map((t) => /* @__PURE__ */ jsx("option", { value: t.id, children: t.name }, t.id))
        ] }),
        /* @__PURE__ */ jsx("button", { className: "rounded-md bg-secondary px-3 py-2 text-sm", children: "Add" })
      ] })
    ] }) : null
  ] });
}
export {
  WorkoutCalendar as component
};
