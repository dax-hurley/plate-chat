import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

import { buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useWorkoutMutations } from "@/lib/stores";
import { cn } from "@/lib/utils";

export function WorkoutSessionFooter({ sessionId }: { sessionId: string }) {
  const navigate = useNavigate();
  const { finishSession, abandonSession } = useWorkoutMutations();
  const [abandonOpen, setAbandonOpen] = useState(false);
  const [pending, setPending] = useState<"finish" | "abandon" | null>(null);

  async function onFinish() {
    setPending("finish");
    try {
      await finishSession(sessionId);
      toast.success("Workout logged");
      await navigate({ to: "/app/workouts" });
    } catch {
      toast.error("Could not finish workout");
    } finally {
      setPending(null);
    }
  }

  async function onAbandon() {
    setPending("abandon");
    try {
      await abandonSession(sessionId);
      toast.message("Workout abandoned");
      setAbandonOpen(false);
      await navigate({ to: "/app/workouts" });
    } catch {
      toast.error("Could not abandon workout");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 fixed inset-x-0 bottom-[var(--app-mobile-tab-bar-height)] z-40 border-t p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md md:bottom-0 md:left-60 md:p-4 md:pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-xl flex-col gap-2">
        <button
          type="button"
          className={cn(
            buttonVariants(),
            "inline-flex min-h-12 w-full touch-manipulation items-center justify-center gap-2 text-base font-semibold shadow-sm"
          )}
          disabled={pending !== null}
          onClick={() => void onFinish()}
        >
          <CheckCircle className="size-5" aria-hidden />
          {pending === "finish" ? "Finishing…" : "Finish workout"}
        </button>
        <Dialog open={abandonOpen} onOpenChange={setAbandonOpen}>
          <DialogTrigger
            type="button"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "text-muted-foreground hover:text-foreground min-h-11 w-full touch-manipulation gap-2 text-sm"
            )}
            disabled={pending !== null}
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
            <button
              type="button"
              className={cn(
                buttonVariants({ variant: "destructive" }),
                "min-h-12 w-full touch-manipulation"
              )}
              disabled={pending === "abandon"}
              onClick={() => void onAbandon()}
            >
              {pending === "abandon" ? "Abandoning…" : "Yes, abandon workout"}
            </button>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
