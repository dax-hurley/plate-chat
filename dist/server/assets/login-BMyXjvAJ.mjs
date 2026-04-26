import { jsxs, jsx } from "react/jsx-runtime";
import { useSearch, useNavigate, Link } from "@tanstack/react-router";
import { Mail, Lock, LogIn } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { B as Button } from "./button-DbVXcFD_.mjs";
import { L as Label, I as Input } from "./label-BX01hlq_.mjs";
import { a as authClient, A as AuthThemeMenu, B as BrandMark } from "./theme-appearance-CTrnypxL.mjs";
import { b as bootstrapDeviceSession } from "./bootstrap-session-Cjb9SvUA.mjs";
import { k as Route } from "./router-CUOzYYmk.mjs";
import "@base-ui/react/button";
import "class-variance-authority";
import "./utils-H80jjgLf.mjs";
import "clsx";
import "tailwind-merge";
import "@base-ui/react/input";
import "nanostores";
import "defu";
import "@better-fetch/fetch";
import "@better-auth/core/utils/string";
import "next-themes";
import "@base-ui/react/menu";
import "dexie";
import "@capacitor/core";
import "drizzle-zod";
import "drizzle-orm";
import "drizzle-orm/sqlite-core";
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
const SENSITIVE_KEYS = ["email", "password", "passwd", "pwd", "pass"];
function SanitizeLoginUrl() {
  const search = useSearch({ strict: false });
  const navigate = useNavigate();
  useEffect(() => {
    const next = { ...search };
    let dirty = false;
    for (const k of SENSITIVE_KEYS) {
      if (k in next) {
        delete next[k];
        dirty = true;
      }
    }
    if (dirty) {
      void navigate({ to: "/login", search: next, replace: true });
    }
  }, [search, navigate]);
  return null;
}
function LoginForm({ callbackUrl }) {
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  async function onSubmit(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    if (!email || !password) {
      toast.error("Enter your email and password.");
      return;
    }
    setPending(true);
    try {
      const res = await authClient.signIn.email({ email, password });
      if (!res.data?.user?.id) {
        toast.error(res.error?.message ?? "Invalid email or password.");
        return;
      }
      await bootstrapDeviceSession({
        userId: res.data.user.id,
        email: res.data.user.email ?? email,
        name: res.data.user.name ?? null
      });
      await navigate({ to: callbackUrl ?? "/app" });
    } catch {
      toast.error(
        "Could not reach the server. Check your connection and try again."
      );
    } finally {
      setPending(false);
    }
  }
  return /* @__PURE__ */ jsxs("form", { method: "post", action: "#", onSubmit, className: "space-y-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxs(Label, { htmlFor: "email", className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Mail, { className: "text-primary size-4", "aria-hidden": true }),
        "Email"
      ] }),
      /* @__PURE__ */ jsx(
        Input,
        {
          id: "email",
          name: "email",
          type: "email",
          autoComplete: "email",
          required: true,
          className: "min-h-12 text-base"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxs(Label, { htmlFor: "password", className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Lock, { className: "text-primary size-4", "aria-hidden": true }),
        "Password"
      ] }),
      /* @__PURE__ */ jsx(
        Input,
        {
          id: "password",
          name: "password",
          type: "password",
          autoComplete: "current-password",
          required: true,
          className: "min-h-12 text-base"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs(
      Button,
      {
        type: "submit",
        className: "min-h-12 w-full gap-2 text-base shadow-sm",
        disabled: pending,
        children: [
          /* @__PURE__ */ jsx(LogIn, { className: "size-4 opacity-90", "aria-hidden": true }),
          pending ? "Signing in…" : "Sign in"
        ]
      }
    )
  ] });
}
function LoginPage() {
  const {
    callbackUrl
  } = Route.useSearch();
  return /* @__PURE__ */ jsxs("div", { className: "auth-shell relative flex min-h-dvh flex-col justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]", children: [
    /* @__PURE__ */ jsx(SanitizeLoginUrl, {}),
    /* @__PURE__ */ jsx(AuthThemeMenu, {}),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto w-full max-w-sm space-y-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
        /* @__PURE__ */ jsx("div", { className: "mb-4 flex justify-center", children: /* @__PURE__ */ jsx(BrandMark, { className: "size-14 [&_svg]:size-8 shadow-md shadow-primary/20" }) }),
        /* @__PURE__ */ jsxs("h1", { className: "flex items-center justify-center gap-2 text-2xl font-semibold tracking-tight", children: [
          /* @__PURE__ */ jsx(LogIn, { className: "text-primary size-7 shrink-0", "aria-hidden": true }),
          "Welcome back"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mt-2 text-sm", children: "Sign in to continue your training log" })
      ] }),
      /* @__PURE__ */ jsx(LoginForm, { callbackUrl }),
      /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground text-center text-sm", children: [
        "No account?",
        " ",
        /* @__PURE__ */ jsx(Link, { to: "/register", className: "text-primary min-h-11 inline-flex items-center font-medium underline-offset-4 hover:underline", children: "Create one" })
      ] })
    ] })
  ] });
}
export {
  LoginPage as component
};
