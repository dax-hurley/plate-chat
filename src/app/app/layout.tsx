import type { ReactNode } from "react";

import { AppHeader } from "@/components/app/app-header";
import { AppNav } from "@/components/app/app-nav";
import {
  CoachMainArea,
  CoachRuntimeProvider,
} from "@/components/app/coach-runtime";

export default function AppSectionLayout({ children }: { children: ReactNode }) {
  return (
    <CoachRuntimeProvider>
      <div className="flex h-dvh max-h-dvh flex-col overflow-hidden">
        <AppNav />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:pl-60">
          <AppHeader />
          <CoachMainArea>{children}</CoachMainArea>
        </div>
      </div>
    </CoachRuntimeProvider>
  );
}
