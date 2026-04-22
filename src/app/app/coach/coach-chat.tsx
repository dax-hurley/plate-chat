"use client";

import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  getToolName,
  isTextUIPart,
  isToolUIPart,
  type UIMessage,
} from "ai";
import {
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MessageSquarePlus,
  Pencil,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  CoachContextInspector,
  CoachContextInspectorTrigger,
} from "@/components/app/coach-context-inspector";
import { useCoachRuntimeOptional } from "@/components/app/coach-runtime";
import { AssistantMarkdown } from "@/components/assistant-markdown";
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
import { getCoachToolUiCopy } from "@/lib/coach-tool-ui";
import { cn } from "@/lib/utils";

const STATIC_QUICK_REPLIES = [
  "📈 Analyze my progress",
  "💪 Create a new workout",
  "🍽️ Make a meal plan",
] as const;

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

const QUICK_REPLY_TOOL = "suggest_quick_replies";

function isQuickRepliesToolPart(part: UIMessage["parts"][number]): boolean {
  return isToolUIPart(part) && getToolName(part) === QUICK_REPLY_TOOL;
}

/** Merge adjacent text parts so markdown lists/code fences parse across stream chunks. */
function mergeAssistantParts(parts: UIMessage["parts"]) {
  type Seg =
    | { kind: "text"; text: string }
    | { kind: "tool"; part: UIMessage["parts"][number] };
  const segments: Seg[] = [];
  let textBuf = "";
  for (const part of parts) {
    if (part.type === "text") {
      textBuf += part.text;
    } else if (isToolUIPart(part)) {
      if (textBuf) {
        segments.push({ kind: "text", text: textBuf });
        textBuf = "";
      }
      segments.push({ kind: "tool", part });
    }
  }
  if (textBuf) segments.push({ kind: "text", text: textBuf });
  return segments;
}

type DisplaySeg =
  | { kind: "text"; text: string }
  | { kind: "tools"; parts: UIMessage["parts"][number][] }
  | { kind: "quickReplies"; part: UIMessage["parts"][number] };

/** Text + tool runs for accordion; `suggest_quick_replies` is isolated for inline chip UI. */
function groupForDisplay(
  segments: ReturnType<typeof mergeAssistantParts>
): DisplaySeg[] {
  const out: DisplaySeg[] = [];
  let toolBuf: UIMessage["parts"][number][] = [];

  const flushTools = () => {
    if (toolBuf.length === 0) return;
    out.push({ kind: "tools", parts: toolBuf });
    toolBuf = [];
  };

  for (const seg of segments) {
    if (seg.kind === "text") {
      flushTools();
      out.push(seg);
    } else if (isQuickRepliesToolPart(seg.part)) {
      flushTools();
      out.push({ kind: "quickReplies", part: seg.part });
    } else {
      toolBuf.push(seg.part);
    }
  }
  flushTools();
  return out;
}

type QuickReplyRow = { text: string; emoji: string };

function parseQuickReplyToolInput(input: unknown): { rows: QuickReplyRow[] } {
  if (!input || typeof input !== "object") {
    return { rows: [] };
  }
  const o = input as { suggestions?: unknown; emoji?: unknown };
  const raw = o.suggestions;
  const topEmoji =
    typeof o.emoji === "string" ? o.emoji.trim().slice(0, 8) : "";
  const acc: QuickReplyRow[] = [];
  if (Array.isArray(raw)) {
    for (const x of raw) {
      if (typeof x === "string") {
        const t = x.trim();
        if (t) acc.push({ text: t, emoji: "" });
      } else if (x && typeof x === "object" && typeof (x as { text?: unknown }).text === "string") {
        const text = String((x as { text: string }).text).trim();
        if (!text) continue;
        const em =
          typeof (x as { emoji?: unknown }).emoji === "string"
            ? (x as { emoji: string }).emoji.trim().slice(0, 8)
            : "";
        acc.push({ text, emoji: em });
      }
    }
  }
  const seed =
    acc.find((r) => r.emoji.length > 0)?.emoji || topEmoji || "";
  const rows = acc.map((r) => ({
    text: r.text,
    emoji: r.emoji || seed,
  }));
  return { rows: rows.slice(0, 8) };
}

/** Merge tool `input` and execute `output` (same shape) for display after stream completes. */
function parseQuickReplyUIPart(part: UIMessage["parts"][number]): {
  rows: QuickReplyRow[];
} {
  if (!isToolUIPart(part)) {
    return { rows: [] };
  }
  const fromInput = parseQuickReplyToolInput(part.input);
  const out =
    "output" in part &&
    part.output != null &&
    typeof part.output === "object"
      ? parseQuickReplyToolInput(part.output)
      : { rows: [] as QuickReplyRow[] };
  return {
    rows:
      fromInput.rows.length > 0 ? fromInput.rows : out.rows,
  };
}

const DEFAULT_QUICK_REPLY_EMOJI = "💬";

