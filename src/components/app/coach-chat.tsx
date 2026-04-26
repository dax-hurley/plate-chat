import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isTextUIPart, type UIMessage } from "ai";
import {
  ArrowUp,
  ChevronLeft,
  Loader2,
  MessageSquarePlus,
  Pencil,
  Sparkles,
  WifiOff,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { authFetch } from "@/lib/client/auth-fetch";
import { triggerSync } from "@/lib/client/db/sync";
import { useOnline } from "@/lib/client/use-online";
import {
  CoachContextInspector,
  CoachContextInspectorTrigger,
} from "@/components/app/coach-context-inspector";
import { useCoachRuntimeOptional } from "@/components/app/coach-runtime";
import {
  AssistantMessageParts,
  isOfflineCoachNotice,
  lastAssistantMessageId,
  OFFLINE_COACH_REPLY,
} from "@/components/chat/assistant-message-parts";
import { Button } from "@/components/ui/button";
import { isCoachAiDebugUiEnabled } from "@/lib/coach-ai-debug";
import type { CoachContextPreviewPayload } from "@/lib/coach-context-preview";
import {
  approxTokensFromText,
  truncateForDebugPreview,
} from "@/lib/coach-debug-tokens";
import {
  coachEmptyStateLead,
  coachNewChatSubtitle,
} from "@/lib/coach-greetings";
import { cn } from "@/lib/utils";

const STATIC_QUICK_REPLIES = [
  "📈 Analyze my progress",
  "💪 Create a workout routine",
  "🍽️ Make a meal plan",
] as const;

function newCoachMessageId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `coach-${Date.now()}`;
}

