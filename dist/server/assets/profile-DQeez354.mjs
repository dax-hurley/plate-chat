import { jsxs, jsx } from "react/jsx-runtime";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useState, useEffect } from "react";
import { u as useLocalSession } from "./session-CyYyvQL9.mjs";
import { u as useDb, d as clearTokens } from "./router-kvjOiOR_.mjs";
import { a as useLiveOne } from "./hooks-Ccy1wbDZ.mjs";
import { u as updateLocal, i as insertLocal } from "./writes-CNff-rob.mjs";
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
function useProfile() {
  const { db } = useDb();
  const { userId } = useLocalSession();
  return useLiveOne(
    async () => {
      if (!db || !userId) return null;
      const row = await db.userProfiles.get(userId);
      return row && row.deletedAt === null ? row : null;
    },
    [db, userId]
  );
}
function useProfileMutations() {
  const { db, ready } = useDb();
  const { userId } = useLocalSession();
  const saveProfile = useCallback(
    async (patch) => {
      if (!ready || !db || !userId) throw new Error("Not ready");
      const existing = await db.userProfiles.get(userId);
      if (existing) {
        await updateLocal(db.userProfiles, userId, patch);
        return;
      }
      await insertLocal(db.userProfiles, {
        userId,
        heightIn: null,
        goalPreset: "custom",
        fitnessGoals: null,
        preferences: null,
        goalCalories: null,
        goalProteinG: null,
        goalCarbsG: null,
        goalFatG: null,
        ...patch
      });
    },
    [db, ready, userId]
  );
  return { saveProfile };
}
const PRESETS = [{
  value: "lose_weight",
  label: "Lose weight"
}, {
  value: "gain_muscle",
  label: "Gain muscle"
}, {
  value: "build_strength",
  label: "Build strength"
}, {
  value: "custom",
  label: "Custom"
}];
function ProfilePage() {
  const navigate = useNavigate();
  const {
    data: profile
  } = useProfile();
  const {
    saveProfile
  } = useProfileMutations();
  const [form, setForm] = useState({
    heightIn: "",
    goalPreset: "custom",
    fitnessGoals: "",
    preferences: "",
    goalCalories: "",
    goalProteinG: "",
    goalCarbsG: "",
    goalFatG: ""
  });
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (!profile || dirty) return;
    setForm({
      heightIn: profile.heightIn?.toString() ?? "",
      goalPreset: profile.goalPreset,
      fitnessGoals: profile.fitnessGoals ?? "",
      preferences: profile.preferences ?? "",
      goalCalories: profile.goalCalories?.toString() ?? "",
      goalProteinG: profile.goalProteinG?.toString() ?? "",
      goalCarbsG: profile.goalCarbsG?.toString() ?? "",
      goalFatG: profile.goalFatG?.toString() ?? ""
    });
  }, [profile, dirty]);
  const update = (k, v) => {
    setForm((f) => ({
      ...f,
      [k]: v
    }));
    setDirty(true);
  };
  return /* @__PURE__ */ jsxs("form", { onSubmit: async (e) => {
    e.preventDefault();
    const num = (v) => v.trim() === "" ? null : Number.isFinite(Number(v)) ? Number(v) : null;
    await saveProfile({
      heightIn: num(form.heightIn),
      goalPreset: form.goalPreset,
      fitnessGoals: form.fitnessGoals || null,
      preferences: form.preferences || null,
      goalCalories: num(form.goalCalories),
      goalProteinG: num(form.goalProteinG),
      goalCarbsG: num(form.goalCarbsG),
      goalFatG: num(form.goalFatG)
    });
    setDirty(false);
  }, className: "space-y-4 max-w-xl", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold", children: "Profile" }),
    /* @__PURE__ */ jsxs("label", { className: "block", children: [
      /* @__PURE__ */ jsx("span", { className: "text-sm", children: "Height (inches)" }),
      /* @__PURE__ */ jsx("input", { value: form.heightIn, onChange: (e) => update("heightIn", e.target.value), inputMode: "decimal", className: "mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" })
    ] }),
    /* @__PURE__ */ jsxs("label", { className: "block", children: [
      /* @__PURE__ */ jsx("span", { className: "text-sm", children: "Goal preset" }),
      /* @__PURE__ */ jsx("select", { value: form.goalPreset, onChange: (e) => update("goalPreset", e.target.value), className: "mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm", children: PRESETS.map((p) => /* @__PURE__ */ jsx("option", { value: p.value, children: p.label }, p.value)) })
    ] }),
    /* @__PURE__ */ jsxs("label", { className: "block", children: [
      /* @__PURE__ */ jsx("span", { className: "text-sm", children: "Fitness goals" }),
      /* @__PURE__ */ jsx("textarea", { value: form.fitnessGoals, onChange: (e) => update("fitnessGoals", e.target.value), rows: 3, className: "mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" })
    ] }),
    /* @__PURE__ */ jsxs("label", { className: "block", children: [
      /* @__PURE__ */ jsx("span", { className: "text-sm", children: "Preferences / allergies" }),
      /* @__PURE__ */ jsx("textarea", { value: form.preferences, onChange: (e) => update("preferences", e.target.value), rows: 2, className: "mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-4 gap-2", children: [
      /* @__PURE__ */ jsxs("label", { className: "block", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs", children: "kcal" }),
        /* @__PURE__ */ jsx("input", { value: form.goalCalories, onChange: (e) => update("goalCalories", e.target.value), inputMode: "numeric", className: "mt-1 w-full rounded-md border bg-background px-2 py-1 text-sm" })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "block", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs", children: "P (g)" }),
        /* @__PURE__ */ jsx("input", { value: form.goalProteinG, onChange: (e) => update("goalProteinG", e.target.value), inputMode: "decimal", className: "mt-1 w-full rounded-md border bg-background px-2 py-1 text-sm" })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "block", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs", children: "C (g)" }),
        /* @__PURE__ */ jsx("input", { value: form.goalCarbsG, onChange: (e) => update("goalCarbsG", e.target.value), inputMode: "decimal", className: "mt-1 w-full rounded-md border bg-background px-2 py-1 text-sm" })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "block", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs", children: "F (g)" }),
        /* @__PURE__ */ jsx("input", { value: form.goalFatG, onChange: (e) => update("goalFatG", e.target.value), inputMode: "decimal", className: "mt-1 w-full rounded-md border bg-background px-2 py-1 text-sm" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between pt-2", children: [
      /* @__PURE__ */ jsx("button", { className: "rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm", children: "Save" }),
      /* @__PURE__ */ jsx("button", { type: "button", onClick: async () => {
        await clearTokens();
        await navigate({
          to: "/login"
        });
      }, className: "text-sm text-destructive", children: "Sign out" })
    ] })
  ] });
}
export {
  ProfilePage as component
};
