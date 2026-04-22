import { jsxs, jsx } from "react/jsx-runtime";
import { useLocation, Link, useNavigate, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { u as useLocalSession } from "./session-CyYyvQL9.mjs";
import { u as useOnline } from "./use-online-BuWfYSX8.mjs";
import { u as useDb } from "./router-kvjOiOR_.mjs";
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
const nav = [
  { to: "/app/workouts", label: "Workouts" },
  { to: "/app/nutrition", label: "Nutrition" },
  { to: "/app/progress", label: "Progress" },
  { to: "/app/calendar", label: "Calendar" },
  { to: "/app/coach", label: "Coach" },
  { to: "/app/profile", label: "Profile" }
];
function AppShell({ children }) {
  const online = useOnline();
  const { ready } = useDb();
  const location = useLocation();
  return /* @__PURE__ */ jsxs("div", { className: "min-h-dvh flex flex-col", children: [
    !online ? /* @__PURE__ */ jsx("div", { className: "sticky top-0 z-50 bg-amber-500/90 text-amber-950 px-4 py-2 text-sm text-center", children: "You're offline — changes save locally and sync when you reconnect." }) : null,
    /* @__PURE__ */ jsx("header", { className: "border-b bg-background/80 backdrop-blur", children: /* @__PURE__ */ jsx("nav", { className: "max-w-5xl mx-auto flex overflow-x-auto gap-1 px-2 py-2", children: nav.map((item) => {
      const active = location.pathname.startsWith(item.to);
      return /* @__PURE__ */ jsx(
        Link,
        {
          to: item.to,
          className: "px-3 py-2 rounded-md text-sm whitespace-nowrap " + (active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground"),
          children: item.label
        },
        item.to
      );
    }) }) }),
    /* @__PURE__ */ jsx("main", { className: "flex-1 max-w-5xl w-full mx-auto px-4 py-6", children: ready ? children : /* @__PURE__ */ jsx("div", { className: "py-12 text-center text-muted-foreground text-sm", children: "Opening local database…" }) })
  ] });
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
