import { jsx, jsxs } from "react/jsx-runtime";
import { useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { a as authClient, b as bootstrapDeviceSession } from "./bootstrap-session-CSfGwUuu.mjs";
import { u as useOnline } from "./use-online-BuWfYSX8.mjs";
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
import "nanostores";
import "@better-fetch/fetch";
import "@better-auth/core/utils/string";
function RegisterPage() {
  const navigate = useNavigate();
  const online = useOnline();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await authClient.signUp.email({
        email,
        password,
        name
      });
      if (!res.data?.user?.id) {
        setError(res.error?.message ?? "Sign-up failed");
        return;
      }
      await bootstrapDeviceSession({
        userId: res.data.user.id
      });
      await navigate({
        to: "/app"
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsx("div", { className: "auth-shell min-h-dvh flex items-center justify-center p-6", children: /* @__PURE__ */ jsxs("form", { onSubmit, className: "w-full max-w-sm space-y-4 bg-card border rounded-2xl p-6 shadow-sm", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold", children: "Create account" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "You'll stay signed in on this device — no network needed after the first login." })
    ] }),
    !online ? /* @__PURE__ */ jsx("div", { className: "rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-200", children: "You're offline. Reconnect to register." }) : null,
    /* @__PURE__ */ jsxs("label", { className: "block", children: [
      /* @__PURE__ */ jsx("span", { className: "text-sm", children: "Name" }),
      /* @__PURE__ */ jsx("input", { className: "mt-1 block w-full rounded-md border bg-background px-3 py-2", value: name, onChange: (e) => setName(e.target.value), autoComplete: "name" })
    ] }),
    /* @__PURE__ */ jsxs("label", { className: "block", children: [
      /* @__PURE__ */ jsx("span", { className: "text-sm", children: "Email" }),
      /* @__PURE__ */ jsx("input", { className: "mt-1 block w-full rounded-md border bg-background px-3 py-2", type: "email", value: email, onChange: (e) => setEmail(e.target.value), autoComplete: "email", required: true })
    ] }),
    /* @__PURE__ */ jsxs("label", { className: "block", children: [
      /* @__PURE__ */ jsx("span", { className: "text-sm", children: "Password" }),
      /* @__PURE__ */ jsx("input", { className: "mt-1 block w-full rounded-md border bg-background px-3 py-2", type: "password", value: password, onChange: (e) => setPassword(e.target.value), autoComplete: "new-password", minLength: 8, required: true })
    ] }),
    error ? /* @__PURE__ */ jsx("p", { className: "text-sm text-destructive", role: "alert", children: error }) : null,
    /* @__PURE__ */ jsx("button", { type: "submit", disabled: loading || !online, className: "w-full rounded-md bg-primary text-primary-foreground py-2 font-medium disabled:opacity-60", children: loading ? "Creating…" : "Create account" }),
    /* @__PURE__ */ jsxs("p", { className: "text-sm text-center text-muted-foreground", children: [
      "Already have an account?",
      " ",
      /* @__PURE__ */ jsx(Link, { to: "/login", className: "text-primary hover:underline", children: "Sign in" })
    ] })
  ] }) });
}
export {
  RegisterPage as component
};
