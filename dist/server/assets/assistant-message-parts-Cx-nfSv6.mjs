import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { isToolUIPart, getToolName, isTextUIPart } from "ai";
import { WifiOff, ChevronRight, RefreshCw } from "lucide-react";
import { A as AssistantMarkdown } from "./assistant-markdown-BkDNTUMc.mjs";
import { B as Button } from "./button-DbVXcFD_.mjs";
import { T as TRAINLOG_TOOL_DEFINITIONS } from "./router-CUOzYYmk.mjs";
import { c as cn } from "./utils-H80jjgLf.mjs";
const TRAINLOG_UI_BY_NAME = Object.fromEntries(
  TRAINLOG_TOOL_DEFINITIONS.map((d) => [
    d.name,
    { completionText: d.completionText, errorText: d.errorText }
  ])
);
const EXTRA_COACH_TOOL_UI = {
  suggest_quick_replies: {
    completionText: "Prepared quick replies",
    errorText: "Couldn't prepare quick replies"
  },
  tool_search_tool_bm25: {
    completionText: "Searched tools",
    errorText: "Couldn't search tools"
  },
  onboarding_meal_refinement_complete: {
    completionText: "Continuing setup",
    errorText: "Couldn't continue"
  }
};
function humanizeToolName(name) {
  return name.replace(/_/g, " ");
}
function getCoachToolUiCopy(toolName) {
  const trainlog = TRAINLOG_UI_BY_NAME[toolName];
  if (trainlog) return trainlog;
  const extra = EXTRA_COACH_TOOL_UI[toolName];
  if (extra) return extra;
  const label = humanizeToolName(toolName);
  return {
    completionText: `${label} finished`,
    errorText: `${label} failed`
  };
}
const QUICK_REPLY_TOOL = "suggest_quick_replies";
function isQuickRepliesToolPart(part) {
  return isToolUIPart(part) && getToolName(part) === QUICK_REPLY_TOOL;
}
function mergeAssistantParts(parts) {
  const segments = [];
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
function groupForDisplay(segments) {
  const out = [];
  let toolBuf = [];
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
function parseQuickReplyToolInput(input) {
  if (!input || typeof input !== "object") {
    return { rows: [] };
  }
  const o = input;
  const raw = o.suggestions;
  const topEmoji = typeof o.emoji === "string" ? o.emoji.trim().slice(0, 8) : "";
  const acc = [];
  if (Array.isArray(raw)) {
    for (const x of raw) {
      if (typeof x === "string") {
        const t = x.trim();
        if (t) acc.push({ text: t, emoji: "" });
      } else if (x && typeof x === "object" && typeof x.text === "string") {
        const text = String(x.text).trim();
        if (!text) continue;
        const em = typeof x.emoji === "string" ? x.emoji.trim().slice(0, 8) : "";
        acc.push({ text, emoji: em });
      }
    }
  }
  const seed = acc.find((r) => r.emoji.length > 0)?.emoji || topEmoji || "";
  const rows = acc.map((r) => ({
    text: r.text,
    emoji: r.emoji || seed
  }));
  return { rows: rows.slice(0, 8) };
}
function parseQuickReplyUIPart(part) {
  if (!isToolUIPart(part)) {
    return { rows: [] };
  }
  const fromInput = parseQuickReplyToolInput(part.input);
  const out = "output" in part && part.output != null && typeof part.output === "object" ? parseQuickReplyToolInput(part.output) : { rows: [] };
  return {
    rows: fromInput.rows.length > 0 ? fromInput.rows : out.rows
  };
}
const DEFAULT_QUICK_REPLY_EMOJI = "💬";
function quickReplyChipText(emoji, suggestion) {
  const e = (emoji.trim() || DEFAULT_QUICK_REPLY_EMOJI).slice(0, 8);
  const s = suggestion.trim();
  if (s.startsWith(e)) return s;
  return `${e} ${s}`;
}
function lastAssistantMessageId(msgs) {
  for (let i = msgs.length - 1; i >= 0; i--) {
    if (msgs[i].role === "assistant") return msgs[i].id;
  }
  return null;
}
function coachToolRunMode(part) {
  if (!isToolUIPart(part)) return "complete";
  const s = part.state;
  if (s === "input-streaming" || s === "input-available" || s === "approval-requested" || s === "approval-responded") {
    return "pending";
  }
  if (s === "output-error" || s === "output-denied") {
    return "error";
  }
  return "complete";
}
function summarizeConsecutiveCoachToolRuns(parts) {
  const rows = [];
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
function formatCoachToolRunLabel(name, count, mode) {
  const { completionText, errorText } = getCoachToolUiCopy(name);
  const base = mode === "pending" ? "Working…" : mode === "error" ? errorText : completionText;
  return count > 1 ? `${base} ×${count}` : base;
}
function coachAiUsageFromMessage(m) {
  const meta = m.metadata;
  return meta?.coachAiUsage;
}
function formatTokenCount(n) {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString();
}
function textFromPartsForOffline(message) {
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
const OFFLINE_COACH_REPLY = "You're offline, so this message didn't reach the coach. Reconnect to the internet and send again if you want a reply.";
function isOfflineCoachNotice(m) {
  return m.role === "assistant" && textFromPartsForOffline(m) === OFFLINE_COACH_REPLY;
}
function AssistantMessageParts({
  message,
  dismissedQuickReplies,
  onQuickReply,
  onRegenerate,
  busy,
  online,
  showRegenerateAndTokenRow = true,
  showOfflineStyling = true
}) {
  const m = message;
  if (m.role !== "assistant" || m.parts == null) return null;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    isOfflineCoachNotice(m) && showOfflineStyling ? /* @__PURE__ */ jsxs("p", { className: "text-amber-900 dark:text-amber-200 flex items-center gap-1.5 text-[0.65rem] font-semibold tracking-wide uppercase", children: [
      /* @__PURE__ */ jsx(WifiOff, { className: "size-3 shrink-0", "aria-hidden": true }),
      "Offline"
    ] }) : null,
    groupForDisplay(mergeAssistantParts(m.parts)).map((seg, i) => {
      if (seg.kind === "text") {
        return /* @__PURE__ */ jsx(AssistantMarkdown, { content: seg.text }, i);
      }
      if (seg.kind === "quickReplies") {
        if (dismissedQuickReplies) return null;
        const part = seg.part;
        if (!isToolUIPart(part)) return null;
        const { rows: rows2 } = parseQuickReplyUIPart(part);
        const inFlight = part.state === "input-streaming" || part.state === "input-available";
        const showSkeleton = inFlight && rows2.length === 0;
        const key = "toolCallId" in part ? part.toolCallId : `qr-${i}`;
        if (!inFlight && rows2.length === 0) {
          return null;
        }
        return /* @__PURE__ */ jsx(
          "div",
          {
            className: "border-border/60 mt-1 flex flex-wrap gap-2 border-t border-dashed pt-2",
            children: showSkeleton ? /* @__PURE__ */ jsxs(
              "div",
              {
                className: "flex flex-wrap gap-2",
                "aria-busy": "true",
                "aria-live": "polite",
                "aria-label": "Loading quick reply suggestions",
                children: [
                  /* @__PURE__ */ jsx("div", { className: "bg-muted/70 h-8 w-[7.25rem] max-w-[42%] animate-pulse rounded-full" }),
                  /* @__PURE__ */ jsx("div", { className: "bg-muted/70 h-8 w-[9.5rem] max-w-[55%] animate-pulse rounded-full" }),
                  /* @__PURE__ */ jsx("div", { className: "bg-muted/70 h-8 w-[6rem] max-w-[36%] animate-pulse rounded-full" })
                ]
              }
            ) : rows2.map((row, j) => /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => onQuickReply(quickReplyChipText(row.emoji, row.text)),
                className: cn(
                  "border-border bg-background text-foreground hover:bg-muted rounded-2xl border px-3 py-1.5 text-left text-xs font-medium transition-colors sm:text-sm",
                  "disabled:pointer-events-none disabled:opacity-50",
                  "max-w-full min-w-0 shrink-0 break-words whitespace-normal sm:max-w-[min(100%,16rem)]"
                ),
                children: quickReplyChipText(row.emoji, row.text)
              },
              `${key}-${j}-${row.text}`
            ))
          },
          key
        );
      }
      const rows = summarizeConsecutiveCoachToolRuns(seg.parts);
      if (rows.length === 0) return null;
      if (rows.length === 1) {
        const { name, count, mode } = rows[0];
        const firstPart = seg.parts.find(isToolUIPart);
        const rowKey = firstPart && "toolCallId" in firstPart ? firstPart.toolCallId : String(i);
        return /* @__PURE__ */ jsxs(
          "div",
          {
            className: "flex flex-wrap items-center gap-2",
            "aria-busy": mode === "pending",
            children: [
              /* @__PURE__ */ jsx(
                "p",
                {
                  className: cn(
                    "font-sans text-xs font-medium",
                    mode === "error" ? "text-destructive" : "text-muted-foreground",
                    mode === "pending" && "coach-tool-pending"
                  ),
                  children: formatCoachToolRunLabel(name, count, mode)
                }
              ),
              mode === "error" && onRegenerate ? /* @__PURE__ */ jsx(
                Button,
                {
                  type: "button",
                  variant: "outline",
                  size: "sm",
                  className: "text-destructive border-destructive/40 hover:bg-destructive/10 h-7 px-2 text-xs",
                  disabled: busy || !online,
                  title: "Retry this reply (including failed tools)",
                  onClick: onRegenerate,
                  children: "Retry"
                }
              ) : null
            ]
          },
          rowKey
        );
      }
      const invocationCount = seg.parts.filter(isToolUIPart).length;
      const anyToolError = rows.some((r) => r.mode === "error");
      const anyToolPending = rows.some((r) => r.mode === "pending");
      return /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxs(
          "details",
          {
            className: "border-border/80 bg-background/80 rounded-lg border [&[open]>summary_.accordion-chevron]:rotate-90",
            "aria-busy": anyToolPending,
            children: [
              /* @__PURE__ */ jsxs(
                "summary",
                {
                  className: "text-foreground hover:bg-muted/50 flex cursor-pointer list-none items-center gap-2 px-3 py-1.5 font-sans text-xs font-medium [&::-webkit-details-marker]:hidden",
                  children: [
                    /* @__PURE__ */ jsx(
                      ChevronRight,
                      {
                        className: "accordion-chevron text-muted-foreground size-3.5 shrink-0 transition-transform",
                        "aria-hidden": true
                      }
                    ),
                    /* @__PURE__ */ jsxs(
                      "span",
                      {
                        className: cn(anyToolPending && "coach-tool-pending"),
                        children: [
                          invocationCount,
                          " tool actions"
                        ]
                      }
                    )
                  ]
                }
              ),
              /* @__PURE__ */ jsx("ul", { className: "border-border/60 text-muted-foreground space-y-1 border-t px-3 py-1.5 font-sans text-xs font-medium", children: rows.map((row, j) => /* @__PURE__ */ jsx(
                "li",
                {
                  className: cn(
                    "pl-1",
                    row.mode === "error" && "text-destructive",
                    row.mode === "pending" && "coach-tool-pending"
                  ),
                  children: formatCoachToolRunLabel(
                    row.name,
                    row.count,
                    row.mode
                  )
                },
                `${row.name}-${row.mode}-${j}`
              )) })
            ]
          }
        ),
        anyToolError && onRegenerate ? /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(
          Button,
          {
            type: "button",
            variant: "outline",
            size: "sm",
            className: "text-destructive border-destructive/40 hover:bg-destructive/10 h-7 px-2 text-xs",
            disabled: busy || !online,
            title: "Retry this reply (including failed tools)",
            onClick: onRegenerate,
            children: "Retry"
          }
        ) }) : null
      ] }, i);
    }),
    showRegenerateAndTokenRow ? (() => {
      const u = coachAiUsageFromMessage(m);
      return /* @__PURE__ */ jsxs(Fragment, { children: [
        u ? /* @__PURE__ */ jsxs(
          "p",
          {
            className: "text-muted-foreground font-mono text-[0.65rem] leading-snug",
            title: "Token counts from the model provider (aggregated across tool steps for this reply)",
            children: [
              "AI tokens — input: ",
              formatTokenCount(u.inputTokens),
              " · output:",
              " ",
              formatTokenCount(u.outputTokens),
              " · total:",
              " ",
              formatTokenCount(u.totalTokens)
            ]
          }
        ) : null,
        onRegenerate ? /* @__PURE__ */ jsx("div", { className: "border-border/60 flex justify-end border-t border-dotted pt-2", children: /* @__PURE__ */ jsxs(
          Button,
          {
            type: "button",
            variant: "ghost",
            size: "sm",
            className: "text-muted-foreground hover:text-foreground h-8 touch-manipulation gap-1.5 px-2 text-xs",
            disabled: busy || !online || showOfflineStyling && isOfflineCoachNotice(m),
            title: "Replace this reply with a new one (same question)",
            onClick: onRegenerate,
            children: [
              /* @__PURE__ */ jsx(RefreshCw, { className: "size-3.5", "aria-hidden": true }),
              "Regenerate"
            ]
          }
        ) }) : null
      ] });
    })() : null
  ] });
}
export {
  AssistantMessageParts as A,
  OFFLINE_COACH_REPLY as O,
  isOfflineCoachNotice as i,
  lastAssistantMessageId as l
};
