import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { u as useCoachConversations } from "./coach-Dn4aHF_f.mjs";
import { u as useOnline } from "./use-online-BuWfYSX8.mjs";
import "dexie";
import "./session-CyYyvQL9.mjs";
import "react";
import "./router-kvjOiOR_.mjs";
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
import "./hooks-Ccy1wbDZ.mjs";
import "dexie-react-hooks";
function CoachIndex() {
  const online = useOnline();
  const {
    data: conversations,
    loading
  } = useCoachConversations();
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold", children: "Coach" }),
      /* @__PURE__ */ jsx(Link, { to: "/app/coach/$id", params: {
        id: "new"
      }, "aria-disabled": !online, className: "rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm " + (online ? "" : "opacity-60 pointer-events-none"), children: "New chat" })
    ] }),
    !online ? /* @__PURE__ */ jsx("div", { className: "rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm", children: "Offline — reconnect to chat with your coach. Past conversations stay readable below." }) : null,
    loading ? /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Loading…" }) : conversations.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "No conversations yet." }) : /* @__PURE__ */ jsx("ul", { className: "space-y-2", children: conversations.map((c) => /* @__PURE__ */ jsx("li", { className: "rounded-xl border bg-card", children: /* @__PURE__ */ jsxs(Link, { to: "/app/coach/$id", params: {
      id: c.id
    }, className: "block p-3", children: [
      /* @__PURE__ */ jsx("div", { className: "font-medium truncate", children: c.title || "Untitled" }),
      /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: new Date(c.updatedAt).toLocaleString() })
    ] }) }, c.id)) })
  ] });
}
export {
  CoachIndex as component
};
