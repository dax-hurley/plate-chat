import { jsxs, jsx } from "react/jsx-runtime";
import { Timer, Hourglass } from "lucide-react";
import { useState, useEffect, useSyncExternalStore } from "react";
import { f as formatDurationSeconds } from "./format-duration-DOYRzqf7.mjs";
import { c as cn } from "./utils-H80jjgLf.mjs";
function WorkoutElapsedTimer({
  startedAtMs,
  initialElapsedSec,
  className,
  variant = "default"
}) {
  const [elapsedSec, setElapsedSec] = useState(initialElapsedSec);
  useEffect(() => {
    const tick = () => {
      setElapsedSec(
        Math.max(0, Math.floor((Date.now() - startedAtMs) / 1e3))
      );
    };
    tick();
    const id = window.setInterval(tick, 1e3);
    return () => window.clearInterval(id);
  }, [startedAtMs]);
  const label = `Elapsed time ${formatDurationSeconds(elapsedSec)}`;
  if (variant === "compact") {
    return /* @__PURE__ */ jsxs(
      "span",
      {
        className: cn(
          "text-foreground inline-flex items-center gap-1 tabular-nums",
          "text-sm font-semibold tracking-tight",
          className
        ),
        "aria-label": label,
        "aria-live": "polite",
        "aria-atomic": "true",
        children: [
          /* @__PURE__ */ jsx(Timer, { className: "text-muted-foreground size-3.5 shrink-0", "aria-hidden": true }),
          formatDurationSeconds(elapsedSec)
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: cn("flex flex-col items-end gap-0.5", className),
      "aria-label": label,
      children: [
        /* @__PURE__ */ jsx("span", { className: "text-muted-foreground text-[0.65rem] font-semibold uppercase tracking-wide", children: "Elapsed" }),
        /* @__PURE__ */ jsxs(
          "span",
          {
            className: "text-foreground flex items-center gap-1.5 text-xl font-semibold tabular-nums tracking-tight",
            "aria-live": "polite",
            "aria-atomic": "true",
            children: [
              /* @__PURE__ */ jsx(Timer, { className: "text-muted-foreground size-5 shrink-0", "aria-hidden": true }),
              formatDurationSeconds(elapsedSec)
            ]
          }
        )
      ]
    }
  );
}
function WorkoutRestCountdown({
  deadlineMs,
  className,
  variant = "default"
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [deadlineMs]);
  const remainingSec = Math.max(0, Math.ceil((deadlineMs - now) / 1e3));
  const label = `Rest remaining ${formatDurationSeconds(remainingSec)}`;
  if (variant === "compact") {
    return /* @__PURE__ */ jsxs(
      "span",
      {
        className: cn(
          "text-foreground inline-flex items-center gap-1 tabular-nums",
          "text-sm font-semibold tracking-tight",
          remainingSec === 0 ? "text-muted-foreground" : "text-foreground",
          className
        ),
        "aria-label": label,
        "aria-live": "polite",
        "aria-atomic": "true",
        children: [
          /* @__PURE__ */ jsx(Hourglass, { className: "text-muted-foreground size-3.5 shrink-0", "aria-hidden": true }),
          formatDurationSeconds(remainingSec)
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: cn("flex flex-col items-end gap-0.5", className),
      "aria-label": label,
      children: [
        /* @__PURE__ */ jsx("span", { className: "text-muted-foreground text-[0.65rem] font-semibold uppercase tracking-wide", children: "Rest" }),
        /* @__PURE__ */ jsxs(
          "span",
          {
            className: cn(
              "flex items-center gap-1.5 text-xl font-semibold tabular-nums tracking-tight",
              remainingSec === 0 ? "text-muted-foreground" : "text-foreground"
            ),
            "aria-live": "polite",
            "aria-atomic": "true",
            children: [
              /* @__PURE__ */ jsx(Hourglass, { className: "text-muted-foreground size-5 shrink-0", "aria-hidden": true }),
              formatDurationSeconds(remainingSec)
            ]
          }
        )
      ]
    }
  );
}
const initial = {
  sessionId: null,
  restDeadlineMs: null,
  currentExerciseName: null
};
let state = initial;
const listeners = /* @__PURE__ */ new Set();
function emit() {
  for (const l of listeners) l();
}
function getWorkoutLiveUi() {
  return state;
}
function patchWorkoutLiveUi(patch) {
  state = { ...state, ...patch };
  emit();
}
function clearWorkoutLiveUi() {
  state = initial;
  emit();
}
function useWorkoutLiveUi() {
  return useSyncExternalStore(
    (onStoreChange) => {
      listeners.add(onStoreChange);
      return () => listeners.delete(onStoreChange);
    },
    () => state,
    () => state
  );
}
export {
  WorkoutElapsedTimer as W,
  WorkoutRestCountdown as a,
  clearWorkoutLiveUi as c,
  getWorkoutLiveUi as g,
  patchWorkoutLiveUi as p,
  useWorkoutLiveUi as u
};
