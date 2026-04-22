"use client";

import type { UIMessage } from "ai";
import { MessageSquarePlus, Sparkles, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { CoachChat } from "@/app/app/coach/coach-chat";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type ConversationSummary = {
  id: string;
  title: string;
  updatedAt: Date;
};

function parseListPayload(data: unknown): ConversationSummary[] {
  const raw = (data as { conversations?: unknown }).conversations;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((c) => {
      if (!c || typeof c !== "object") return null;
      const o = c as Record<string, unknown>;
      const id = typeof o.id === "string" ? o.id : null;
      const title = typeof o.title === "string" ? o.title : "Chat";
      const u = o.updatedAt;
      const updatedAt =
        typeof u === "number"
          ? new Date(u)
          : typeof u === "string"
            ? new Date(u)
            : new Date();
      if (!id) return null;
      return { id, title, updatedAt };
    })
    .filter((x): x is ConversationSummary => x !== null);
}

export function CoachShell() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<string>("New chat");
  const [initialMessages, setInitialMessages] = useState<UIMessage[] | null>(
    null
  );
  const [listLoading, setListLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<"list" | "chat">("chat");
  const [creating, setCreating] = useState(false);
  const selectedIdRef = useRef<string | null>(null);
  selectedIdRef.current = selectedId;
  /** Avoid clearing messages when re-fetching the same thread — that unmounts CoachChat and drops an in-flight stream (e.g. tab refocus + Strict Mode). */
  const lastMessagesFetchIdRef = useRef<string | null>(null);

  const loadConversationMessages = useCallback(async (id: string) => {
    setMessagesLoading(true);
    if (lastMessagesFetchIdRef.current !== id) {
      setInitialMessages(null);
    }
    try {
      const r = await fetch(`/api/coach/conversations/${id}`);
      if (!r.ok) throw new Error("Failed to load conversation");
      const data = (await r.json()) as {
        conversation?: { messages?: UIMessage[]; title?: string };
      };
      const conv = data.conversation;
      setInitialMessages(Array.isArray(conv?.messages) ? conv!.messages! : []);
      lastMessagesFetchIdRef.current = id;
      if (typeof conv?.title === "string") setSelectedTitle(conv.title);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setListLoading(true);
      try {
        const r = await fetch("/api/coach/conversations");
        if (!r.ok || cancelled) return;
        const data = (await r.json()) as unknown;
        let list = parseListPayload(data);
        if (list.length === 0) {
          const cr = await fetch("/api/coach/conversations", {
            method: "POST",
          });
          if (!cr.ok || cancelled) return;
          const created = (await cr.json()) as {
            conversation?: {
              id: string;
              title: string;
              updatedAt: number | string;
            };
          };
          if (created.conversation?.id) {
            const u = created.conversation.updatedAt;
            list = [
              {
                id: created.conversation.id,
                title: created.conversation.title,
                updatedAt:
                  typeof u === "number" ? new Date(u) : new Date(String(u)),
              },
            ];
          }
        }
        if (cancelled) return;
        setConversations(list);
        if (list[0]) {
          setSelectedId(list[0].id);
          setSelectedTitle(list[0].title);
          await loadConversationMessages(list[0].id);
        }
      } finally {
        if (!cancelled) setListLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadConversationMessages]);

  const selectConversation = useCallback(
    async (id: string, title: string) => {
      setSelectedId(id);
      setSelectedTitle(title);
      setMobilePanel("chat");
      await loadConversationMessages(id);
    },
    [loadConversationMessages]
  );

  async function createConversation() {
    if (creating) return;
    setCreating(true);
    try {
      const r = await fetch("/api/coach/conversations", { method: "POST" });
      if (!r.ok) return;
      const data = (await r.json()) as {
        conversation?: {
          id: string;
          title: string;
          updatedAt: number | string;
        };
      };
      const c = data.conversation;
      if (!c?.id) return;
      const summary: ConversationSummary = {
        id: c.id,
        title: c.title,
        updatedAt:
          typeof c.updatedAt === "number"
            ? new Date(c.updatedAt)
            : new Date(String(c.updatedAt)),
      };
      setConversations((prev) => [summary, ...prev.filter((x) => x.id !== c.id)]);
      await selectConversation(c.id, c.title);
    } finally {
      setCreating(false);
    }
  }

  async function deleteConversation(id: string) {
    if (
      !confirm("Delete this conversation? This cannot be undone.")
    ) {
      return;
    }
    const r = await fetch(`/api/coach/conversations/${id}`, {
      method: "DELETE",
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
    const r = await fetch("/api/coach/conversations");
    if (!r.ok) return;
    const data = (await r.json()) as unknown;
    const list = parseListPayload(data);
    setConversations(list);
    const id = selectedIdRef.current;
    if (id) {
      const row = list.find((x) => x.id === id);
      if (row) setSelectedTitle(row.title);
    }
  }, []);

  const showChatReady =
    selectedId && initialMessages !== null && !messagesLoading;

  return (
    <div className="bg-background flex min-h-0 flex-1 flex-col md:flex-row">
      {/* Conversation list — desktop sidebar */}
      <aside
        className={cn(
          "border-border flex min-h-0 w-full shrink-0 flex-col border-b md:w-72 md:border-r md:border-b-0",
          mobilePanel === "chat" ? "hidden md:flex" : "flex"
        )}
      >
        <div className="border-border flex shrink-0 items-center gap-2 border-b px-3 py-3">
          <span className="bg-primary/15 text-primary ring-primary/15 inline-flex size-9 items-center justify-center rounded-xl ring-1 md:hidden">
            <Sparkles className="size-4" strokeWidth={2} aria-hidden />
          </span>
          <div className="min-w-0 flex-1 md:pl-0">
            <h2 className="text-sm font-semibold tracking-tight">Conversations</h2>
            <p className="text-muted-foreground text-xs">Your coach threads</p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0 gap-1.5"
            disabled={creating || listLoading}
            onClick={() => void createConversation()}
          >
            <MessageSquarePlus className="size-4" aria-hidden />
            <span className="hidden sm:inline">New</span>
          </Button>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-0.5 p-2">
            {listLoading ? (
              <p className="text-muted-foreground px-2 py-6 text-center text-sm">
                Loading…
              </p>
            ) : conversations.length === 0 ? (
              <p className="text-muted-foreground px-2 py-6 text-center text-sm">
                No conversations yet.
              </p>
            ) : (
              conversations.map((c) => (
                <div
                  key={c.id}
                  className={cn(
                    "hover:bg-muted/80 flex items-stretch gap-0.5 rounded-lg transition-colors",
                    c.id === selectedId
                      ? "bg-muted font-medium"
                      : "text-muted-foreground"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => void selectConversation(c.id, c.title)}
                    className="min-w-0 flex-1 px-3 py-2.5 text-left text-sm"
                  >
                    <span className="text-foreground line-clamp-2 font-medium">
                      {c.title}
                    </span>
                    <span className="text-muted-foreground mt-0.5 block text-xs font-normal tabular-nums">
                      {c.updatedAt.toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive mt-1 mr-1 size-8 shrink-0 self-start"
                    aria-label={`Delete “${c.title}”`}
                    onClick={(e) => {
                      e.stopPropagation();
                      void deleteConversation(c.id);
                    }}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </aside>

      {/* Chat */}
      <section
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col",
          mobilePanel === "list" ? "hidden md:flex" : "flex"
        )}
      >
        {listLoading || !selectedId ? (
          <div className="text-muted-foreground flex flex-1 items-center justify-center text-sm">
            Loading…
          </div>
        ) : messagesLoading || !showChatReady ? (
          <div className="text-muted-foreground flex flex-1 items-center justify-center text-sm">
            Loading conversation…
          </div>
        ) : (
          <CoachChat
            key={selectedId}
            conversationId={selectedId}
            initialMessages={initialMessages ?? []}
            conversationTitle={selectedTitle}
            onMobileBack={() => setMobilePanel("list")}
            onPersist={() => void onPersist()}
            onNewConversation={() => void createConversation()}
          />
        )}
      </section>
    </div>
  );
}
