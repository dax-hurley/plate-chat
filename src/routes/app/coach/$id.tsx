import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCoachConversation } from "@/lib/stores/coach";
import { useOnline } from "@/lib/client/use-online";
import { authFetch } from "@/lib/client/auth-fetch";

export const Route = createFileRoute("/app/coach/$id")({
  component: CoachChat,
});

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

function CoachChat() {
  const { id } = Route.useParams();
  const online = useOnline();
  const { data: conversation } = useCoachConversation(id === "new" ? null : id);

  const parsed: Message[] = useMemo(() => {
    if (!conversation?.messages) return [];
    try {
      const raw = JSON.parse(conversation.messages) as unknown;
      if (!Array.isArray(raw)) return [];
      return raw.filter(
        (m): m is Message =>
          typeof m === "object" &&
          m !== null &&
          "role" in m &&
          "content" in m
      );
    } catch {
      return [];
    }
  }, [conversation?.messages]);

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Message[]>([]);

  const onSend = async () => {
    if (!online || !draft.trim()) return;
    setError(null);
    setSending(true);
    const next: Message = { role: "user", content: draft };
    setPending((p) => [...p, next]);
    setDraft("");
    try {
      const res = await authFetch("/api/coach/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: id === "new" ? null : id,
          message: next.content,
        }),
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

  return (
    <div className="flex flex-col h-full min-h-[70dvh]">
      <div className="flex items-center justify-between pb-3">
        <Link to="/app/coach" className="text-sm text-muted-foreground">
          ← Back
        </Link>
        {conversation ? (
          <div className="text-sm font-medium truncate">
            {conversation.title}
          </div>
        ) : null}
      </div>

      {!online ? (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm mb-3">
          Offline — reconnect to chat with your coach.
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Ask your coach anything about your training or nutrition.
          </p>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "user"
                  ? "ml-auto max-w-[85%] rounded-2xl bg-primary text-primary-foreground px-3 py-2 text-sm"
                  : "max-w-[85%] rounded-2xl border bg-card px-3 py-2 text-sm"
              }
            >
              {m.content}
            </div>
          ))
        )}
      </div>

      {error ? (
        <p className="text-xs text-destructive pt-2">
          {error}{" "}
          <button
            onClick={onSend}
            className="underline"
            disabled={!online || sending}
          >
            Retry
          </button>
        </p>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void onSend();
        }}
        className="pt-3 flex gap-2"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={online ? "Ask your coach…" : "Offline"}
          disabled={!online || sending}
          className="flex-1 rounded-md border bg-background px-3 py-2 text-sm disabled:opacity-60"
        />
        <button
          disabled={!online || sending || !draft.trim()}
          className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm disabled:opacity-60"
        >
          Send
        </button>
      </form>
    </div>
  );
}
