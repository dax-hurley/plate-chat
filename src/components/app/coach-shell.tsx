import type { UIMessage } from "ai";
import { MessageSquarePlus, Sparkles, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { CoachChat } from "@/components/app/coach-chat";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { authFetch } from "@/lib/client/auth-fetch";
import { useOnline } from "@/lib/client/use-online";
import { cn } from "@/lib/utils";

/** Avoid hanging the coach UI when the TCP stack is slow or the browser lies about onLine. */
const COACH_FETCH_TIMEOUT_MS = 15_000;

function coachFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const ctrl = new AbortController();
  const t = window.setTimeout(() => ctrl.abort(), COACH_FETCH_TIMEOUT_MS);
  return authFetch(input, { ...init, signal: ctrl.signal }).finally(() =>
    window.clearTimeout(t)
  );
}

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

type CoachShellProps = {
  /** One-shot user message from a deep link (new empty thread, or new thread is created if the current one was non-empty). */
  prepopulatedUserPrompt?: string | null;
  onPrepopulatedUserPromptApplied?: () => void;
};

export function CoachShell({
  prepopulatedUserPrompt = null,
  onPrepopulatedUserPromptApplied,
}: CoachShellProps = {}) {
  const online = useOnline();
  /** If creating a new thread for a deep link fails, fall back to filling the current chat. */
  const [deepLinkNewThreadExhausted, setDeepLinkNewThreadExhausted] =
    useState(false);
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
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  selectedIdRef.current = selectedId;
  const lastMessagesFetchIdRef = useRef<string | null>(null);
  const didLoadFromNetworkRef = useRef(false);
  const localOnlyConversationIdRef = useRef<string | null>(null);
  const createConversationForDeepLinkRef = useRef<() => Promise<boolean>>(() =>
    Promise.resolve(false)
  );

  const prepopulatedUserPromptKey =
    prepopulatedUserPrompt?.trim() ? prepopulatedUserPrompt : null;
  const messageCount = initialMessages?.length ?? 0;
  const withholdPrepopForNewThread = Boolean(
    prepopulatedUserPromptKey &&
      online &&
      messageCount > 0 &&
      !deepLinkNewThreadExhausted
  );
  const prepopToPassToChat = withholdPrepopForNewThread
    ? undefined
    : prepopulatedUserPromptKey ?? undefined;

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
      { id, title: "Offline chat", updatedAt: new Date() },
    ]);
    setSelectedId(id);
    setSelectedTitle("New chat");
    setInitialMessages([]);
    lastMessagesFetchIdRef.current = id;
  }, []);

  const loadConversationMessages = useCallback(
    async (id: string) => {
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
        const data = (await r.json()) as unknown;
        let list = parseListPayload(data);
        if (list.length === 0) {
          const cr = await coachFetch("/api/coach/conversations", {
            method: "POST",
          });
          if (cancelled) return;
          if (!cr.ok) {
            if (!didLoadFromNetworkRef.current) bootstrapLocalCoachSession();
            return;
          }
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
    async (id: string, title: string) => {
      setSelectedId(id);
      setSelectedTitle(title);
      setMobilePanel("chat");
      await loadConversationMessages(id);
    },
    [loadConversationMessages]
  );

  async function createConversation(): Promise<boolean> {
    if (creating || !online) return false;
    setCreating(true);
    try {
      const r = await coachFetch("/api/coach/conversations", { method: "POST" });
      if (!r.ok) return false;
      const data = (await r.json()) as {
        conversation?: {
          id: string;
          title: string;
          updatedAt: number | string;
        };
      };
      const c = data.conversation;
      if (!c?.id) return false;
      const summary: ConversationSummary = {
        id: c.id,
        title: c.title,
        updatedAt:
          typeof c.updatedAt === "number"
            ? new Date(c.updatedAt)
            : new Date(String(c.updatedAt)),
      };
      setConversations((prev) => [
        summary,
        ...prev.filter((x) => x.id !== c.id),
      ]);
      await selectConversation(c.id, c.title);
      return true;
    } finally {
      setCreating(false);
    }
  }
  createConversationForDeepLinkRef.current = createConversation;

  async function deleteConversation(id: string) {
    if (localOnlyConversationIdRef.current === id) {
      localOnlyConversationIdRef.current = null;
      const nextList = conversations.filter((c) => c.id !== id);
      setConversations(nextList);
      if (id !== selectedId) return;
      if (!online || nextList.length === 0) {
        bootstrapLocalCoachSession();
      } else if (nextList[0]) {
        await selectConversation(nextList[0].id, nextList[0].title);
      }
      return;
    }

    if (!online) return;

    const r = await coachFetch(`/api/coach/conversations/${id}`, {
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
    const r = await coachFetch("/api/coach/conversations");
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

  const showChatReady =
    selectedId && initialMessages !== null && !messagesLoading;

  return (
    <div className="bg-background flex min-h-0 flex-1 flex-col md:flex-row">
      <ConfirmDialog
        open={deleteTargetId != null}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetId(null);
        }}
        title="Delete this conversation?"
        description="This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="destructive"
        onConfirm={async () => {
          if (!deleteTargetId) return;
          const id = deleteTargetId;
          setDeleteTargetId(null);
          await deleteConversation(id);
        }}
      />
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
            <h2 className="text-sm font-semibold tracking-tight">
              Conversations
            </h2>
            <p className="text-muted-foreground text-xs">Your coach threads</p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0 gap-1.5"
            disabled={creating || listLoading || !online}
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
                    disabled={
                      !online && localOnlyConversationIdRef.current !== c.id
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTargetId(c.id);
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
            initialComposerText={prepopToPassToChat}
            onInitialComposerTextApplied={onPrepopulatedUserPromptApplied}
          />
        )}
      </section>
    </div>
  );
}