function textFromParts(message: UIMessage) {
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

/** Full text transcript for title generation (server truncates). */
function messagesToTitleContext(messages: UIMessage[]) {
  const out: { role: string; text: string }[] = [];
  for (const m of messages) {
    if (m.role !== "user" && m.role !== "assistant") continue;
    const text = textFromParts(m).trim();
    if (!text) continue;
    out.push({ role: m.role, text });
  }
  return out;
}

function userMessageCount(messages: UIMessage[]) {
  return messages.filter((m) => m.role === "user").length;
}

type CoachAiUsageMeta = {
  coachAiUsage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
};

function coachAiUsageFromMessage(m: UIMessage): CoachAiUsageMeta["coachAiUsage"] {
  const meta = m.metadata as CoachAiUsageMeta | undefined;
  return meta?.coachAiUsage;
}

function formatTokenCount(n: number | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString();
}

const COACH_DEBUG_DATA_TYPE = "data-coach-debug" as const;

/** Strip legacy debug artifacts before persisting (tokens may remain). */
function stripCoachDebugForPersistence(messages: UIMessage[]): UIMessage[] {
  return messages.map((m) => {
    if (m.role !== "assistant") return m;
    let next = m;
    if (m.parts?.length) {
      const parts = m.parts.filter((p) => p.type !== COACH_DEBUG_DATA_TYPE);
      if (parts.length !== m.parts.length) next = { ...next, parts };
    }
    const meta = next.metadata as Record<string, unknown> | undefined;
    if (meta && "coachDebug" in meta) {
      const rest = { ...meta };
      delete rest.coachDebug;
      next = {
        ...next,
        metadata:
          Object.keys(rest).length > 0
            ? (rest as CoachAiUsageMeta)
            : undefined,
      };
    }
    return next;
  });
}

/**
 * UI messages as they would be sent on the next submit: history plus composer text as a pending
 * user message (or the edited user message while editing).
 */
function uiMessagesForNextSend(options: {
  messages: UIMessage[];
  input: string;
  editingUserId: string | null;
  editDraft: string;
}): UIMessage[] {
  const { messages, input, editingUserId, editDraft } = options;
  if (editingUserId != null) {
    const idx = messages.findIndex((m) => m.id === editingUserId);
    if (idx < 0) return messages;
    const base = messages[idx];
    if (base.role !== "user") return messages;
    const prefix = messages.slice(0, idx);
    const updated: UIMessage = {
      ...base,
      parts: [{ type: "text", text: editDraft }],
    };
    return [...prefix, updated];
  }
  const text = input.trim();
  if (!text) return messages;
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `pending-${Date.now()}`;
  const pending: UIMessage = {
    id,
    role: "user",
    parts: [{ type: "text", text }],
  };
  return [...messages, pending];
}

/** Most recent assistant message that already has provider token usage (may be an earlier turn while the latest reply is still streaming). */
function lastCoachAiUsageFromMessages(
  msgs: UIMessage[]
): CoachAiUsageMeta["coachAiUsage"] | undefined {
  for (let i = msgs.length - 1; i >= 0; i--) {
    const m = msgs[i];
    if (m.role !== "assistant") continue;
    const u = coachAiUsageFromMessage(m);
    if (u != null) return u;
  }
  return undefined;
}

/** After the 1st user message, then every 5 user messages (5, 10, …). */
function shouldGenerateConversationTitle(messages: UIMessage[]) {
  const n = userMessageCount(messages);
  return n === 1 || (n > 0 && n % 5 === 0);
}

export type CoachChatProps = {
  conversationId: string;
  initialMessages: UIMessage[];
  conversationTitle: string;
  onMobileBack?: () => void;
  onNewConversation?: () => void;
  onPersist?: () => void;
  /** Deep-link: auto-send in an empty thread; if the thread already has messages (offline or fallback), fill the composer. */
  initialComposerText?: string;
  onInitialComposerTextApplied?: () => void;
};

export function CoachChat({
  conversationId,
  initialMessages,
  conversationTitle,
  onMobileBack,
  onNewConversation,
  onPersist,
  initialComposerText,
  onInitialComposerTextApplied,
}: CoachChatProps) {
  const [input, setInput] = useState("");
  /** Hide inline quick-reply chips for an assistant message after tap or new user send. */
  const [dismissedQuickByAssistantId, setDismissedQuickByAssistantId] =
    useState<Record<string, true>>({});
  const [emptyQuickDismissed, setEmptyQuickDismissed] = useState(false);
  /** Edit user message in the composer below; saving truncates all messages after it. */
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  /** Snapshot of composer text before opening edit, restored on cancel. */
  const [inputBeforeEdit, setInputBeforeEdit] = useState<string | null>(null);
  const [contextInspectorOpen, setContextInspectorOpen] = useState(false);
  const [contextPreview, setContextPreview] =
    useState<CoachContextPreviewPayload | null>(null);
  const [contextPreviewLoading, setContextPreviewLoading] = useState(false);
  const [contextPreviewError, setContextPreviewError] = useState<string | null>(
    null
  );
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
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
    async (messages: UIMessage[], aiTitle?: string) => {
      try {
        await authFetch(`/api/coach/conversations/${conversationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: stripCoachDebugForPersistence(messages),
            ...(aiTitle ? { title: aiTitle } : {}),
          }),
        });
        onPersistRef.current?.();
      } catch {
        /* ignore */
      }
    },
    [conversationId]
  );

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/coach/chat",
        fetch: authFetch,
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
    clearError,
  } = useChat({
    id: conversationId,
    messages: initialMessages,
    transport,
    onFinish: ({ messages: next, isAbort, isError }) => {
      void (async () => {
        try {
          let aiTitle: string | undefined;
          if (
            !isAbort &&
            !isError &&
            shouldGenerateConversationTitle(next)
          ) {
            try {
              const r = await authFetch("/api/coach/conversation-title", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  messages: messagesToTitleContext(next),
                }),
              });
              const data = (await r.json()) as { title?: string };
              const t = data.title?.trim();
              if (t) aiTitle = t.slice(0, 120);
            } catch {
              /* keep default title path in PATCH */
            }
          }
          await persistMessages(next, aiTitle);
        } finally {
          /** Coach tools mutate server-backed collections; pull immediately so open pages (Dexie live queries) update without waiting for the poll interval. */
          triggerSync();
        }
      })();
    },
  });

  const messagesRef = useRef<UIMessage[]>(messages);
  messagesRef.current = messages;

  const statusRef = useRef(status);
  statusRef.current = status;
  const editingUserIdRef = useRef(editingUserId);
  editingUserIdRef.current = editingUserId;
  const onlineRef = useRef(online);
  onlineRef.current = online;

  /** When returning from a background tab/app, server may have newer messages (tools ran while frozen). */
  useEffect(() => {
    const resyncFromServer = () => {
      if (document.visibilityState !== "visible") return;
      if (!onlineRef.current) return;
      if (
        statusRef.current === "streaming" ||
        statusRef.current === "submitted"
      ) {
        return;
      }
      if (editingUserIdRef.current !== null) return;
      void (async () => {
        try {
          const r = await authFetch(`/api/coach/conversations/${conversationId}`);
          if (!r.ok) return;
          const data = (await r.json()) as {
            conversation?: { messages?: UIMessage[] };
          };
          const next = data.conversation?.messages;
          if (!Array.isArray(next)) return;
          setMessages(next);
          onPersistRef.current?.();
          triggerSync();
        } catch {
          /* ignore */
        }
      })();
    };

    document.addEventListener("visibilitychange", resyncFromServer);
    const onPageShow = (ev: PageTransitionEvent) => {
      if (ev.persisted) resyncFromServer();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => {
      document.removeEventListener("visibilitychange", resyncFromServer);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [conversationId, setMessages]);

  /** Tab / mobile background can freeze the UI stream; persist draft so reload restores partial assistant text. */
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

  /**
   * `useChat` stays `streaming` until the response body closes. The model can go quiet for a long
   * time while tools run server-side, so the stream has no chunks even though the request is still
   * open — avoid implying tokens are still arriving.
   */
  const lastStreamProgressAtRef = useRef(Date.now());
  useEffect(() => {
    if (status === "streaming" || status === "submitted") {
      lastStreamProgressAtRef.current = Date.now();
    }
  }, [messages, status]);

  const STREAM_QUIET_MS = 7000;
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
  const workingLabel =
    status === "submitted"
      ? "Starting reply…"
      : streamQuietLong
        ? "Working…"
        : "Generating reply…";

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

  const draftForComposerDebug =
    editingUserId != null ? editDraft : input;
  const lastUsageForComposer = useMemo(
    () => lastCoachAiUsageFromMessages(messages),
    [messages]
  );
  const showComposerDebug =
    isCoachAiDebugUiEnabled() || lastUsageForComposer != null;
  const draftApproxTokens = approxTokensFromText(draftForComposerDebug);
  const draftPreview =
    draftForComposerDebug.trim().length > 0
      ? truncateForDebugPreview(draftForComposerDebug)
      : null;

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
            editDraft,
          });
          const r = await authFetch("/api/coach/context-preview", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ conversationId, messages: msgs }),
          });
          if (!r.ok) {
            const errText = await r.text();
            throw new Error(
              r.status === 404
                ? "Context preview needs COACH_AI_DEBUG=true on the server."
                : errText || r.statusText
            );
          }
          const data = (await r.json()) as CoachContextPreviewPayload;
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
    editDraft,
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
    (userText: string) => {
      const uid = newCoachMessageId();
      const aid = newCoachMessageId();
      const userMsg: UIMessage = {
        id: uid,
        role: "user",
        parts: [{ type: "text", text: userText }],
      };
      const assistantMsg: UIMessage = {
        id: aid,
        role: "assistant",
        parts: [{ type: "text", text: OFFLINE_COACH_REPLY }],
      };
      setMessages((prev) => {
        const next = [...prev, userMsg, assistantMsg];
        void persistMessages(next);
        return next;
      });
    },
    [persistMessages, setMessages]
  );

  const autoSendInitialPromptKey = useRef<string | null>(null);
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
    sendMessage,
  ]);

  function beginEditUserMessage(m: UIMessage) {
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

    const updated: UIMessage = {
      ...prev,
      parts: [{ type: "text", text: trimmed }],
    };
    const next = messages.slice(0, idx).concat([updated]);
    setMessages(next);
    setEditingUserId(null);
    setEditDraft("");
    setInputBeforeEdit(null);
    setDismissedQuickByAssistantId((d) => {
      const keep = new Set(next.map((x) => x.id));
      const out: Record<string, true> = {};
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
      behavior: "smooth",
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

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    void submitComposer();
  }

  function onComposerKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
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

  function sendQuick(text: string) {
    const t = text.trim();
    if (!t) return;
    // Do not gate on `busy`: the model often streams `suggest_quick_replies` last; the overall
    // request can still be "streaming" while chips are already actionable. useChat accepts a new
    // send while the prior stream is winding down.
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

  return (
    <div
      className="bg-background flex min-h-0 flex-1 flex-col"
      aria-busy={busy}
    >
      <header className="border-border bg-background/95 shrink-0 border-b px-3 py-3 backdrop-blur-sm md:px-4">
        <div className="flex items-center gap-2">
          {onMobileBack ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-foreground shrink-0 md:hidden"
              aria-label="Back to conversations"
              onClick={onMobileBack}
            >
              <ChevronLeft className="size-5" strokeWidth={2} aria-hidden />
            </Button>
          ) : null}
          <span
            className={cn(
              "inline-flex size-9 shrink-0 items-center justify-center rounded-xl ring-1 transition-shadow",
              !online && !busy
                ? "bg-amber-500/15 text-amber-700 ring-amber-500/25 dark:text-amber-400"
                : "bg-primary/15 text-primary ring-primary/15",
              busy &&
                (streamQuietLong
                  ? "ring-primary/25"
                  : "ring-primary/35 shadow-[0_0_0_3px_hsl(var(--primary)/0.12)]")
            )}
            aria-hidden
          >
            {busy ? (
              <Loader2
                className={cn(
                  "size-4",
                  streamQuietLong
                    ? "text-primary/80 animate-[spin_2.5s_linear_infinite]"
                    : "animate-spin"
                )}
                strokeWidth={2.25}
              />
            ) : !online ? (
              <WifiOff className="size-4" strokeWidth={2} />
            ) : (
              <Sparkles className="size-4" strokeWidth={2} />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-semibold tracking-tight">Coach Miles</h1>
            <p
              className={cn(
                "min-w-0 text-xs",
                busy
                  ? "text-primary font-medium"
                  : !online
                    ? "text-amber-800 dark:text-amber-400 font-medium"
                    : "text-muted-foreground truncate"
              )}
              title={
                busy
                  ? workingLabel
                  : !online
                    ? "You're offline. Messages you send stay on this device until you reconnect."
                    : conversationTitle === "New chat"
                      ? coachNewChatSubtitle(conversationId)
                      : conversationTitle
              }
              role={busy || !online ? "status" : undefined}
              aria-live={busy || !online ? "polite" : undefined}
            >
              {busy ? (
                <span className="min-w-0 truncate">{workingLabel}</span>
              ) : !online ? (
                <span className="flex min-w-0 items-center gap-1.5">
                  <WifiOff className="size-3.5 shrink-0" aria-hidden />
                  <span className="min-w-0 truncate">
                    Offline — coach replies when you&apos;re back online
                  </span>
                </span>
              ) : conversationTitle === "New chat" ? (
                coachNewChatSubtitle(conversationId)
              ) : (
                conversationTitle
              )}
            </p>
          </div>
          {onNewConversation ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 gap-1 md:hidden"
              onClick={onNewConversation}
            >
              <MessageSquarePlus className="size-4" aria-hidden />
              New
            </Button>
          ) : null}
        </div>
      </header>

      <div
        ref={scrollRef}
        className="text-muted-foreground min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 text-sm"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
            <p className="text-foreground max-w-sm text-base font-medium">
              {coachEmptyStateLead(conversationId)}
            </p>
            {!emptyQuickDismissed ? (
              <div
                className="flex max-w-md flex-wrap justify-center gap-2"
                aria-label="Suggested starters"
              >
                {STATIC_QUICK_REPLIES.map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => sendQuick(label)}
                    className={cn(
                      "border-border bg-muted/60 text-foreground hover:bg-muted rounded-2xl border px-3 py-2 text-left text-xs font-medium transition-colors sm:text-sm",
                      "disabled:pointer-events-none disabled:opacity-50",
                      "max-w-full min-w-0 shrink-0 break-words whitespace-normal sm:max-w-[min(100%,16rem)]"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "flex",
                m.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {m.role === "user" ? (
                <div className="flex max-w-[90%] flex-col items-end gap-1.5">
                  <p
                    className={cn(
                      "bg-primary text-primary-foreground rounded-2xl px-4 py-2.5 font-medium whitespace-pre-wrap",
                      editingUserId === m.id &&
                        "ring-primary/60 ring-2 ring-offset-2 ring-offset-background"
                    )}
                  >
                    {textFromParts(m)}
                  </p>
                  {editingUserId === m.id ? (
                    <p className="text-muted-foreground max-w-full text-right text-[0.65rem] leading-snug">
                      Editing in the message box below. Saving removes
                      everything after this message.
                    </p>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground h-8 touch-manipulation gap-1 px-2 text-xs"
                      disabled={busy}
                      title="Edit message; removes replies after it"
                      onClick={() => beginEditUserMessage(m)}
                    >
                      <Pencil className="size-3.5" aria-hidden />
                      Edit
                    </Button>
                  )}
                </div>
              ) : (
                <div
                  className={cn(
                    "max-w-[95%] space-y-2 rounded-2xl border px-4 py-3",
                    isOfflineCoachNotice(m)
                      ? "border-amber-500/45 bg-amber-500/10"
                      : "bg-muted/40 border-border/60"
                  )}
                >
                  <AssistantMessageParts
                    message={m}
                    dismissedQuickReplies={
                      dismissedQuickByAssistantId[m.id] === true
                    }
                    onQuickReply={sendQuick}
                    onRegenerate={() => void regenerate({ messageId: m.id })}
                    busy={busy}
                    online={online}
                    showRegenerateAndTokenRow
                    showOfflineStyling
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="border-border bg-background/95 shrink-0 border-t px-4 py-3">
        <p className="text-muted-foreground mb-3 text-[0.65rem] leading-relaxed">
          AI can make mistakes. Not medical advice—verify important information
          and consult a professional when needed.
        </p>
        {!online ? (
          <p
            className="text-amber-800 dark:text-amber-400 mb-3 flex items-start gap-2 text-xs leading-snug"
            role="status"
            aria-live="polite"
          >
            <WifiOff className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span>
              You&apos;re offline. Your message is shown in the chat with a
              local note — it is not sent to the coach until you reconnect.
            </span>
          </p>
        ) : null}
        {error ? (
          <div
            className="mb-2 flex flex-col gap-2"
            role="alert"
          >
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-destructive text-sm">
                {isCoachAiDebugUiEnabled() && error.message.trim()
                  ? error.message
                  : "Something went wrong."}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                disabled={busy || !online}
                onClick={() => void retryAfterChatError()}
              >
                Retry
              </Button>
            </div>
            {isCoachAiDebugUiEnabled() &&
            error.message.trim() === "Something went wrong." ? (
              <p className="text-muted-foreground text-[0.65rem] leading-snug">
                Response body is still generic. Set{" "}
                <code className="bg-muted rounded px-1 font-mono text-[0.6rem]">
                  COACH_AI_DEBUG=true
                </code>{" "}
                on the server so <code className="font-mono">/api/coach/chat</code>{" "}
                can return detailed errors.
              </p>
            ) : null}
            {isCoachAiDebugUiEnabled() && error.stack ? (
              <details className="group border-border/80 bg-muted/30 rounded-lg border">
                <summary className="text-muted-foreground cursor-pointer px-3 py-2 text-xs font-medium marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="underline-offset-2 group-open:underline">
                    Stack trace
                  </span>
                </summary>
                <pre className="text-muted-foreground max-h-40 overflow-auto border-t px-3 py-2 font-mono text-[0.65rem] leading-snug whitespace-pre-wrap break-words">
                  {error.stack}
                </pre>
              </details>
            ) : null}
          </div>
        ) : null}

        <form onSubmit={(e) => void onSubmit(e)}>
          {editingUserId != null ? (
            <div className="text-muted-foreground mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-medium text-foreground">Editing message</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={cancelEditUserMessage}
              >
                Cancel
              </Button>
            </div>
          ) : null}
          <div
            className={cn(
              "border-input bg-background relative rounded-lg border shadow-sm transition-colors",
              busy && "border-primary/35 bg-muted/25",
              !busy &&
                !online &&
                "border-amber-500/35 bg-amber-500/[0.06] dark:bg-amber-500/10",
              editingUserId != null && "border-primary/40 bg-muted/20",
              "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50"
            )}
          >
            <textarea
              ref={composerRef}
              value={editingUserId != null ? editDraft : input}
              onChange={(e) =>
                editingUserId != null
                  ? setEditDraft(e.target.value)
                  : setInput(e.target.value)
              }
              onKeyDown={onComposerKeyDown}
              placeholder={
                editingUserId != null
                  ? "Edit your message… (Enter to save, Shift+Enter for new line, Esc to cancel)"
                  : "Message your coach… (Enter to send, Shift+Enter for new line)"
              }
              rows={2}
              className={cn(
                "placeholder:text-muted-foreground min-h-[4.5rem] w-full resize-y border-0 bg-transparent py-2.5 pr-14 pl-3 pb-11 text-sm outline-none",
                "focus-visible:ring-0",
                "disabled:opacity-60"
              )}
              disabled={busy}
              aria-label={editingUserId != null ? "Edit message" : "Message"}
            />
            <div className="absolute right-2 bottom-2 flex items-center gap-1.5">
              {busy ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void stop()}
                >
                  Stop
                </Button>
              ) : editingUserId != null ? (
                <Button
                  type="submit"
                  size="icon"
                  disabled={!editDraft.trim()}
                  aria-label="Save edit"
                  title="Save (removes messages after this one)"
                >
                  <ArrowUp className="size-4" strokeWidth={2.25} />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim()}
                  aria-label="Send message"
                >
                  <ArrowUp className="size-4" strokeWidth={2.25} />
                </Button>
              )}
            </div>
          </div>
          {showComposerDebug ? (
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
              <CoachContextInspectorTrigger
                disabled={busy || !online}
                onClick={() => setContextInspectorOpen(true)}
              />
              <p
                className="text-muted-foreground font-mono text-[0.65rem] leading-snug sm:max-w-[min(100%,42rem)] sm:text-right"
                title="Draft tokens are a rough estimate (characters ÷ 4). Last reply uses provider counts."
                aria-live="polite"
              >
                {lastUsageForComposer ? (
                  <>
                    Last reply — input:{" "}
                    {formatTokenCount(lastUsageForComposer.inputTokens)} · output:{" "}
                    {formatTokenCount(lastUsageForComposer.outputTokens)} · total:{" "}
                    {formatTokenCount(lastUsageForComposer.totalTokens)}
                    <span aria-hidden> · </span>
                  </>
                ) : null}
                Draft ~{draftApproxTokens.toLocaleString()} tok (approx.)
                {draftPreview != null ? (
                  <>
                    <span aria-hidden> · </span>
                    <span className="break-words">{`“${draftPreview}”`}</span>
                  </>
                ) : (
                  <>
                    <span aria-hidden> · </span>
                    <span className="text-muted-foreground/80">(empty)</span>
                  </>
                )}
              </p>
            </div>
          ) : null}
        </form>
      </div>

      <CoachContextInspector
        open={contextInspectorOpen}
        onOpenChange={setContextInspectorOpen}
        payload={contextPreview}
        loading={contextPreviewLoading}
        error={contextPreviewError}
      />
    </div>
  );
}
