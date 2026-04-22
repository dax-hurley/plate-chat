"use client";

import { useState } from "react";
import { CalendarPlus } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumericStepperInput } from "@/components/ui/numeric-stepper";
import { WORKOUT_WEEKDAY_OPTS } from "@/lib/workout-weekday-opts";
import { cn } from "@/lib/utils";

type ScheduleMode = "none" | "once" | "repeat";

export function WorkoutScheduleFields({
  defaultPlanDate,
  suggestDow,
}: {
  defaultPlanDate: string;
  suggestDow: number;
}) {
  const [mode, setMode] = useState<ScheduleMode>("none");

  return (
    <Card className="border-primary/15">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarPlus className="text-primary size-5 shrink-0" aria-hidden />
          Calendar
        </CardTitle>
        <CardDescription>
          Optional — you can always schedule later under Workouts → Calendar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <input type="hidden" name="scheduleMode" value={mode} />

        <div className="grid gap-2 sm:grid-cols-3">
          {(
            [
              {
                key: "none" as const,
                title: "Not now",
                desc: "Only create the template",
              },
              {
                key: "once" as const,
                title: "One time",
                desc: "Single day on calendar",
              },
              {
                key: "repeat" as const,
                title: "Repeat weekly",
                desc: "Weekdays + interval",
              },
            ] as const
          ).map(({ key, title, desc }) => (
            <button
              key={key}
              type="button"
              onClick={() => setMode(key)}
              className={cn(
                "border-border flex min-h-[4.25rem] touch-manipulation flex-col items-start rounded-xl border px-3 py-3 text-left transition-colors",
                mode === key
                  ? "bg-primary/10 border-primary/40 ring-primary/25 ring-2"
                  : "bg-card hover:bg-muted/50"
              )}
            >
              <span className="font-semibold">{title}</span>
              <span className="text-muted-foreground mt-0.5 text-xs leading-snug">
                {desc}
              </span>
            </button>
          ))}
        </div>

        {mode === "once" || mode === "repeat" ? (
          <div className="space-y-2">
            <Label htmlFor="planDate" className="text-base">
              {mode === "once" ? "Workout date" : "Rule starts (first active day)"}
            </Label>
            <Input
              id="planDate"
              name="planDate"
              type="date"
              defaultValue={defaultPlanDate}
              required
              className="min-h-14 text-base touch-manipulation"
            />
            {mode === "repeat" ? (
              <p className="text-muted-foreground text-xs">
                You still pick which weekdays apply below; this is when the rule
                begins.
              </p>
            ) : (
              <p className="text-muted-foreground text-xs">
                This workout appears once on your calendar on that day.
              </p>
            )}
          </div>
        ) : null}

        {mode === "repeat" ? (
          <div className="border-border space-y-4 border-t pt-4">
            <div>
              <p className="text-base font-semibold">On these weekdays</p>
              <p className="text-muted-foreground mt-1 text-xs">
                Today&apos;s weekday is checked as a suggestion.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {WORKOUT_WEEKDAY_OPTS.map(({ dow, label }) => (
                <label
                  key={dow}
                  className="border-border bg-card hover:bg-muted/40 flex min-h-14 cursor-pointer touch-manipulation items-center gap-3 rounded-xl border px-3 py-2 has-[:checked]:border-primary/40 has-[:checked]:bg-primary/8"
                >
                  <input
                    type="checkbox"
                    name="byDay"
                    value={String(dow)}
                    defaultChecked={dow === suggestDow}
                    className="border-input text-primary size-5 shrink-0 rounded-md"
                  />
                  <span className="text-sm font-medium">{label}</span>
                </label>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="repeatInterval" className="text-base">
                  Repeat every N weeks
                </Label>
                <NumericStepperInput
                  id="repeatInterval"
                  name="repeatInterval"
                  min={1}
                  max={12}
                  defaultValue={1}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="repeatUntil" className="text-base">
                  Ends on (optional)
                </Label>
                <Input
                  id="repeatUntil"
                  name="repeatUntil"
                  type="date"
                  className="min-h-14 text-base touch-manipulation"
                />
              </div>
            </div>
          </div>
        ) : null}

        {mode === "once" || mode === "repeat" ? (
          <div className="space-y-2">
            <Label htmlFor="scheduleNote" className="text-base">
              Calendar note (optional)
            </Label>
            <Input
              id="scheduleNote"
              name="scheduleNote"
              placeholder="Shown on the plan (e.g. Deload)"
              className="min-h-14 text-base touch-manipulation"
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
