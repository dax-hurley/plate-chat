"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { CirclePlus, EllipsisVertical, Pencil } from "lucide-react";

import { StartWorkoutForm } from "@/app/app/start-workout-form";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function WorkoutRoutineCardActions({
  templateId,
  name,
  quickAddHref,
  mobileExtra,
}: {
  templateId: string;
  name: string;
  /** Defaults to template quick-add route */
  quickAddHref?: string;
  /** Shown inside the mobile “More” sheet (e.g. delete routine) */
  mobileExtra?: ReactNode;
}) {
  const qa = quickAddHref ?? `/app/workouts/${templateId}/quick-add`;

  return (
    <>
      <div className="hidden flex-col gap-2 md:flex">
        <StartWorkoutForm templateId={templateId} name={name} />
        <Link
          href={`/app/workouts/${templateId}#workout-exercises`}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "border-primary/20 inline-flex min-h-11 w-full touch-manipulation items-center justify-center gap-2 text-base"
          )}
        >
          <Pencil className="size-4 shrink-0" aria-hidden />
          Edit exercises
        </Link>
        <Link
          href={qa}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "border-primary/20 inline-flex min-h-11 w-full touch-manipulation items-center justify-center gap-2 text-base"
          )}
        >
          <CirclePlus className="size-4 shrink-0" aria-hidden />
          Quick add exercise
        </Link>
      </div>
      <div className="flex min-h-12 gap-2 md:hidden">
        <StartWorkoutForm
          templateId={templateId}
          name={name}
          formClassName="min-w-0 flex-1"
          buttonClassName="w-full min-w-0"
        />
        <Sheet>
          <SheetTrigger
            type="button"
            aria-label="More actions"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "border-primary/20 size-12 shrink-0 touch-manipulation p-0"
            )}
          >
            <EllipsisVertical className="size-5" aria-hidden />
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[min(85dvh,32rem)] gap-0">
            <SheetHeader className="text-left">
              <SheetTitle className="pr-10">{name}</SheetTitle>
              <SheetDescription>Quick add or other actions for this routine.</SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-3 px-4 pb-6 pt-2">
              <Link
                href={`/app/workouts/${templateId}#workout-exercises`}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "border-primary/20 inline-flex min-h-12 w-full touch-manipulation items-center justify-center gap-2 text-base"
                )}
              >
                <Pencil className="size-4 shrink-0" aria-hidden />
                Edit exercises
              </Link>
              <Link
                href={qa}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "border-primary/20 inline-flex min-h-12 w-full touch-manipulation items-center justify-center gap-2 text-base"
                )}
              >
                <CirclePlus className="size-4 shrink-0" aria-hidden />
                Quick add exercise
              </Link>
              {mobileExtra ? (
                <div className="border-border border-t pt-3">{mobileExtra}</div>
              ) : null}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
