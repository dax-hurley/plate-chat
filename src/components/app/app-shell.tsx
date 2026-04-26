import type { ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";

import { AppHeader } from "@/components/app/app-header";
import { AppNav } from "@/components/app/app-nav";
import {
  CoachMainArea,
  CoachRuntimeProvider,
} from "@/components/app/coach-runtime";
import { useDb } from "@/lib/client/db/provider";

export function AppShell({ children }: { children: ReactNode }) {
  const { ready } = useDb();
  const isOnboarding = useRouterState({
    select: (s) => s.location.pathname.includes("/onboarding"),
  });

  if (isOnboarding) {
    return (
      <CoachRuntimeProvider>
        <div className="bg-background flex h-dvh max-h-dvh flex-col overflow-hidden">
          <main className="flex h-full min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-hidden">
            {ready ? (
              children
            ) : (
              <div className="text-muted-foreground flex min-h-40 items-center justify-center p-6 text-sm">
                Opening local database…
              </div>
            )}
          </main>
        </div>
      </CoachRuntimeProvider>
    );
  }

  return (
    <CoachRuntimeProvider>
      <div className="flex h-dvh max-h-dvh flex-col overflow-hidden">
        <AppNav />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:pl-60">
          <AppHeader />
          <CoachMainArea>
            {ready ? (
              children
            ) : (
              <div className="py-12 text-center text-muted-foreground text-sm">
                Opening local database…
              </div>
            )}
          </CoachMainArea>
        </div>
      </div>
    </CoachRuntimeProvider>
  );
}
