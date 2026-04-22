import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { a as useCoachConversation } from "./coach-Dn4aHF_f.mjs";
import { u as useOnline } from "./use-online-BuWfYSX8.mjs";
import { a as Route, b as authFetch } from "./router-kvjOiOR_.mjs";
import "dexie";
import "./session-CyYyvQL9.mjs";
import "./hooks-Ccy1wbDZ.mjs";
import "dexie-react-hooks";
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
function CoachChat() {
  const {
    id
  } = Route.useParams();
  const online = useOnline();
  const {
    data: conversation
  } = useCoachConversation(id === "new" ? null : id);
  const parsed = useMemo(() => {
    if (!conversation?.messages) return [];
    try {
      const raw = JSON.parse(conversation.messages);
      if (!Array.isArray(raw)) return [];
      return raw.filter((m) => typeof m === "object" && m !== null && "role" in m && "content" in m);
    } catch {
      return [];
    }
  }, [conversation?.messages]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [pending, setPending] = useState([]);
  const onSend = async () => {
    if (!online || !draft.trim()) return;
    setError(null);
    setSending(true);
    const next = {
      role: "user",
      content: draft
    };
    setPending((p) => [...p, next]);
    setDraft("");
    try {
      const res = await authFetch("/api/coach/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          conversationId: id === "new" ? null : id,
          message: next.content
        })
      });
      if (!res.ok) {
        setError(`Failed (${res.status})`);
      } else {
        setPending([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSending(false);
    }
  };
  const messages = [...parsed, ...pending];
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full min-h-[70dvh]", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between pb-3", children: [
      /* @__PURE__ */ jsx(Link, { to: "/app/coach", className: "text-sm text-muted-foreground", children: "← Back" }),
      conversation ? /* @__PURE__ */ jsx("div", { className: "text-sm font-medium truncate", children: conversation.title }) : null
    ] }),
    !online ? /* @__PURE__ */ jsx("div", { className: "rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm mb-3", children: "Offline — reconnect to chat with your coach." }) : null,
    /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto space-y-3 pr-1", children: messages.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Ask your coach anything about your training or nutrition." }) : messages.map((m, i) => /* @__PURE__ */ jsx("div", { className: m.role === "user" ? "ml-auto max-w-[85%] rounded-2xl bg-primary text-primary-foreground px-3 py-2 text-sm" : "max-w-[85%] rounded-2xl border bg-card px-3 py-2 text-sm", children: m.content }, i)) }),
    error ? /* @__PURE__ */ jsxs("p", { className: "text-xs text-destructive pt-2", children: [
      error,
      " ",
      /* @__PURE__ */ jsx("button", { onClick: onSend, className: "underline", disabled: !online || sending, children: "Retry" })
    ] }) : null,
    /* @__PURE__ */ jsxs("form", { onSubmit: (e) => {
      e.preventDefault();
      void onSend();
    }, className: "pt-3 flex gap-2", children: [
      /* @__PURE__ */ jsx("input", { value: draft, onChange: (e) => setDraft(e.target.value), placeholder: online ? "Ask your coach…" : "Offline", disabled: !online || sending, className: "flex-1 rounded-md border bg-background px-3 py-2 text-sm disabled:opacity-60" }),
      /* @__PURE__ */ jsx("button", { disabled: !online || sending || !draft.trim(), className: "rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm disabled:opacity-60", children: "Send" })
    ] })
  ] });
}
export {
  CoachChat as component
};
