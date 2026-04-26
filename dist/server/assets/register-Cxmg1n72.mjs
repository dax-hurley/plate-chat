import { jsxs, jsx } from "react/jsx-runtime";
import { useNavigate, Link } from "@tanstack/react-router";
import { User, Mail, Lock, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { B as Button } from "./button-DbVXcFD_.mjs";
import { L as Label, I as Input } from "./label-BX01hlq_.mjs";
import { A as APP_BRAND_NAME } from "./router-CUOzYYmk.mjs";
import { a as authClient, A as AuthThemeMenu, B as BrandMark } from "./theme-appearance-CTrnypxL.mjs";
import { b as bootstrapDeviceSession } from "./bootstrap-session-Cjb9SvUA.mjs";
import "@base-ui/react/button";
import "class-variance-authority";
import "./utils-H80jjgLf.mjs";
import "clsx";
import "tailwind-merge";
import "@base-ui/react/input";
import "dexie";
import "@capacitor/core";
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
import "nanostores";
import "@better-fetch/fetch";
import "@better-auth/core/utils/string";
import "@base-ui/react/menu";
function RegisterForm() {
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  async function onSubmit(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");
    if (!email || !password) {
      toast.error("Email and password are required.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setPending(true);
    try {
      const res = await authClient.signUp.email({ email, password, name });
      if (!res.data?.user?.id) {
        toast.error(res.error?.message ?? "Could not create account.");
        return;
      }
      await bootstrapDeviceSession({
        userId: res.data.user.id,
        email: res.data.user.email ?? email,
        name: res.data.user.name ?? name ?? null
      });
      toast.success(`Welcome to ${APP_BRAND_NAME}!`);
      await navigate({ to: "/app" });
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }
  return /* @__PURE__ */ jsxs("form", { method: "post", action: "#", onSubmit, className: "space-y-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxs(Label, { htmlFor: "name", className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(User, { className: "text-primary size-4", "aria-hidden": true }),
        "Name (optional)"
      ] }),
      /* @__PURE__ */ jsx(
        Input,
        {
          id: "name",
          name: "name",
          type: "text",
          autoComplete: "name",
          className: "min-h-12 text-base"
        }
      )
    ] }),
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
          autoComplete: "new-password",
          required: true,
          minLength: 8,
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
          /* @__PURE__ */ jsx(UserPlus, { className: "size-4 opacity-90", "aria-hidden": true }),
          pending ? "Creating…" : "Create account"
        ]
      }
    )
  ] });
}
function RegisterPage() {
  return /* @__PURE__ */ jsxs("div", { className: "auth-shell relative flex min-h-dvh flex-col justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]", children: [
    /* @__PURE__ */ jsx(AuthThemeMenu, {}),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto w-full max-w-sm space-y-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
        /* @__PURE__ */ jsx("div", { className: "mb-4 flex justify-center", children: /* @__PURE__ */ jsx(BrandMark, { className: "size-14 [&_svg]:size-8 shadow-md shadow-primary/20" }) }),
        /* @__PURE__ */ jsxs("h1", { className: "flex items-center justify-center gap-2 text-2xl font-semibold tracking-tight", children: [
          /* @__PURE__ */ jsx(UserPlus, { className: "text-primary size-7 shrink-0", "aria-hidden": true }),
          "Create account"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mt-2 text-sm", children: "Track workouts and nutrition in one place" })
      ] }),
      /* @__PURE__ */ jsx(RegisterForm, {}),
      /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground text-center text-sm", children: [
        "Already have an account?",
        " ",
        /* @__PURE__ */ jsx(Link, { to: "/login", className: "text-primary min-h-11 inline-flex items-center font-medium underline-offset-4 hover:underline", children: "Sign in" })
      ] })
    ] })
  ] });
}
export {
  RegisterPage as component
};
