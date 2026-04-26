import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { u as useScheduledItems } from "./schedule-CDtsSZTH.mjs";
import { a as useWorkoutTemplates } from "./workouts-DSVvumuN.mjs";
import "./writes-C61wFNCm.mjs";
import "./router-CUOzYYmk.mjs";
import "dexie";
import "@capacitor/core";
import "drizzle-zod";
import "drizzle-orm";
import "drizzle-orm/sqlite-core";
import "next-themes";
import "sonner";
import "lucide-react";
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
import "dexie-react-hooks";
import "./ids-zMPBJmub.mjs";
function pad(n) {
  return n.toString().padStart(2, "0");
}
function dayKey(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function CalendarPage() {
  const [anchor, setAnchor] = useState(() => /* @__PURE__ */ new Date());
  const {
    startKey,
    endKey,
    days
  } = useMemo(() => {
    const start = new Date(anchor);
    start.setDate(1);
    start.setDate(start.getDate() - start.getDay());
    const days2 = [];
    const cur = new Date(start);
    for (let i = 0; i < 42; i++) {
      days2.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return {
      startKey: dayKey(days2[0]),
      endKey: dayKey(days2[days2.length - 1]),
      days: days2
    };
  }, [anchor]);
  const {
    data: items
  } = useScheduledItems(startKey, endKey);
  const {
    data: templates
  } = useWorkoutTemplates();
  const tmap = useMemo(() => new Map(templates.map((t) => [t.id, t.name])), [templates]);
  const byDay = useMemo(() => {
    const m = /* @__PURE__ */ new Map();
    for (const it of items) {
      const arr = m.get(it.dayKey) ?? [];
      arr.push(it);
      m.set(it.dayKey, arr);
    }
    return m;
  }, [items]);
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold", children: anchor.toLocaleDateString(void 0, {
        month: "long",
        year: "numeric"
      }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("button", { onClick: () => {
          const d = new Date(anchor);
          d.setMonth(d.getMonth() - 1);
          setAnchor(d);
        }, className: "rounded-md border px-2 py-1 text-sm", children: "←" }),
        /* @__PURE__ */ jsx("button", { onClick: () => setAnchor(/* @__PURE__ */ new Date()), className: "rounded-md border px-2 py-1 text-sm", children: "Today" }),
        /* @__PURE__ */ jsx("button", { onClick: () => {
          const d = new Date(anchor);
          d.setMonth(d.getMonth() + 1);
          setAnchor(d);
        }, className: "rounded-md border px-2 py-1 text-sm", children: "→" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-7 gap-1 text-xs text-muted-foreground", children: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => /* @__PURE__ */ jsx("div", { className: "text-center py-1", children: d }, d)) }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-7 gap-1", children: days.map((d) => {
      const key = dayKey(d);
      const scheduled = byDay.get(key) ?? [];
      const inMonth = d.getMonth() === anchor.getMonth();
      const today = key === dayKey(/* @__PURE__ */ new Date());
      return /* @__PURE__ */ jsxs("div", { className: "rounded-md border min-h-24 p-1 text-xs " + (inMonth ? "" : "opacity-40 ") + (today ? "border-primary" : ""), children: [
        /* @__PURE__ */ jsx("div", { className: "font-medium", children: d.getDate() }),
        /* @__PURE__ */ jsx("ul", { className: "space-y-0.5", children: scheduled.map((s) => /* @__PURE__ */ jsx("li", { className: "rounded bg-primary/10 px-1 py-0.5 truncate", children: tmap.get(s.templateId) ?? "Workout" }, s.id)) })
      ] }, key);
    }) }),
    /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
      "Schedule workouts from",
      " ",
      /* @__PURE__ */ jsx(Link, { to: "/app/workouts/calendar", className: "text-primary hover:underline", children: "the workouts calendar" }),
      "."
    ] })
  ] });
}
export {
  CalendarPage as component
};
