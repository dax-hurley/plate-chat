import { createFileRoute, Link } from "@tanstack/react-router";
import { useCoachConversations } from "@/lib/stores/coach";
import { useOnline } from "@/lib/client/use-online";

export const Route = createFileRoute("/app/coach/")({
  component: CoachIndex,
});

function CoachIndex() {
  const online = useOnline();
  const { data: conversations, loading } = useCoachConversations();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Coach</h1>
        <Link
          to="/app/coach/$id"
          params={{ id: "new" }}
          aria-disabled={!online}
          className={
            "rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm " +
            (online ? "" : "opacity-60 pointer-events-none")
          }
        >
          New chat
        </Link>
      </div>

      {!online ? (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          Offline — reconnect to chat with your coach. Past conversations stay
          readable below.
        </div>
      ) : null}

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : conversations.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No conversations yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {conversations.map((c) => (
            <li key={c.id} className="rounded-xl border bg-card">
              <Link
                to="/app/coach/$id"
                params={{ id: c.id }}
                className="block p-3"
              >
                <div className="font-medium truncate">
                  {c.title || "Untitled"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(c.updatedAt).toLocaleString()}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
