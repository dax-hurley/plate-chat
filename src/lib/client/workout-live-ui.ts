import { useSyncExternalStore } from "react";

export type WorkoutLiveUiState = {
  sessionId: string | null;
  restDeadlineMs: number | null;
  currentExerciseName: string | null;
};

const initial: WorkoutLiveUiState = {
  sessionId: null,
  restDeadlineMs: null,
  currentExerciseName: null,
};

let state: WorkoutLiveUiState = initial;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function getWorkoutLiveUi(): WorkoutLiveUiState {
  return state;
}

export function patchWorkoutLiveUi(patch: Partial<WorkoutLiveUiState>) {
  state = { ...state, ...patch };
  emit();
}

export function clearWorkoutLiveUi() {
  state = initial;
  emit();
}

export function useWorkoutLiveUi(): WorkoutLiveUiState {
  return useSyncExternalStore(
    (onStoreChange) => {
      listeners.add(onStoreChange);
      return () => listeners.delete(onStoreChange);
    },
    () => state,
    () => state
  );
}
