import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

import { useDb } from "@/lib/client/db/provider";
import * as client from "@/lib/client/workout-session-dexie";
import { useLocalSession } from "@/lib/stores/session";

export type WorkoutSessionClientActions = {
  fillSetSlot: (
    sessionId: string,
    exerciseId: string,
    setIndex: number
  ) => Promise<void>;
  decrementSetReps: (
    sessionId: string,
    exerciseId: string,
    setIndex: number
  ) => Promise<void>;
  adjustSessionExerciseWeight: (
    sessionId: string,
    exerciseId: string,
    direction: "up" | "down"
  ) => Promise<void>;
  adjustSessionExerciseDuration: (
    sessionId: string,
    exerciseId: string,
    direction: "up" | "down"
  ) => Promise<void>;
  adjustSessionExerciseTargetDistance: (
    sessionId: string,
    exerciseId: string,
    direction: "up" | "down"
  ) => Promise<void>;
  logTimedSet: (
    sessionId: string,
    exerciseId: string,
    setIndex: number,
    durationSec: number
  ) => Promise<void>;
  logDistanceTimeFromStopwatch: (
    sessionId: string,
    exerciseId: string,
    setIndex: number,
    durationSec: number
  ) => Promise<void>;
};

const WorkoutSessionActionsContext =
  createContext<WorkoutSessionClientActions | null>(null);

export function WorkoutSessionActionsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { db, ready } = useDb();
  const { userId } = useLocalSession();

  const value = useMemo((): WorkoutSessionClientActions | null => {
    if (!ready || !db || !userId) return null;
    return {
      fillSetSlot: (sessionId, exerciseId, setIndex) =>
        client.clientFillSetSlot(db, userId, sessionId, exerciseId, setIndex),
      decrementSetReps: (sessionId, exerciseId, setIndex) =>
        client.clientDecrementSetReps(
          db,
          userId,
          sessionId,
          exerciseId,
          setIndex
        ),
      adjustSessionExerciseWeight: (sessionId, exerciseId, direction) =>
        client.clientAdjustSessionExerciseWeight(
          db,
          userId,
          sessionId,
          exerciseId,
          direction
        ),
      adjustSessionExerciseDuration: (sessionId, exerciseId, direction) =>
        client.clientAdjustSessionExerciseDuration(
          db,
          userId,
          sessionId,
          exerciseId,
          direction
        ),
      adjustSessionExerciseTargetDistance: (sessionId, exerciseId, direction) =>
        client.clientAdjustSessionExerciseTargetDistance(
          db,
          userId,
          sessionId,
          exerciseId,
          direction
        ),
      logTimedSet: (sessionId, exerciseId, setIndex, durationSec) =>
        client.clientLogTimedSet(
          db,
          userId,
          sessionId,
          exerciseId,
          setIndex,
          durationSec
        ),
      logDistanceTimeFromStopwatch: (
        sessionId,
        exerciseId,
        setIndex,
        durationSec
      ) =>
        client.clientLogDistanceTimeFromStopwatch(
          db,
          userId,
          sessionId,
          exerciseId,
          setIndex,
          durationSec
        ),
    };
  }, [db, ready, userId]);

  if (!value) {
    return (
      <p className="text-muted-foreground py-10 text-center text-sm">Loading…</p>
    );
  }

  return (
    <WorkoutSessionActionsContext.Provider value={value}>
      {children}
    </WorkoutSessionActionsContext.Provider>
  );
}

export function useWorkoutSessionActions() {
  const ctx = useContext(WorkoutSessionActionsContext);
  if (!ctx) {
    throw new Error("useWorkoutSessionActions: actions not available");
  }
  return ctx;
}

