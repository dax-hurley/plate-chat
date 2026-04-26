import { jsx } from "react/jsx-runtime";
import { useNavigate } from "@tanstack/react-router";
import { useState, useCallback, useLayoutEffect } from "react";
import { C as CoachShell } from "./coach-runtime-BX8b2qqH.mjs";
import { R as Route } from "./router-CUOzYYmk.mjs";
import "lucide-react";
import "@ai-sdk/react";
import "ai";
import "./use-online-B1QDuTlA.mjs";
import "./button-DbVXcFD_.mjs";
import "@base-ui/react/button";
import "class-variance-authority";
import "./utils-H80jjgLf.mjs";
import "clsx";
import "tailwind-merge";
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
import "dexie";
import "@capacitor/core";
import "drizzle-zod";
import "drizzle-orm";
import "drizzle-orm/sqlite-core";
import "next-themes";
import "sonner";
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
function CoachPageLayout({
  children
}) {
  return /* @__PURE__ */ jsx("div", { className: "text-card-foreground -mx-5 -mt-7 flex min-h-0 flex-col md:-mx-12 md:-mt-10", children });
}
function CoachIndex() {
  const {
    prompt: promptFromUrl
  } = Route.useSearch();
  const navigate = useNavigate();
  const [prepopulatedUserPrompt, setPrepopulatedUserPrompt] = useState(null);
  const clearPrepopulatedUserPrompt = useCallback(() => setPrepopulatedUserPrompt(null), []);
  useLayoutEffect(() => {
    if (!promptFromUrl) return;
    setPrepopulatedUserPrompt(promptFromUrl);
    void navigate({
      to: "/app/coach",
      search: {},
      replace: true
    });
  }, [promptFromUrl, navigate]);
  return /* @__PURE__ */ jsx(CoachPageLayout, { children: /* @__PURE__ */ jsx("div", { className: "bg-background flex min-h-[min(100dvh,40rem)] flex-1 flex-col md:min-h-[min(100dvh,48rem)]", children: /* @__PURE__ */ jsx(CoachShell, { prepopulatedUserPrompt, onPrepopulatedUserPromptApplied: clearPrepopulatedUserPrompt }) }) });
}
export {
  CoachIndex as component
};
