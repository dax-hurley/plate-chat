import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isTextUIPart, isToolUIPart, getToolName } from "ai";
import { ArrowRight, Check, TrendingDown, Dumbbell, Weight, PencilLine, Loader2, ChevronLeft, Sparkles, RotateCcw, ArrowUp, PanelTop, ChevronUp } from "lucide-react";
import { useMemo, useState, useLayoutEffect, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { A as AssistantMarkdown } from "./assistant-markdown-BkDNTUMc.mjs";
import { l as lastAssistantMessageId, A as AssistantMessageParts } from "./assistant-message-parts-Cx-nfSv6.mjs";
import { d as buildMealPlanBoardView, M as MealPlanBoard } from "./meal-plan-board-view-C8LpyvEs.mjs";
import { B as Button } from "./button-DbVXcFD_.mjs";
import { C as ConfirmDialog } from "./confirm-dialog-L0Y1JjA8.mjs";
import { C as Card, d as CardContent, a as CardHeader, b as CardTitle, c as CardDescription } from "./card-C4819yjg.mjs";
import { L as Label, I as Input } from "./label-BX01hlq_.mjs";
import { P as PROFILE_SEX_VALUES, o as isGoalPreset, j as mondayOfWeekContaining, f as formatDayKey, M as MEAL_PLAN_REFINEMENT_USER_PROMPT, g as authFetch, t as triggerSync, q as buildOnboardingUserMessage, r as onboardingCacheKey, A as APP_BRAND_NAME, u as useDb, O as ONBOARDING_MEAL_REFINEMENT_COMPLETE_TOOL } from "./router-CUOzYYmk.mjs";
import { u as useOnline } from "./use-online-B1QDuTlA.mjs";
import { S as Sheet, a as SheetContent, b as SheetHeader, c as SheetTitle, d as SheetDescription } from "./sheet-VTzMxY9v.mjs";
import "@capacitor/core";
import "dexie-react-hooks";
import { a as useMealLibrary, b as useMealLibraryIngredientsForItems } from "./nutrition-BIi3XxN5.mjs";
import { u as useMealPlanMutations, a as usePlanForWeek, b as usePlanSlots } from "./meal-plan-BFJYrRc9.mjs";
import "dexie";
import { c as cn } from "./utils-H80jjgLf.mjs";
import { a as useLocalSession } from "./writes-C61wFNCm.mjs";
import "react-markdown";
import "remark-gfm";
import "@radix-ui/react-accordion";
import "./meal-library-json-CDywx7OK.mjs";
import "./dialog-OkPnLnLD.mjs";
import "@base-ui/react/dialog";
import "./autocomplete-combobox-Bz_SOWqH.mjs";
import "react-dom";
import "@base-ui/react/button";
import "class-variance-authority";
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
import "./ids-zMPBJmub.mjs";
import "clsx";
import "tailwind-merge";
const MEAL_ONBOARDING_CHIPS = [
  { id: "high_protein", label: "High protein", emoji: "🥩" },
  { id: "vegetarian", label: "Vegetarian", emoji: "🥗" },
  { id: "budget", label: "Budget-friendly", emoji: "💵" },
  { id: "quick_meals", label: "Quick to cook", emoji: "⏱️" },
  { id: "batch_prep", label: "Meal prep", emoji: "🍱" },
  { id: "low_carb", label: "Lower carb", emoji: "🥑" },
  { id: "family", label: "Family-friendly", emoji: "👨‍👩‍👧" },
  { id: "variety", label: "Lots of variety", emoji: "🌈" }
];
const WORKOUT_ONBOARDING_CHIPS = [
  { id: "full_body", label: "Full body", emoji: "🧍" },
  { id: "upper", label: "Upper body", emoji: "💪" },
  { id: "lower", label: "Legs & glutes", emoji: "🦵" },
  { id: "push", label: "Push", emoji: "⬆️" },
  { id: "pull", label: "Pull", emoji: "🔙" },
  { id: "cardio", label: "Cardio / conditioning", emoji: "❤️" },
  { id: "home", label: "Home / minimal equipment", emoji: "🏠" },
  { id: "gym", label: "Gym machines & free weights", emoji: "🏋️" }
];
const PROFILE_STEPS = [
  "height",
  "weight",
  "age",
  "sex",
  "activity",
  "training_goal"
];
const PROFILE_STEP_COUNT = PROFILE_STEPS.length;
const ONBOARDING_PHASES = [
  ...PROFILE_STEPS,
  "goals",
  "meal_chips",
  "meal_notes",
  "meal_ai",
  "meal_review",
  "meal_change_chat",
  "workout_chips",
  "workout_notes",
  "workout_ai"
];
const MEAL_STEPS = /* @__PURE__ */ new Set([
  "meal_chips",
  "meal_notes",
  "meal_ai",
  "meal_review",
  "meal_change_chat"
]);
const WORKOUT_STEPS = /* @__PURE__ */ new Set([
  "workout_chips",
  "workout_notes",
  "workout_ai"
]);
function isOnboardingPhase(s) {
  return ONBOARDING_PHASES.includes(s);
}
function fixInconsistentOnboardingPhase(phase, wantMeal, wantWorkout) {
  if (MEAL_STEPS.has(phase) && !wantMeal) {
    if (wantWorkout) return "workout_chips";
    return "goals";
  }
  if (WORKOUT_STEPS.has(phase) && !wantWorkout) {
    if (wantMeal) return "meal_review";
    return "goals";
  }
  return phase;
}
const VERSION = 1;
const key = (userId) => `tl_onb_prog_v${VERSION}_${userId}`;
function readOnboardingProgress(userId) {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(key(userId));
  if (raw == null) return null;
  try {
    const j = JSON.parse(raw);
    if (!j || typeof j !== "object") return null;
    const p = j.phase;
    if (typeof p !== "string" || !isOnboardingPhase(p)) return null;
    const s = j;
    if (s.v !== 1) return null;
    const wantMeal = Boolean(s.wantMeal);
    const wantWorkout = Boolean(s.wantWorkout);
    return {
      v: 1,
      phase: fixInconsistentOnboardingPhase(
        s.phase,
        wantMeal,
        wantWorkout
      ),
      wantMeal,
      wantWorkout,
      heightFeet: typeof s.heightFeet === "string" ? s.heightFeet : "",
      heightInches: typeof s.heightInches === "string" ? s.heightInches : "",
      weightLb: typeof s.weightLb === "string" ? s.weightLb : "",
      ageYears: typeof s.ageYears === "string" ? s.ageYears : "",
      sex: typeof s.sex === "string" ? s.sex : "",
      activity: typeof s.activity === "string" ? s.activity : "",
      goalPreset: typeof s.goalPreset === "string" ? s.goalPreset : "",
      mealSelected: Array.isArray(s.mealSelected) ? s.mealSelected.filter((x) => typeof x === "string") : [],
      workoutSelected: Array.isArray(s.workoutSelected) ? s.workoutSelected.filter((x) => typeof x === "string") : [],
      mealNotes: typeof s.mealNotes === "string" ? s.mealNotes : "",
      workoutNotes: typeof s.workoutNotes === "string" ? s.workoutNotes : "",
      mealStarted: Boolean(s.mealStarted),
      workoutStarted: Boolean(s.workoutStarted)
    };
  } catch {
    return null;
  }
}
function writeOnboardingProgress(userId, state) {
  if (typeof localStorage === "undefined") return;
  try {
    const fixed = {
      ...state,
      phase: fixInconsistentOnboardingPhase(
        state.phase,
        state.wantMeal,
        state.wantWorkout
      )
    };
    localStorage.setItem(key(userId), JSON.stringify(fixed));
  } catch {
  }
}
function clearOnboardingProgress(userId) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(key(userId));
  } catch {
  }
}
function applyOnboardingSnapshot(s, setters) {
  const fixed = {
    ...s,
    phase: fixInconsistentOnboardingPhase(
      s.phase,
      s.wantMeal,
      s.wantWorkout
    )
  };
  setters.setPhase(fixed.phase);
  setters.setWantMeal(fixed.wantMeal);
  setters.setWantWorkout(fixed.wantWorkout);
  setters.setHeightFeet(fixed.heightFeet);
  setters.setHeightInches(fixed.heightInches);
  setters.setWeightLb(fixed.weightLb);
  setters.setAgeYears(fixed.ageYears);
  setters.setSex(
    fixed.sex === "" || PROFILE_SEX_VALUES.includes(fixed.sex) ? fixed.sex : ""
  );
  setters.setActivity(
    [
      "sedentary",
      "light",
      "moderate",
      "active",
      "very_active",
      ""
    ].includes(fixed.activity) ? fixed.activity : ""
  );
  setters.setGoalPreset(
    fixed.goalPreset && isGoalPreset(fixed.goalPreset) ? fixed.goalPreset : ""
  );
  setters.setMealSelected(new Set(fixed.mealSelected));
  setters.setWorkoutSelected(new Set(fixed.workoutSelected));
  setters.setMealNotes(fixed.mealNotes);
  setters.setWorkoutNotes(fixed.workoutNotes);
  setters.setMealStarted(fixed.mealStarted);
  setters.setWorkoutStarted(fixed.workoutStarted);
}
function snapshotOnboarding(s) {
  return {
    v: 1,
    phase: s.phase,
    wantMeal: s.wantMeal,
    wantWorkout: s.wantWorkout,
    heightFeet: s.heightFeet,
    heightInches: s.heightInches,
    weightLb: s.weightLb,
    ageYears: s.ageYears,
    sex: s.sex,
    activity: s.activity,
    goalPreset: s.goalPreset === "" ? "" : s.goalPreset,
    mealSelected: [...s.mealSelected],
    workoutSelected: [...s.workoutSelected],
    mealNotes: s.mealNotes,
    workoutNotes: s.workoutNotes,
    mealStarted: s.mealStarted,
    workoutStarted: s.workoutStarted
  };
}
function assistantTextForMarkdown(m) {
  const parts = m.parts ?? [];
  let s = "";
  for (const p of parts) {
    if (isTextUIPart(p)) s += p.text;
  }
  return s;
}
function mealRefinementVisibleMessages(messages) {
  const i = messages.findIndex(
    (m) => m.role === "user" && assistantTextForMarkdown(m).trim() === MEAL_PLAN_REFINEMENT_USER_PROMPT
  );
  if (i >= 0) return messages.slice(i);
  return [];
}
function withoutRefinementCompleteToolForDisplay(m) {
  if (m.role !== "assistant" || !m.parts?.length) return m;
  const parts = m.parts.filter(
    (p) => !isToolUIPart(p) || getToolName(p) !== ONBOARDING_MEAL_REFINEMENT_COMPLETE_TOOL
  );
  if (parts.length === m.parts.length) return m;
  return { ...m, parts };
}
function OnboardingMealPlanReview({ weekKey }) {
  const { ready } = useDb();
  const { ensurePlan } = useMealPlanMutations();
  const { data: plan, loading: planLoading } = usePlanForWeek(weekKey);
  const { data: slots } = usePlanSlots(plan?.id ?? null);
  const { data: library } = useMealLibrary();
  const libIds = useMemo(
    () => [...new Set(slots.map((s) => s.libraryItemId).filter(Boolean))],
    [slots]
  );
  const { data: allIngs } = useMealLibraryIngredientsForItems(libIds);
  useEffect(() => {
    if (!ready) return;
    void ensurePlan(weekKey);
  }, [weekKey, ensurePlan, ready]);
  const itemsById = useMemo(() => {
    const m = /* @__PURE__ */ new Map();
    const byLib = /* @__PURE__ */ new Map();
    for (const ing of allIngs) {
      const arr = byLib.get(ing.libraryItemId) ?? [];
      arr.push(ing);
      byLib.set(ing.libraryItemId, arr);
    }
    for (const item of library) {
      m.set(item.id, { item, ingredients: byLib.get(item.id) ?? [] });
    }
    return m;
  }, [library, allIngs]);
  const planBoard = useMemo(() => {
    if (!plan) return null;
    return buildMealPlanBoardView(
      { id: plan.id, weekStartDayKey: plan.weekStartDayKey },
      slots,
      itemsById
    );
  }, [plan, slots, itemsById]);
  const libraryOptions = useMemo(
    () => library.map((i) => ({ id: i.id, name: i.name })),
    [library]
  );
  if (!ready || planLoading || !plan || !planBoard) {
    return /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-3 py-10", children: [
      /* @__PURE__ */ jsx(Loader2, { className: "text-muted-foreground size-8 animate-spin" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-center text-sm", children: "Loading your week…" })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    libraryOptions.length === 0 ? /* @__PURE__ */ jsxs(
      "div",
      {
        className: cn(
          "border-primary/15 bg-card text-muted-foreground rounded-xl border p-4 text-sm shadow-sm"
        ),
        children: [
          "Your recipe library is empty. Add meals in",
          " ",
          /* @__PURE__ */ jsx(
            Link,
            {
              to: "/app/nutrition/library",
              className: "text-primary font-medium underline",
              children: "Recipe library"
            }
          ),
          " ",
          "first, then you can assign them here."
        ]
      }
    ) : null,
    /* @__PURE__ */ jsx(
      MealPlanBoard,
      {
        weekStartDayKey: weekKey,
        plan: planBoard,
        libraryOptions,
        showWeekNav: false,
        showThisWeekHeader: false
      }
    )
  ] });
}
function useOnboardingChat(id, mode, weekKey, mealPlanRefinement = false) {
  const mealRefinementRef = useRef(mealPlanRefinement);
  mealRefinementRef.current = mealPlanRefinement;
  const transport = useMemo(
    () => new DefaultChatTransport({
      api: "/api/onboarding/chat",
      fetch: authFetch,
      prepareSendMessagesRequest: ({ messages }) => ({
        body: {
          mode,
          weekStartDayKey: weekKey,
          messages,
          mealPlanRefinement: mode === "meal_plan" ? mealRefinementRef.current : false
        }
      })
    }),
    [mode, weekKey]
  );
  return useChat({
    id,
    transport,
    onFinish: () => {
      void triggerSync();
    }
  });
}
function assistantHasDisplayableContent(m) {
  for (const p of m.parts ?? []) {
    if (isTextUIPart(p) && p.text.trim()) return true;
    if (isToolUIPart(p)) return true;
  }
  return false;
}
function OnboardingMealRefinementPanel({
  weekKey,
  messages,
  status,
  errorText,
  onSend,
  onRegenerateMessage,
  onRetry,
  onBack,
  onContinue,
  continueLabel,
  finishing,
  online,
  busy,
  headerEnd,
  retrying,
  stepIndex,
  stepTotal
}) {
  const [line, setLine] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dismissedQuickByAssistantId, setDismissedQuickByAssistantId] = useState({});
  const scrollRef = useRef(null);
  const hasError = status === "error" || Boolean(errorText);
  const sendWithDismiss = useCallback(
    (text) => {
      const aid = lastAssistantMessageId(messages);
      if (aid) {
        setDismissedQuickByAssistantId((d) => ({ ...d, [aid]: true }));
      }
      onSend(text);
    },
    [messages, onSend]
  );
  const onSubmit = (e) => {
    e.preventDefault();
    const t = line.trim();
    if (!t || busy || !online) {
      if (!online) toast.error("You need a connection to send a message.");
      return;
    }
    setLine("");
    sendWithDismiss(t);
  };
  const onComposerKeyDown = (e) => {
    if (e.key !== "Enter" || e.shiftKey) return;
    if (e.nativeEvent.isComposing) return;
    e.preventDefault();
    e.currentTarget.form?.requestSubmit();
  };
  const onQuickReply = useCallback(
    (text) => {
      const t = text.trim();
      if (!t) return;
      sendWithDismiss(t);
    },
    [sendWithDismiss]
  );
  const visibleMessages = useMemo(
    () => mealRefinementVisibleMessages(messages),
    [messages]
  );
  const lastAssistantId = useMemo(
    () => visibleMessages.filter((m) => m.role === "assistant").at(-1)?.id ?? null,
    [visibleMessages]
  );
  const seenRefinementCompleteToolCallIds = useRef(/* @__PURE__ */ new Set());
  const refinementCompleteInitRef = useRef(false);
  function collectRefinementCompleteSuccessIds(msgs) {
    const ids = [];
    const tool = ONBOARDING_MEAL_REFINEMENT_COMPLETE_TOOL;
    for (const m of msgs) {
      for (const p of m.parts ?? []) {
        if (!isToolUIPart(p) || getToolName(p) !== tool) continue;
        if (p.state !== "output-available") continue;
        const out = p.output;
        if (out == null || typeof out !== "object" || out.ok !== true) continue;
        const toolCallId = "toolCallId" in p && typeof p.toolCallId === "string" ? p.toolCallId : null;
        if (toolCallId != null) ids.push(toolCallId);
      }
    }
    return ids;
  }
  useEffect(() => {
    if (!refinementCompleteInitRef.current && messages.length > 0) {
      refinementCompleteInitRef.current = true;
      for (const id of collectRefinementCompleteSuccessIds(messages)) {
        seenRefinementCompleteToolCallIds.current.add(id);
      }
      return;
    }
    if (!refinementCompleteInitRef.current) return;
    for (const m of messages) {
      for (const p of m.parts ?? []) {
        if (!isToolUIPart(p)) continue;
        if (getToolName(p) !== ONBOARDING_MEAL_REFINEMENT_COMPLETE_TOOL) {
          continue;
        }
        if (p.state !== "output-available") continue;
        const out = p.output;
        if (out == null || typeof out !== "object" || out.ok !== true) {
          continue;
        }
        const toolCallId = "toolCallId" in p && typeof p.toolCallId === "string" ? p.toolCallId : null;
        if (toolCallId == null) continue;
        if (seenRefinementCompleteToolCallIds.current.has(toolCallId)) {
          continue;
        }
        seenRefinementCompleteToolCallIds.current.add(toolCallId);
        if (finishing) return;
        onContinue();
        return;
      }
    }
  }, [messages, onContinue, finishing]);
  useLayoutEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [visibleMessages, status, errorText]);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      OnboardingStepShell,
      {
        title: "Refine your meal plan",
        description: "Chat with the assistant about changes — tap a suggestion or type your own.",
        stepIndex,
        stepTotal,
        onBack,
        showBack: true,
        headerEnd,
        compactLayout: true,
        footer: /* @__PURE__ */ jsxs("div", { className: "flex w-full flex-col gap-2", children: [
          errorText ? /* @__PURE__ */ jsx("p", { className: "text-destructive text-sm", role: "alert", children: errorText }) : null,
          hasError ? /* @__PURE__ */ jsxs(
            Button,
            {
              type: "button",
              variant: "secondary",
              className: "h-10 w-full",
              onClick: onRetry,
              disabled: busy || retrying,
              children: [
                retrying || busy ? /* @__PURE__ */ jsx(Loader2, { className: "size-4 animate-spin" }) : /* @__PURE__ */ jsx(RotateCcw, { className: "size-4" }),
                "Try again"
              ]
            }
          ) : null,
          /* @__PURE__ */ jsx("form", { onSubmit, className: "shrink-0", children: /* @__PURE__ */ jsxs(
            "div",
            {
              className: cn(
                "border-input bg-background relative rounded-lg border shadow-sm transition-colors",
                busy && "border-primary/35 bg-muted/25",
                "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50"
              ),
              children: [
                /* @__PURE__ */ jsx(
                  "textarea",
                  {
                    value: line,
                    onChange: (e) => setLine(e.target.value),
                    onKeyDown: onComposerKeyDown,
                    placeholder: "Ask for a swap, a lighter day, or a new idea… (Enter to send)",
                    rows: 2,
                    className: "placeholder:text-muted-foreground w-full min-h-[2.75rem] resize-y border-0 bg-transparent py-1.5 pr-11 pl-2.5 text-sm leading-snug outline-none",
                    disabled: !online || busy,
                    autoComplete: "off",
                    "aria-label": "Message"
                  }
                ),
                /* @__PURE__ */ jsx("div", { className: "absolute right-1.5 bottom-1.5", children: /* @__PURE__ */ jsx(
                  Button,
                  {
                    type: "submit",
                    size: "icon",
                    className: "size-8 shrink-0",
                    disabled: !line.trim() || !online || busy,
                    "aria-label": "Send",
                    children: /* @__PURE__ */ jsx(ArrowUp, { className: "size-4" })
                  }
                ) })
              ]
            }
          ) }),
          /* @__PURE__ */ jsxs(
            Button,
            {
              type: "button",
              variant: "outline",
              className: "h-9 w-full touch-manipulation gap-1.5 text-sm",
              onClick: () => setDrawerOpen(true),
              children: [
                /* @__PURE__ */ jsx(PanelTop, { className: "size-3.5 shrink-0", "aria-hidden": true }),
                "View this week’s plan"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            Button,
            {
              type: "button",
              className: "min-h-12 w-full text-base",
              onClick: onContinue,
              disabled: finishing,
              children: [
                continueLabel,
                /* @__PURE__ */ jsx(ArrowRight, { className: "size-4" })
              ]
            }
          )
        ] }),
        children: /* @__PURE__ */ jsxs(
          "div",
          {
            ref: scrollRef,
            className: "text-muted-foreground min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-0.5 py-0.5 text-sm [scrollbar-gutter:stable_both_edges]",
            "aria-live": "polite",
            children: [
              visibleMessages.length === 0 && busy ? /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground flex items-center gap-2 text-sm", children: [
                /* @__PURE__ */ jsx(Loader2, { className: "size-4 shrink-0 animate-spin" }),
                "Preparing your chat…"
              ] }) : null,
              visibleMessages.filter((m) => m.role === "user" || m.role === "assistant").map((m) => {
                if (m.role === "user") {
                  return /* @__PURE__ */ jsx(
                    "div",
                    {
                      className: "flex justify-end",
                      children: /* @__PURE__ */ jsx("p", { className: "bg-primary text-primary-foreground max-w-[min(100%,20rem)] rounded-2xl px-3 py-2 text-sm font-medium whitespace-pre-wrap sm:max-w-[90%]", children: assistantTextForMarkdown(m) || "…" })
                    },
                    m.id
                  );
                }
                const isLastAssistant = m.id === lastAssistantId;
                const showHold = busy && isLastAssistant && !assistantHasDisplayableContent(m);
                return /* @__PURE__ */ jsx("div", { className: "flex justify-start", children: /* @__PURE__ */ jsxs(
                  "div",
                  {
                    className: cn(
                      "max-w-full min-w-0 space-y-2 rounded-2xl border px-2.5 py-2 sm:max-w-[95%] sm:px-3",
                      "bg-muted/40 border-border/60"
                    ),
                    children: [
                      showHold ? /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground flex items-center gap-2 text-sm", children: [
                        /* @__PURE__ */ jsx(Loader2, { className: "size-4 shrink-0 animate-spin" }),
                        "Replying…"
                      ] }) : null,
                      /* @__PURE__ */ jsx(
                        AssistantMessageParts,
                        {
                          message: withoutRefinementCompleteToolForDisplay(m),
                          dismissedQuickReplies: dismissedQuickByAssistantId[m.id] === true,
                          onQuickReply,
                          onRegenerate: () => {
                            void onRegenerateMessage(m.id);
                          },
                          busy,
                          online,
                          showRegenerateAndTokenRow: false,
                          showOfflineStyling: false
                        }
                      )
                    ]
                  }
                ) }, m.id);
              })
            ]
          }
        )
      }
    ),
    /* @__PURE__ */ jsx(Sheet, { open: drawerOpen, onOpenChange: setDrawerOpen, children: /* @__PURE__ */ jsxs(
      SheetContent,
      {
        side: "bottom",
        className: "min-h-0 max-h-[88dvh] gap-0 overflow-hidden rounded-t-2xl p-0",
        showCloseButton: true,
        children: [
          /* @__PURE__ */ jsxs(
            "div",
            {
              className: "border-border flex shrink-0 flex-col items-center border-b border-dashed py-1.5",
              "aria-hidden": true,
              children: [
                /* @__PURE__ */ jsx(
                  "div",
                  {
                    className: "bg-muted-foreground/30 h-1 w-9 shrink-0 rounded-full"
                  }
                ),
                /* @__PURE__ */ jsx(
                  ChevronUp,
                  {
                    className: "text-muted-foreground/50 mt-0.5 size-5",
                    strokeWidth: 2.25,
                    "aria-hidden": true
                  }
                )
              ]
            }
          ),
          /* @__PURE__ */ jsxs(SheetHeader, { className: "shrink-0 border-0 px-3 pt-1 pb-2 sm:pt-2", children: [
            /* @__PURE__ */ jsx(SheetTitle, { children: "Your week" }),
            /* @__PURE__ */ jsx(SheetDescription, { children: "The plan in the app right now. Close to keep chatting." })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-4 pt-1 sm:px-4", children: /* @__PURE__ */ jsx(OnboardingMealPlanReview, { weekKey }) })
        ]
      }
    ) })
  ] });
}
function totalInchesFromParts(feetStr, inchesStr) {
  const ft = feetStr.trim();
  const ins = inchesStr.trim();
  if (ft === "") return null;
  const f = Number(ft);
  if (!Number.isFinite(f) || f < 2 || f > 8) return null;
  const inchPart = ins === "" ? 0 : Number(ins);
  if (!Number.isFinite(inchPart) || inchPart < 0 || inchPart > 11) return null;
  const total = Math.round(f) * 12 + Math.round(inchPart);
  if (total < 20 || total > 96) return null;
  return total;
}
function parseIntField(raw, min, max) {
  const t = raw.trim();
  if (t === "") return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return Math.round(n);
}
function OnboardingStepShell({
  title,
  description,
  stepIndex,
  stepTotal,
  onBack,
  showBack,
  headerEnd,
  children,
  footer,
  compactLayout
}) {
  return /* @__PURE__ */ jsxs("div", { className: "flex h-full min-h-0 w-full min-w-0 flex-1 flex-col", children: [
    /* @__PURE__ */ jsxs("div", { className: cn("shrink-0 px-1", compactLayout ? "pt-0" : "pt-1"), children: [
      showBack || headerEnd ? /* @__PURE__ */ jsxs(
        "div",
        {
          className: cn("flex w-full min-h-9 items-center pr-0.5", compactLayout ? "mb-0" : "mb-1"),
          children: [
            showBack ? /* @__PURE__ */ jsxs(
              Button,
              {
                type: "button",
                variant: "ghost",
                className: "touch-manipulate -ms-1 h-9 shrink-0 gap-1 px-2 text-muted-foreground",
                onClick: onBack,
                children: [
                  /* @__PURE__ */ jsx(ChevronLeft, { className: "size-5" }),
                  "Back"
                ]
              }
            ) : null,
            headerEnd ? /* @__PURE__ */ jsx("div", { className: "ms-auto flex h-9 min-w-0 items-center justify-end", children: headerEnd }) : null
          ]
        }
      ) : null,
      /* @__PURE__ */ jsxs(
        "p",
        {
          className: cn(
            "text-muted-foreground text-center text-xs font-medium tabular-nums",
            compactLayout ? "mb-0.5" : "mb-1"
          ),
          children: [
            "Step ",
            stepIndex,
            " of ",
            stepTotal
          ]
        }
      ),
      /* @__PURE__ */ jsx("div", { className: cn("flex justify-center gap-1", compactLayout ? "mb-1.5" : "mb-4"), children: Array.from({ length: stepTotal }, (_, i) => /* @__PURE__ */ jsx(
        "span",
        {
          className: cn(
            "h-1.5 w-5 rounded-full transition-colors",
            i < stepIndex - 1 && "bg-primary/55",
            i === stepIndex - 1 && "bg-primary",
            i > stepIndex - 1 && "bg-muted"
          ),
          "aria-hidden": true
        },
        i
      )) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden", children: [
      /* @__PURE__ */ jsx(
        "h1",
        {
          className: cn(
            "shrink-0 font-bold leading-tight tracking-tight",
            compactLayout ? "text-xl" : "text-2xl"
          ),
          children: title
        }
      ),
      /* @__PURE__ */ jsx(
        "p",
        {
          className: cn(
            "text-muted-foreground shrink-0 leading-relaxed",
            compactLayout ? "mt-1 text-sm" : "mt-2 text-base"
          ),
          children: description
        }
      ),
      /* @__PURE__ */ jsx(
        "div",
        {
          className: cn(
            compactLayout ? "mt-2 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden pb-0" : "mt-8 min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-clip overscroll-contain px-0.5 pb-4 [scrollbar-gutter:stable]"
          ),
          children
        }
      )
    ] }),
    /* @__PURE__ */ jsx(
      "div",
      {
        className: cn(
          "bg-background/95 border-border supports-[padding:max(0px)]:pb-[max(0.75rem,env(safe-area-inset-bottom))] relative z-20 -mx-1 shrink-0 border-t px-1 backdrop-blur",
          compactLayout ? "pt-2 pb-3" : "pt-3 pb-4"
        ),
        children: footer
      }
    )
  ] });
}
function OnboardingChipsPage({
  title,
  description,
  stepIndex,
  stepTotal,
  chips,
  selected,
  onToggle,
  onBack,
  onContinue,
  continueLabel,
  disabled,
  headerEnd
}) {
  return /* @__PURE__ */ jsxs(
    OnboardingStepShell,
    {
      title,
      description,
      stepIndex,
      stepTotal,
      onBack,
      showBack: true,
      headerEnd,
      footer: /* @__PURE__ */ jsxs(
        Button,
        {
          type: "button",
          className: "min-h-14 w-full text-base",
          onClick: onContinue,
          disabled,
          children: [
            continueLabel,
            /* @__PURE__ */ jsx(ArrowRight, { className: "size-4" })
          ]
        }
      ),
      children: [
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-3 text-sm font-medium", children: "Tap all that apply" }),
        /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: chips.map((c) => {
          const on = selected.has(c.id);
          return /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: () => onToggle(c.id),
              className: cn(
                "inline-flex min-h-11 min-w-[44px] items-center gap-1.5 rounded-full border px-3.5 py-2.5 text-sm font-medium transition-all touch-manipulation active:scale-[0.98]",
                on ? "border-primary bg-primary/12 text-foreground ring-primary/50 ring-2" : "border-border bg-muted/50 text-muted-foreground"
              ),
              children: [
                /* @__PURE__ */ jsx("span", { className: "text-lg", "aria-hidden": true, children: c.emoji }),
                c.label,
                on ? /* @__PURE__ */ jsx(Check, { className: "text-primary size-3.5 shrink-0", "aria-hidden": true }) : null
              ]
            },
            c.id
          );
        }) })
      ]
    }
  );
}
function OnboardingNotesPage({
  title,
  description,
  stepIndex,
  stepTotal,
  notes,
  onNotes,
  onBack,
  onContinue,
  continueLabel,
  disabled,
  placeholder,
  headerEnd
}) {
  return /* @__PURE__ */ jsxs(
    OnboardingStepShell,
    {
      title,
      description,
      stepIndex,
      stepTotal,
      onBack,
      showBack: true,
      headerEnd,
      footer: /* @__PURE__ */ jsxs(
        Button,
        {
          type: "button",
          className: "min-h-14 w-full text-base",
          onClick: onContinue,
          disabled,
          children: [
            continueLabel,
            /* @__PURE__ */ jsx(ArrowRight, { className: "size-4" })
          ]
        }
      ),
      children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "onb-step-notes", className: "sr-only", children: "Notes" }),
        /* @__PURE__ */ jsx(
          "textarea",
          {
            id: "onb-step-notes",
            className: "border-input bg-background focus-visible:ring-ring/50 dark:bg-input/30 min-h-36 w-full rounded-2xl border px-4 py-3.5 text-base leading-relaxed outline-none focus-visible:ring-2",
            placeholder,
            value: notes,
            onChange: (e) => onNotes(e.target.value),
            autoComplete: "off",
            autoCorrect: "on"
          }
        )
      ]
    }
  );
}
function OnboardingAiResult({
  title,
  description,
  stepIndex,
  stepTotal,
  onBack,
  onGenerate,
  onContinue,
  onRetry,
  generateLabel,
  continueLabel,
  busy,
  canContinue,
  continueDisabled,
  messages,
  errorText,
  status,
  started,
  retrying,
  headerEnd
}) {
  const hasError = status === "error" || Boolean(errorText);
  return /* @__PURE__ */ jsx(
    OnboardingStepShell,
    {
      title,
      description,
      stepIndex,
      stepTotal,
      onBack,
      showBack: true,
      headerEnd,
      compactLayout: true,
      footer: !started ? /* @__PURE__ */ jsxs(
        Button,
        {
          type: "button",
          className: "min-h-14 w-full gap-2 text-base",
          onClick: onGenerate,
          disabled: busy,
          children: [
            busy && status === "submitted" ? /* @__PURE__ */ jsx(Loader2, { className: "size-4 animate-spin" }) : /* @__PURE__ */ jsx(Sparkles, { className: "size-4" }),
            generateLabel
          ]
        }
      ) : canContinue ? /* @__PURE__ */ jsxs(
        Button,
        {
          type: "button",
          className: "min-h-14 w-full text-base",
          onClick: onContinue,
          disabled: busy || continueDisabled,
          children: [
            continueLabel,
            /* @__PURE__ */ jsx(ArrowRight, { className: "size-4" })
          ]
        }
      ) : hasError && started ? /* @__PURE__ */ jsxs(
        Button,
        {
          type: "button",
          className: "min-h-14 w-full gap-2 text-base",
          onClick: onRetry,
          disabled: busy || retrying,
          variant: "secondary",
          children: [
            retrying || busy ? /* @__PURE__ */ jsx(Loader2, { className: "size-4 animate-spin" }) : /* @__PURE__ */ jsx(RotateCcw, { className: "size-4" }),
            "Try again"
          ]
        }
      ) : /* @__PURE__ */ jsx("p", { className: "text-muted-foreground min-h-14 py-2 text-center text-sm", children: status === "submitted" || status === "streaming" ? /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center justify-center gap-2", children: [
        /* @__PURE__ */ jsx(Loader2, { className: "size-4 animate-spin" }),
        "Generating your plan in the app…"
      ] }) : null }),
      children: /* @__PURE__ */ jsxs("div", { className: "flex min-h-0 flex-1 flex-col", children: [
        errorText ? /* @__PURE__ */ jsx("p", { className: "text-destructive shrink-0 text-sm", role: "alert", children: errorText }) : null,
        started && messages.length > 0 ? /* @__PURE__ */ jsx(
          "div",
          {
            className: "min-h-0 flex-1 overflow-y-auto overscroll-contain px-0.5 pt-0.5 [scrollbar-gutter:stable_both_edges] pb-[max(3.5rem,env(safe-area-inset-bottom,0px))]",
            children: /* @__PURE__ */ jsxs(Card, { className: "border-primary/20 mb-1", children: [
              /* @__PURE__ */ jsxs(CardHeader, { className: "pb-2", children: [
                /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "Assistant" }),
                /* @__PURE__ */ jsx(CardDescription, { children: "Creating entries in the app. This can take a moment." })
              ] }),
              /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3 pb-2", children: [
                (() => {
                  const lastAsst = messages.filter((m) => m.role === "assistant").at(-1);
                  if (!lastAsst) return null;
                  const body = assistantTextForMarkdown(lastAsst);
                  return /* @__PURE__ */ jsx("div", { className: "min-w-0", children: body ? /* @__PURE__ */ jsx(AssistantMarkdown, { content: body }) : status === "streaming" || status === "submitted" ? /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground flex items-center gap-2 text-sm", children: [
                    /* @__PURE__ */ jsx(Loader2, { className: "size-4 shrink-0 animate-spin" }),
                    "Working…"
                  ] }) : null }, lastAsst.id);
                })(),
                status === "streaming" || status === "submitted" ? /* @__PURE__ */ jsxs(
                  "p",
                  {
                    className: "text-muted-foreground flex items-center gap-2 text-xs",
                    "aria-live": "polite",
                    children: [
                      /* @__PURE__ */ jsx(Loader2, { className: "size-3.5 shrink-0 animate-spin" }),
                      "Saving to your account…"
                    ]
                  }
                ) : null
              ] })
            ] })
          }
        ) : null
      ] })
    }
  );
}
const SEX_OPTIONS = [
  ["male", "♂️ Man"],
  ["female", "♀️ Woman"],
  ["transgender_man", "♂️ Transgender man"],
  ["transgender_woman", "♀️ Transgender woman"],
  ["nonbinary", "◻️ Nonbinary"],
  ["other", "🔀 Other"],
  ["prefer_not_to_say", "🔒 I'd prefer not to say"]
];
const ONBOARDING_GOAL_CHOICES = [
  { id: "lose_weight", label: "Lose Weight", Icon: TrendingDown },
  { id: "gain_muscle", label: "Gain Muscle", Icon: Dumbbell },
  { id: "build_strength", label: "Build Strength", Icon: Weight },
  { id: "custom", label: "Custom", Icon: PencilLine }
];
const ACTIVITY_OPTIONS = [
  ["sedentary", "🪑 Sedentary", "Mostly sitting or lying"],
  ["light", "🚶 Light", "Leisurely walks, light day-to-day activity"],
  ["moderate", "🏃 Moderate", "Regular exercise a few days a week"],
  ["active", "💨 Active", "Hard exercise most days"],
  ["very_active", "🔥 Very active", "Physical job or training daily"]
];
function OnboardingFlow({ userId }) {
  const navigate = useNavigate();
  const online = useOnline();
  const weekKey = useMemo(
    () => mondayOfWeekContaining(formatDayKey()),
    []
  );
  const [phase, setPhase] = useState("height");
  const [heightFeet, setHeightFeet] = useState("");
  const [heightInches, setHeightInches] = useState("");
  const [weightLb, setWeightLb] = useState("");
  const [ageYears, setAgeYears] = useState("");
  const [sex, setSex] = useState("");
  const [activity, setActivity] = useState("");
  const [goalPreset, setGoalPreset] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [mealSelected, setMealSelected] = useState(
    () => /* @__PURE__ */ new Set()
  );
  const [workoutSelected, setWorkoutSelected] = useState(
    () => /* @__PURE__ */ new Set()
  );
  const [mealNotes, setMealNotes] = useState("");
  const [workoutNotes, setWorkoutNotes] = useState("");
  const [mealStarted, setMealStarted] = useState(false);
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [wantMeal, setWantMeal] = useState(false);
  const [wantWorkout, setWantWorkout] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [skipDialogOpen, setSkipDialogOpen] = useState(false);
  useLayoutEffect(() => {
    const saved = readOnboardingProgress(userId);
    if (saved) {
      applyOnboardingSnapshot(saved, {
        setPhase,
        setWantMeal,
        setWantWorkout,
        setHeightFeet,
        setHeightInches,
        setWeightLb,
        setAgeYears,
        setSex,
        setActivity,
        setGoalPreset,
        setMealSelected,
        setWorkoutSelected,
        setMealNotes,
        setWorkoutNotes,
        setMealStarted,
        setWorkoutStarted
      });
    }
  }, [userId]);
  useEffect(() => {
    writeOnboardingProgress(
      userId,
      snapshotOnboarding({
        phase,
        wantMeal,
        wantWorkout,
        heightFeet,
        heightInches,
        weightLb,
        ageYears,
        sex,
        activity,
        goalPreset,
        mealSelected,
        workoutSelected,
        mealNotes,
        workoutNotes,
        mealStarted,
        workoutStarted
      })
    );
  }, [
    userId,
    phase,
    wantMeal,
    wantWorkout,
    heightFeet,
    heightInches,
    weightLb,
    ageYears,
    sex,
    activity,
    goalPreset,
    mealSelected,
    workoutSelected,
    mealNotes,
    workoutNotes,
    mealStarted,
    workoutStarted
  ]);
  const {
    messages: mealMessages,
    sendMessage: sendMeal,
    error: mealError,
    status: mealStatus,
    clearError: clearMealError,
    regenerate: regenerateMeal
  } = useOnboardingChat(
    "onb-meal",
    "meal_plan",
    weekKey,
    phase === "meal_change_chat"
  );
  const {
    messages: workoutMessages,
    sendMessage: sendWorkout,
    error: workoutError,
    status: workoutStatus,
    clearError: clearWorkoutError,
    regenerate: regenerateWorkout
  } = useOnboardingChat("onb-workout", "workout", weekKey);
  const mealMessagesRef = useRef(mealMessages);
  const workoutMessagesRef = useRef(workoutMessages);
  mealMessagesRef.current = mealMessages;
  workoutMessagesRef.current = workoutMessages;
  const [mealRetrying, setMealRetrying] = useState(false);
  const [workoutRetrying, setWorkoutRetrying] = useState(false);
  const mealRefinementSeedRef = useRef(false);
  useEffect(() => {
    if (phase !== "meal_change_chat" || !wantMeal) {
      mealRefinementSeedRef.current = false;
      return;
    }
    if (!online) return;
    if (mealRefinementSeedRef.current) return;
    const hasOpening = mealMessages.some(
      (m) => m.role === "user" && assistantTextForMarkdown(m).includes(
        "I'd like to adjust this week's meal plan"
      )
    );
    if (hasOpening) {
      mealRefinementSeedRef.current = true;
      return;
    }
    mealRefinementSeedRef.current = true;
    clearMealError();
    void sendMeal({ text: MEAL_PLAN_REFINEMENT_USER_PROMPT });
  }, [
    phase,
    wantMeal,
    online,
    mealMessages,
    clearMealError,
    sendMeal
  ]);
  const saveProfile = useCallback(async () => {
    const totalIn = totalInchesFromParts(heightFeet, heightInches);
    const w = parseIntField(weightLb, 50, 700);
    const a = parseIntField(ageYears, 10, 120);
    if (totalIn == null) {
      toast.error("Check your height (feet 2–8, inches 0–11).");
      return;
    }
    if (w == null) {
      toast.error("Enter a valid weight in pounds.");
      return;
    }
    if (a == null) {
      toast.error("Enter a valid age in years.");
      return;
    }
    if (!sex || !activity) {
      toast.error("Select sex and activity level.");
      return;
    }
    if (!isGoalPreset(goalPreset)) {
      toast.error("Choose a training goal.");
      return;
    }
    if (!online) {
      toast.error("You need a connection to save your profile.");
      return;
    }
    setSavingProfile(true);
    try {
      const r = await authFetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heightIn: totalIn,
          weightLb: w,
          ageYears: a,
          sex,
          activityLevel: activity,
          goalPreset
        })
      });
      if (!r.ok) {
        toast.error("Could not save your profile. Try again.");
        return;
      }
      void triggerSync();
      toast.success("Profile saved");
      setPhase("goals");
    } catch (e) {
      console.error(e);
      toast.error("Could not save your profile");
    } finally {
      setSavingProfile(false);
    }
  }, [
    heightFeet,
    heightInches,
    weightLb,
    ageYears,
    sex,
    activity,
    goalPreset,
    online
  ]);
  const goBackProfile = (current) => {
    const i = PROFILE_STEPS.indexOf(current);
    if (i <= 0) return;
    setPhase(PROFILE_STEPS[i - 1]);
  };
  const continueHeight = () => {
    const total = totalInchesFromParts(heightFeet, heightInches);
    if (total == null) {
      toast.error("Enter feet (2–8) and inches 0–11, or leave inches blank.");
      return;
    }
    setPhase("weight");
  };
  const continueWeight = () => {
    const w = parseIntField(weightLb, 50, 700);
    if (w == null) {
      toast.error("Enter a valid weight in pounds (50–700).");
      return;
    }
    setPhase("age");
  };
  const continueAge = () => {
    const a = parseIntField(ageYears, 10, 120);
    if (a == null) {
      toast.error("Enter your age in years (10–120).");
      return;
    }
    setPhase("sex");
  };
  const continueSex = () => {
    if (!sex) {
      toast.error("Select one option.");
      return;
    }
    setPhase("activity");
  };
  const continueActivity = () => {
    if (!activity) {
      toast.error("Select your usual activity level.");
      return;
    }
    setPhase("training_goal");
  };
  const nextFromGoals = () => {
    if (!wantMeal && !wantWorkout) {
      toast.error("Choose Meal planning, Workouts, or both.");
      return;
    }
    if (wantMeal) {
      setPhase("meal_chips");
      return;
    }
    if (wantWorkout) {
      setPhase("workout_chips");
    }
  };
  const mealStepTotal = 5;
  const workoutStepTotal = 3;
  const mealLabels = useMemo(
    () => [...mealSelected].map((id) => MEAL_ONBOARDING_CHIPS.find((c) => c.id === id)).filter(Boolean).map((c) => `${c.emoji} ${c.label}`),
    [mealSelected]
  );
  const workoutLabels = useMemo(
    () => [...workoutSelected].map((id) => WORKOUT_ONBOARDING_CHIPS.find((c) => c.id === id)).filter(Boolean).map((c) => `${c.emoji} ${c.label}`),
    [workoutSelected]
  );
  const genMeal = () => {
    if (!online) {
      toast.error("Connect to the internet to use AI for your meal plan.");
      return;
    }
    clearMealError();
    setMealStarted(true);
    const text = buildOnboardingUserMessage(mealLabels, mealNotes);
    void sendMeal({ text });
  };
  const genWorkout = () => {
    if (!online) {
      toast.error("Connect to the internet to use AI for your workout.");
      return;
    }
    clearWorkoutError();
    setWorkoutStarted(true);
    const text = buildOnboardingUserMessage(workoutLabels, workoutNotes);
    void sendWorkout({ text });
  };
  const retryMeal = useCallback(async () => {
    if (!online) {
      clearMealError();
      toast.error("You need a connection to retry.");
      return;
    }
    setMealRetrying(true);
    try {
      clearMealError();
      const lastUser = [...mealMessagesRef.current].reverse().find((m) => m.role === "user");
      if (lastUser) {
        await regenerateMeal({ messageId: lastUser.id });
      } else {
        const text = buildOnboardingUserMessage(mealLabels, mealNotes);
        await sendMeal({ text });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setMealRetrying(false);
    }
  }, [
    online,
    clearMealError,
    regenerateMeal,
    sendMeal,
    mealLabels,
    mealNotes
  ]);
  const retryWorkout = useCallback(async () => {
    if (!online) {
      clearWorkoutError();
      toast.error("You need a connection to retry.");
      return;
    }
    setWorkoutRetrying(true);
    try {
      clearWorkoutError();
      const lastUser = [...workoutMessagesRef.current].reverse().find((m) => m.role === "user");
      if (lastUser) {
        await regenerateWorkout({ messageId: lastUser.id });
      } else {
        const text = buildOnboardingUserMessage(workoutLabels, workoutNotes);
        await sendWorkout({ text });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setWorkoutRetrying(false);
    }
  }, [
    online,
    clearWorkoutError,
    regenerateWorkout,
    sendWorkout,
    workoutLabels,
    workoutNotes
  ]);
  const finishOnboarding = useCallback(async () => {
    setFinishing(true);
    try {
      const r = await authFetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markOnboardingComplete: true })
      });
      if (!r.ok) {
        toast.error("Could not mark setup complete. Try again.");
        return;
      }
      clearOnboardingProgress(userId);
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem(onboardingCacheKey(userId), "1");
      }
      void triggerSync();
      await navigate({ to: "/app" });
    } catch (e) {
      console.error(e);
      toast.error("Something went wrong");
    } finally {
      setFinishing(false);
    }
  }, [navigate, userId]);
  const runSkipOnboarding = useCallback(async () => {
    if (finishing) return;
    setFinishing(true);
    try {
      const r = await authFetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markOnboardingComplete: true })
      });
      if (!r.ok) {
        toast.error("Could not update your account. Try again.");
        return;
      }
      clearOnboardingProgress(userId);
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem(onboardingCacheKey(userId), "1");
      }
      void triggerSync();
      await navigate({ to: "/app" });
    } catch (e) {
      console.error(e);
      toast.error("Something went wrong");
    } finally {
      setFinishing(false);
    }
  }, [finishing, navigate, userId]);
  const onConfirmSkip = useCallback(async () => {
    setSkipDialogOpen(false);
    await runSkipOnboarding();
  }, [runSkipOnboarding]);
  const afterMeal = () => {
    if (wantWorkout) {
      setPhase("workout_chips");
    } else {
      void finishOnboarding();
    }
  };
  const afterWorkout = () => {
    void finishOnboarding();
  };
  const mealCanContinue = mealStarted && mealStatus === "ready" && !mealError && mealMessages.some((m) => m.role === "assistant");
  const workoutCanContinue = workoutStarted && workoutStatus === "ready" && !workoutError && workoutMessages.some((m) => m.role === "assistant");
  const toggle = (id, which) => {
    if (which === "meal") {
      setMealSelected((prev) => {
        const n = new Set(prev);
        if (n.has(id)) n.delete(id);
        else n.add(id);
        return n;
      });
    } else {
      setWorkoutSelected((prev) => {
        const n = new Set(prev);
        if (n.has(id)) n.delete(id);
        else n.add(id);
        return n;
      });
    }
  };
  const skipButton = useMemo(
    () => /* @__PURE__ */ jsx(
      Button,
      {
        type: "button",
        variant: "ghost",
        size: "sm",
        className: "text-muted-foreground h-9 shrink-0 px-2.5 touch-manipulation",
        onClick: () => setSkipDialogOpen(true),
        disabled: finishing,
        children: "Skip Setup"
      }
    ),
    [finishing]
  );
  return /* @__PURE__ */ jsxs(
    Card,
    {
      className: cn(
        "mx-auto flex h-full min-h-0 w-full min-w-0 max-w-md flex-1 flex-col gap-0 overflow-hidden p-0 py-0 shadow-none ring-0",
        "max-h-dvh md:max-w-2xl xl:max-w-3xl",
        "rounded-none border-0 bg-transparent",
        "md:rounded-2xl md:border md:border-border/80 md:bg-card md:shadow-sm md:ring-1 md:ring-foreground/10"
      ),
      children: [
        /* @__PURE__ */ jsx(
          ConfirmDialog,
          {
            open: skipDialogOpen,
            onOpenChange: setSkipDialogOpen,
            title: "Skip setup?",
            description: "You can update your profile and goals in Settings any time.",
            confirmLabel: "Skip",
            cancelLabel: "Continue setup",
            onConfirm: onConfirmSkip
          }
        ),
        /* @__PURE__ */ jsxs(CardContent, { className: "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-0 px-4 pb-0 pt-2 sm:pt-3 md:px-6 md:pt-4", children: [
          phase === "height" ? /* @__PURE__ */ jsxs(
            OnboardingStepShell,
            {
              title: "How tall are you?",
              description: "Use feet and inches, like a doctor’s visit — inches can be 0 or left blank if exact.",
              stepIndex: 1,
              stepTotal: PROFILE_STEP_COUNT,
              onBack: () => {
              },
              showBack: false,
              headerEnd: skipButton,
              footer: /* @__PURE__ */ jsxs(
                Button,
                {
                  type: "button",
                  className: "min-h-14 w-full text-base",
                  onClick: continueHeight,
                  children: [
                    "Continue",
                    /* @__PURE__ */ jsx(ArrowRight, { className: "size-4" })
                  ]
                }
              ),
              children: [
                /* @__PURE__ */ jsxs("div", { className: "grid min-w-0 grid-cols-2 gap-4", children: [
                  /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                    /* @__PURE__ */ jsx(Label, { htmlFor: "onb-ft", className: "text-muted-foreground text-sm", children: "Feet" }),
                    /* @__PURE__ */ jsx(
                      Input,
                      {
                        id: "onb-ft",
                        inputMode: "numeric",
                        autoFocus: true,
                        className: "mt-2 min-h-16 rounded-2xl text-center text-3xl font-semibold tabular-nums",
                        value: heightFeet,
                        onChange: (e) => setHeightFeet(e.target.value.replace(/\D/g, "")),
                        placeholder: "5",
                        maxLength: 1,
                        autoComplete: "off",
                        "aria-describedby": "height-hint"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                    /* @__PURE__ */ jsx(Label, { htmlFor: "onb-in", className: "text-muted-foreground text-sm", children: "Inches" }),
                    /* @__PURE__ */ jsx(
                      Input,
                      {
                        id: "onb-in",
                        inputMode: "numeric",
                        className: "mt-2 min-h-16 rounded-2xl text-center text-3xl font-semibold tabular-nums",
                        value: heightInches,
                        onChange: (e) => setHeightInches(e.target.value.replace(/\D/g, "")),
                        placeholder: "10",
                        maxLength: 2,
                        autoComplete: "off",
                        "aria-describedby": "height-hint"
                      }
                    )
                  ] })
                ] }),
                /* @__PURE__ */ jsx("p", { id: "height-hint", className: "text-muted-foreground mt-3 text-sm", children: "Example: 5 feet 10 inches — enter 5 under feet and 10 under inches." })
              ]
            }
          ) : null,
          phase === "weight" ? /* @__PURE__ */ jsxs(
            OnboardingStepShell,
            {
              title: "What’s your weight? - Optional",
              description: "In pounds, as you’d see on a typical scale in the US. This helps us calculate things like your daily calorie needs.",
              stepIndex: 2,
              stepTotal: PROFILE_STEP_COUNT,
              onBack: () => goBackProfile("weight"),
              showBack: true,
              headerEnd: skipButton,
              footer: /* @__PURE__ */ jsxs(
                Button,
                {
                  type: "button",
                  className: "min-h-14 w-full text-base",
                  onClick: continueWeight,
                  children: [
                    "Continue",
                    /* @__PURE__ */ jsx(ArrowRight, { className: "size-4" })
                  ]
                }
              ),
              children: [
                /* @__PURE__ */ jsx(Label, { htmlFor: "wt", className: "text-muted-foreground text-sm", children: "Pounds (lb)" }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    id: "wt",
                    inputMode: "numeric",
                    autoFocus: true,
                    className: "mt-2 min-h-16 rounded-2xl text-center text-3xl font-semibold tabular-nums",
                    value: weightLb,
                    onChange: (e) => setWeightLb(e.target.value.replace(/[^\d.]/g, "")),
                    placeholder: "180",
                    "aria-describedby": "wt-hint"
                  }
                ),
                /* @__PURE__ */ jsx("p", { id: "wt-hint", className: "text-muted-foreground mt-2 text-sm", children: "Used with height for progress and plans." })
              ]
            }
          ) : null,
          phase === "age" ? /* @__PURE__ */ jsx(
            OnboardingStepShell,
            {
              title: "How old are you?",
              description: "We use this to tune plans and your coach’s advice.",
              stepIndex: 3,
              stepTotal: PROFILE_STEP_COUNT,
              onBack: () => goBackProfile("age"),
              showBack: true,
              headerEnd: skipButton,
              footer: /* @__PURE__ */ jsxs(
                Button,
                {
                  type: "button",
                  className: "min-h-14 w-full text-base",
                  onClick: continueAge,
                  children: [
                    "Continue",
                    /* @__PURE__ */ jsx(ArrowRight, { className: "size-4" })
                  ]
                }
              ),
              children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center", children: [
                /* @__PURE__ */ jsx(
                  Label,
                  {
                    htmlFor: "age",
                    className: "text-muted-foreground w-full text-center text-sm",
                    children: "Age in years"
                  }
                ),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    id: "age",
                    inputMode: "numeric",
                    autoFocus: true,
                    className: "mt-2 min-h-16 w-full max-w-[12ch] rounded-2xl text-center text-3xl font-semibold tabular-nums",
                    value: ageYears,
                    onChange: (e) => setAgeYears(e.target.value.replace(/\D/g, "")),
                    placeholder: "32",
                    maxLength: 3
                  }
                )
              ] })
            }
          ) : null,
          phase === "sex" ? /* @__PURE__ */ jsx(
            OnboardingStepShell,
            {
              title: "How should we list your sex?",
              description: "This helps with coaching context. You can change it later in Profile.",
              stepIndex: 4,
              stepTotal: PROFILE_STEP_COUNT,
              onBack: () => goBackProfile("sex"),
              showBack: true,
              headerEnd: skipButton,
              footer: /* @__PURE__ */ jsxs(
                Button,
                {
                  type: "button",
                  className: "min-h-14 w-full text-base",
                  onClick: continueSex,
                  disabled: !sex,
                  children: [
                    "Continue",
                    /* @__PURE__ */ jsx(ArrowRight, { className: "size-4" })
                  ]
                }
              ),
              children: /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-2", children: SEX_OPTIONS.map(([v, label]) => /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => setSex(v),
                  className: cn(
                    "flex min-h-14 w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-left text-base font-medium touch-manipulation active:scale-[0.99]",
                    sex === v ? "border-primary bg-primary/10 ring-primary/30 ring-2" : "border-border bg-card"
                  ),
                  children: [
                    label,
                    sex === v ? /* @__PURE__ */ jsx(Check, { className: "text-primary size-5", "aria-hidden": true }) : null
                  ]
                },
                v
              )) })
            }
          ) : null,
          phase === "activity" ? /* @__PURE__ */ jsxs(
            OnboardingStepShell,
            {
              title: "How active is your average day?",
              description: "Not just workouts — think about work and daily movement.",
              stepIndex: 5,
              stepTotal: PROFILE_STEP_COUNT,
              onBack: () => goBackProfile("activity"),
              showBack: true,
              headerEnd: skipButton,
              footer: /* @__PURE__ */ jsxs(
                Button,
                {
                  type: "button",
                  className: "min-h-14 w-full text-base",
                  onClick: continueActivity,
                  disabled: !activity || finishing,
                  children: [
                    "Continue",
                    /* @__PURE__ */ jsx(ArrowRight, { className: "size-4" })
                  ]
                }
              ),
              children: [
                /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-2", children: ACTIVITY_OPTIONS.map(([v, label, sub]) => /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: () => setActivity(v),
                    className: cn(
                      "relative flex min-h-16 w-full flex-col items-start gap-0.5 rounded-2xl border px-4 py-3.5 pr-12 text-left touch-manipulation active:scale-[0.99]",
                      activity === v ? "border-primary bg-primary/10 ring-primary/30 ring-2" : "border-border bg-card"
                    ),
                    children: [
                      /* @__PURE__ */ jsx("span", { className: "text-base font-medium", children: label }),
                      /* @__PURE__ */ jsx("span", { className: "text-muted-foreground text-xs leading-snug", children: sub }),
                      activity === v ? /* @__PURE__ */ jsx(
                        Check,
                        {
                          className: "text-primary absolute end-3 top-1/2 size-5 -translate-y-1/2",
                          "aria-hidden": true
                        }
                      ) : null
                    ]
                  },
                  v
                )) }),
                /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mt-3 text-xs", children: "Next: choose your main training goal. Your profile is saved after that step." })
              ]
            }
          ) : null,
          phase === "training_goal" ? /* @__PURE__ */ jsxs(
            OnboardingStepShell,
            {
              title: "What’s your main training goal?",
              description: "You can change this anytime in Profile. Optional details go in your profile’s goal notes after setup.",
              stepIndex: 6,
              stepTotal: PROFILE_STEP_COUNT,
              onBack: () => goBackProfile("training_goal"),
              showBack: true,
              headerEnd: skipButton,
              footer: /* @__PURE__ */ jsxs(
                Button,
                {
                  type: "button",
                  className: "min-h-14 w-full text-base",
                  onClick: () => void saveProfile(),
                  disabled: !isGoalPreset(goalPreset) || savingProfile || !online || finishing,
                  children: [
                    savingProfile ? /* @__PURE__ */ jsx(Loader2, { className: "size-4 animate-spin" }) : null,
                    "Save and continue",
                    /* @__PURE__ */ jsx(ArrowRight, { className: "size-4" })
                  ]
                }
              ),
              children: [
                /* @__PURE__ */ jsx(
                  "div",
                  {
                    className: "border-border grid w-full grid-cols-2 gap-1 rounded-xl border bg-muted/40 p-1 sm:grid-cols-4",
                    role: "tablist",
                    "aria-label": "Primary training goal",
                    children: ONBOARDING_GOAL_CHOICES.map(({ id, label, Icon }) => {
                      const selected = goalPreset === id;
                      return /* @__PURE__ */ jsxs(
                        "button",
                        {
                          type: "button",
                          role: "tab",
                          "aria-selected": selected,
                          "aria-label": label,
                          className: cn(
                            "inline-flex min-h-11 w-full min-w-0 flex-1 items-center justify-center rounded-lg px-1.5 text-xs font-medium transition-colors touch-manipulation",
                            "flex-col gap-1 py-2.5 text-center sm:flex-row sm:gap-2 sm:px-2 sm:text-sm",
                            selected ? "bg-primary text-primary-foreground shadow-sm ring-1 ring-inset ring-primary-foreground/20" : "text-muted-foreground hover:bg-background/80 hover:text-foreground dark:hover:bg-background/40"
                          ),
                          onClick: () => setGoalPreset(id),
                          children: [
                            /* @__PURE__ */ jsx(Icon, { className: "size-5 shrink-0", "aria-hidden": true }),
                            label
                          ]
                        },
                        id
                      );
                    })
                  }
                ),
                /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mt-3 text-xs", children: !online ? "You need a connection to save your profile." : "Saves to your account with your height, weight, and demographics." })
              ]
            }
          ) : null,
          phase === "goals" ? /* @__PURE__ */ jsx(
            OnboardingStepShell,
            {
              title: `What do you want to use ${APP_BRAND_NAME} for?`,
              description: "You can turn on both. We’ll take you through each one step by step.",
              stepIndex: 1,
              stepTotal: 1,
              onBack: () => setPhase("training_goal"),
              showBack: true,
              headerEnd: skipButton,
              footer: /* @__PURE__ */ jsxs(
                Button,
                {
                  type: "button",
                  className: "min-h-14 w-full text-base",
                  onClick: nextFromGoals,
                  disabled: !wantMeal && !wantWorkout,
                  children: [
                    "Continue",
                    /* @__PURE__ */ jsx(ArrowRight, { className: "size-4" })
                  ]
                }
              ),
              children: /* @__PURE__ */ jsx("div", { className: "grid gap-3", children: [
                {
                  on: wantMeal,
                  set: () => setWantMeal((v) => !v),
                  label: "Meal planning",
                  emoji: "🥗"
                },
                {
                  on: wantWorkout,
                  set: () => setWantWorkout((v) => !v),
                  label: "Workouts",
                  emoji: "💪"
                }
              ].map(({ on, set, label, emoji }) => /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: set,
                  className: cn(
                    "hover:border-primary/40 flex min-h-20 w-full items-center justify-between gap-3 rounded-2xl border-2 p-4 text-left touch-manipulation active:scale-[0.99]",
                    on ? "border-primary bg-primary/8 ring-primary/25 ring-2" : "border-border bg-card"
                  ),
                  children: [
                    /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-3", children: [
                      /* @__PURE__ */ jsx("span", { className: "text-2xl", "aria-hidden": true, children: emoji }),
                      /* @__PURE__ */ jsx("span", { className: "text-base font-semibold", children: label })
                    ] }),
                    on ? /* @__PURE__ */ jsx(Check, { className: "text-primary size-6" }) : null
                  ]
                },
                label
              )) })
            }
          ) : null,
          phase === "meal_chips" && wantMeal ? /* @__PURE__ */ jsx(
            OnboardingChipsPage,
            {
              title: "Style for your first meal week",
              description: "Quick taps — you can add details on the next screen.",
              stepIndex: 1,
              stepTotal: mealStepTotal,
              chips: MEAL_ONBOARDING_CHIPS,
              selected: mealSelected,
              onToggle: (id) => toggle(id, "meal"),
              onBack: () => setPhase("goals"),
              onContinue: () => setPhase("meal_notes"),
              continueLabel: "Next",
              headerEnd: skipButton
            }
          ) : null,
          phase === "meal_notes" && wantMeal ? /* @__PURE__ */ jsx(
            OnboardingNotesPage,
            {
              title: "Anything else?",
              description: "Allergies, budget, time to cook, family size — optional. This will help our AI pick recipes that are tailored to your needs.",
              stepIndex: 2,
              stepTotal: mealStepTotal,
              notes: mealNotes,
              onNotes: setMealNotes,
              onBack: () => setPhase("meal_chips"),
              onContinue: () => setPhase("meal_ai"),
              continueLabel: "Next",
              placeholder: "E.g. nut allergy, 30 min dinners, high protein…",
              headerEnd: skipButton
            }
          ) : null,
          phase === "meal_ai" && wantMeal ? /* @__PURE__ */ jsx(
            OnboardingAiResult,
            {
              title: "Build your first week of meals",
              description: "We’ll create recipes and fill your week using AI. You can edit them later in Nutrition.",
              stepIndex: 3,
              stepTotal: mealStepTotal,
              onBack: () => setPhase("meal_notes"),
              onGenerate: genMeal,
              onContinue: () => setPhase("meal_review"),
              onRetry: retryMeal,
              generateLabel: "Generate my week",
              continueLabel: "Next",
              busy: mealStatus === "submitted" || mealStatus === "streaming",
              canContinue: Boolean(mealCanContinue),
              continueDisabled: finishing,
              messages: mealMessages,
              errorText: mealError?.message,
              status: mealStatus,
              started: mealStarted,
              retrying: mealRetrying,
              headerEnd: skipButton
            }
          ) : null,
          phase === "meal_review" && wantMeal ? /* @__PURE__ */ jsx(
            OnboardingStepShell,
            {
              title: "Review your week",
              description: "Here’s what we added to your plan. Tap any meal to view the recipe and ingredients.",
              stepIndex: 4,
              stepTotal: mealStepTotal,
              onBack: () => setPhase("meal_ai"),
              showBack: true,
              headerEnd: skipButton,
              footer: /* @__PURE__ */ jsxs("div", { className: "flex w-full flex-col gap-2", children: [
                /* @__PURE__ */ jsxs(
                  Button,
                  {
                    type: "button",
                    className: "min-h-14 w-full text-base",
                    onClick: afterMeal,
                    disabled: finishing,
                    children: [
                      "Looks good to me!",
                      /* @__PURE__ */ jsx(ArrowRight, { className: "size-4" })
                    ]
                  }
                ),
                /* @__PURE__ */ jsx(
                  Button,
                  {
                    type: "button",
                    variant: "secondary",
                    className: "min-h-14 w-full text-base",
                    onClick: () => setPhase("meal_change_chat"),
                    disabled: finishing,
                    children: "I want to make changes"
                  }
                )
              ] }),
              children: /* @__PURE__ */ jsx(OnboardingMealPlanReview, { weekKey })
            }
          ) : null,
          phase === "meal_change_chat" && wantMeal ? /* @__PURE__ */ jsx(
            OnboardingMealRefinementPanel,
            {
              weekKey,
              messages: mealMessages,
              status: mealStatus,
              errorText: mealError?.message,
              onSend: (t) => {
                clearMealError();
                void sendMeal({ text: t });
              },
              onRegenerateMessage: (id) => {
                void regenerateMeal({ messageId: id });
              },
              onRetry: retryMeal,
              onBack: () => setPhase("meal_review"),
              onContinue: afterMeal,
              continueLabel: wantWorkout ? "I'm happy with my week — next: workout" : "I'm happy with my week — finish setup",
              finishing,
              online,
              busy: mealStatus === "submitted" || mealStatus === "streaming",
              headerEnd: skipButton,
              retrying: mealRetrying,
              stepIndex: 5,
              stepTotal: mealStepTotal
            }
          ) : null,
          phase === "workout_chips" && wantWorkout ? /* @__PURE__ */ jsx(
            OnboardingChipsPage,
            {
              title: "Focus for your first workout",
              description: "We’ll use these to pick exercises. You can add notes next.",
              stepIndex: 1,
              stepTotal: workoutStepTotal,
              chips: WORKOUT_ONBOARDING_CHIPS,
              selected: workoutSelected,
              onToggle: (id) => toggle(id, "workout"),
              onBack: () => wantMeal ? setPhase("meal_review") : setPhase("goals"),
              onContinue: () => setPhase("workout_notes"),
              continueLabel: "Next",
              headerEnd: skipButton
            }
          ) : null,
          phase === "workout_notes" && wantWorkout ? /* @__PURE__ */ jsx(
            OnboardingNotesPage,
            {
              title: "Details for your workout",
              description: "Injuries, days per week, equipment limits — all optional.",
              stepIndex: 2,
              stepTotal: workoutStepTotal,
              notes: workoutNotes,
              onNotes: setWorkoutNotes,
              onBack: () => setPhase("workout_chips"),
              onContinue: () => setPhase("workout_ai"),
              continueLabel: "Next",
              placeholder: "E.g. bad left shoulder, 3x week, only dumbbells at home…",
              headerEnd: skipButton
            }
          ) : null,
          phase === "workout_ai" && wantWorkout ? /* @__PURE__ */ jsx(
            OnboardingAiResult,
            {
              title: "Create your first saved workout",
              description: "The assistant will add a workout you can start from the Workouts tab.",
              stepIndex: 3,
              stepTotal: workoutStepTotal,
              onBack: () => setPhase("workout_notes"),
              onGenerate: genWorkout,
              onContinue: afterWorkout,
              onRetry: retryWorkout,
              generateLabel: "Generate my workout",
              continueLabel: "Finish setup",
              busy: workoutStatus === "submitted" || workoutStatus === "streaming",
              canContinue: Boolean(workoutCanContinue),
              continueDisabled: finishing,
              messages: workoutMessages,
              errorText: workoutError?.message,
              status: workoutStatus,
              started: workoutStarted,
              retrying: workoutRetrying,
              headerEnd: skipButton
            }
          ) : null
        ] })
      ]
    }
  );
}
function OnboardingPage() {
  const {
    userId,
    loading
  } = useLocalSession();
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "text-muted-foreground flex h-full min-h-0 w-full min-w-0 flex-1 items-center justify-center p-6 text-sm md:bg-muted/40", children: "Loading…" });
  }
  if (!userId) return null;
  return /* @__PURE__ */ jsx("div", { className: "flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-x-hidden bg-background md:bg-muted/40 md:px-6 md:py-6 lg:px-10", children: /* @__PURE__ */ jsx(OnboardingFlow, { userId }) });
}
export {
  OnboardingPage as component
};
