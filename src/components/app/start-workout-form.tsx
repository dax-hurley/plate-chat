import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useWorkoutMutations, useActiveSession, useWorkoutTemplate } from "@/lib/stores";
import { cn } from "@/lib/utils";

export function StartWorkoutForm({
  templateId,
  name,
  formClassName,
  buttonClassName,
}: {
  templateId: string;
  name: string;
  formClassName?: string;
  buttonClassName?: string;
}) {
  const navigate = useNavigate();
  const { startSession } = useWorkoutMutations();
  const { data: activeSession, loading: activeSessionLoading } =
    useActiveSession();
  const { data: activeTemplate } = useWorkoutTemplate(
    activeSession?.templateId ?? null
  );
  const [pending, setPending] = useState(false);
  const [replaceOpen, setReplaceOpen] = useState(false);

  const inProgressName = activeSession
    ? activeSession.templateId
      ? (activeTemplate?.name ?? "Workout")
      : "Workout"
    : "";

  async function startNow() {
    if (pending) return;
    setPending(true);
    try {
      const id = await startSession(templateId);
      setReplaceOpen(false);
      await navigate({
        to: "/app/workouts/session/$sessionId",
        params: { sessionId: id },
      });
    } catch {
      toast.error("Could not start workout");
    } finally {
      setPending(false);
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (activeSessionLoading) return;
    if (activeSession) {
      setReplaceOpen(true);
      return;
    }
    void startNow();
  }

  return (
    <>
      <form onSubmit={onSubmit} className={cn("min-w-0", formClassName)}>
        <Button
          type="submit"
          disabled={pending || activeSessionLoading}
          className={cn(
            "min-h-12 w-full min-w-0 shrink justify-between gap-3 text-base shadow-sm",
            buttonClassName
          )}
        >
          <span className="min-w-0 truncate font-medium">{name}</span>
          <span className="text-primary-foreground/90 inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold">
            <Play className="size-4 fill-current opacity-90" aria-hidden />
            Start
          </span>
        </Button>
      </form>

      <Dialog open={replaceOpen} onOpenChange={setReplaceOpen}>
        <DialogContent className="gap-4">
          <DialogHeader>
            <DialogTitle>Abandon in-progress workout?</DialogTitle>
            <DialogDescription>
              <span className="text-foreground font-medium">
                {inProgressName}
              </span>{" "}
              is in progress. Starting{" "}
              <span className="text-foreground font-medium">{name}</span> will
              abandon that session. Unlogged sets will not be saved, and this
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="touch-manipulation"
              disabled={pending}
              onClick={() => setReplaceOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="touch-manipulation"
              disabled={pending}
              onClick={() => void startNow()}
            >
              {pending ? "Starting…" : "Abandon and start"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
