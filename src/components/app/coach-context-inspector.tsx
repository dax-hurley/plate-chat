"use client";

import { Braces } from "lucide-react";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  enrichCoachContextPreviewPayload,
  type CoachContextPreviewPayload,
} from "@/lib/coach-context-preview";
import { cn } from "@/lib/utils";

export type { CoachContextPreviewPayload };

function JsonBlock({ value, className }: { value: unknown; className?: string }) {
  const text = useMemo(() => {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }, [value]);
  return (
    <pre
      className={cn(
        "text-muted-foreground font-mono text-[0.7rem] leading-relaxed whitespace-pre-wrap break-words",
        className
      )}
    >
      {text}
    </pre>
  );
}

const inspectorScrollClass =
  "max-h-[min(600px,calc(90vh-10rem))] min-h-[8rem] overflow-y-auto overflow-x-auto overscroll-contain rounded-md pr-2 [scrollbar-gutter:stable] touch-pan-y";

function fmtStat(n: number | undefined) {
  return typeof n === "number" && !Number.isNaN(n) ? n.toLocaleString() : "—";
}

type CoachContextInspectorProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payload: CoachContextPreviewPayload | null;
  loading: boolean;
  error: string | null;
};

export function CoachContextInspector({
  open,
  onOpenChange,
  payload,
  loading,
  error,
}: CoachContextInspectorProps) {
  const displayPayload = useMemo(
    () => enrichCoachContextPreviewPayload(payload),
    [payload]
  );
  const s = displayPayload?.contextStats;
  const immediateNames = s?.immediateToolNames ?? [];
  const deferredNames = s?.deferredToolNames ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[min(90vh,720px)] max-w-[min(96vw,56rem)] min-h-0 flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(96vw,56rem)]"
        showCloseButton
      >
        <DialogHeader className="border-border shrink-0 border-b px-4 py-3">
          <DialogTitle>Next request context</DialogTitle>
          <DialogDescription>
            System prompt, model messages, and tool definitions (schemas + descriptions)
            for your next send. Deferred Trainlog tools are registered with the API but
            are omitted from the initial context prefix until discovered via{" "}
            <code className="text-foreground/90">tool_search_tool_bm25</code> — API{" "}
            <code className="text-foreground/90">input_tokens</code> can stay high on
            later turns because expanded tools and tool results live in message history.
            Prefix vs deferred counts are recomputed on the client from tool names when the
            preview API omits those fields.
            {displayPayload?.modelId ? (
              <span className="text-muted-foreground mt-2 block font-mono text-[0.7rem]">
                Model: {displayPayload.modelId}
              </span>
            ) : null}
            {s ? (
              <span className="text-muted-foreground mt-2 block font-mono text-[0.65rem] leading-snug">
                Chars — system {fmtStat(s.systemChars)} · messages{" "}
                {fmtStat(s.modelMessagesChars)} · tools (all) {fmtStat(s.toolsChars)} ·
                prefix tools only {fmtStat(s.prefixToolsChars)} · deferred catalog{" "}
                {fmtStat(s.deferredCatalogChars)} · total {fmtStat(s.totalChars)} (~
                {fmtStat(s.approxInputTokens)} tok all) · ~{" "}
                {fmtStat(s.approxPrefixOnlyTokens)} tok prefix est.
                <span className="mt-1 block">
                  Immediate: {immediateNames.join(", ") || "—"}
                </span>
                <span className="mt-0.5 block">
                  Deferred ({deferredNames.length}):{" "}
                  {deferredNames.length > 0
                    ? `${deferredNames.slice(0, 8).join(", ")}${
                        deferredNames.length > 8 ? "…" : ""
                      }`
                    : "—"}
                </span>
              </span>
            ) : null}
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <p className="text-muted-foreground px-4 py-6 text-sm">Loading…</p>
        ) : error ? (
          <p className="text-destructive px-4 py-6 text-sm" role="alert">
            {error}
          </p>
        ) : (
          <Tabs
            defaultValue="system"
            className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden"
          >
            <TabsList
              variant="line"
              className="border-border h-auto w-full shrink-0 justify-start gap-0 rounded-none border-b bg-transparent px-2"
            >
              <TabsTrigger value="system" className="rounded-none">
                System
              </TabsTrigger>
              <TabsTrigger value="messages" className="rounded-none">
                Model messages
              </TabsTrigger>
              <TabsTrigger value="tools" className="rounded-none">
                Tool definitions
              </TabsTrigger>
            </TabsList>
            <TabsContent
              value="system"
              className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-3"
            >
              <div className={inspectorScrollClass}>
                {displayPayload?.system ? (
                  <pre className="text-muted-foreground font-mono text-[0.7rem] leading-relaxed whitespace-pre-wrap">
                    {displayPayload.system}
                  </pre>
                ) : (
                  <p className="text-muted-foreground text-sm">No system prompt.</p>
                )}
              </div>
            </TabsContent>
            <TabsContent
              value="messages"
              className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-3"
            >
              <div className={inspectorScrollClass}>
                {displayPayload?.modelMessages != null ? (
                  <JsonBlock value={displayPayload.modelMessages} />
                ) : (
                  <p className="text-muted-foreground text-sm">No messages.</p>
                )}
              </div>
            </TabsContent>
            <TabsContent
              value="tools"
              className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-3"
            >
              <div className={inspectorScrollClass}>
                {displayPayload?.toolDefinitions != null ? (
                  <JsonBlock value={displayPayload.toolDefinitions} />
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No tool definitions (enable server debug).
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function CoachContextInspectorTrigger({
  disabled,
  onClick,
}: {
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="text-muted-foreground h-8 gap-1 px-2 text-xs"
      disabled={disabled}
      title="Show system, messages, and tool schemas for your next send (debug)"
      onClick={onClick}
    >
      <Braces className="size-3.5" aria-hidden />
      Context
    </Button>
  );
}
