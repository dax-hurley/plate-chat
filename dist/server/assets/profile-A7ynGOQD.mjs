import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useRef, useState, useEffect } from "react";
import { UserRound, Check, Loader2, CloudOff, TrendingDown, Dumbbell, Weight, PencilLine, Apple, Flame, Beef, Wheat, Droplets, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { C as Card, a as CardHeader, b as CardTitle, c as CardDescription, d as CardContent } from "./card-C4819yjg.mjs";
import { L as Label, I as Input } from "./label-BX01hlq_.mjs";
import { d as parseProfileSex, A as APP_BRAND_NAME, e as pullSyncCollections } from "./router-CUOzYYmk.mjs";
import "@capacitor/core";
import "dexie-react-hooks";
import "dexie";
import { u as useProfileMutations, a as useProfile } from "./profile-Wj5woFTV.mjs";
import { c as cn } from "./utils-H80jjgLf.mjs";
import { b as buttonVariants } from "./button-DbVXcFD_.mjs";
import { u as useOnline } from "./use-online-B1QDuTlA.mjs";
import "@base-ui/react/input";
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
import "./writes-C61wFNCm.mjs";
import "clsx";
import "tailwind-merge";
import "@base-ui/react/button";
import "class-variance-authority";
const DEBOUNCE_MS = 600;
const textareaClass = "border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 w-full min-h-[5.5rem] resize-y rounded-lg border px-2.5 py-2 text-base outline-none transition-colors focus-visible:ring-3 md:text-sm";
const GOAL_OPTIONS = [
  { id: "lose_weight", label: "Lose Weight", Icon: TrendingDown },
  { id: "gain_muscle", label: "Gain Muscle", Icon: Dumbbell },
  { id: "build_strength", label: "Build Strength", Icon: Weight },
  { id: "custom", label: "Custom", Icon: PencilLine }
];
function parseCaloriesField(raw) {
  const t = raw.trim();
  if (t === "") return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0 || n > 5e4) return null;
  return Math.round(n);
}
function parseGramGoalField(raw) {
  const t = raw.trim();
  if (t === "") return null;
  const n = Number(t.replace(",", "."));
  if (!Number.isFinite(n) || n < 0 || n > 1e3) return null;
  return Math.round(n * 10) / 10;
}
function fmtCaloriesInput(n) {
  return n != null && Number.isFinite(n) ? String(Math.round(n)) : "";
}
function fmtGramInput(n) {
  if (n == null || !Number.isFinite(n)) return "";
  const r = Math.round(n * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}
function parseAgeYearsField(raw) {
  const t = raw.trim();
  if (t === "") return null;
  const n = Math.round(Number(t));
  if (!Number.isFinite(n) || n < 1 || n > 120) return null;
  return n;
}
function snapshotFromFields(heightIn, ageYears, sex, activityLevel, goalPreset, fitnessGoals, preferences, goalCalories, goalProteinG, goalCarbsG, goalFatG) {
  let heightNum = null;
  const t = heightIn.trim();
  if (t !== "") {
    const n = Number(t);
    if (Number.isFinite(n) && n > 0) heightNum = n;
  }
  const s = sex.trim();
  const al = activityLevel.trim();
  return {
    heightIn: heightNum,
    ageYears: parseAgeYearsField(ageYears),
    sex: s === "" ? null : parseProfileSex(s),
    activityLevel: al === "" ? null : al === "sedentary" || al === "light" || al === "moderate" || al === "active" || al === "very_active" ? al : null,
    goalPreset,
    fitnessGoals: fitnessGoals.trim() === "" ? null : fitnessGoals.trim(),
    preferences: preferences.trim() === "" ? null : preferences.trim(),
    goalCalories: parseCaloriesField(goalCalories),
    goalProteinG: parseGramGoalField(goalProteinG),
    goalCarbsG: parseGramGoalField(goalCarbsG),
    goalFatG: parseGramGoalField(goalFatG)
  };
}
function snapshotFromProfile(p) {
  return {
    heightIn: p?.heightIn ?? null,
    ageYears: p?.ageYears ?? null,
    sex: p?.sex ?? null,
    activityLevel: p?.activityLevel ?? null,
    goalPreset: p?.goalPreset ?? "custom",
    fitnessGoals: p?.fitnessGoals ?? null,
    preferences: p?.preferences ?? null,
    goalCalories: p?.goalCalories ?? null,
    goalProteinG: p?.goalProteinG ?? null,
    goalCarbsG: p?.goalCarbsG ?? null,
    goalFatG: p?.goalFatG ?? null
  };
}
function applyDraftToState(d, setters) {
  setters.setHeightIn(
    d.heightIn != null && Number.isFinite(d.heightIn) ? String(d.heightIn) : ""
  );
  setters.setAgeYears(
    d.ageYears != null && Number.isFinite(d.ageYears) ? String(d.ageYears) : ""
  );
  setters.setSex(
    d.sex != null && parseProfileSex(d.sex) != null ? d.sex : ""
  );
  setters.setActivityLevel(
    d.activityLevel === "sedentary" || d.activityLevel === "light" || d.activityLevel === "moderate" || d.activityLevel === "active" || d.activityLevel === "very_active" ? d.activityLevel : ""
  );
  setters.setGoalPreset(d.goalPreset);
  setters.setFitnessGoals(d.fitnessGoals ?? "");
  setters.setPreferences(d.preferences ?? "");
  setters.setGoalCalories(fmtCaloriesInput(d.goalCalories));
  setters.setGoalProteinG(fmtGramInput(d.goalProteinG));
  setters.setGoalCarbsG(fmtGramInput(d.goalCarbsG));
  setters.setGoalFatG(fmtGramInput(d.goalFatG));
}
function UserProfileForm({
  initialProfile
}) {
  const { saveProfile } = useProfileMutations();
  const mounted = useRef(false);
  const baselineRef = useRef(JSON.stringify(snapshotFromProfile(initialProfile)));
  const lastRemoteKeyRef = useRef(null);
  const [heightIn, setHeightIn] = useState(
    initialProfile?.heightIn != null && Number.isFinite(initialProfile.heightIn) ? String(initialProfile.heightIn) : ""
  );
  const [ageYears, setAgeYears] = useState(
    initialProfile?.ageYears != null && Number.isFinite(initialProfile.ageYears) ? String(initialProfile.ageYears) : ""
  );
  const [sex, setSex] = useState(() => {
    const s = initialProfile?.sex;
    return s != null && parseProfileSex(s) != null ? s : "";
  });
  const [activityLevel, setActivityLevel] = useState(() => {
    const a = initialProfile?.activityLevel;
    return a === "sedentary" || a === "light" || a === "moderate" || a === "active" || a === "very_active" ? a : "";
  });
  const [goalPreset, setGoalPreset] = useState(
    initialProfile?.goalPreset ?? "custom"
  );
  const [fitnessGoals, setFitnessGoals] = useState(
    initialProfile?.fitnessGoals ?? ""
  );
  const [preferences, setPreferences] = useState(
    initialProfile?.preferences ?? ""
  );
  const [goalCalories, setGoalCalories] = useState(
    fmtCaloriesInput(initialProfile?.goalCalories)
  );
  const [goalProteinG, setGoalProteinG] = useState(
    fmtGramInput(initialProfile?.goalProteinG)
  );
  const [goalCarbsG, setGoalCarbsG] = useState(
    fmtGramInput(initialProfile?.goalCarbsG)
  );
  const [goalFatG, setGoalFatG] = useState(
    fmtGramInput(initialProfile?.goalFatG)
  );
  const [syncPhase, setSyncPhase] = useState("synced");
  useEffect(() => {
    if (initialProfile == null) {
      return;
    }
    const k = `${initialProfile.updatedAt}:${initialProfile.rev}`;
    if (lastRemoteKeyRef.current === k) {
      return;
    }
    lastRemoteKeyRef.current = k;
    const d = snapshotFromProfile(initialProfile);
    applyDraftToState(d, {
      setHeightIn,
      setAgeYears,
      setSex,
      setActivityLevel,
      setGoalPreset,
      setFitnessGoals,
      setPreferences,
      setGoalCalories,
      setGoalProteinG,
      setGoalCarbsG,
      setGoalFatG
    });
    baselineRef.current = JSON.stringify(d);
    setSyncPhase("synced");
  }, [initialProfile?.updatedAt, initialProfile?.rev]);
  useEffect(() => {
    if (syncPhase !== "saved") return;
    const t = window.setTimeout(() => setSyncPhase("synced"), 2800);
    return () => window.clearTimeout(t);
  }, [syncPhase]);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const draft = snapshotFromFields(
      heightIn,
      ageYears,
      sex,
      activityLevel,
      goalPreset,
      fitnessGoals,
      preferences,
      goalCalories,
      goalProteinG,
      goalCarbsG,
      goalFatG
    );
    const current = JSON.stringify(draft);
    if (current === baselineRef.current) {
      setSyncPhase((prev) => {
        if (prev === "saved" || prev === "saving") return prev;
        return "synced";
      });
      return;
    }
    setSyncPhase("pending");
    const t = window.setTimeout(async () => {
      setSyncPhase("saving");
      try {
        await saveProfile(draft);
        baselineRef.current = current;
        setSyncPhase("saved");
        toast.success("Profile saved", { duration: 2200 });
      } catch (e) {
        console.error(e);
        setSyncPhase("error");
        toast.error("Could not save profile");
      }
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [
    heightIn,
    ageYears,
    sex,
    activityLevel,
    goalPreset,
    fitnessGoals,
    preferences,
    goalCalories,
    goalProteinG,
    goalCarbsG,
    goalFatG,
    saveProfile
  ]);
  const goalsTextLabel = goalPreset === "custom" ? "Goals" : "Additional Goals";
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between", children: [
      /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground flex items-center gap-2 text-sm", children: [
        /* @__PURE__ */ jsx(UserRound, { className: "size-4 shrink-0", "aria-hidden": true }),
        `Update how ${APP_BRAND_NAME} and your coach know you. Changes save
          automatically.`
      ] }),
      /* @__PURE__ */ jsx(
        "div",
        {
          className: "flex shrink-0 flex-col items-stretch gap-1 sm:items-end",
          "aria-live": "polite",
          "aria-busy": syncPhase === "pending" || syncPhase === "saving",
          children: /* @__PURE__ */ jsx(
            "div",
            {
              className: cn(
                "inline-flex min-h-10 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium shadow-sm transition-colors",
                syncPhase === "synced" && "border-border bg-muted/50 text-muted-foreground",
                syncPhase === "pending" && "border-amber-500/35 bg-amber-500/10 text-amber-950 dark:text-amber-100",
                syncPhase === "saving" && "border-primary/40 bg-primary/10 text-foreground",
                syncPhase === "saved" && "border-emerald-500/40 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100",
                syncPhase === "error" && "border-destructive/40 bg-destructive/10 text-destructive"
              ),
              children: syncPhase === "synced" ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Check, { className: "size-4 opacity-60", "aria-hidden": true }),
                /* @__PURE__ */ jsx("span", { children: "All changes saved" })
              ] }) : syncPhase === "pending" ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(
                  Loader2,
                  {
                    className: "size-4 animate-spin text-amber-600 dark:text-amber-400",
                    "aria-hidden": true
                  }
                ),
                /* @__PURE__ */ jsx("span", { children: "Waiting to save…" })
              ] }) : syncPhase === "saving" ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(
                  Loader2,
                  {
                    className: "text-primary size-4 animate-spin",
                    "aria-hidden": true
                  }
                ),
                /* @__PURE__ */ jsx("span", { children: "Saving…" })
              ] }) : syncPhase === "saved" ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(
                  Check,
                  {
                    className: "size-4 text-emerald-600 dark:text-emerald-400",
                    "aria-hidden": true
                  }
                ),
                /* @__PURE__ */ jsx("span", { children: "Saved" })
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(CloudOff, { className: "size-4", "aria-hidden": true }),
                /* @__PURE__ */ jsx("span", { children: "Not saved — try again" })
              ] })
            }
          )
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-6 md:grid-cols-2", children: [
      /* @__PURE__ */ jsxs(Card, { className: "border-primary/15 md:col-span-2", children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "pb-2", children: [
          /* @__PURE__ */ jsx(CardTitle, { className: "text-lg", children: "Height" }),
          /* @__PURE__ */ jsx(CardDescription, { children: "Total inches (used for BMI with vitals weight)." })
        ] }),
        /* @__PURE__ */ jsxs(CardContent, { className: "pt-0", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "profile-height", className: "sr-only", children: "Height (in)" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "profile-height",
              type: "number",
              inputMode: "decimal",
              step: "any",
              className: "min-h-12 text-base max-w-xs",
              value: heightIn,
              onChange: (e) => setHeightIn(e.target.value),
              placeholder: "e.g. 70"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { className: "border-primary/15 md:col-span-2", children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "pb-2", children: [
          /* @__PURE__ */ jsx(CardTitle, { className: "text-lg", children: "Demographics" }),
          /* @__PURE__ */ jsx(CardDescription, { children: "Optional context for your coach and plans. Syncs with your account." })
        ] }),
        /* @__PURE__ */ jsxs(CardContent, { className: "grid gap-4 pt-0 sm:grid-cols-2", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "profile-age", children: "Age (years)" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                id: "profile-age",
                type: "number",
                min: 1,
                max: 120,
                className: "mt-1.5 min-h-12 text-base",
                inputMode: "numeric",
                value: ageYears,
                onChange: (e) => setAgeYears(e.target.value),
                placeholder: "e.g. 32"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "profile-sex", children: "Sex" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                id: "profile-sex",
                className: "border-input bg-background focus-visible:ring-ring/50 dark:bg-input/30 mt-1.5 flex min-h-12 w-full rounded-md border px-2.5 text-base shadow-xs outline-none focus-visible:ring-2",
                value: sex,
                onChange: (e) => setSex(e.target.value),
                children: [
                  /* @__PURE__ */ jsx("option", { value: "", children: "Not set" }),
                  /* @__PURE__ */ jsx("option", { value: "male", children: "Man" }),
                  /* @__PURE__ */ jsx("option", { value: "female", children: "Woman" }),
                  /* @__PURE__ */ jsx("option", { value: "transgender_man", children: "Transgender man" }),
                  /* @__PURE__ */ jsx("option", { value: "transgender_woman", children: "Transgender woman" }),
                  /* @__PURE__ */ jsx("option", { value: "nonbinary", children: "Nonbinary" }),
                  /* @__PURE__ */ jsx("option", { value: "other", children: "Other" }),
                  /* @__PURE__ */ jsx("option", { value: "prefer_not_to_say", children: "I'd prefer not to say" })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "sm:col-span-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "profile-activity", children: "Usual activity level" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                id: "profile-activity",
                className: "border-input bg-background focus-visible:ring-ring/50 dark:bg-input/30 mt-1.5 flex min-h-12 w-full rounded-md border px-2.5 text-base shadow-xs outline-none focus-visible:ring-2",
                value: activityLevel,
                onChange: (e) => setActivityLevel(e.target.value),
                children: [
                  /* @__PURE__ */ jsx("option", { value: "", children: "Not set" }),
                  /* @__PURE__ */ jsx("option", { value: "sedentary", children: "Sedentary" }),
                  /* @__PURE__ */ jsx("option", { value: "light", children: "Light" }),
                  /* @__PURE__ */ jsx("option", { value: "moderate", children: "Moderate" }),
                  /* @__PURE__ */ jsx("option", { value: "active", children: "Active" }),
                  /* @__PURE__ */ jsx("option", { value: "very_active", children: "Very active" })
                ]
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { className: "border-primary/15 md:col-span-2", children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "pb-2", children: [
          /* @__PURE__ */ jsx(CardTitle, { className: "text-lg", children: "Goals" }),
          /* @__PURE__ */ jsx(CardDescription, { children: "Choose a primary goal. Add details below — for a preset, they supplement that choice; for Custom, they are your full goals." })
        ] }),
        /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4 pt-0", children: [
          /* @__PURE__ */ jsx(
            "div",
            {
              className: "border-border grid w-full grid-cols-2 gap-1 rounded-xl border bg-muted/40 p-1 sm:grid-cols-4",
              role: "tablist",
              "aria-label": "Primary fitness goal",
              children: GOAL_OPTIONS.map(({ id, label, Icon }) => {
                const selected = goalPreset === id;
                return /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    role: "radio",
                    "aria-checked": selected,
                    className: cn(
                      "inline-flex min-h-10 flex-1 items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors touch-manipulation",
                      "flex-col gap-1.5 py-2.5 text-center text-xs leading-tight sm:flex-row sm:gap-2 sm:px-3 sm:text-sm",
                      selected ? "bg-primary text-primary-foreground shadow-sm ring-1 ring-inset ring-primary-foreground/20" : "text-muted-foreground hover:bg-background/80 hover:text-foreground dark:hover:bg-background/40"
                    ),
                    onClick: () => setGoalPreset(id),
                    children: [
                      /* @__PURE__ */ jsx(Icon, { className: "size-5 shrink-0 sm:size-4", "aria-hidden": true }),
                      label
                    ]
                  },
                  id
                );
              })
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "profile-goals", children: goalsTextLabel }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                id: "profile-goals",
                className: textareaClass,
                value: fitnessGoals,
                onChange: (e) => setFitnessGoals(e.target.value),
                placeholder: goalPreset === "custom" ? "Describe your fitness goals…" : "Optional: nuance, timeline, or focus areas…",
                rows: 4
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { className: "border-primary/15 md:col-span-2", children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "pb-2", children: [
          /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2 text-lg", children: [
            /* @__PURE__ */ jsx(Apple, { className: "text-primary size-5 shrink-0", "aria-hidden": true }),
            "Daily macro goals"
          ] }),
          /* @__PURE__ */ jsx(CardDescription, { children: "Optional targets for calories and macros (grams). Compare with your nutrition log day totals." })
        ] }),
        /* @__PURE__ */ jsx(CardContent, { className: "pt-0", children: /* @__PURE__ */ jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "from-chart-2/12 border-chart-2/25 space-y-2 rounded-xl border bg-gradient-to-br to-transparent p-3", children: [
            /* @__PURE__ */ jsxs(
              Label,
              {
                htmlFor: "profile-goal-calories",
                className: "text-muted-foreground gap-1.5 text-xs",
                children: [
                  /* @__PURE__ */ jsx(Flame, { className: "text-chart-2 size-3.5 shrink-0", "aria-hidden": true }),
                  "Calories (kcal)"
                ]
              }
            ),
            /* @__PURE__ */ jsx(
              Input,
              {
                id: "profile-goal-calories",
                type: "number",
                inputMode: "numeric",
                min: 0,
                max: 5e4,
                step: 1,
                className: "min-h-12 text-base tabular-nums",
                value: goalCalories,
                onChange: (e) => setGoalCalories(e.target.value),
                placeholder: "e.g. 2000"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "from-chart-1/15 border-chart-1/25 space-y-2 rounded-xl border bg-gradient-to-br to-transparent p-3", children: [
            /* @__PURE__ */ jsxs(
              Label,
              {
                htmlFor: "profile-goal-protein",
                className: "text-muted-foreground gap-1.5 text-xs",
                children: [
                  /* @__PURE__ */ jsx(Beef, { className: "text-chart-1 size-3.5 shrink-0", "aria-hidden": true }),
                  "Protein (g)"
                ]
              }
            ),
            /* @__PURE__ */ jsx(
              Input,
              {
                id: "profile-goal-protein",
                type: "number",
                inputMode: "decimal",
                min: 0,
                max: 1e3,
                step: "any",
                className: "min-h-12 text-base tabular-nums",
                value: goalProteinG,
                onChange: (e) => setGoalProteinG(e.target.value),
                placeholder: "e.g. 150"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "from-chart-4/15 border-chart-4/25 space-y-2 rounded-xl border bg-gradient-to-br to-transparent p-3", children: [
            /* @__PURE__ */ jsxs(
              Label,
              {
                htmlFor: "profile-goal-carbs",
                className: "text-muted-foreground gap-1.5 text-xs",
                children: [
                  /* @__PURE__ */ jsx(Wheat, { className: "text-chart-4 size-3.5 shrink-0", "aria-hidden": true }),
                  "Carbs (g)"
                ]
              }
            ),
            /* @__PURE__ */ jsx(
              Input,
              {
                id: "profile-goal-carbs",
                type: "number",
                inputMode: "decimal",
                min: 0,
                max: 1e3,
                step: "any",
                className: "min-h-12 text-base tabular-nums",
                value: goalCarbsG,
                onChange: (e) => setGoalCarbsG(e.target.value),
                placeholder: "e.g. 200"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "from-chart-3/15 border-chart-3/25 space-y-2 rounded-xl border bg-gradient-to-br to-transparent p-3", children: [
            /* @__PURE__ */ jsxs(
              Label,
              {
                htmlFor: "profile-goal-fat",
                className: "text-muted-foreground gap-1.5 text-xs",
                children: [
                  /* @__PURE__ */ jsx(Droplets, { className: "text-chart-3 size-3.5 shrink-0", "aria-hidden": true }),
                  "Fat (g)"
                ]
              }
            ),
            /* @__PURE__ */ jsx(
              Input,
              {
                id: "profile-goal-fat",
                type: "number",
                inputMode: "decimal",
                min: 0,
                max: 1e3,
                step: "any",
                className: "min-h-12 text-base tabular-nums",
                value: goalFatG,
                onChange: (e) => setGoalFatG(e.target.value),
                placeholder: "e.g. 65"
              }
            )
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs(Card, { className: "border-primary/15 md:col-span-2", children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "pb-2", children: [
          /* @__PURE__ */ jsx(CardTitle, { className: "text-lg", children: "Preferences" }),
          /* @__PURE__ */ jsx(CardDescription, { children: "Food preferences, available equipment, schedule, and similar." })
        ] }),
        /* @__PURE__ */ jsxs(CardContent, { className: "pt-0", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "profile-preferences", className: "sr-only", children: "Preferences" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              id: "profile-preferences",
              className: textareaClass,
              value: preferences,
              onChange: (e) => setPreferences(e.target.value),
              placeholder: "e.g. high-protein meals; barbell and cables at home...",
              rows: 4
            }
          )
        ] })
      ] })
    ] })
  ] });
}
function ProfilePage() {
  const online = useOnline();
  const {
    data: profile
  } = useProfile();
  useEffect(() => {
    if (!online) return;
    void pullSyncCollections(["userProfiles"]);
  }, [online]);
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto w-full max-w-xl space-y-8 lg:max-w-5xl", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("h1", { className: "flex items-center gap-2.5 text-2xl font-semibold tracking-tight", children: [
        /* @__PURE__ */ jsx("span", { className: "bg-primary/15 text-primary ring-primary/15 inline-flex size-10 items-center justify-center rounded-2xl ring-1", children: /* @__PURE__ */ jsx(UserRound, { className: "size-5", strokeWidth: 2.25, "aria-hidden": true }) }),
        "Profile"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mt-2 text-sm", children: "Personal info, fitness goals, and preferences." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-muted/30 border-border flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: "Setup walkthrough" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-sm", children: "Re-run the guided meal plan and workout intro any time." })
      ] }),
      /* @__PURE__ */ jsxs(Link, { to: "/app/onboarding", className: cn(buttonVariants({
        variant: "secondary"
      }), "inline-flex min-h-12 shrink-0 touch-manipulation items-center justify-center gap-2"), children: [
        /* @__PURE__ */ jsx(Sparkles, { className: "size-4" }),
        "Open onboarding"
      ] })
    ] }),
    /* @__PURE__ */ jsx(UserProfileForm, { initialProfile: profile })
  ] });
}
export {
  ProfilePage as component
};
