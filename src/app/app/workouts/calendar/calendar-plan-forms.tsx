"use client";

import { useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumericStepperInput } from "@/components/ui/numeric-stepper";
import { WORKOUT_WEEKDAY_OPTS } from "@/lib/workout-weekday-opts";
import { cn } from "@/lib/utils";

import {
  actionCreateRecurring,
  actionScheduleTemplate,
} from "./actions";

const selectClass =
  "border-input bg-background text-foreground ring-offset-background focus-visible:ring-ring min-h-14 w-full rounded-lg border px-3 text-base transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none touch-manipulation";

type TemplateOpt = { id: string; name: string };

export function CalendarPlanForms({
  dayKey,
  dowForForm,
  templates,
}: {
  dayKey: string;
  dowForForm: number;
  templates: TemplateOpt[];
}) {
  const [kind, setKind] = useState<"once" | "repeat">("once");

  if (templates.length === 0) return null;

  return (
    <div className="border-border space-y-4 border-t pt-4">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setKind("once")}
          className={cn(
            "min-h-14 touch-manipulation rounded-xl border px-3 py-2 text-sm font-semibold transition-colors",
            kind === "once"
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-card text-muted-foreground border-border hover:bg-muted/50"
          )}
        >
          Schedule once
        </button>
        <button
          type="button"
          onClick={() => setKind("repeat")}
          className={cn(
            "min-h-14 touch-manipulation rounded-xl border px-3 py-2 text-sm font-semibold transition-colors",
            kind === "repeat"
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-card text-muted-foreground border-border hover:bg-muted/50"
          )}
        >
          Repeat weekly
        </button>
      </div>

      {kind === "once" ? (
        <form action={actionScheduleTemplate} className="space-y-4">
          <input type="hidden" name="dayKey" value={dayKey} />
          <div className="space-y-2">
            <Label htmlFor="cal-once-template" className="text-base">
              Workout template
            </Label>
            <select
              id="cal-once-template"
              name="templateId"
              required
              className={selectClass}
              defaultValue=""
            >
              <option value="" disabled>
                Choose template…
              </option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cal-once-notes" className="text-base">
              Note (optional)
            </Label>
            <Input
              id="cal-once-notes"
              name="notes"
              placeholder="e.g. Heavy singles"
              className="min-h-14 text-base touch-manipulation"
            />
          </div>
          <button
            type="submit"
            className={cn(
              buttonVariants({ variant: "default" }),
              "min-h-14 w-full touch-manipulation text-base"
            )}
          >
            Add one-off
          </button>
        </form>
      ) : (
        <form action={actionCreateRecurring} className="space-y-4">
          <input type="hidden" name="startDayKey" value={dayKey} />
          <p className="text-muted-foreground text-xs">
            Pick weekdays and how often the week repeats. The rule starts from the
            day shown in the header.
          </p>
          <div className="space-y-2">
            <Label htmlFor="cal-rec-template" className="text-base">
              Workout template
            </Label>
            <select
              id="cal-rec-template"
              name="templateId"
              required
              className={selectClass}
              defaultValue=""
            >
              <option value="" disabled>
                Choose template…
              </option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <fieldset className="space-y-2">
            <legend className="text-base font-semibold">On these weekdays</legend>
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
                    defaultChecked={dow === dowForForm}
                    className="border-input text-primary size-5 shrink-0 rounded-md"
                  />
                  <span className="text-sm font-medium">{label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="intervalWeeks" className="text-base">
                Repeat every N weeks
              </Label>
              <NumericStepperInput
                id="intervalWeeks"
                name="intervalWeeks"
                min={1}
                max={12}
                defaultValue={1}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="untilDayKey" className="text-base">
                Ends on (optional)
              </Label>
              <Input
                id="untilDayKey"
                name="untilDayKey"
                type="date"
                className="min-h-14 text-base touch-manipulation"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="recurringNotes" className="text-base">
              Note (optional)
            </Label>
            <Input
              id="recurringNotes"
              name="recurringNotes"
              placeholder="e.g. Mesocycle 1"
              className="min-h-14 text-base touch-manipulation"
            />
          </div>
          <button
            type="submit"
            className={cn(
              buttonVariants({ variant: "secondary" }),
              "min-h-14 w-full touch-manipulation text-base"
            )}
          >
            Save repeating schedule
          </button>
        </form>
      )}
    </div>
  );
}