/** Prefix each chip with one emoji (model field or default); avoids doubling if the line already starts with the same emoji. */
function quickReplyChipText(emoji: string, suggestion: string) {
  const e = (emoji.trim() || DEFAULT_QUICK_REPLY_EMOJI).slice(0, 8);
  const s = suggestion.trim();
  if (s.startsWith(e)) return s;
  return `${e} ${s}`;
}

function lastAssistantMessageId(msgs: UIMessage[]): string | null {
  for (let i = msgs.length - 1; i >= 0; i--) {
    if (msgs[i].role === "assistant") return msgs[i].id;
  }
  return null;
}

type CoachToolRunMode = "pending" | "complete" | "error";

function coachToolRunMode(
  part: UIMessage["parts"][number]
): CoachToolRunMode {
  if (!isToolUIPart(part)) return "complete";
  const s = part.state;
  if (
    s === "input-streaming" ||
    s === "input-available" ||
    s === "approval-requested" ||
    s === "approval-responded"
  ) {
    return "pending";
  }
  if (s === "output-error" || s === "output-denied") {
    return "error";
  }
  return "complete";
}

/** Merge consecutive same tool + same outcome (pending / success / error) for compact labels. */
function summarizeConsecutiveCoachToolRuns(parts: UIMessage["parts"][number][]) {
  const rows: { name: string; count: number; mode: CoachToolRunMode }[] = [];
  for (const part of parts) {
    if (!isToolUIPart(part)) continue;
    const name = getToolName(part);
    const mode = coachToolRunMode(part);
    const prev = rows[rows.length - 1];
    if (prev && prev.name === name && prev.mode === mode) prev.count += 1;
    else rows.push({ name, count: 1, mode });
  }
  return rows;
}

function formatCoachToolRunLabel(
  name: string,
  count: number,
  mode: CoachToolRunMode
) {
  const { completionText, errorText } = getCoachToolUiCopy(name);
  const base =
    mode === "pending"
      ? "Working…"
      : mode === "error"
        ? errorText
        : completionText;
  return count > 1 ? `${base} ×${count}` : base;
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
};

