import { jsxs, jsx } from "react/jsx-runtime";
import { useCallback, useState, useMemo } from "react";
import { u as useLocalSession } from "./session-CyYyvQL9.mjs";
import { u as useDb } from "./router-kvjOiOR_.mjs";
import { u as useLiveArray } from "./hooks-Ccy1wbDZ.mjs";
import { u as updateLocal, i as insertLocal, s as softDeleteLocal } from "./writes-CNff-rob.mjs";
import { n as newId, a as nowMs } from "./ids-zMPBJmub.mjs";
import "@tanstack/react-router";
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
import "dexie-react-hooks";
function useVitals(vitalKey) {
  const { db } = useDb();
  const { userId } = useLocalSession();
  return useLiveArray(
    async () => {
      if (!db || !userId || !vitalKey) return [];
      const rows = await db.userVitalEntries.where("[userId+vitalKey]").equals([userId, vitalKey]).toArray();
      return rows.filter((r) => r.deletedAt === null).sort((a, b) => a.dayKey.localeCompare(b.dayKey));
    },
    [db, userId, vitalKey]
  );
}
function useProgressMutations() {
  const { db, ready } = useDb();
  const { userId } = useLocalSession();
  const setVital = useCallback(
    async (vitalKey, dayKey, value) => {
      if (!ready || !db || !userId) throw new Error("Not ready");
      const matches = await db.userVitalEntries.where("[userId+vitalKey+dayKey]").equals([userId, vitalKey, dayKey]).toArray();
      const existing = matches[0];
      if (existing) {
        await updateLocal(db.userVitalEntries, existing.id, {
          value,
          recordedAt: nowMs(),
          deletedAt: null
        });
        return;
      }
      await insertLocal(db.userVitalEntries, {
        id: newId(),
        userId,
        vitalKey,
        dayKey,
        value,
        recordedAt: nowMs()
      });
    },
    [db, ready, userId]
  );
  const clearVital = useCallback(
    async (vitalKey, dayKey) => {
      if (!ready || !db || !userId) throw new Error("Not ready");
      const matches = await db.userVitalEntries.where("[userId+vitalKey+dayKey]").equals([userId, vitalKey, dayKey]).toArray();
      const existing = matches.find((r) => r.deletedAt === null);
      if (!existing) return;
      await softDeleteLocal(db.userVitalEntries, existing.id);
    },
    [db, ready, userId]
  );
  return { setVital, clearVital };
}
const VITALS = [{
  key: "weight",
  label: "Weight (lb)"
}, {
  key: "body_fat",
  label: "Body fat %"
}, {
  key: "waist",
  label: "Waist (in)"
}];
function pad(n) {
  return n.toString().padStart(2, "0");
}
function todayKey() {
  const d = /* @__PURE__ */ new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function ProgressPage() {
  const [vitalKey, setVitalKey] = useState("weight");
  const {
    data: entries
  } = useVitals(vitalKey);
  const {
    setVital,
    clearVital
  } = useProgressMutations();
  const [dayKey, setDayKey] = useState(todayKey);
  const [value, setValue] = useState("");
  const sorted = useMemo(() => [...entries].sort((a, b) => b.dayKey.localeCompare(a.dayKey)), [entries]);
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold", children: "Progress" }),
    /* @__PURE__ */ jsx("div", { className: "flex gap-2", children: VITALS.map((v) => /* @__PURE__ */ jsx("button", { onClick: () => setVitalKey(v.key), className: "rounded-md px-3 py-1.5 text-sm " + (vitalKey === v.key ? "bg-primary text-primary-foreground" : "border"), children: v.label }, v.key)) }),
    /* @__PURE__ */ jsxs("form", { onSubmit: async (e) => {
      e.preventDefault();
      const n = Number(value);
      if (!Number.isFinite(n)) return;
      await setVital(vitalKey, dayKey, n);
      setValue("");
    }, className: "rounded-xl border bg-card p-3 flex items-end gap-2", children: [
      /* @__PURE__ */ jsxs("label", { className: "flex-1", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: "Date" }),
        /* @__PURE__ */ jsx("input", { type: "date", value: dayKey, onChange: (e) => setDayKey(e.target.value), className: "mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "flex-1", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: "Value" }),
        /* @__PURE__ */ jsx("input", { value, onChange: (e) => setValue(e.target.value), inputMode: "decimal", className: "mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" })
      ] }),
      /* @__PURE__ */ jsx("button", { className: "rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm", children: "Save" })
    ] }),
    sorted.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "No entries yet." }) : /* @__PURE__ */ jsx("ul", { className: "space-y-1", children: sorted.map((e) => /* @__PURE__ */ jsxs("li", { className: "flex items-center justify-between rounded-md border bg-card px-3 py-2 text-sm", children: [
      /* @__PURE__ */ jsx("span", { children: e.dayKey }),
      /* @__PURE__ */ jsx("span", { className: "font-medium", children: e.value }),
      /* @__PURE__ */ jsx("button", { onClick: () => clearVital(vitalKey, e.dayKey), className: "text-xs text-destructive", children: "Remove" })
    ] }, e.id)) })
  ] });
}
export {
  ProgressPage as component
};
