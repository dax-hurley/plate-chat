import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, ClipboardList } from "lucide-react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWorkoutMutations } from "@/lib/stores";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/workouts/new")({
  component: NewWorkoutPage,
});

function NewWorkoutPage() {
  const navigate = useNavigate();
  const { createTemplate } = useWorkoutMutations();
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Give your workout a name.");
      return;
    }
    setPending(true);
    try {
      const id = await createTemplate({
        name: trimmed,
        notes: notes.trim() || null,
        routineGroupId: null,
        routineOrder: null,
      });
      toast.success("Workout created", { description: "Add exercises next." });
      await navigate({ to: "/app/workouts/$id", params: { id } });
    } catch {
      toast.error("Could not create workout.");
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <Link
        to="/app/workouts"
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
          Name your routine, then add lifts on the next screen.
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-base">
            Name
          </Label>
          <Input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
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
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Warm-up tips, etc."
            className="min-h-14 text-base touch-manipulation"
          />
        </div>

        <Button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-14 w-full touch-manipulation items-center justify-center gap-2 text-base shadow-sm"
        >
          {pending ? "Creating…" : "Continue"}
          {!pending ? <ArrowRight className="size-4" aria-hidden /> : null}
        </Button>
      </form>
    </div>
  );
}