export function CoachChat({
  conversationId,
  initialMessages,
  conversationTitle,
  onMobileBack,
  onNewConversation,
  onPersist,
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
        await fetch(`/api/coach/conversations/${conversationId}`, {
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
        let aiTitle: string | undefined;
        if (
          !isAbort &&
          !isError &&
          shouldGenerateConversationTitle(next)
        ) {
          try {
            const r = await fetch("/api/coach/conversation-title", {
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
      })();
    },
  });

  const messagesRef = useRef<UIMessage[]>(messages);
  messagesRef.current = messages;

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
          const r = await fetch("/api/coach/context-preview", {
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
    clearError();
    const last = messagesRef.current[messagesRef.current.length - 1];
    if (!last) return;
    if (last.role === "assistant") {
      await regenerate({ messageId: last.id });
    } else {
      await sendMessage();
    }
  }, [clearError, regenerate, sendMessage]);

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
              "bg-primary/15 text-primary ring-primary/15 inline-flex size-9 shrink-0 items-center justify-center rounded-xl ring-1 transition-shadow",
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
                  : "text-muted-foreground truncate"
              )}
              title={
                busy
                  ? workingLabel
                  : conversationTitle === "New chat"
                    ? coachNewChatSubtitle(conversationId)
                    : conversationTitle
              }
              role={busy ? "status" : undefined}
              aria-live={busy ? "polite" : undefined}
            >
              {busy ? (
                <span className="min-w-0 truncate">{workingLabel}</span>
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
                <div className="bg-muted/40 max-w-[95%] space-y-2 rounded-2xl border border-border/60 px-4 py-3">
                  {groupForDisplay(mergeAssistantParts(m.parts)).map(
                    (seg, i) => {
                      if (seg.kind === "text") {
                        return (
                          <AssistantMarkdown key={i} content={seg.text} />
                        );
                      }
                      if (seg.kind === "quickReplies") {
                        if (dismissedQuickByAssistantId[m.id]) return null;
                        const part = seg.part;
                        if (!isToolUIPart(part)) return null;
                        const { rows } = parseQuickReplyUIPart(part);
                        const inFlight =
                          part.state === "input-streaming" ||
                          part.state === "input-available";
                        const showSkeleton = inFlight && rows.length === 0;
                        const key =
                          "toolCallId" in part ? part.toolCallId : String(i);
                        if (!inFlight && rows.length === 0) {
                          return null;
                        }
                        return (
                          <div
                            key={key}
                            className="border-border/60 mt-1 flex flex-wrap gap-2 border-t border-dashed pt-3"
                          >
                            {showSkeleton ? (
                              <div
                                className="flex flex-wrap gap-2"
                                aria-busy="true"
                                aria-live="polite"
                                aria-label="Loading quick reply suggestions"
                              >
                                <div className="bg-muted/70 h-9 w-[7.25rem] max-w-[42%] animate-pulse rounded-full" />
                                <div className="bg-muted/70 h-9 w-[9.5rem] max-w-[55%] animate-pulse rounded-full" />
                                <div className="bg-muted/70 h-9 w-[6rem] max-w-[36%] animate-pulse rounded-full" />
                              </div>
                            ) : (
                              rows.map((row, j) => (
                                <button
                                  key={`${key}-${j}-${row.text}`}
                                  type="button"
                                  onClick={() =>
                                    sendQuick(
                                      quickReplyChipText(row.emoji, row.text)
                                    )
                                  }
                                  className={cn(
                                    "border-border bg-background text-foreground hover:bg-muted rounded-2xl border px-3 py-2 text-left text-xs font-medium transition-colors sm:text-sm",
                                    "disabled:pointer-events-none disabled:opacity-50",
                                    "max-w-full min-w-0 shrink-0 break-words whitespace-normal sm:max-w-[min(100%,16rem)]"
                                  )}
                                >
                                  {quickReplyChipText(row.emoji, row.text)}
                                </button>
                              ))
                            )}
                          </div>
                        );
                      }
                      const rows = summarizeConsecutiveCoachToolRuns(seg.parts);
                      if (rows.length === 0) return null;

                      if (rows.length === 1) {
                        const { name, count, mode } = rows[0];
                        const firstPart = seg.parts.find(isToolUIPart);
                        const rowKey =
                          firstPart && "toolCallId" in firstPart
                            ? firstPart.toolCallId
                            : String(i);
                        return (
                          <div
                            key={rowKey}
                            className="flex flex-wrap items-center gap-2"
                            aria-busy={mode === "pending"}
                          >
                            <p
                              className={cn(
                                "font-sans text-xs font-medium",
                                mode === "error"
                                  ? "text-destructive"
                                  : "text-muted-foreground",
                                mode === "pending" && "coach-tool-pending"
                              )}
                            >
                              {formatCoachToolRunLabel(name, count, mode)}
                            </p>
                            {mode === "error" ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="text-destructive border-destructive/40 hover:bg-destructive/10 h-7 px-2 text-xs"
                                disabled={busy}
                                title="Retry this reply (including failed tools)"
                                onClick={() =>
                                  void regenerate({ messageId: m.id })
                                }
                              >
                                Retry
                              </Button>
                            ) : null}
                          </div>
                        );
                      }

                      const invocationCount = seg.parts.filter(isToolUIPart)
                        .length;
                      const anyToolError = rows.some((r) => r.mode === "error");
                      const anyToolPending = rows.some(
                        (r) => r.mode === "pending"
                      );
                      return (
                        <div key={i} className="space-y-2">
                          <details
                            className="border-border/80 bg-background/80 rounded-lg border [&[open]>summary_.accordion-chevron]:rotate-90"
                            aria-busy={anyToolPending}
                          >
                            <summary
                              className="text-foreground hover:bg-muted/50 flex cursor-pointer list-none items-center gap-2 px-3 py-2 font-sans text-xs font-medium [&::-webkit-details-marker]:hidden"
                            >
                              <ChevronRight
                                className="accordion-chevron text-muted-foreground size-3.5 shrink-0 transition-transform"
                                aria-hidden
                              />
                              <span
                                className={cn(
                                  anyToolPending && "coach-tool-pending"
                                )}
                              >
                                {invocationCount} tool actions
                              </span>
                            </summary>
                            <ul className="border-border/60 text-muted-foreground space-y-1 border-t px-3 py-2 font-sans text-xs font-medium">
                              {rows.map((row, j) => (
                                <li
                                  key={`${row.name}-${row.mode}-${j}`}
                                  className={cn(
                                    "pl-1",
                                    row.mode === "error" && "text-destructive",
                                    row.mode === "pending" && "coach-tool-pending"
                                  )}
                                >
                                  {formatCoachToolRunLabel(
                                    row.name,
                                    row.count,
                                    row.mode
                                  )}
                                </li>
                              ))}
                            </ul>
                          </details>
                          {anyToolError ? (
                            <div className="flex justify-end">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="text-destructive border-destructive/40 hover:bg-destructive/10 h-7 px-2 text-xs"
                                disabled={busy}
                                title="Retry this reply (including failed tools)"
                                onClick={() =>
                                  void regenerate({ messageId: m.id })
                                }
                              >
                                Retry
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      );
                    }
                  )}
                  {(() => {
                    const u = coachAiUsageFromMessage(m);
                    if (!u) return null;
                    return (
                      <p
                        className="text-muted-foreground font-mono text-[0.65rem] leading-snug"
                        title="Token counts from the model provider (aggregated across tool steps for this reply)"
                      >
                        AI tokens — input: {formatTokenCount(u.inputTokens)} ·
                        output: {formatTokenCount(u.outputTokens)} · total:{" "}
                        {formatTokenCount(u.totalTokens)}
                      </p>
                    );
                  })()}
                  <div className="border-border/60 flex justify-end border-t border-dotted pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground h-8 touch-manipulation gap-1.5 px-2 text-xs"
                      disabled={busy}
                      title="Replace this reply with a new one (same question)"
                      onClick={() => void regenerate({ messageId: m.id })}
                    >
                      <RefreshCw className="size-3.5" aria-hidden />
                      Regenerate
                    </Button>
                  </div>
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
                disabled={busy}
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
                disabled={busy}
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
