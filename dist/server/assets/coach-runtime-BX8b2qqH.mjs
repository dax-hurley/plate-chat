import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useMemo, useState, useRef, useEffect, useCallback, createContext, useContext } from "react";
import { useLocation } from "@tanstack/react-router";
import { Braces, ChevronLeft, Loader2, WifiOff, Sparkles, MessageSquarePlus, Pencil, ArrowUp, Trash2 } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isTextUIPart } from "ai";
import { a8 as getTrainlogToolNamesSorted, A as APP_BRAND_NAME, g as authFetch, t as triggerSync, a9 as isCoachAiDebugUiEnabled } from "./router-CUOzYYmk.mjs";
import { u as useOnline } from "./use-online-B1QDuTlA.mjs";
import { B as Button } from "./button-DbVXcFD_.mjs";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogDescription } from "./dialog-OkPnLnLD.mjs";
import { Tabs as Tabs$1 } from "@base-ui/react/tabs";
import { cva } from "class-variance-authority";
import { c as cn } from "./utils-H80jjgLf.mjs";
import { O as OFFLINE_COACH_REPLY, l as lastAssistantMessageId, A as AssistantMessageParts, i as isOfflineCoachNotice } from "./assistant-message-parts-Cx-nfSv6.mjs";
import { C as ConfirmDialog } from "./confirm-dialog-L0Y1JjA8.mjs";
import { S as ScrollArea } from "./scroll-area-BUy2INq0.mjs";
function Tabs({
  className,
  orientation = "horizontal",
  ...props
}) {
  return /* @__PURE__ */ jsx(
    Tabs$1.Root,
    {
      "data-slot": "tabs",
      "data-orientation": orientation,
      className: cn(
        "group/tabs flex gap-2 data-horizontal:flex-col",
        className
      ),
      ...props
    }
  );
}
const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground group-data-horizontal/tabs:h-8 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:rounded-none",
  {
    variants: {
      variant: {
        default: "bg-muted",
        line: "gap-1 bg-transparent"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
function TabsList({
  className,
  variant = "default",
  ...props
}) {
  return /* @__PURE__ */ jsx(
    Tabs$1.List,
    {
      "data-slot": "tabs-list",
      "data-variant": variant,
      className: cn(tabsListVariants({ variant }), className),
      ...props
    }
  );
}
function TabsTrigger({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    Tabs$1.Tab,
    {
      "data-slot": "tabs-trigger",
      className: cn(
        "relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:pr-1 has-data-[icon=inline-start]:pl-1 aria-disabled:pointer-events-none aria-disabled:opacity-50 dark:text-muted-foreground dark:hover:text-foreground group-data-[variant=default]/tabs-list:data-active:shadow-sm group-data-[variant=line]/tabs-list:data-active:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent dark:group-data-[variant=line]/tabs-list:data-active:border-transparent dark:group-data-[variant=line]/tabs-list:data-active:bg-transparent",
        "data-active:bg-background data-active:text-foreground dark:data-active:border-input dark:data-active:bg-input/30 dark:data-active:text-foreground",
        "after:absolute after:bg-foreground after:opacity-0 after:transition-opacity group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:bottom-[-5px] group-data-horizontal/tabs:after:h-0.5 group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:-right-1 group-data-vertical/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
        className
      ),
      ...props
    }
  );
}
function TabsContent({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    Tabs$1.Panel,
    {
      "data-slot": "tabs-content",
      className: cn("flex-1 text-sm outline-none", className),
      ...props
    }
  );
}
const IMMEDIATE_TOOL_NAMES = /* @__PURE__ */ new Set([
  "tool_search_tool_bm25",
  "suggest_quick_replies"
]);
function enrichCoachContextPreviewPayload(payload) {
  if (payload == null) return null;
  const defs = payload.toolDefinitions;
  if (!Array.isArray(defs)) return payload;
  const trainlog = new Set(getTrainlogToolNamesSorted());
  const namedDefs = defs.filter(
    (d) => d != null && typeof d === "object" && typeof d.name === "string"
  );
  const prefixDefs = namedDefs.filter((d) => IMMEDIATE_TOOL_NAMES.has(d.name));
  const deferredDefs = namedDefs.filter((d) => trainlog.has(d.name));
  const prefixToolsChars = JSON.stringify(prefixDefs).length;
  const deferredCatalogChars = JSON.stringify(deferredDefs).length;
  const immediateSorted = [...IMMEDIATE_TOOL_NAMES].sort(
    (a, b) => a.localeCompare(b)
  );
  const deferredSorted = getTrainlogToolNamesSorted();
  const raw = payload.contextStats;
  const systemChars = raw?.systemChars ?? 0;
  const modelMessagesChars = raw?.modelMessagesChars ?? 0;
  const prefixTotalChars = systemChars + modelMessagesChars + prefixToolsChars;
  const needNames = raw?.immediateToolNames == null || raw.immediateToolNames.length === 0 || raw?.deferredToolNames == null || raw.deferredToolNames.length === 0;
  const needChars = raw?.prefixToolsChars == null || raw?.deferredCatalogChars == null || raw?.approxPrefixOnlyTokens == null;
  if (!needNames && !needChars) return payload;
  return {
    ...payload,
    contextStats: {
      ...raw,
      ...needChars ? {
        prefixToolsChars: raw?.prefixToolsChars ?? prefixToolsChars,
        deferredCatalogChars: raw?.deferredCatalogChars ?? deferredCatalogChars,
        approxPrefixOnlyTokens: raw?.approxPrefixOnlyTokens ?? Math.ceil(prefixTotalChars / 4)
      } : {},
      ...needNames ? {
        immediateToolNames: raw?.immediateToolNames != null && raw.immediateToolNames.length > 0 ? raw.immediateToolNames : immediateSorted,
        deferredToolNames: raw?.deferredToolNames != null && raw.deferredToolNames.length > 0 ? raw.deferredToolNames : deferredSorted
      } : {}
    }
  };
}
function JsonBlock({ value, className }) {
  const text = useMemo(() => {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }, [value]);
  return /* @__PURE__ */ jsx(
    "pre",
    {
      className: cn(
        "text-muted-foreground font-mono text-[0.7rem] leading-relaxed whitespace-pre-wrap break-words",
        className
      ),
      children: text
    }
  );
}
const inspectorScrollClass = "max-h-[min(600px,calc(90vh-10rem))] min-h-[8rem] overflow-y-auto overflow-x-auto overscroll-contain rounded-md pr-2 [scrollbar-gutter:stable] touch-pan-y";
function fmtStat(n) {
  return typeof n === "number" && !Number.isNaN(n) ? n.toLocaleString() : "—";
}
function CoachContextInspector({
  open,
  onOpenChange,
  payload,
  loading,
  error
}) {
  const displayPayload = useMemo(
    () => enrichCoachContextPreviewPayload(payload),
    [payload]
  );
  const s = displayPayload?.contextStats;
  const immediateNames = s?.immediateToolNames ?? [];
  const deferredNames = s?.deferredToolNames ?? [];
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs(
    DialogContent,
    {
      className: "flex max-h-[min(90vh,720px)] max-w-[min(96vw,56rem)] min-h-0 flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(96vw,56rem)]",
      showCloseButton: true,
      children: [
        /* @__PURE__ */ jsxs(DialogHeader, { className: "border-border shrink-0 border-b px-4 py-3", children: [
          /* @__PURE__ */ jsx(DialogTitle, { children: "Next request context" }),
          /* @__PURE__ */ jsxs(DialogDescription, { children: [
            "System prompt, model messages, and tool definitions (schemas + descriptions) for your next send. Deferred data tools are registered with the API but are omitted from the initial context prefix until discovered via",
            " ",
            /* @__PURE__ */ jsx("code", { className: "text-foreground/90", children: "tool_search_tool_bm25" }),
            " — API",
            " ",
            /* @__PURE__ */ jsx("code", { className: "text-foreground/90", children: "input_tokens" }),
            " can stay high on later turns because expanded tools and tool results live in message history. Prefix vs deferred counts are recomputed on the client from tool names when the preview API omits those fields.",
            displayPayload?.modelId ? /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground mt-2 block font-mono text-[0.7rem]", children: [
              "Model: ",
              displayPayload.modelId
            ] }) : null,
            s ? /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground mt-2 block font-mono text-[0.65rem] leading-snug", children: [
              "Chars — system ",
              fmtStat(s.systemChars),
              " · messages",
              " ",
              fmtStat(s.modelMessagesChars),
              " · tools (all) ",
              fmtStat(s.toolsChars),
              " · prefix tools only ",
              fmtStat(s.prefixToolsChars),
              " · deferred catalog",
              " ",
              fmtStat(s.deferredCatalogChars),
              " · total ",
              fmtStat(s.totalChars),
              " (~",
              fmtStat(s.approxInputTokens),
              " tok all) · ~",
              " ",
              fmtStat(s.approxPrefixOnlyTokens),
              " tok prefix est.",
              /* @__PURE__ */ jsxs("span", { className: "mt-1 block", children: [
                "Immediate: ",
                immediateNames.join(", ") || "—"
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "mt-0.5 block", children: [
                "Deferred (",
                deferredNames.length,
                "):",
                " ",
                deferredNames.length > 0 ? `${deferredNames.slice(0, 8).join(", ")}${deferredNames.length > 8 ? "…" : ""}` : "—"
              ] })
            ] }) : null
          ] })
        ] }),
        loading ? /* @__PURE__ */ jsx("p", { className: "text-muted-foreground px-4 py-6 text-sm", children: "Loading…" }) : error ? /* @__PURE__ */ jsx("p", { className: "text-destructive px-4 py-6 text-sm", role: "alert", children: error }) : /* @__PURE__ */ jsxs(
          Tabs,
          {
            defaultValue: "system",
            className: "flex min-h-0 flex-1 flex-col gap-0 overflow-hidden",
            children: [
              /* @__PURE__ */ jsxs(
                TabsList,
                {
                  variant: "line",
                  className: "border-border h-auto w-full shrink-0 justify-start gap-0 rounded-none border-b bg-transparent px-2",
                  children: [
                    /* @__PURE__ */ jsx(TabsTrigger, { value: "system", className: "rounded-none", children: "System" }),
                    /* @__PURE__ */ jsx(TabsTrigger, { value: "messages", className: "rounded-none", children: "Model messages" }),
                    /* @__PURE__ */ jsx(TabsTrigger, { value: "tools", className: "rounded-none", children: "Tool definitions" })
                  ]
                }
              ),
              /* @__PURE__ */ jsx(
                TabsContent,
                {
                  value: "system",
                  className: "mt-0 flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-3",
                  children: /* @__PURE__ */ jsx("div", { className: inspectorScrollClass, children: displayPayload?.system ? /* @__PURE__ */ jsx("pre", { className: "text-muted-foreground font-mono text-[0.7rem] leading-relaxed whitespace-pre-wrap", children: displayPayload.system }) : /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-sm", children: "No system prompt." }) })
                }
              ),
              /* @__PURE__ */ jsx(
                TabsContent,
                {
                  value: "messages",
                  className: "mt-0 flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-3",
                  children: /* @__PURE__ */ jsx("div", { className: inspectorScrollClass, children: displayPayload?.modelMessages != null ? /* @__PURE__ */ jsx(JsonBlock, { value: displayPayload.modelMessages }) : /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-sm", children: "No messages." }) })
                }
              ),
              /* @__PURE__ */ jsx(
                TabsContent,
                {
                  value: "tools",
                  className: "mt-0 flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-3",
                  children: /* @__PURE__ */ jsx("div", { className: inspectorScrollClass, children: displayPayload?.toolDefinitions != null ? /* @__PURE__ */ jsx(JsonBlock, { value: displayPayload.toolDefinitions }) : /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-sm", children: "No tool definitions (enable server debug)." }) })
                }
              )
            ]
          }
        )
      ]
    }
  ) });
}
function CoachContextInspectorTrigger({
  disabled,
  onClick
}) {
  return /* @__PURE__ */ jsxs(
    Button,
    {
      type: "button",
      variant: "outline",
      size: "sm",
      className: "text-muted-foreground h-8 gap-1 px-2 text-xs",
      disabled,
      title: "Show system, messages, and tool schemas for your next send (debug)",
      onClick,
      children: [
        /* @__PURE__ */ jsx(Braces, { className: "size-3.5", "aria-hidden": true }),
        "Context"
      ]
    }
  );
}
function approxTokensFromText(text) {
  const t = text.trim();
  if (t.length === 0) return 0;
  return Math.max(1, Math.ceil(t.length / 4));
}
function truncateForDebugPreview(text, maxChars = 80) {
  const t = text.trim().replace(/\s+/g, " ");
  if (t.length <= maxChars) return t;
  return `${t.slice(0, Math.max(0, maxChars - 1))}…`;
}
function bucketFromId(id, modulo) {
  if (modulo <= 0) return 0;
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % modulo;
}
const NEW_CHAT_SUBTITLES = [
  "Your AI Personal Trainer",
  `Training, nutrition, and your ${APP_BRAND_NAME} context`,
  "Ready when you are",
  "Let's make the next session count",
  "Here to help you train smarter"
];
const EMPTY_STATE_LEADS = [
  `Ask anything about training, recovery, or what you're logging in ${APP_BRAND_NAME}.`,
  "Wondering about programming, form, or fueling your workouts? Start here.",
  "I can use your workouts, meals, and vitals—ask me anything.",
  "Stuck on a plateau, a meal plan, or rest days? Pick a topic below or type your own.",
  "From rep schemes to macros—what do you want to dig into today?"
];
function coachNewChatSubtitle(conversationId) {
  return NEW_CHAT_SUBTITLES[bucketFromId(conversationId, NEW_CHAT_SUBTITLES.length)];
}
function coachEmptyStateLead(conversationId) {
  return EMPTY_STATE_LEADS[bucketFromId(`empty:${conversationId}`, EMPTY_STATE_LEADS.length)];
}
const STATIC_QUICK_REPLIES = [
  "📈 Analyze my progress",
  "💪 Create a workout routine",
  "🍽️ Make a meal plan"
];
function newCoachMessageId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `coach-${Date.now()}`;
}
function textFromParts(message) {
  const parts = message.parts ?? [];
  let out = "";
  for (const p of parts) {
    if (isTextUIPart(p)) {
      out += p.text;
    } else if (p.type === "reasoning" && "text" in p && typeof p.text === "string") {
      out += p.text;
    }
  }
  return out;
}
function messagesToTitleContext(messages) {
  const out = [];
  for (const m of messages) {
    if (m.role !== "user" && m.role !== "assistant") continue;
    const text = textFromParts(m).trim();
    if (!text) continue;
    out.push({ role: m.role, text });
  }
  return out;
}
function userMessageCount(messages) {
  return messages.filter((m) => m.role === "user").length;
}
function coachAiUsageFromMessage(m) {
  const meta = m.metadata;
  return meta?.coachAiUsage;
}
function formatTokenCount(n) {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString();
}
const COACH_DEBUG_DATA_TYPE = "data-coach-debug";
function stripCoachDebugForPersistence(messages) {
  return messages.map((m) => {
    if (m.role !== "assistant") return m;
    let next = m;
    if (m.parts?.length) {
      const parts = m.parts.filter((p) => p.type !== COACH_DEBUG_DATA_TYPE);
      if (parts.length !== m.parts.length) next = { ...next, parts };
    }
    const meta = next.metadata;
    if (meta && "coachDebug" in meta) {
      const rest = { ...meta };
      delete rest.coachDebug;
      next = {
        ...next,
        metadata: Object.keys(rest).length > 0 ? rest : void 0
      };
    }
    return next;
  });
}
function uiMessagesForNextSend(options) {
  const { messages, input, editingUserId, editDraft } = options;
  if (editingUserId != null) {
    const idx = messages.findIndex((m) => m.id === editingUserId);
    if (idx < 0) return messages;
    const base = messages[idx];
    if (base.role !== "user") return messages;
    const prefix = messages.slice(0, idx);
    const updated = {
      ...base,
      parts: [{ type: "text", text: editDraft }]
    };
    return [...prefix, updated];
  }
  const text = input.trim();
  if (!text) return messages;
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `pending-${Date.now()}`;
  const pending = {
    id,
    role: "user",
    parts: [{ type: "text", text }]
  };
  return [...messages, pending];
}
function lastCoachAiUsageFromMessages(msgs) {
  for (let i = msgs.length - 1; i >= 0; i--) {
    const m = msgs[i];
    if (m.role !== "assistant") continue;
    const u = coachAiUsageFromMessage(m);
    if (u != null) return u;
  }
  return void 0;
}
function shouldGenerateConversationTitle(messages) {
  const n = userMessageCount(messages);
  return n === 1 || n > 0 && n % 5 === 0;
}
function CoachChat({
  conversationId,
  initialMessages,
  conversationTitle,
  onMobileBack,
  onNewConversation,
  onPersist,
  initialComposerText,
  onInitialComposerTextApplied
}) {
  const [input, setInput] = useState("");
  const [dismissedQuickByAssistantId, setDismissedQuickByAssistantId] = useState({});
  const [emptyQuickDismissed, setEmptyQuickDismissed] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editDraft, setEditDraft] = useState("");
  const [inputBeforeEdit, setInputBeforeEdit] = useState(null);
  const [contextInspectorOpen, setContextInspectorOpen] = useState(false);
  const [contextPreview, setContextPreview] = useState(null);
  const [contextPreviewLoading, setContextPreviewLoading] = useState(false);
  const [contextPreviewError, setContextPreviewError] = useState(
    null
  );
  const composerRef = useRef(null);
  const scrollRef = useRef(null);
  const onPersistRef = useRef(onPersist);
  onPersistRef.current = onPersist;
  const online = useOnline();
  useEffect(() => {
    setDismissedQuickByAssistantId({});
    setEmptyQuickDismissed(false);
    setEditingUserId(null);
    setEditDraft("");
    setInputBeforeEdit(null);
    setContextInspectorOpen(false);
    setContextPreview(null);
    setContextPreviewError(null);
  }, [conversationId]);
  const persistMessages = useCallback(
    async (messages2, aiTitle) => {
      try {
        await authFetch(`/api/coach/conversations/${conversationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: stripCoachDebugForPersistence(messages2),
            ...aiTitle ? { title: aiTitle } : {}
          })
        });
        onPersistRef.current?.();
      } catch {
      }
    },
    [conversationId]
  );
  const transport = useMemo(
    () => new DefaultChatTransport({
      api: "/api/coach/chat",
      fetch: authFetch
    }),
    []
  );
  const {
    messages,
    sendMessage,
    setMessages,
    regenerate,
    status,
    stop,
    error,
    clearError
  } = useChat({
    id: conversationId,
    messages: initialMessages,
    transport,
    onFinish: ({ messages: next, isAbort, isError }) => {
      void (async () => {
        try {
          let aiTitle;
          if (!isAbort && !isError && shouldGenerateConversationTitle(next)) {
            try {
              const r = await authFetch("/api/coach/conversation-title", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  messages: messagesToTitleContext(next)
                })
              });
              const data = await r.json();
              const t = data.title?.trim();
              if (t) aiTitle = t.slice(0, 120);
            } catch {
            }
          }
          await persistMessages(next, aiTitle);
        } finally {
          triggerSync();
        }
      })();
    }
  });
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const statusRef = useRef(status);
  statusRef.current = status;
  const editingUserIdRef = useRef(editingUserId);
  editingUserIdRef.current = editingUserId;
  const onlineRef = useRef(online);
  onlineRef.current = online;
  useEffect(() => {
    const resyncFromServer = () => {
      if (document.visibilityState !== "visible") return;
      if (!onlineRef.current) return;
      if (statusRef.current === "streaming" || statusRef.current === "submitted") {
        return;
      }
      if (editingUserIdRef.current !== null) return;
      void (async () => {
        try {
          const r = await authFetch(`/api/coach/conversations/${conversationId}`);
          if (!r.ok) return;
          const data = await r.json();
          const next = data.conversation?.messages;
          if (!Array.isArray(next)) return;
          setMessages(next);
          onPersistRef.current?.();
          triggerSync();
        } catch {
        }
      })();
    };
    document.addEventListener("visibilitychange", resyncFromServer);
    const onPageShow = (ev) => {
      if (ev.persisted) resyncFromServer();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => {
      document.removeEventListener("visibilitychange", resyncFromServer);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [conversationId, setMessages]);
  useEffect(() => {
    const saveDraft = () => {
      if (status !== "streaming" && status !== "submitted") return;
      void persistMessages(messagesRef.current);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") saveDraft();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", saveDraft);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", saveDraft);
    };
  }, [status, persistMessages]);
  useEffect(() => {
    if (status !== "streaming") return;
    const id = window.setInterval(() => {
      void persistMessages(messagesRef.current);
    }, 2500);
    return () => window.clearInterval(id);
  }, [status, persistMessages]);
  const lastStreamProgressAtRef = useRef(Date.now());
  useEffect(() => {
    if (status === "streaming" || status === "submitted") {
      lastStreamProgressAtRef.current = Date.now();
    }
  }, [messages, status]);
  const STREAM_QUIET_MS = 7e3;
  const [streamQuietLong, setStreamQuietLong] = useState(false);
  useEffect(() => {
    if (status !== "streaming") {
      setStreamQuietLong(false);
      return;
    }
    const tick = () => {
      setStreamQuietLong(
        Date.now() - lastStreamProgressAtRef.current >= STREAM_QUIET_MS
      );
    };
    tick();
    const id = window.setInterval(tick, 400);
    return () => window.clearInterval(id);
  }, [status]);
  const busy = status === "streaming" || status === "submitted";
  const workingLabel = status === "submitted" ? "Starting reply…" : streamQuietLong ? "Working…" : "Generating reply…";
  const coachRuntime = useCoachRuntimeOptional();
  const prevCoachBusyRef = useRef(false);
  useEffect(() => {
    coachRuntime?.setCoachAgentWorking(busy);
  }, [busy, coachRuntime]);
  useEffect(() => {
    if (prevCoachBusyRef.current && !busy) {
      const last = messagesRef.current[messagesRef.current.length - 1];
      if (last?.role === "assistant") {
        coachRuntime?.signalAssistantReplyFinishedWhileClosed();
      }
    }
    prevCoachBusyRef.current = busy;
  }, [busy, coachRuntime]);
  const draftForComposerDebug = editingUserId != null ? editDraft : input;
  const lastUsageForComposer = useMemo(
    () => lastCoachAiUsageFromMessages(messages),
    [messages]
  );
  const showComposerDebug = isCoachAiDebugUiEnabled() || lastUsageForComposer != null;
  const draftApproxTokens = approxTokensFromText(draftForComposerDebug);
  const draftPreview = draftForComposerDebug.trim().length > 0 ? truncateForDebugPreview(draftForComposerDebug) : null;
  useEffect(() => {
    if (!contextInspectorOpen) {
      setContextPreview(null);
      setContextPreviewError(null);
      setContextPreviewLoading(false);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        setContextPreviewLoading(true);
        setContextPreviewError(null);
        setContextPreview(null);
        try {
          const msgs = uiMessagesForNextSend({
            messages,
            input,
            editingUserId,
            editDraft
          });
          const r = await authFetch("/api/coach/context-preview", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ conversationId, messages: msgs })
          });
          if (!r.ok) {
            const errText = await r.text();
            throw new Error(
              r.status === 404 ? "Context preview needs COACH_AI_DEBUG=true on the server." : errText || r.statusText
            );
          }
          const data = await r.json();
          if (!cancelled) setContextPreview(data);
        } catch (e) {
          if (!cancelled) {
            setContextPreviewError(
              e instanceof Error ? e.message : "Failed to load context"
            );
          }
        } finally {
          if (!cancelled) setContextPreviewLoading(false);
        }
      })();
    }, 320);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    contextInspectorOpen,
    conversationId,
    messages,
    input,
    editingUserId,
    editDraft
  ]);
  const retryAfterChatError = useCallback(async () => {
    if (!online) {
      clearError();
      return;
    }
    clearError();
    const last = messagesRef.current[messagesRef.current.length - 1];
    if (!last) return;
    if (last.role === "assistant") {
      await regenerate({ messageId: last.id });
    } else {
      await sendMessage();
    }
  }, [clearError, online, regenerate, sendMessage]);
  const appendOfflineCoachExchange = useCallback(
    (userText) => {
      const uid = newCoachMessageId();
      const aid = newCoachMessageId();
      const userMsg = {
        id: uid,
        role: "user",
        parts: [{ type: "text", text: userText }]
      };
      const assistantMsg = {
        id: aid,
        role: "assistant",
        parts: [{ type: "text", text: OFFLINE_COACH_REPLY }]
      };
      setMessages((prev) => {
        const next = [...prev, userMsg, assistantMsg];
        void persistMessages(next);
        return next;
      });
    },
    [persistMessages, setMessages]
  );
  const autoSendInitialPromptKey = useRef(null);
  useEffect(() => {
    const t = initialComposerText?.trim();
    if (!t) return;
    const key = `${conversationId}::${t}`;
    if (autoSendInitialPromptKey.current === key) return;
    if (busy) return;
    if (editingUserId != null) return;
    if (messages.length > 0) {
      autoSendInitialPromptKey.current = key;
      setInput(t);
      onInitialComposerTextApplied?.();
      const id = requestAnimationFrame(() => composerRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
    autoSendInitialPromptKey.current = key;
    onInitialComposerTextApplied?.();
    setEmptyQuickDismissed(true);
    const aid = lastAssistantMessageId(messages);
    if (aid) {
      setDismissedQuickByAssistantId((d) => ({ ...d, [aid]: true }));
    }
    if (!online) {
      appendOfflineCoachExchange(t);
      return;
    }
    void sendMessage({ text: t });
  }, [
    appendOfflineCoachExchange,
    busy,
    conversationId,
    editingUserId,
    initialComposerText,
    messages,
    onInitialComposerTextApplied,
    online,
    sendMessage
  ]);
  function beginEditUserMessage(m) {
    if (busy || m.role !== "user") return;
    setInputBeforeEdit(input);
    setEditingUserId(m.id);
    setEditDraft(textFromParts(m));
    setInput("");
    queueMicrotask(() => composerRef.current?.focus());
  }
  function cancelEditUserMessage() {
    setEditingUserId(null);
    setEditDraft("");
    if (inputBeforeEdit != null) {
      setInput(inputBeforeEdit);
      setInputBeforeEdit(null);
    }
  }
  async function saveEditedUserMessage() {
    const trimmed = editDraft.trim();
    if (!trimmed || editingUserId == null) return;
    const idx = messages.findIndex((x) => x.id === editingUserId);
    if (idx < 0) return;
    const prev = messages[idx];
    if (prev.role !== "user") return;
    const updated = {
      ...prev,
      parts: [{ type: "text", text: trimmed }]
    };
    const next = messages.slice(0, idx).concat([updated]);
    setMessages(next);
    setEditingUserId(null);
    setEditDraft("");
    setInputBeforeEdit(null);
    setDismissedQuickByAssistantId((d) => {
      const keep = new Set(next.map((x) => x.id));
      const out = {};
      for (const k of Object.keys(d)) {
        if (keep.has(k)) out[k] = true;
      }
      return out;
    });
    await persistMessages(next);
  }
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [messages, status]);
  async function submitComposer() {
    if (editingUserId != null) {
      await saveEditedUserMessage();
      return;
    }
    const text = input.trim();
    if (!text || busy) return;
    const aid = lastAssistantMessageId(messages);
    if (aid) {
      setDismissedQuickByAssistantId((d) => ({ ...d, [aid]: true }));
    }
    setInput("");
    if (!online) {
      appendOfflineCoachExchange(text);
      return;
    }
    await sendMessage({ text });
  }
  function onSubmit(e) {
    e.preventDefault();
    void submitComposer();
  }
  function onComposerKeyDown(e) {
    if (e.key === "Escape" && editingUserId != null) {
      e.preventDefault();
      cancelEditUserMessage();
      return;
    }
    if (e.key !== "Enter" || e.shiftKey) return;
    if (e.nativeEvent.isComposing) return;
    e.preventDefault();
    void submitComposer();
  }
  function sendQuick(text) {
    const t = text.trim();
    if (!t) return;
    if (messages.length === 0) {
      setEmptyQuickDismissed(true);
    } else {
      const aid = lastAssistantMessageId(messages);
      if (aid) {
        setDismissedQuickByAssistantId((d) => ({ ...d, [aid]: true }));
      }
    }
    if (!online) {
      appendOfflineCoachExchange(t);
      return;
    }
    void sendMessage({ text: t });
  }
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: "bg-background flex min-h-0 flex-1 flex-col",
      "aria-busy": busy,
      children: [
        /* @__PURE__ */ jsx("header", { className: "border-border bg-background/95 shrink-0 border-b px-3 py-3 backdrop-blur-sm md:px-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          onMobileBack ? /* @__PURE__ */ jsx(
            Button,
            {
              type: "button",
              variant: "ghost",
              size: "icon",
              className: "text-foreground shrink-0 md:hidden",
              "aria-label": "Back to conversations",
              onClick: onMobileBack,
              children: /* @__PURE__ */ jsx(ChevronLeft, { className: "size-5", strokeWidth: 2, "aria-hidden": true })
            }
          ) : null,
          /* @__PURE__ */ jsx(
            "span",
            {
              className: cn(
                "inline-flex size-9 shrink-0 items-center justify-center rounded-xl ring-1 transition-shadow",
                !online && !busy ? "bg-amber-500/15 text-amber-700 ring-amber-500/25 dark:text-amber-400" : "bg-primary/15 text-primary ring-primary/15",
                busy && (streamQuietLong ? "ring-primary/25" : "ring-primary/35 shadow-[0_0_0_3px_hsl(var(--primary)/0.12)]")
              ),
              "aria-hidden": true,
              children: busy ? /* @__PURE__ */ jsx(
                Loader2,
                {
                  className: cn(
                    "size-4",
                    streamQuietLong ? "text-primary/80 animate-[spin_2.5s_linear_infinite]" : "animate-spin"
                  ),
                  strokeWidth: 2.25
                }
              ) : !online ? /* @__PURE__ */ jsx(WifiOff, { className: "size-4", strokeWidth: 2 }) : /* @__PURE__ */ jsx(Sparkles, { className: "size-4", strokeWidth: 2 })
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsx("h1", { className: "text-base font-semibold tracking-tight", children: "Coach Miles" }),
            /* @__PURE__ */ jsx(
              "p",
              {
                className: cn(
                  "min-w-0 text-xs",
                  busy ? "text-primary font-medium" : !online ? "text-amber-800 dark:text-amber-400 font-medium" : "text-muted-foreground truncate"
                ),
                title: busy ? workingLabel : !online ? "You're offline. Messages you send stay on this device until you reconnect." : conversationTitle === "New chat" ? coachNewChatSubtitle(conversationId) : conversationTitle,
                role: busy || !online ? "status" : void 0,
                "aria-live": busy || !online ? "polite" : void 0,
                children: busy ? /* @__PURE__ */ jsx("span", { className: "min-w-0 truncate", children: workingLabel }) : !online ? /* @__PURE__ */ jsxs("span", { className: "flex min-w-0 items-center gap-1.5", children: [
                  /* @__PURE__ */ jsx(WifiOff, { className: "size-3.5 shrink-0", "aria-hidden": true }),
                  /* @__PURE__ */ jsx("span", { className: "min-w-0 truncate", children: "Offline — coach replies when you're back online" })
                ] }) : conversationTitle === "New chat" ? coachNewChatSubtitle(conversationId) : conversationTitle
              }
            )
          ] }),
          onNewConversation ? /* @__PURE__ */ jsxs(
            Button,
            {
              type: "button",
              variant: "outline",
              size: "sm",
              className: "shrink-0 gap-1 md:hidden",
              onClick: onNewConversation,
              children: [
                /* @__PURE__ */ jsx(MessageSquarePlus, { className: "size-4", "aria-hidden": true }),
                "New"
              ]
            }
          ) : null
        ] }) }),
        /* @__PURE__ */ jsx(
          "div",
          {
            ref: scrollRef,
            className: "text-muted-foreground min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 text-sm",
            children: messages.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center gap-4 py-8 text-center", children: [
              /* @__PURE__ */ jsx("p", { className: "text-foreground max-w-sm text-base font-medium", children: coachEmptyStateLead(conversationId) }),
              !emptyQuickDismissed ? /* @__PURE__ */ jsx(
                "div",
                {
                  className: "flex max-w-md flex-wrap justify-center gap-2",
                  "aria-label": "Suggested starters",
                  children: STATIC_QUICK_REPLIES.map((label) => /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => sendQuick(label),
                      className: cn(
                        "border-border bg-muted/60 text-foreground hover:bg-muted rounded-2xl border px-3 py-2 text-left text-xs font-medium transition-colors sm:text-sm",
                        "disabled:pointer-events-none disabled:opacity-50",
                        "max-w-full min-w-0 shrink-0 break-words whitespace-normal sm:max-w-[min(100%,16rem)]"
                      ),
                      children: label
                    },
                    label
                  ))
                }
              ) : null
            ] }) : messages.map((m) => /* @__PURE__ */ jsx(
              "div",
              {
                className: cn(
                  "flex",
                  m.role === "user" ? "justify-end" : "justify-start"
                ),
                children: m.role === "user" ? /* @__PURE__ */ jsxs("div", { className: "flex max-w-[90%] flex-col items-end gap-1.5", children: [
                  /* @__PURE__ */ jsx(
                    "p",
                    {
                      className: cn(
                        "bg-primary text-primary-foreground rounded-2xl px-4 py-2.5 font-medium whitespace-pre-wrap",
                        editingUserId === m.id && "ring-primary/60 ring-2 ring-offset-2 ring-offset-background"
                      ),
                      children: textFromParts(m)
                    }
                  ),
                  editingUserId === m.id ? /* @__PURE__ */ jsx("p", { className: "text-muted-foreground max-w-full text-right text-[0.65rem] leading-snug", children: "Editing in the message box below. Saving removes everything after this message." }) : /* @__PURE__ */ jsxs(
                    Button,
                    {
                      type: "button",
                      variant: "ghost",
                      size: "sm",
                      className: "text-muted-foreground hover:text-foreground h-8 touch-manipulation gap-1 px-2 text-xs",
                      disabled: busy,
                      title: "Edit message; removes replies after it",
                      onClick: () => beginEditUserMessage(m),
                      children: [
                        /* @__PURE__ */ jsx(Pencil, { className: "size-3.5", "aria-hidden": true }),
                        "Edit"
                      ]
                    }
                  )
                ] }) : /* @__PURE__ */ jsx(
                  "div",
                  {
                    className: cn(
                      "max-w-[95%] space-y-2 rounded-2xl border px-4 py-3",
                      isOfflineCoachNotice(m) ? "border-amber-500/45 bg-amber-500/10" : "bg-muted/40 border-border/60"
                    ),
                    children: /* @__PURE__ */ jsx(
                      AssistantMessageParts,
                      {
                        message: m,
                        dismissedQuickReplies: dismissedQuickByAssistantId[m.id] === true,
                        onQuickReply: sendQuick,
                        onRegenerate: () => void regenerate({ messageId: m.id }),
                        busy,
                        online,
                        showRegenerateAndTokenRow: true,
                        showOfflineStyling: true
                      }
                    )
                  }
                )
              },
              m.id
            ))
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "border-border bg-background/95 shrink-0 border-t px-4 py-3", children: [
          /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-3 text-[0.65rem] leading-relaxed", children: "AI can make mistakes. Not medical advice—verify important information and consult a professional when needed." }),
          !online ? /* @__PURE__ */ jsxs(
            "p",
            {
              className: "text-amber-800 dark:text-amber-400 mb-3 flex items-start gap-2 text-xs leading-snug",
              role: "status",
              "aria-live": "polite",
              children: [
                /* @__PURE__ */ jsx(WifiOff, { className: "mt-0.5 size-3.5 shrink-0", "aria-hidden": true }),
                /* @__PURE__ */ jsx("span", { children: "You're offline. Your message is shown in the chat with a local note — it is not sent to the coach until you reconnect." })
              ]
            }
          ) : null,
          error ? /* @__PURE__ */ jsxs(
            "div",
            {
              className: "mb-2 flex flex-col gap-2",
              role: "alert",
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-destructive text-sm", children: isCoachAiDebugUiEnabled() && error.message.trim() ? error.message : "Something went wrong." }),
                  /* @__PURE__ */ jsx(
                    Button,
                    {
                      type: "button",
                      variant: "outline",
                      size: "sm",
                      className: "h-8",
                      disabled: busy || !online,
                      onClick: () => void retryAfterChatError(),
                      children: "Retry"
                    }
                  )
                ] }),
                isCoachAiDebugUiEnabled() && error.message.trim() === "Something went wrong." ? /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground text-[0.65rem] leading-snug", children: [
                  "Response body is still generic. Set",
                  " ",
                  /* @__PURE__ */ jsx("code", { className: "bg-muted rounded px-1 font-mono text-[0.6rem]", children: "COACH_AI_DEBUG=true" }),
                  " ",
                  "on the server so ",
                  /* @__PURE__ */ jsx("code", { className: "font-mono", children: "/api/coach/chat" }),
                  " ",
                  "can return detailed errors."
                ] }) : null,
                isCoachAiDebugUiEnabled() && error.stack ? /* @__PURE__ */ jsxs("details", { className: "group border-border/80 bg-muted/30 rounded-lg border", children: [
                  /* @__PURE__ */ jsx("summary", { className: "text-muted-foreground cursor-pointer px-3 py-2 text-xs font-medium marker:content-none [&::-webkit-details-marker]:hidden", children: /* @__PURE__ */ jsx("span", { className: "underline-offset-2 group-open:underline", children: "Stack trace" }) }),
                  /* @__PURE__ */ jsx("pre", { className: "text-muted-foreground max-h-40 overflow-auto border-t px-3 py-2 font-mono text-[0.65rem] leading-snug whitespace-pre-wrap break-words", children: error.stack })
                ] }) : null
              ]
            }
          ) : null,
          /* @__PURE__ */ jsxs("form", { onSubmit: (e) => void onSubmit(e), children: [
            editingUserId != null ? /* @__PURE__ */ jsxs("div", { className: "text-muted-foreground mb-2 flex flex-wrap items-center justify-between gap-2 text-xs", children: [
              /* @__PURE__ */ jsx("span", { className: "font-medium text-foreground", children: "Editing message" }),
              /* @__PURE__ */ jsx(
                Button,
                {
                  type: "button",
                  variant: "ghost",
                  size: "sm",
                  className: "h-8",
                  onClick: cancelEditUserMessage,
                  children: "Cancel"
                }
              )
            ] }) : null,
            /* @__PURE__ */ jsxs(
              "div",
              {
                className: cn(
                  "border-input bg-background relative rounded-lg border shadow-sm transition-colors",
                  busy && "border-primary/35 bg-muted/25",
                  !busy && !online && "border-amber-500/35 bg-amber-500/[0.06] dark:bg-amber-500/10",
                  editingUserId != null && "border-primary/40 bg-muted/20",
                  "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50"
                ),
                children: [
                  /* @__PURE__ */ jsx(
                    "textarea",
                    {
                      ref: composerRef,
                      value: editingUserId != null ? editDraft : input,
                      onChange: (e) => editingUserId != null ? setEditDraft(e.target.value) : setInput(e.target.value),
                      onKeyDown: onComposerKeyDown,
                      placeholder: editingUserId != null ? "Edit your message… (Enter to save, Shift+Enter for new line, Esc to cancel)" : "Message your coach… (Enter to send, Shift+Enter for new line)",
                      rows: 2,
                      className: cn(
                        "placeholder:text-muted-foreground min-h-[4.5rem] w-full resize-y border-0 bg-transparent py-2.5 pr-14 pl-3 pb-11 text-sm outline-none",
                        "focus-visible:ring-0",
                        "disabled:opacity-60"
                      ),
                      disabled: busy,
                      "aria-label": editingUserId != null ? "Edit message" : "Message"
                    }
                  ),
                  /* @__PURE__ */ jsx("div", { className: "absolute right-2 bottom-2 flex items-center gap-1.5", children: busy ? /* @__PURE__ */ jsx(
                    Button,
                    {
                      type: "button",
                      variant: "outline",
                      size: "sm",
                      onClick: () => void stop(),
                      children: "Stop"
                    }
                  ) : editingUserId != null ? /* @__PURE__ */ jsx(
                    Button,
                    {
                      type: "submit",
                      size: "icon",
                      disabled: !editDraft.trim(),
                      "aria-label": "Save edit",
                      title: "Save (removes messages after this one)",
                      children: /* @__PURE__ */ jsx(ArrowUp, { className: "size-4", strokeWidth: 2.25 })
                    }
                  ) : /* @__PURE__ */ jsx(
                    Button,
                    {
                      type: "submit",
                      size: "icon",
                      disabled: !input.trim(),
                      "aria-label": "Send message",
                      children: /* @__PURE__ */ jsx(ArrowUp, { className: "size-4", strokeWidth: 2.25 })
                    }
                  ) })
                ]
              }
            ),
            showComposerDebug ? /* @__PURE__ */ jsxs("div", { className: "mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between", children: [
              /* @__PURE__ */ jsx(
                CoachContextInspectorTrigger,
                {
                  disabled: busy || !online,
                  onClick: () => setContextInspectorOpen(true)
                }
              ),
              /* @__PURE__ */ jsxs(
                "p",
                {
                  className: "text-muted-foreground font-mono text-[0.65rem] leading-snug sm:max-w-[min(100%,42rem)] sm:text-right",
                  title: "Draft tokens are a rough estimate (characters ÷ 4). Last reply uses provider counts.",
                  "aria-live": "polite",
                  children: [
                    lastUsageForComposer ? /* @__PURE__ */ jsxs(Fragment, { children: [
                      "Last reply — input:",
                      " ",
                      formatTokenCount(lastUsageForComposer.inputTokens),
                      " · output:",
                      " ",
                      formatTokenCount(lastUsageForComposer.outputTokens),
                      " · total:",
                      " ",
                      formatTokenCount(lastUsageForComposer.totalTokens),
                      /* @__PURE__ */ jsx("span", { "aria-hidden": true, children: " · " })
                    ] }) : null,
                    "Draft ~",
                    draftApproxTokens.toLocaleString(),
                    " tok (approx.)",
                    draftPreview != null ? /* @__PURE__ */ jsxs(Fragment, { children: [
                      /* @__PURE__ */ jsx("span", { "aria-hidden": true, children: " · " }),
                      /* @__PURE__ */ jsx("span", { className: "break-words", children: `“${draftPreview}”` })
                    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                      /* @__PURE__ */ jsx("span", { "aria-hidden": true, children: " · " }),
                      /* @__PURE__ */ jsx("span", { className: "text-muted-foreground/80", children: "(empty)" })
                    ] })
                  ]
                }
              )
            ] }) : null
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          CoachContextInspector,
          {
            open: contextInspectorOpen,
            onOpenChange: setContextInspectorOpen,
            payload: contextPreview,
            loading: contextPreviewLoading,
            error: contextPreviewError
          }
        )
      ]
    }
  );
}
const COACH_FETCH_TIMEOUT_MS = 15e3;
function coachFetch(input, init = {}) {
  const ctrl = new AbortController();
  const t = window.setTimeout(() => ctrl.abort(), COACH_FETCH_TIMEOUT_MS);
  return authFetch(input, { ...init, signal: ctrl.signal }).finally(
    () => window.clearTimeout(t)
  );
}
function parseListPayload(data) {
  const raw = data.conversations;
  if (!Array.isArray(raw)) return [];
  return raw.map((c) => {
    if (!c || typeof c !== "object") return null;
    const o = c;
    const id = typeof o.id === "string" ? o.id : null;
    const title = typeof o.title === "string" ? o.title : "Chat";
    const u = o.updatedAt;
    const updatedAt = typeof u === "number" ? new Date(u) : typeof u === "string" ? new Date(u) : /* @__PURE__ */ new Date();
    if (!id) return null;
    return { id, title, updatedAt };
  }).filter((x) => x !== null);
}
function CoachShell({
  prepopulatedUserPrompt = null,
  onPrepopulatedUserPromptApplied
} = {}) {
  const online = useOnline();
  const [deepLinkNewThreadExhausted, setDeepLinkNewThreadExhausted] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedTitle, setSelectedTitle] = useState("New chat");
  const [initialMessages, setInitialMessages] = useState(
    null
  );
  const [listLoading, setListLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [mobilePanel, setMobilePanel] = useState("chat");
  const [creating, setCreating] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const selectedIdRef = useRef(null);
  selectedIdRef.current = selectedId;
  const lastMessagesFetchIdRef = useRef(null);
  const didLoadFromNetworkRef = useRef(false);
  const localOnlyConversationIdRef = useRef(null);
  const createConversationForDeepLinkRef = useRef(
    () => Promise.resolve(false)
  );
  const prepopulatedUserPromptKey = prepopulatedUserPrompt?.trim() ? prepopulatedUserPrompt : null;
  const messageCount = initialMessages?.length ?? 0;
  const withholdPrepopForNewThread = Boolean(
    prepopulatedUserPromptKey && online && messageCount > 0 && !deepLinkNewThreadExhausted
  );
  const prepopToPassToChat = withholdPrepopForNewThread ? void 0 : prepopulatedUserPromptKey ?? void 0;
  useEffect(() => {
    setDeepLinkNewThreadExhausted(false);
  }, [prepopulatedUserPromptKey]);
  const bootstrapLocalCoachSession = useCallback(() => {
    if (!localOnlyConversationIdRef.current) {
      localOnlyConversationIdRef.current = crypto.randomUUID();
    }
    const id = localOnlyConversationIdRef.current;
    setListLoading(false);
    setMessagesLoading(false);
    setConversations([
      { id, title: "Offline chat", updatedAt: /* @__PURE__ */ new Date() }
    ]);
    setSelectedId(id);
    setSelectedTitle("New chat");
    setInitialMessages([]);
    lastMessagesFetchIdRef.current = id;
  }, []);
  const loadConversationMessages = useCallback(
    async (id) => {
      if (localOnlyConversationIdRef.current === id) {
        setMessagesLoading(true);
        if (lastMessagesFetchIdRef.current !== id) {
          setInitialMessages(null);
        }
        setInitialMessages([]);
        lastMessagesFetchIdRef.current = id;
        setSelectedTitle("New chat");
        setMessagesLoading(false);
        return;
      }
      if (!online) {
        setMessagesLoading(false);
        setInitialMessages([]);
        return;
      }
      setMessagesLoading(true);
      if (lastMessagesFetchIdRef.current !== id) {
        setInitialMessages(null);
      }
      try {
        const r = await coachFetch(`/api/coach/conversations/${id}`);
        if (!r.ok) throw new Error("Failed to load conversation");
        const data = await r.json();
        const conv = data.conversation;
        setInitialMessages(Array.isArray(conv?.messages) ? conv.messages : []);
        lastMessagesFetchIdRef.current = id;
        if (typeof conv?.title === "string") setSelectedTitle(conv.title);
      } finally {
        setMessagesLoading(false);
      }
    },
    [online]
  );
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!online && didLoadFromNetworkRef.current) {
        return;
      }
      if (!online && !didLoadFromNetworkRef.current) {
        bootstrapLocalCoachSession();
        return;
      }
      setListLoading(true);
      try {
        const r = await coachFetch("/api/coach/conversations");
        if (cancelled) return;
        if (!r.ok) {
          if (!didLoadFromNetworkRef.current) bootstrapLocalCoachSession();
          return;
        }
        const data = await r.json();
        let list = parseListPayload(data);
        if (list.length === 0) {
          const cr = await coachFetch("/api/coach/conversations", {
            method: "POST"
          });
          if (cancelled) return;
          if (!cr.ok) {
            if (!didLoadFromNetworkRef.current) bootstrapLocalCoachSession();
            return;
          }
          const created = await cr.json();
          if (created.conversation?.id) {
            const u = created.conversation.updatedAt;
            list = [
              {
                id: created.conversation.id,
                title: created.conversation.title,
                updatedAt: typeof u === "number" ? new Date(u) : new Date(String(u))
              }
            ];
          }
        }
        if (cancelled) return;
        localOnlyConversationIdRef.current = null;
        setConversations(list);
        if (list[0]) {
          setSelectedId(list[0].id);
          setSelectedTitle(list[0].title);
          try {
            await loadConversationMessages(list[0].id);
          } catch {
            if (!didLoadFromNetworkRef.current) bootstrapLocalCoachSession();
          }
        }
        didLoadFromNetworkRef.current = true;
      } catch {
        if (!cancelled && !didLoadFromNetworkRef.current) {
          bootstrapLocalCoachSession();
        }
      } finally {
        if (!cancelled) setListLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [online, loadConversationMessages, bootstrapLocalCoachSession]);
  const selectConversation = useCallback(
    async (id, title) => {
      setSelectedId(id);
      setSelectedTitle(title);
      setMobilePanel("chat");
      await loadConversationMessages(id);
    },
    [loadConversationMessages]
  );
  async function createConversation() {
    if (creating || !online) return false;
    setCreating(true);
    try {
      const r = await coachFetch("/api/coach/conversations", { method: "POST" });
      if (!r.ok) return false;
      const data = await r.json();
      const c = data.conversation;
      if (!c?.id) return false;
      const summary = {
        id: c.id,
        title: c.title,
        updatedAt: typeof c.updatedAt === "number" ? new Date(c.updatedAt) : new Date(String(c.updatedAt))
      };
      setConversations((prev) => [
        summary,
        ...prev.filter((x) => x.id !== c.id)
      ]);
      await selectConversation(c.id, c.title);
      return true;
    } finally {
      setCreating(false);
    }
  }
  createConversationForDeepLinkRef.current = createConversation;
  async function deleteConversation(id) {
    if (localOnlyConversationIdRef.current === id) {
      localOnlyConversationIdRef.current = null;
      const nextList2 = conversations.filter((c) => c.id !== id);
      setConversations(nextList2);
      if (id !== selectedId) return;
      if (!online || nextList2.length === 0) {
        bootstrapLocalCoachSession();
      } else if (nextList2[0]) {
        await selectConversation(nextList2[0].id, nextList2[0].title);
      }
      return;
    }
    if (!online) return;
    const r = await coachFetch(`/api/coach/conversations/${id}`, {
      method: "DELETE"
    });
    if (!r.ok) return;
    const nextList = conversations.filter((c) => c.id !== id);
    setConversations(nextList);
    if (id !== selectedId) return;
    if (nextList[0]) {
      await selectConversation(nextList[0].id, nextList[0].title);
    } else {
      await createConversation();
    }
  }
  const onPersist = useCallback(async () => {
    const r = await coachFetch("/api/coach/conversations");
    if (!r.ok) return;
    const data = await r.json();
    const list = parseListPayload(data);
    setConversations(list);
    const id = selectedIdRef.current;
    if (id) {
      const row = list.find((x) => x.id === id);
      if (row) setSelectedTitle(row.title);
    }
  }, []);
  useEffect(() => {
    if (!withholdPrepopForNewThread) return;
    if (listLoading) return;
    if (creating) return;
    void (async () => {
      const ok = await createConversationForDeepLinkRef.current();
      if (!ok) {
        setDeepLinkNewThreadExhausted(true);
      }
    })();
  }, [withholdPrepopForNewThread, listLoading, creating]);
  const showChatReady = selectedId && initialMessages !== null && !messagesLoading;
  return /* @__PURE__ */ jsxs("div", { className: "bg-background flex min-h-0 flex-1 flex-col md:flex-row", children: [
    /* @__PURE__ */ jsx(
      ConfirmDialog,
      {
        open: deleteTargetId != null,
        onOpenChange: (open) => {
          if (!open) setDeleteTargetId(null);
        },
        title: "Delete this conversation?",
        description: "This cannot be undone.",
        confirmLabel: "Delete",
        cancelLabel: "Cancel",
        confirmVariant: "destructive",
        onConfirm: async () => {
          if (!deleteTargetId) return;
          const id = deleteTargetId;
          setDeleteTargetId(null);
          await deleteConversation(id);
        }
      }
    ),
    /* @__PURE__ */ jsxs(
      "aside",
      {
        className: cn(
          "border-border flex min-h-0 w-full shrink-0 flex-col border-b md:w-72 md:border-r md:border-b-0",
          mobilePanel === "chat" ? "hidden md:flex" : "flex"
        ),
        children: [
          /* @__PURE__ */ jsxs("div", { className: "border-border flex shrink-0 items-center gap-2 border-b px-3 py-3", children: [
            /* @__PURE__ */ jsx("span", { className: "bg-primary/15 text-primary ring-primary/15 inline-flex size-9 items-center justify-center rounded-xl ring-1 md:hidden", children: /* @__PURE__ */ jsx(Sparkles, { className: "size-4", strokeWidth: 2, "aria-hidden": true }) }),
            /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1 md:pl-0", children: [
              /* @__PURE__ */ jsx("h2", { className: "text-sm font-semibold tracking-tight", children: "Conversations" }),
              /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-xs", children: "Your coach threads" })
            ] }),
            /* @__PURE__ */ jsxs(
              Button,
              {
                type: "button",
                size: "sm",
                variant: "outline",
                className: "shrink-0 gap-1.5",
                disabled: creating || listLoading || !online,
                onClick: () => void createConversation(),
                children: [
                  /* @__PURE__ */ jsx(MessageSquarePlus, { className: "size-4", "aria-hidden": true }),
                  /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: "New" })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsx(ScrollArea, { className: "min-h-0 flex-1", children: /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-0.5 p-2", children: listLoading ? /* @__PURE__ */ jsx("p", { className: "text-muted-foreground px-2 py-6 text-center text-sm", children: "Loading…" }) : conversations.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-muted-foreground px-2 py-6 text-center text-sm", children: "No conversations yet." }) : conversations.map((c) => /* @__PURE__ */ jsxs(
            "div",
            {
              className: cn(
                "hover:bg-muted/80 flex items-stretch gap-0.5 rounded-lg transition-colors",
                c.id === selectedId ? "bg-muted font-medium" : "text-muted-foreground"
              ),
              children: [
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: () => void selectConversation(c.id, c.title),
                    className: "min-w-0 flex-1 px-3 py-2.5 text-left text-sm",
                    children: [
                      /* @__PURE__ */ jsx("span", { className: "text-foreground line-clamp-2 font-medium", children: c.title }),
                      /* @__PURE__ */ jsx("span", { className: "text-muted-foreground mt-0.5 block text-xs font-normal tabular-nums", children: c.updatedAt.toLocaleString(void 0, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit"
                      }) })
                    ]
                  }
                ),
                /* @__PURE__ */ jsx(
                  Button,
                  {
                    type: "button",
                    variant: "ghost",
                    size: "icon",
                    className: "text-muted-foreground hover:text-destructive mt-1 mr-1 size-8 shrink-0 self-start",
                    "aria-label": `Delete “${c.title}”`,
                    disabled: !online && localOnlyConversationIdRef.current !== c.id,
                    onClick: (e) => {
                      e.stopPropagation();
                      setDeleteTargetId(c.id);
                    },
                    children: /* @__PURE__ */ jsx(Trash2, { className: "size-4", "aria-hidden": true })
                  }
                )
              ]
            },
            c.id
          )) }) })
        ]
      }
    ),
    /* @__PURE__ */ jsx(
      "section",
      {
        className: cn(
          "flex min-h-0 min-w-0 flex-1 flex-col",
          mobilePanel === "list" ? "hidden md:flex" : "flex"
        ),
        children: listLoading || !selectedId ? /* @__PURE__ */ jsx("div", { className: "text-muted-foreground flex flex-1 items-center justify-center text-sm", children: "Loading…" }) : messagesLoading || !showChatReady ? /* @__PURE__ */ jsx("div", { className: "text-muted-foreground flex flex-1 items-center justify-center text-sm", children: "Loading conversation…" }) : /* @__PURE__ */ jsx(
          CoachChat,
          {
            conversationId: selectedId,
            initialMessages: initialMessages ?? [],
            conversationTitle: selectedTitle,
            onMobileBack: () => setMobilePanel("list"),
            onPersist: () => void onPersist(),
            onNewConversation: () => void createConversation(),
            initialComposerText: prepopToPassToChat,
            onInitialComposerTextApplied: onPrepopulatedUserPromptApplied
          },
          selectedId
        )
      }
    )
  ] });
}
const CoachRuntimeContext = createContext(null);
function useCoachRuntime() {
  const ctx = useContext(CoachRuntimeContext);
  if (!ctx) {
    throw new Error("useCoachRuntime must be used within CoachRuntimeProvider");
  }
  return ctx;
}
function useCoachRuntimeOptional() {
  return useContext(CoachRuntimeContext);
}
const MAIN_PAD = "flex-1 min-h-0 overflow-y-auto px-5 pt-7 pb-[calc(var(--app-mobile-tab-bar-height)+1.25rem)] md:max-w-none md:px-12 md:pb-12 md:pt-10";
function CoachMainArea({ children }) {
  const { isCoachOpen, closeCoach } = useCoachRuntime();
  const pathname = useLocation({ select: (s) => s.pathname });
  const prevPathRef = useRef(null);
  useEffect(() => {
    if (prevPathRef.current === null) {
      prevPathRef.current = pathname;
      return;
    }
    if (prevPathRef.current === pathname) return;
    const prev = prevPathRef.current;
    prevPathRef.current = pathname;
    if (prev === "/app/coach" && pathname === "/app") return;
    closeCoach();
  }, [pathname, closeCoach]);
  useEffect(() => {
    if (!isCoachOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeCoach();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isCoachOpen, closeCoach]);
  return /* @__PURE__ */ jsxs("div", { className: "relative flex min-h-0 flex-1 flex-col overflow-hidden", children: [
    /* @__PURE__ */ jsx(
      "div",
      {
        className: cn(
          "absolute inset-0 flex min-h-0 flex-col overflow-hidden",
          isCoachOpen ? "bg-background z-20" : "z-0 opacity-0 pointer-events-none"
        ),
        "aria-hidden": !isCoachOpen,
        children: /* @__PURE__ */ jsx("div", { className: "flex min-h-0 flex-1 flex-col overflow-hidden px-5 pb-[calc(var(--app-mobile-tab-bar-height)+1.25rem)] md:px-12 md:pb-12", children: /* @__PURE__ */ jsx(
          "div",
          {
            className: cn(
              "text-card-foreground flex min-h-0 flex-1 flex-col overflow-hidden",
              "-mx-5 md:-mx-12"
            ),
            children: /* @__PURE__ */ jsx(CoachShell, {})
          }
        ) })
      }
    ),
    /* @__PURE__ */ jsx(
      "main",
      {
        className: cn(
          "relative z-10 min-h-0",
          isCoachOpen ? "h-0 shrink-0 overflow-hidden opacity-0 select-none pointer-events-none" : MAIN_PAD
        ),
        "aria-hidden": isCoachOpen,
        children
      }
    )
  ] });
}
function CoachRuntimeProvider({ children }) {
  const [isCoachOpen, setIsCoachOpen] = useState(false);
  const [coachAgentWorking, setCoachAgentWorkingState] = useState(false);
  const [coachHasUnreadFromAssistant, setCoachHasUnreadFromAssistant] = useState(false);
  const isOpenRef = useRef(false);
  const openCoach = useCallback(() => {
    isOpenRef.current = true;
    setIsCoachOpen(true);
    setCoachHasUnreadFromAssistant(false);
  }, []);
  const closeCoach = useCallback(() => {
    isOpenRef.current = false;
    setIsCoachOpen(false);
  }, []);
  const toggleCoach = useCallback(() => {
    setIsCoachOpen((prev) => {
      const next = !prev;
      isOpenRef.current = next;
      if (next) setCoachHasUnreadFromAssistant(false);
      return next;
    });
  }, []);
  const setCoachAgentWorking = useCallback((working) => {
    setCoachAgentWorkingState(working);
  }, []);
  const signalAssistantReplyFinishedWhileClosed = useCallback(() => {
    if (!isOpenRef.current) {
      setCoachHasUnreadFromAssistant(true);
    }
  }, []);
  const value = useMemo(
    () => ({
      isCoachOpen,
      openCoach,
      closeCoach,
      toggleCoach,
      coachAgentWorking,
      coachHasUnreadFromAssistant,
      setCoachAgentWorking,
      signalAssistantReplyFinishedWhileClosed
    }),
    [
      isCoachOpen,
      openCoach,
      closeCoach,
      toggleCoach,
      coachAgentWorking,
      coachHasUnreadFromAssistant,
      setCoachAgentWorking,
      signalAssistantReplyFinishedWhileClosed
    ]
  );
  return /* @__PURE__ */ jsx(CoachRuntimeContext.Provider, { value, children });
}
export {
  CoachShell as C,
  useCoachRuntime as a,
  CoachRuntimeProvider as b,
  CoachMainArea as c,
  useCoachRuntimeOptional as u
};
