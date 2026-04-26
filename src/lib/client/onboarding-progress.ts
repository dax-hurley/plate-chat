import { type Dispatch, type SetStateAction } from "react";

import { isGoalPreset, type GoalPreset } from "@/lib/profile-goal-preset";
import { PROFILE_SEX_VALUES, type ProfileSex } from "@/lib/profile-demographics";

export const PROFILE_STEPS = [
  "height",
  "weight",
  "age",
  "sex",
  "activity",
  "training_goal",
] as const;
export const PROFILE_STEP_COUNT = PROFILE_STEPS.length;
export type ProfileStep = (typeof PROFILE_STEPS)[number];

export const ONBOARDING_PHASES = [
  ...PROFILE_STEPS,
  "goals",
  "meal_chips",
  "meal_notes",
  "meal_ai",
  "meal_review",
  "meal_change_chat",
  "workout_chips",
  "workout_notes",
  "workout_ai",
] as const;
export type OnboardingPhase = (typeof ONBOARDING_PHASES)[number];

const MEAL_STEPS: ReadonlySet<OnboardingPhase> = new Set([
  "meal_chips",
  "meal_notes",
  "meal_ai",
  "meal_review",
  "meal_change_chat",
]);
const WORKOUT_STEPS: ReadonlySet<OnboardingPhase> = new Set([
  "workout_chips",
  "workout_notes",
  "workout_ai",
]);

function isOnboardingPhase(s: string): s is OnboardingPhase {
  return (ONBOARDING_PHASES as readonly string[]).includes(s);
}

export function fixInconsistentOnboardingPhase(
  phase: OnboardingPhase,
  wantMeal: boolean,
  wantWorkout: boolean
): OnboardingPhase {
  if (MEAL_STEPS.has(phase) && !wantMeal) {
    if (wantWorkout) return "workout_chips";
    return "goals";
  }
  if (WORKOUT_STEPS.has(phase) && !wantWorkout) {
    if (wantMeal) return "meal_review";
    return "goals";
  }
  return phase;
}

const VERSION = 1;
const key = (userId: string) => `tl_onb_prog_v${VERSION}_${userId}`;

export type OnboardingProgressSnapshotV1 = {
  v: 1;
  phase: OnboardingPhase;
  wantMeal: boolean;
  wantWorkout: boolean;
  heightFeet: string;
  heightInches: string;
  weightLb: string;
  ageYears: string;
  sex: string;
  activity: string;
  /** `GoalPreset` string or "" */
  goalPreset: string;
  mealSelected: string[];
  workoutSelected: string[];
  mealNotes: string;
  workoutNotes: string;
  mealStarted: boolean;
  workoutStarted: boolean;
};

const DEFAULT: Omit<OnboardingProgressSnapshotV1, "v" | "phase"> = {
  wantMeal: false,
  wantWorkout: false,
  heightFeet: "",
  heightInches: "",
  weightLb: "",
  ageYears: "",
  sex: "",
  activity: "",
  goalPreset: "",
  mealSelected: [],
  workoutSelected: [],
  mealNotes: "",
  workoutNotes: "",
  mealStarted: false,
  workoutStarted: false,
};

/**
 * Read saved onboarding state from localStorage (per user).
 */
export function readOnboardingProgress(
  userId: string
): OnboardingProgressSnapshotV1 | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(key(userId));
  if (raw == null) return null;
  try {
    const j: unknown = JSON.parse(raw);
    if (!j || typeof j !== "object") return null;
    const p = (j as { v?: unknown; phase?: unknown }).phase;
    if (typeof p !== "string" || !isOnboardingPhase(p)) return null;
    const s = j as OnboardingProgressSnapshotV1;
    if (s.v !== 1) return null;
    const wantMeal = Boolean(s.wantMeal);
    const wantWorkout = Boolean(s.wantWorkout);
    return {
      v: 1,
      phase: fixInconsistentOnboardingPhase(
        s.phase,
        wantMeal,
        wantWorkout
      ),
      wantMeal,
      wantWorkout,
      heightFeet: typeof s.heightFeet === "string" ? s.heightFeet : "",
      heightInches: typeof s.heightInches === "string" ? s.heightInches : "",
      weightLb: typeof s.weightLb === "string" ? s.weightLb : "",
      ageYears: typeof s.ageYears === "string" ? s.ageYears : "",
      sex: typeof s.sex === "string" ? s.sex : "",
      activity: typeof s.activity === "string" ? s.activity : "",
      goalPreset: typeof s.goalPreset === "string" ? s.goalPreset : "",
      mealSelected: Array.isArray(s.mealSelected)
        ? s.mealSelected.filter((x) => typeof x === "string")
        : [],
      workoutSelected: Array.isArray(s.workoutSelected)
        ? s.workoutSelected.filter((x) => typeof x === "string")
        : [],
      mealNotes: typeof s.mealNotes === "string" ? s.mealNotes : "",
      workoutNotes: typeof s.workoutNotes === "string" ? s.workoutNotes : "",
      mealStarted: Boolean(s.mealStarted),
      workoutStarted: Boolean(s.workoutStarted),
    };
  } catch {
    return null;
  }
}

