import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation } from "@tanstack/react-router";

import { CoachShell } from "@/components/app/coach-shell";
import { cn } from "@/lib/utils";

type CoachRuntimeValue = {
  isCoachOpen: boolean;
  openCoach: () => void;
  closeCoach: () => void;
  toggleCoach: () => void;
  /** Coach is streaming or waiting on the model. */
  coachAgentWorking: boolean;
  /** Assistant finished a reply while the coach panel was closed. */
  coachHasUnreadFromAssistant: boolean;
  setCoachAgentWorking: (working: boolean) => void;
  /** Call when a coach reply cycle ends with visible assistant output (see CoachChat). */
  signalAssistantReplyFinishedWhileClosed: () => void;
};

const CoachRuntimeContext = createContext<CoachRuntimeValue | null>(null);

export function useCoachRuntime(): CoachRuntimeValue {
  const ctx = useContext(CoachRuntimeContext);
  if (!ctx) {
    throw new Error("useCoachRuntime must be used within CoachRuntimeProvider");
  }
  return ctx;
}

export function useCoachRuntimeOptional(): CoachRuntimeValue | null {
  return useContext(CoachRuntimeContext);
}

const MAIN_PAD =
  "flex-1 min-h-0 overflow-y-auto px-5 pt-7 pb-[calc(var(--app-mobile-tab-bar-height)+1.25rem)] md:max-w-none md:px-12 md:pb-12 md:pt-10";

/**
 * Renders route `children` in `<main>` and keeps `CoachShell` mounted in the same column.
 * When the coach is hidden, the shell stays behind the page (inert) so streams keep running.
 * When the coach is shown, it fills this column edge-to-edge like the dedicated coach route.
 */
export function CoachMainArea({ children }: { children: ReactNode }) {
  const { isCoachOpen, closeCoach } = useCoachRuntime();
  const pathname = useLocation({ select: (s) => s.pathname });
  const prevPathRef = useRef<string | null>(null);

  /** Leaving the coach view via in-app navigation minimizes coach so other pages stay usable. */
  useEffect(() => {
    if (prevPathRef.current === null) {
      prevPathRef.current = pathname;
      return;
    }
    if (prevPathRef.current === pathname) return;
    const prev = prevPathRef.current;
    prevPathRef.current = pathname;
    if (prev === "/app/coach" && pathname === "/app") return;
    closeCoach();
  }, [pathname, closeCoach]);

  useEffect(() => {
    if (!isCoachOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCoach();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isCoachOpen, closeCoach]);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        className={cn(
          "absolute inset-0 flex min-h-0 flex-col overflow-hidden",
          isCoachOpen
            ? "bg-background z-20"
            : "z-0 opacity-0 pointer-events-none"
        )}
        aria-hidden={!isCoachOpen}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 pb-[calc(var(--app-mobile-tab-bar-height)+1.25rem)] md:px-12 md:pb-12">
          <div
            className={cn(
              "text-card-foreground flex min-h-0 flex-1 flex-col overflow-hidden",
              "-mx-5 md:-mx-12"
            )}
          >
            <CoachShell />
          </div>
        </div>
      </div>
      <main
        className={cn(
          "relative z-10 min-h-0",
          isCoachOpen
            ? "h-0 shrink-0 overflow-hidden opacity-0 select-none pointer-events-none"
            : MAIN_PAD
        )}
        aria-hidden={isCoachOpen}
      >
        {children}
      </main>
    </div>
  );
}

export function CoachRuntimeProvider({ children }: { children: ReactNode }) {
  const [isCoachOpen, setIsCoachOpen] = useState(false);
  const [coachAgentWorking, setCoachAgentWorkingState] = useState(false);
  const [coachHasUnreadFromAssistant, setCoachHasUnreadFromAssistant] =
    useState(false);
  /** Kept in sync with open/close/toggle so chat callbacks see the latest value in the same tick. */
  const isOpenRef = useRef(false);

  const openCoach = useCallback(() => {
    isOpenRef.current = true;
    setIsCoachOpen(true);
    setCoachHasUnreadFromAssistant(false);
  }, []);

  const closeCoach = useCallback(() => {
    isOpenRef.current = false;
    setIsCoachOpen(false);
  }, []);

  const toggleCoach = useCallback(() => {
    setIsCoachOpen((prev) => {
      const next = !prev;
      isOpenRef.current = next;
      if (next) setCoachHasUnreadFromAssistant(false);
      return next;
    });
  }, []);

  const setCoachAgentWorking = useCallback((working: boolean) => {
    setCoachAgentWorkingState(working);
  }, []);

  const signalAssistantReplyFinishedWhileClosed = useCallback(() => {
    if (!isOpenRef.current) {
      setCoachHasUnreadFromAssistant(true);
    }
  }, []);

  const value = useMemo<CoachRuntimeValue>(
    () => ({
      isCoachOpen,
      openCoach,
      closeCoach,
      toggleCoach,
      coachAgentWorking,
      coachHasUnreadFromAssistant,
      setCoachAgentWorking,
      signalAssistantReplyFinishedWhileClosed,
    }),
    [
      isCoachOpen,
      openCoach,
      closeCoach,
      toggleCoach,
      coachAgentWorking,
      coachHasUnreadFromAssistant,
      setCoachAgentWorking,
      signalAssistantReplyFinishedWhileClosed,
    ]
  );

  return (
    <CoachRuntimeContext.Provider value={value}>
      {children}
    </CoachRuntimeContext.Provider>
  );
}
