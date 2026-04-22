"use client";

import { CheckCircle, XCircle } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import { actionAbandonWorkout, actionCompleteWorkout } from "../../actions";

export function WorkoutSessionFooter({ sessionId }: { sessionId: string }) {
  return (
    <div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 fixed inset-x-0 bottom-[var(--app-mobile-tab-bar-height)] z-40 border-t p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md md:bottom-0 md:left-60 md:p-4 md:pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-xl flex-col gap-2">
        <form action={actionCompleteWorkout.bind(null, sessionId)}>
          <button
            type="submit"
            className={cn(
              buttonVariants(),
              "inline-flex min-h-12 w-full touch-manipulation items-center justify-center gap-2 text-base font-semibold shadow-sm"
            )}
          >
            <CheckCircle className="size-5" aria-hidden />
            Finish workout
          </button>
        </form>
        <Dialog>
          <DialogTrigger
            type="button"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "text-muted-foreground hover:text-foreground min-h-11 w-full touch-manipulation gap-2 text-sm"
            )}
          >
            <XCircle className="size-4" aria-hidden />
            Abandon workout…
          </DialogTrigger>
          <DialogContent className="gap-4">
            <DialogHeader>
              <DialogTitle>Abandon this workout?</DialogTitle>
              <DialogDescription>
                Your in-progress sets for this session will be discarded. This
                cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <form action={actionAbandonWorkout.bind(null, sessionId)} className="mt-2">
              <button
                type="submit"
                className={cn(
                  buttonVariants({ variant: "destructive" }),
                  "min-h-12 w-full touch-manipulation"
                )}
              >
                Yes, abandon workout
              </button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
