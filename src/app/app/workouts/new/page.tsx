import Link from "next/link";
import { ArrowLeft, ArrowRight, ClipboardList } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDayKey } from "@/lib/date-key";
import { cn } from "@/lib/utils";

import { actionCreateTemplate } from "../actions";

import { WorkoutScheduleFields } from "./workout-schedule-fields";

export default function NewWorkoutPage() {
  const suggestDow = new Date().getDay();

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <Link
        href="/app/workouts"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "min-h-11 -ml-2 gap-2"
        )}
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back
      </Link>
      <div>
        <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight">
          <span className="bg-primary/15 text-primary ring-primary/15 inline-flex size-10 items-center justify-center rounded-2xl ring-1">
            <ClipboardList className="size-5" strokeWidth={2.25} aria-hidden />
          </span>
          New workout
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Name your routine, optionally add it to your calendar, then add lifts
          on the next screen
        </p>
      </div>
      <form action={actionCreateTemplate} className="space-y-8">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-base">
            Name
          </Label>
          <Input
            id="name"
            name="name"
            required
            placeholder="e.g. StrongLifts A"
            className="min-h-14 text-base touch-manipulation"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-base">
            Notes (optional)
          </Label>
          <Input
            id="notes"
            name="notes"
            placeholder="Warm-up tips, etc."
            className="min-h-14 text-base touch-manipulation"
          />
        </div>

        <WorkoutScheduleFields
          defaultPlanDate={formatDayKey(new Date())}
          suggestDow={suggestDow}
        />

        <button
          type="submit"
          className={cn(
            buttonVariants(),
            "inline-flex min-h-14 w-full touch-manipulation items-center justify-center gap-2 text-base shadow-sm"
          )}
        >
          Continue
          <ArrowRight className="size-4" aria-hidden />
        </button>
      </form>
    </div>
  );
}