/**
 * Write onboarding state to localStorage.
 */
export function writeOnboardingProgress(
  userId: string,
  state: OnboardingProgressSnapshotV1
): void {
  if (typeof localStorage === "undefined") return;
  try {
    const fixed: OnboardingProgressSnapshotV1 = {
      ...state,
      phase: fixInconsistentOnboardingPhase(
        state.phase,
        state.wantMeal,
        state.wantWorkout
      ),
    };
    localStorage.setItem(key(userId), JSON.stringify(fixed));
  } catch {
    // private mode, quota, etc.
  }
}

/**
 * Call when onboarding is completed or skipped; clears resume state.
 */
export function clearOnboardingProgress(userId: string): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(key(userId));
  } catch {
    // ignore
  }
}

type Setter<T> = Dispatch<SetStateAction<T>>;

/** Applies a loaded snapshot to all useState setters. */
export function applyOnboardingSnapshot(
  s: OnboardingProgressSnapshotV1,
  setters: {
    setPhase: Setter<OnboardingPhase>;
    setWantMeal: Setter<boolean>;
    setWantWorkout: Setter<boolean>;
    setHeightFeet: Setter<string>;
    setHeightInches: Setter<string>;
    setWeightLb: Setter<string>;
    setAgeYears: Setter<string>;
    setSex: Setter<ProfileSex | "">;
    setActivity: Setter<
      | "sedentary"
      | "light"
      | "moderate"
      | "active"
      | "very_active"
      | ""
    >;
    setGoalPreset: Setter<GoalPreset | "">;
    setMealSelected: Setter<Set<string>>;
    setWorkoutSelected: Setter<Set<string>>;
    setMealNotes: Setter<string>;
    setWorkoutNotes: Setter<string>;
    setMealStarted: Setter<boolean>;
    setWorkoutStarted: Setter<boolean>;
  }
) {
  const fixed: OnboardingProgressSnapshotV1 = {
    ...s,
    phase: fixInconsistentOnboardingPhase(
      s.phase,
      s.wantMeal,
      s.wantWorkout
    ),
  };
  setters.setPhase(fixed.phase);
  setters.setWantMeal(fixed.wantMeal);
  setters.setWantWorkout(fixed.wantWorkout);
  setters.setHeightFeet(fixed.heightFeet);
  setters.setHeightInches(fixed.heightInches);
  setters.setWeightLb(fixed.weightLb);
  setters.setAgeYears(fixed.ageYears);
  setters.setSex(
    fixed.sex === "" || PROFILE_SEX_VALUES.includes(fixed.sex as ProfileSex)
      ? (fixed.sex as ProfileSex | "")
      : ""
  );
  setters.setActivity(
    [
      "sedentary",
      "light",
      "moderate",
      "active",
      "very_active",
      "",
    ].includes(fixed.activity)
      ? (fixed.activity as
          | "sedentary"
          | "light"
          | "moderate"
          | "active"
          | "very_active"
          | "")
      : ""
  );
  setters.setGoalPreset(
    fixed.goalPreset && isGoalPreset(fixed.goalPreset) ? fixed.goalPreset : ""
  );
  setters.setMealSelected(new Set(fixed.mealSelected));
  setters.setWorkoutSelected(new Set(fixed.workoutSelected));
  setters.setMealNotes(fixed.mealNotes);
  setters.setWorkoutNotes(fixed.workoutNotes);
  setters.setMealStarted(fixed.mealStarted);
  setters.setWorkoutStarted(fixed.workoutStarted);
}

/**
 * Create a storable snapshot from current React state.
 */
export function snapshotOnboarding(
  s: {
    phase: OnboardingPhase;
    wantMeal: boolean;
    wantWorkout: boolean;
    heightFeet: string;
    heightInches: string;
    weightLb: string;
    ageYears: string;
    sex: string;
    activity: string;
    goalPreset: GoalPreset | "";
    mealSelected: Set<string>;
    workoutSelected: Set<string>;
    mealNotes: string;
    workoutNotes: string;
    mealStarted: boolean;
    workoutStarted: boolean;
  }
): OnboardingProgressSnapshotV1 {
  return {
    v: 1,
    phase: s.phase,
    wantMeal: s.wantMeal,
    wantWorkout: s.wantWorkout,
    heightFeet: s.heightFeet,
    heightInches: s.heightInches,
    weightLb: s.weightLb,
    ageYears: s.ageYears,
    sex: s.sex,
    activity: s.activity,
    goalPreset: s.goalPreset === "" ? "" : s.goalPreset,
    mealSelected: [...s.mealSelected],
    workoutSelected: [...s.workoutSelected],
    mealNotes: s.mealNotes,
    workoutNotes: s.workoutNotes,
    mealStarted: s.mealStarted,
    workoutStarted: s.workoutStarted,
  };
}
