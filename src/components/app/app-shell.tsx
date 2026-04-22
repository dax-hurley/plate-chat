import { Link, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useOnline } from "@/lib/client/use-online";
import { useDb } from "@/lib/client/db/provider";

interface NavItem {
  to: string;
  label: string;
}

const nav: NavItem[] = [
  { to: "/app/workouts", label: "Workouts" },
  { to: "/app/nutrition", label: "Nutrition" },
  { to: "/app/progress", label: "Progress" },
  { to: "/app/calendar", label: "Calendar" },
  { to: "/app/coach", label: "Coach" },
  { to: "/app/profile", label: "Profile" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const online = useOnline();
  const { ready } = useDb();
  const location = useLocation();

  return (
    <div className="min-h-dvh flex flex-col">
      {!online ? (
        <div className="sticky top-0 z-50 bg-amber-500/90 text-amber-950 px-4 py-2 text-sm text-center">
          You&apos;re offline — changes save locally and sync when you reconnect.
        </div>
      ) : null}
      <header className="border-b bg-background/80 backdrop-blur">
        <nav className="max-w-5xl mx-auto flex overflow-x-auto gap-1 px-2 py-2">
          {nav.map((item) => {
            const active = location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={
                  "px-3 py-2 rounded-md text-sm whitespace-nowrap " +
                  (active
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        {ready ? (
          children
        ) : (
          <div className="py-12 text-center text-muted-foreground text-sm">
            Opening local database…
          </div>
        )}
      </main>
    </div>
  );
}
