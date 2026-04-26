import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useNavigate, Link, useLocation, useRouterState, Outlet } from "@tanstack/react-router";
import { useState, useSyncExternalStore, useEffect, useMemo } from "react";
import { a as useLocalSession } from "./writes-C61wFNCm.mjs";
import { ChevronDown, User, UserRound, LogOut, Dumbbell, Home, UtensilsCrossed, Activity, Sparkles } from "lucide-react";
import { a as authClient, D as DropdownMenu, b as DropdownMenuTrigger, c as DropdownMenuContent, d as DropdownMenuSeparator, e as DropdownMenuItem, f as AppHeaderThemeMenu, B as BrandMark } from "./theme-appearance-CTrnypxL.mjs";
import { a3 as stopSyncRunner, a4 as clearTokens, a5 as resetDb, a6 as subscribeSyncing, a7 as getSyncingSnapshot, A as APP_BRAND_NAME, u as useDb } from "./router-CUOzYYmk.mjs";
import { b as buttonVariants } from "./button-DbVXcFD_.mjs";
import { c as cn } from "./utils-H80jjgLf.mjs";
import { u as useWorkoutLiveUi, c as clearWorkoutLiveUi, a as WorkoutRestCountdown, W as WorkoutElapsedTimer } from "./workout-live-ui-rILdFPTD.mjs";
import { Popover } from "@base-ui/react/popover";
import { u as useOnline } from "./use-online-B1QDuTlA.mjs";
import { u as useActiveSession, c as useWorkoutTemplate } from "./workouts-DSVvumuN.mjs";
import "dexie";
import "dexie-react-hooks";
import "@capacitor/core";
import { a as useCoachRuntime, b as CoachRuntimeProvider, c as CoachMainArea } from "./coach-runtime-BX8b2qqH.mjs";
import "nanostores";
import "defu";
import "@better-fetch/fetch";
import "@better-auth/core/utils/string";
import "next-themes";
import "@base-ui/react/menu";
import "drizzle-zod";
import "drizzle-orm";
import "drizzle-orm/sqlite-core";
import "sonner";
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
import "@base-ui/react/button";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "./format-duration-DOYRzqf7.mjs";
import "./ids-zMPBJmub.mjs";
import "@ai-sdk/react";
import "./dialog-OkPnLnLD.mjs";
import "@base-ui/react/dialog";
import "@base-ui/react/tabs";
import "./assistant-message-parts-Cx-nfSv6.mjs";
import "./assistant-markdown-BkDNTUMc.mjs";
import "react-markdown";
import "remark-gfm";
import "./confirm-dialog-L0Y1JjA8.mjs";
import "./scroll-area-BUy2INq0.mjs";
import "@base-ui/react/scroll-area";
async function signOutLocal() {
  stopSyncRunner();
  try {
    await authClient.signOut();
  } catch {
  }
  await clearTokens();
  await resetDb();
}
function profileInitial(name, email) {
  const raw = name?.trim() || email?.trim();
  if (!raw) return "?";
  const c = raw[0];
  return c ? c.toUpperCase() : "?";
}
function AppHeaderProfileMenu({
  email,
  name
}) {
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const initial = profileInitial(name ?? void 0, email ?? void 0);
  const displayName = name?.trim() || null;
  async function onSignOut() {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await signOutLocal();
    } finally {
      await navigate({ to: "/login" });
    }
  }
  return /* @__PURE__ */ jsxs(DropdownMenu, { children: [
    /* @__PURE__ */ jsxs(
      DropdownMenuTrigger,
      {
        className: cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "h-10 gap-2 rounded-full border-primary/25 pr-2.5 pl-1.5 aria-expanded:bg-muted"
        ),
        "aria-label": "Account menu",
        children: [
          /* @__PURE__ */ jsx("span", { className: "bg-primary/15 text-primary flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold", children: initial }),
          /* @__PURE__ */ jsx(ChevronDown, { className: "size-4 opacity-60", "aria-hidden": true })
        ]
      }
    ),
    /* @__PURE__ */ jsxs(
      DropdownMenuContent,
      {
        align: "end",
        className: "min-w-[14rem] w-[min(100vw-2rem,16rem)]",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "px-2 py-2", children: [
            displayName ? /* @__PURE__ */ jsx("p", { className: "truncate text-sm font-medium leading-tight", children: displayName }) : null,
            email ? /* @__PURE__ */ jsx(
              "p",
              {
                className: cn(
                  "truncate text-muted-foreground text-xs leading-snug",
                  displayName ? "mt-1" : ""
                ),
                children: email
              }
            ) : /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground flex items-center gap-2 text-xs", children: [
              /* @__PURE__ */ jsx(User, { className: "size-3.5 shrink-0 opacity-70", "aria-hidden": true }),
              "Signed in"
            ] })
          ] }),
          /* @__PURE__ */ jsx(DropdownMenuSeparator, {}),
          /* @__PURE__ */ jsxs(
            DropdownMenuItem,
            {
              onClick: () => {
                void navigate({ to: "/app/profile" });
              },
              children: [
                /* @__PURE__ */ jsx(UserRound, { className: "size-4", "aria-hidden": true }),
                "Profile"
              ]
            }
          ),
          /* @__PURE__ */ jsx(DropdownMenuSeparator, {}),
          /* @__PURE__ */ jsxs(
            DropdownMenuItem,
            {
              variant: "destructive",
              disabled: isSigningOut,
              onClick: () => {
                void onSignOut();
              },
              children: [
                /* @__PURE__ */ jsx(LogOut, { className: "size-4", "aria-hidden": true }),
                "Sign out"
              ]
            }
          )
        ]
      }
    )
  ] });
}
function SimpleTooltip({
  text,
  children,
  className,
  delay = 200,
  closeDelay = 0
}) {
  return /* @__PURE__ */ jsxs(Popover.Root, { modal: false, children: [
    /* @__PURE__ */ jsx(
      Popover.Trigger,
      {
        type: "button",
        className: cn(
          "inline-flex min-h-9 min-w-9 touch-manipulation items-center justify-center",
          "rounded-full border-0 bg-transparent p-0 outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring/50",
          className
        ),
        openOnHover: true,
        closeDelay,
        delay,
        "aria-label": text,
        nativeButton: true,
        children
      }
    ),
    /* @__PURE__ */ jsx(Popover.Portal, { children: /* @__PURE__ */ jsx(
      Popover.Positioner,
      {
        className: "isolate z-50 outline-none",
        side: "bottom",
        sideOffset: 6,
        children: /* @__PURE__ */ jsx(
          Popover.Popup,
          {
            className: cn(
              "max-w-[12rem] origin-(--transform-origin) rounded-md bg-popover px-2.5 py-1.5 text-pretty text-left text-popover-foreground text-xs leading-snug",
              "shadow-md ring-1 ring-foreground/10",
              "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
              "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
            ),
            role: "tooltip",
            children: text
          }
        )
      }
    ) })
  ] });
}
function useSyncing() {
  return useSyncExternalStore(subscribeSyncing, getSyncingSnapshot, () => false);
}
function AppHeaderWorkoutSubtitle({
  exerciseName,
  restDeadlineMs
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [restDeadlineMs]);
  const remaining = restDeadlineMs != null ? Math.max(0, Math.ceil((restDeadlineMs - now) / 1e3)) : 0;
  const resting = restDeadlineMs != null && remaining > 0;
  const phase = resting ? "Rest now" : "Working set";
  return /* @__PURE__ */ jsx("span", { className: "text-muted-foreground block max-w-full truncate text-[0.7rem] leading-tight sm:text-xs", children: exerciseName ? /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("span", { className: "text-foreground/90 font-medium", children: exerciseName }),
    /* @__PURE__ */ jsxs("span", { children: [
      " · ",
      phase
    ] })
  ] }) : phase });
}
function AppHeaderWorkoutTimer({
  startedAtMs,
  initialElapsedSec,
  restDeadlineMs
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (restDeadlineMs == null) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [restDeadlineMs]);
  const restRemaining = restDeadlineMs != null ? Math.max(0, Math.ceil((restDeadlineMs - now) / 1e3)) : 0;
  const showRest = restDeadlineMs != null && restRemaining > 0;
  if (showRest && restDeadlineMs != null) {
    return /* @__PURE__ */ jsx(
      WorkoutRestCountdown,
      {
        variant: "compact",
        className: "shrink-0",
        deadlineMs: restDeadlineMs
      }
    );
  }
  return /* @__PURE__ */ jsx(
    WorkoutElapsedTimer,
    {
      variant: "compact",
      className: "shrink-0",
      startedAtMs,
      initialElapsedSec
    }
  );
}
function AppHeader() {
  const { tokens } = useLocalSession();
  const online = useOnline();
  const syncing = useSyncing();
  const { data: activeSession, loading: activeSessionLoading } = useActiveSession();
  const { data: activeTemplate } = useWorkoutTemplate(
    activeSession?.templateId ?? null
  );
  const liveUi = useWorkoutLiveUi();
  useEffect(() => {
    if (activeSessionLoading) return;
    if (!activeSession) {
      clearWorkoutLiveUi();
    }
  }, [activeSession, activeSessionLoading]);
  const showActiveBar = Boolean(activeSession) && !activeSessionLoading;
  const sessionTitle = activeSession ? activeSession.templateId ? activeTemplate?.name ?? "Workout" : "Workout" : "";
  const { startedAtMs, initialElapsedSec } = useMemo(() => {
    if (!activeSession) {
      return { startedAtMs: 0, initialElapsedSec: 0 };
    }
    const ms = activeSession.startedAt;
    return {
      startedAtMs: ms,
      initialElapsedSec: Math.max(0, Math.floor((Date.now() - ms) / 1e3))
    };
  }, [activeSession]);
  const headerLiveMatches = activeSession != null && liveUi.sessionId === activeSession.id;
  const activeWorkoutLink = showActiveBar && activeSession ? /* @__PURE__ */ jsxs(
    Link,
    {
      to: "/app/workouts/session/$sessionId",
      params: { sessionId: activeSession.id },
      className: cn(
        "bg-primary/8 hover:bg-primary/12 border-primary/20",
        "flex min-w-0 w-full max-w-lg items-center gap-2 overflow-hidden rounded-xl border",
        "px-2.5 py-1.5 text-left transition-colors",
        "touch-manipulation sm:px-3"
      ),
      title: `Open ${sessionTitle}`,
      "aria-label": `Active workout: ${sessionTitle}. Open session.`,
      children: [
        /* @__PURE__ */ jsx(
          Dumbbell,
          {
            className: "text-primary size-4 shrink-0 sm:size-[1.125rem]",
            "aria-hidden": true
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsx("span", { className: "block truncate text-sm font-medium sm:text-base", children: sessionTitle }),
          headerLiveMatches ? /* @__PURE__ */ jsx(
            AppHeaderWorkoutSubtitle,
            {
              exerciseName: liveUi.currentExerciseName,
              restDeadlineMs: liveUi.restDeadlineMs
            }
          ) : null
        ] }),
        /* @__PURE__ */ jsx(
          AppHeaderWorkoutTimer,
          {
            startedAtMs,
            initialElapsedSec,
            restDeadlineMs: headerLiveMatches ? liveUi.restDeadlineMs : null
          }
        )
      ]
    }
  ) : null;
  const statusTooltip = syncing ? "Syncing…" : !online ? "Offline; saves locally" : "Connected";
  const headerControls = /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(SimpleTooltip, { text: statusTooltip, className: "-m-0.5 shrink-0", children: /* @__PURE__ */ jsx(
      "span",
      {
        className: cn(
          "size-2.5 rounded-full",
          !online && "bg-red-500",
          online && "bg-emerald-600 ring-1 ring-emerald-900/30 dark:bg-green-500 dark:ring-1 dark:ring-lime-200/35",
          syncing && "animate-pulse"
        )
      }
    ) }),
    /* @__PURE__ */ jsx(AppHeaderThemeMenu, {}),
    /* @__PURE__ */ jsx(
      AppHeaderProfileMenu,
      {
        email: tokens?.email ?? null,
        name: tokens?.name ?? null
      }
    )
  ] });
  return /* @__PURE__ */ jsx("header", { className: "bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-40 border-b pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur-md md:border-l-0", children: /* @__PURE__ */ jsx(
    "div",
    {
      className: cn(
        "mx-auto h-16 w-full min-w-0 max-w-xl items-center gap-2 px-5 md:max-w-none md:px-12",
        showActiveBar ? "grid min-w-0 grid-cols-[1fr_minmax(0,32rem)_1fr] sm:gap-3" : "flex justify-between md:justify-end"
      ),
      children: showActiveBar ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("div", { className: "flex min-w-0 items-center justify-self-start sm:gap-3", children: /* @__PURE__ */ jsxs(
          Link,
          {
            to: "/app",
            className: "flex min-w-0 shrink-0 items-center gap-2.5 md:hidden",
            children: [
              /* @__PURE__ */ jsx(BrandMark, { className: "size-8 shrink-0 [&_svg]:size-[1.15rem]" }),
              /* @__PURE__ */ jsx("span", { className: "text-lg font-semibold tracking-tight", children: APP_BRAND_NAME })
            ]
          }
        ) }),
        /* @__PURE__ */ jsx("div", { className: "flex min-w-0 items-center justify-center justify-self-center", children: activeWorkoutLink }),
        /* @__PURE__ */ jsx("div", { className: "flex min-w-0 items-center justify-end justify-self-end gap-2", children: headerControls })
      ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs(
          Link,
          {
            to: "/app",
            className: "flex min-w-0 shrink-0 items-center gap-2.5 md:hidden",
            children: [
              /* @__PURE__ */ jsx(BrandMark, { className: "size-8 shrink-0 [&_svg]:size-[1.15rem]" }),
              /* @__PURE__ */ jsx("span", { className: "text-lg font-semibold tracking-tight", children: APP_BRAND_NAME })
            ]
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "flex min-w-0 shrink-0 items-center justify-end gap-2", children: headerControls })
      ] })
    }
  ) });
}
const mainLinks = [
  { href: "/app", label: "Home", icon: Home },
  { href: "/app/workouts", label: "Workouts", icon: Dumbbell },
  { href: "/app/nutrition", label: "Nutrition", icon: UtensilsCrossed },
  { href: "/app/progress", label: "Progress", icon: Activity },
  { href: "/app/coach", label: "AI Coach", icon: Sparkles }
];
function isActive(pathname, href) {
  if (href === "/app") return pathname === "/app";
  return pathname.startsWith(href);
}
function CoachNavWorkingDots({ dotClassName }) {
  return /* @__PURE__ */ jsx("span", { className: "flex items-center justify-center gap-[1.5px]", "aria-hidden": true, children: [0, 1, 2].map((i) => /* @__PURE__ */ jsx(
    "span",
    {
      className: cn("coach-nav-dot size-[2.5px] shrink-0 rounded-full", dotClassName),
      style: { animationDelay: `${i * 140}ms` }
    },
    i
  )) });
}
function CoachNavGlyph({
  coachAgentWorking,
  coachHasUnreadFromAssistant,
  sparklesClassName,
  variant
}) {
  const coachHighlighted = variant === "sidebarActive" || variant === "tabActive";
  const workingBadgeClass = coachHighlighted ? "bg-white ring-2 ring-primary shadow-sm dark:bg-white dark:ring-primary dark:shadow-sm" : "bg-primary ring-2 ring-white shadow-sm dark:bg-primary dark:ring-white dark:shadow-sm";
  const workingDotClass = coachHighlighted ? "bg-primary dark:bg-primary" : "bg-white dark:bg-white";
  const unreadRing = variant === "sidebar" || variant === "sidebarActive" ? variant === "sidebarActive" ? "ring-white dark:ring-zinc-100" : "ring-background" : variant === "tabActive" ? "ring-white dark:ring-zinc-100" : "ring-background";
  return /* @__PURE__ */ jsxs("span", { className: "relative inline-flex shrink-0 items-center justify-center", children: [
    /* @__PURE__ */ jsx(Sparkles, { className: sparklesClassName, "aria-hidden": true }),
    coachAgentWorking ? /* @__PURE__ */ jsx(
      "span",
      {
        className: cn(
          "absolute -top-0.5 -right-0.5 flex size-[0.9375rem] items-center justify-center rounded-full md:size-4",
          workingBadgeClass
        ),
        "aria-hidden": true,
        children: /* @__PURE__ */ jsx(CoachNavWorkingDots, { dotClassName: workingDotClass })
      }
    ) : coachHasUnreadFromAssistant ? /* @__PURE__ */ jsx(
      "span",
      {
        className: cn(
          "absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-destructive ring-2",
          unreadRing
        ),
        "aria-hidden": true
      }
    ) : null
  ] });
}
function AppNav() {
  const pathname = useLocation({ select: (s) => s.pathname });
  const {
    openCoach,
    closeCoach,
    isCoachOpen,
    coachAgentWorking,
    coachHasUnreadFromAssistant
  } = useCoachRuntime();
  function onNavLinkClick() {
    if (isCoachOpen) closeCoach();
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs(
      "aside",
      {
        className: "bg-sidebar/98 supports-[backdrop-filter]:bg-sidebar/90 border-sidebar-border fixed left-0 top-0 z-50 hidden h-dvh w-60 flex-col border-r pt-[max(0.75rem,env(safe-area-inset-top))] shadow-[2px_0_24px_-12px_oklch(0.12_0.02_260_/_0.45)] backdrop-blur-md md:flex",
        "aria-label": "Main navigation",
        children: [
          /* @__PURE__ */ jsx("div", { className: "border-sidebar-border border-b px-5 py-6", children: /* @__PURE__ */ jsxs(
            Link,
            {
              to: "/app",
              onClick: onNavLinkClick,
              className: "hover:bg-sidebar-accent/80 flex items-center gap-3.5 rounded-xl p-1.5 transition-colors",
              children: [
                /* @__PURE__ */ jsx(BrandMark, {}),
                /* @__PURE__ */ jsx("span", { className: "text-sidebar-foreground text-lg font-semibold tracking-tight", children: APP_BRAND_NAME })
              ]
            }
          ) }),
          /* @__PURE__ */ jsx("nav", { className: "flex flex-1 flex-col gap-2 p-4", children: mainLinks.map(({ href, label, icon: Icon }) => {
            if (href === "/app/coach") {
              const active2 = isCoachOpen;
              return /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  "aria-label": "Open AI Coach",
                  "aria-busy": coachAgentWorking,
                  onClick: () => isCoachOpen ? closeCoach() : openCoach(),
                  className: cn(
                    "text-sidebar-foreground/75 flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-medium transition-colors",
                    active2 && "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  ),
                  children: [
                    /* @__PURE__ */ jsx(
                      CoachNavGlyph,
                      {
                        coachAgentWorking,
                        coachHasUnreadFromAssistant,
                        sparklesClassName: "size-5 shrink-0",
                        variant: active2 ? "sidebarActive" : "sidebar"
                      }
                    ),
                    /* @__PURE__ */ jsx("span", { className: "flex min-w-0 flex-1 items-center gap-2", children: label })
                  ]
                },
                href
              );
            }
            const active = !isCoachOpen && isActive(pathname, href);
            return /* @__PURE__ */ jsxs(
              Link,
              {
                to: href,
                onClick: onNavLinkClick,
                className: cn(
                  "text-sidebar-foreground/75 flex min-h-12 items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-colors",
                  active && "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                ),
                children: [
                  /* @__PURE__ */ jsx(Icon, { className: "size-5 shrink-0", "aria-hidden": true }),
                  label
                ]
              },
              href
            );
          }) }),
          /* @__PURE__ */ jsx("div", { className: "border-sidebar-border border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))]", children: /* @__PURE__ */ jsxs(
            Link,
            {
              to: "/app/profile",
              onClick: onNavLinkClick,
              className: cn(
                "text-sidebar-foreground/75 flex min-h-12 items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-colors",
                !isCoachOpen && pathname.startsWith("/app/profile") && "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
              ),
              children: [
                /* @__PURE__ */ jsx(UserRound, { className: "size-5 shrink-0", "aria-hidden": true }),
                "Profile"
              ]
            }
          ) })
        ]
      }
    ),
    /* @__PURE__ */ jsx(
      "nav",
      {
        className: "bg-sidebar/95 supports-[backdrop-filter]:bg-sidebar/90 border-sidebar-border fixed bottom-0 left-0 right-0 z-50 border-t pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-4px_24px_-12px_oklch(0.12_0.02_260_/_0.4)] backdrop-blur-md md:hidden",
        "aria-label": "Main",
        children: /* @__PURE__ */ jsx("div", { className: "mx-auto flex max-w-xl items-stretch justify-around gap-2 px-4", children: mainLinks.map(({ href, label, icon: Icon }) => {
          if (href === "/app/coach") {
            const active2 = isCoachOpen;
            return /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                "aria-label": "Open AI Coach",
                "aria-busy": coachAgentWorking,
                onClick: () => isCoachOpen ? closeCoach() : openCoach(),
                className: cn(
                  "text-muted-foreground flex min-h-[3.25rem] min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-2 text-[0.65rem] leading-tight font-medium transition-colors sm:text-xs",
                  active2 && "bg-primary text-primary-foreground shadow-inner"
                ),
                children: [
                  /* @__PURE__ */ jsx(
                    CoachNavGlyph,
                    {
                      coachAgentWorking,
                      coachHasUnreadFromAssistant,
                      sparklesClassName: "size-6 shrink-0",
                      variant: active2 ? "tabActive" : "tabIdle"
                    }
                  ),
                  label
                ]
              },
              href
            );
          }
          const active = !isCoachOpen && isActive(pathname, href);
          return /* @__PURE__ */ jsxs(
            Link,
            {
              to: href,
              onClick: onNavLinkClick,
              className: cn(
                "text-muted-foreground flex min-h-[3.25rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-2 text-[0.65rem] leading-tight font-medium transition-colors sm:text-xs",
                active && "bg-primary text-primary-foreground shadow-inner"
              ),
              children: [
                /* @__PURE__ */ jsx(Icon, { className: "size-6 shrink-0", "aria-hidden": true }),
                label
              ]
            },
            href
          );
        }) })
      }
    )
  ] });
}
function AppShell({ children }) {
  const { ready } = useDb();
  const isOnboarding = useRouterState({
    select: (s) => s.location.pathname.includes("/onboarding")
  });
  if (isOnboarding) {
    return /* @__PURE__ */ jsx(CoachRuntimeProvider, { children: /* @__PURE__ */ jsx("div", { className: "bg-background flex h-dvh max-h-dvh flex-col overflow-hidden", children: /* @__PURE__ */ jsx("main", { className: "flex h-full min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-hidden", children: ready ? children : /* @__PURE__ */ jsx("div", { className: "text-muted-foreground flex min-h-40 items-center justify-center p-6 text-sm", children: "Opening local database…" }) }) }) });
  }
  return /* @__PURE__ */ jsx(CoachRuntimeProvider, { children: /* @__PURE__ */ jsxs("div", { className: "flex h-dvh max-h-dvh flex-col overflow-hidden", children: [
    /* @__PURE__ */ jsx(AppNav, {}),
    /* @__PURE__ */ jsxs("div", { className: "flex min-h-0 flex-1 flex-col overflow-hidden md:pl-60", children: [
      /* @__PURE__ */ jsx(AppHeader, {}),
      /* @__PURE__ */ jsx(CoachMainArea, { children: ready ? children : /* @__PURE__ */ jsx("div", { className: "py-12 text-center text-muted-foreground text-sm", children: "Opening local database…" }) })
    ] })
  ] }) });
}
function AppLayout() {
  const navigate = useNavigate();
  const {
    userId,
    loading
  } = useLocalSession();
  useEffect(() => {
    if (!loading && !userId) void navigate({
      to: "/login"
    });
  }, [loading, userId, navigate]);
  return /* @__PURE__ */ jsx(AppShell, { children: /* @__PURE__ */ jsx(Outlet, {}) });
}
export {
  AppLayout as component
};
