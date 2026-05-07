import { getToolName, isTextUIPart, isToolUIPart, type UIMessage } from "ai";
import { ChevronRight, RefreshCw, WifiOff } from "lucide-react";

import { AssistantMarkdown } from "@/components/assistant-markdown";
import { committedAssistantMarkdownPrefixLen } from "@/lib/streaming-markdown-split";
import { Button } from "@/components/ui/button";
import { getCoachToolUiCopy } from "@/lib/coach-tool-ui";
import { splitLeadingEmoji } from "@/lib/quick-reply-split";
import { cn } from "@/lib/utils";

export const QUICK_REPLY_TOOL = "suggest_quick_replies";

function isQuickRepliesToolPart(part: UIMessage["parts"][number]): boolean {
  return isToolUIPart(part) && getToolName(part) === QUICK_REPLY_TOOL;
}

/** Merge adjacent text parts so markdown lists/code fences parse across stream chunks. */
export function mergeAssistantParts(parts: UIMessage["parts"] | undefined) {
  type Seg =
    | { kind: "text"; text: string }
    | { kind: "tool"; part: UIMessage["parts"][number] };
  const segments: Seg[] = [];
  let textBuf = "";
  for (const part of parts ?? []) {
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
export function groupForDisplay(
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
        if (!t) continue;
        const { emoji, text } = splitLeadingEmoji(t);
        acc.push({ text: text || t, emoji });
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
  const seed = acc.find((r) => r.emoji.length > 0)?.emoji || topEmoji || "";
  const rows = acc.map((r) => ({
    text: r.text,
    emoji: r.emoji || seed,
  }));
  return { rows: rows.slice(0, 8) };
}

/** Merge tool `input` and execute `output` (same shape) for display after stream completes. */
export function parseQuickReplyUIPart(part: UIMessage["parts"][number]): {
  rows: QuickReplyRow[];
} {
  if (!isToolUIPart(part)) {
    return { rows: [] };
  }
  const fromInput = parseQuickReplyToolInput(part.input);
  const out =
    "output" in part && part.output != null && typeof part.output === "object"
      ? parseQuickReplyToolInput(part.output)
      : { rows: [] as QuickReplyRow[] };
  return {
    rows: fromInput.rows.length > 0 ? fromInput.rows : out.rows,
  };
}

const DEFAULT_QUICK_REPLY_EMOJI = "💬";

/** Prefix each chip with one emoji (model field or default); avoids doubling if the line already starts with the same emoji. */
export function quickReplyChipText(emoji: string, suggestion: string) {
  const e = (emoji.trim() || DEFAULT_QUICK_REPLY_EMOJI).slice(0, 8);
  const s = suggestion.trim();
  if (s.startsWith(e)) return s;
  return `${e} ${s}`;
}

export function lastAssistantMessageId(msgs: UIMessage[]): string | null {
  for (let i = msgs.length - 1; i >= 0; i--) {
    if (msgs[i].role === "assistant") return msgs[i].id;
  }
  return null;
}

type CoachToolRunMode = "pending" | "complete" | "error";

function coachToolRunMode(part: UIMessage["parts"][number]): CoachToolRunMode {
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
export function summarizeConsecutiveCoachToolRuns(
  parts: UIMessage["parts"][number][]
) {
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

type CoachAiUsageMeta = {
  coachAiUsage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
};

function coachAiUsageFromMessage(
  m: UIMessage
): CoachAiUsageMeta["coachAiUsage"] {
  const meta = m.metadata as CoachAiUsageMeta | undefined;
  return meta?.coachAiUsage;
}

function formatTokenCount(n: number | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString();
}

function textFromPartsForOffline(message: UIMessage) {
  const parts = message.parts ?? [];
  let out = "";
  for (const p of parts) {
    if (isTextUIPart(p)) {
      out += p.text;
    } else if (
      p.type === "reasoning" &&
      "text" in p &&
      typeof p.text === "string"
    ) {
      out += p.text;
    }
  }
  return out;
}

export const OFFLINE_COACH_REPLY =
  "You're offline, so this message didn't reach the coach. Reconnect to the internet and send again if you want a reply.";

/**
 * While the model streams, only the committed prefix (paragraph boundaries
 * outside code fences) is parsed with react-markdown + GFM; the tail is plain
 * text so we avoid re-parsing the full growing document on every token.
 * When the stream finishes, the full string is parsed as markdown once.
 */
function ThrottledAssistantMarkdown({
  content,
  active,
}: {
  content: string;
  /** When true, use incremental markdown + plaintext tail (streaming). */
  active: boolean;
}) {
  if (!active) {
    return <AssistantMarkdown content={content} />;
  }

  const split = committedAssistantMarkdownPrefixLen(content);
  const head = content.slice(0, split);
  const tail = content.slice(split);

  return (
    <>
      {head.trim() ? <AssistantMarkdown content={head} /> : null}
      {tail.length > 0 ? (
        <span className="text-foreground block text-[0.9375rem] leading-relaxed whitespace-pre-wrap break-words">
          {tail}
        </span>
      ) : null}
    </>
  );
}

export function isOfflineCoachNotice(m: UIMessage): boolean {
  return m.role === "assistant" && textFromPartsForOffline(m) === OFFLINE_COACH_REPLY;
}

export type AssistantMessagePartsProps = {
  message: UIMessage;
  dismissedQuickReplies: boolean;
  onQuickReply: (text: string) => void;
  onRegenerate?: () => void;
  busy: boolean;
  online: boolean;
  /** When false, omit bottom Regenerate and token debug (e.g. onboarding). */
  showRegenerateAndTokenRow?: boolean;
  /** When true, show per-reply provider token counts (requires debug / metadata). */
  showAssistantTokenUsage?: boolean;
  /** When false, never show the offline sub-label (e.g. onboarding). */
  showOfflineStyling?: boolean;
  /** When true, render streaming text with incremental markdown (prefix only) + plain tail. */
  streamThrottledMarkdown?: boolean;
};

/**
 * Renders the inner body of a coach/assistant turn: markdown, non–quick-reply tool rows, and
 * `suggest_quick_replies` chips. Shared by Coach chat and onboarding refinement.
 */
export function AssistantMessageParts({
  message,
  dismissedQuickReplies,
  onQuickReply,
  onRegenerate,
  busy,
  online,
  showRegenerateAndTokenRow = true,
  showOfflineStyling = true,
  streamThrottledMarkdown = false,
  showAssistantTokenUsage = false,
}: AssistantMessagePartsProps) {
  const m = message;
  if (m.role !== "assistant" || m.parts == null) return null;
  return (
    <>
      {isOfflineCoachNotice(m) && showOfflineStyling ? (
        <p className="text-amber-900 dark:text-amber-200 flex items-center gap-1.5 text-[0.65rem] font-semibold tracking-wide uppercase">
          <WifiOff className="size-3 shrink-0" aria-hidden />
          Offline
        </p>
      ) : null}
      {groupForDisplay(mergeAssistantParts(m.parts)).map((seg, i) => {
        if (seg.kind === "text") {
          return streamThrottledMarkdown ? (
            <ThrottledAssistantMarkdown
              key={`t-${i}`}
              content={seg.text}
              active={streamThrottledMarkdown}
            />
          ) : (
            <AssistantMarkdown key={`t-${i}`} content={seg.text} />
          );
        }
        if (seg.kind === "quickReplies") {
          if (dismissedQuickReplies) return null;
          const part = seg.part;
          if (!isToolUIPart(part)) return null;
          const { rows } = parseQuickReplyUIPart(part);
          const inFlight =
            part.state === "input-streaming" || part.state === "input-available";
          const showSkeleton = inFlight && rows.length === 0;
          const key =
            "toolCallId" in part ? part.toolCallId : `qr-${i}`;
          if (!inFlight && rows.length === 0) {
            return null;
          }
          return (
            <div
              key={key}
              className="border-border/60 mt-1 flex flex-wrap gap-2 border-t border-dashed pt-2"
            >
              {showSkeleton ? (
                <div
                  className="flex flex-wrap gap-2"
                  aria-busy="true"
                  aria-live="polite"
                  aria-label="Loading quick reply suggestions"
                >
                  <div className="bg-muted/70 h-8 w-[7.25rem] max-w-[42%] animate-pulse rounded-full" />
                  <div className="bg-muted/70 h-8 w-[9.5rem] max-w-[55%] animate-pulse rounded-full" />
                  <div className="bg-muted/70 h-8 w-[6rem] max-w-[36%] animate-pulse rounded-full" />
                </div>
              ) : (
                rows.map((row, j) => (
                  <button
                    key={`${key}-${j}-${row.text}`}
                    type="button"
                    onClick={() =>
                      onQuickReply(quickReplyChipText(row.emoji, row.text))
                    }
                    className={cn(
                      "border-border bg-background text-foreground hover:bg-muted rounded-2xl border px-3 py-1.5 text-left text-xs font-medium transition-colors sm:text-sm",
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
              {mode === "error" && onRegenerate ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-destructive border-destructive/40 hover:bg-destructive/10 h-7 px-2 text-xs"
                  disabled={busy || !online}
                  title="Retry this reply (including failed tools)"
                  onClick={onRegenerate}
                >
                  Retry
                </Button>
              ) : null}
            </div>
          );
        }

        const invocationCount = seg.parts.filter(isToolUIPart).length;
        const anyToolError = rows.some((r) => r.mode === "error");
        const anyToolPending = rows.some((r) => r.mode === "pending");
        return (
          <div key={i} className="space-y-2">
            <details
              className="border-border/80 bg-background/80 rounded-lg border [&[open]>summary_.accordion-chevron]:rotate-90"
              aria-busy={anyToolPending}
            >
              <summary
                className="text-foreground hover:bg-muted/50 flex cursor-pointer list-none items-center gap-2 px-3 py-1.5 font-sans text-xs font-medium [&::-webkit-details-marker]:hidden"
              >
                <ChevronRight
                  className="accordion-chevron text-muted-foreground size-3.5 shrink-0 transition-transform"
                  aria-hidden
                />
                <span
                  className={cn(anyToolPending && "coach-tool-pending")}
                >
                  {invocationCount} tool actions
                </span>
              </summary>
              <ul className="border-border/60 text-muted-foreground space-y-1 border-t px-3 py-1.5 font-sans text-xs font-medium">
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
            {anyToolError && onRegenerate ? (
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-destructive border-destructive/40 hover:bg-destructive/10 h-7 px-2 text-xs"
                  disabled={busy || !online}
                  title="Retry this reply (including failed tools)"
                  onClick={onRegenerate}
                >
                  Retry
                </Button>
              </div>
            ) : null}
          </div>
        );
      })}
      {showRegenerateAndTokenRow ? (() => {
        const u = coachAiUsageFromMessage(m);
        const showTokens = showAssistantTokenUsage && u;
        return (
          <>
            {showTokens ? (
              <p
                className="text-muted-foreground font-mono text-[0.65rem] leading-snug"
                title="Token counts from the model provider (aggregated across tool steps for this reply)"
              >
                AI tokens — input: {formatTokenCount(u.inputTokens)} · output:{" "}
                {formatTokenCount(u.outputTokens)} · total:{" "}
                {formatTokenCount(u.totalTokens)}
              </p>
            ) : null}
            {onRegenerate ? (
              <div className="border-border/60 flex justify-end border-t border-dotted pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground h-8 touch-manipulation gap-1.5 px-2 text-xs"
                  disabled={busy || !online || (showOfflineStyling && isOfflineCoachNotice(m))}
                  title="Replace this reply with a new one (same question)"
                  onClick={onRegenerate}
                >
                  <RefreshCw className="size-3.5" aria-hidden />
                  Regenerate
                </Button>
              </div>
            ) : null}
          </>
        );
      })() : null}
    </>
  );
}
