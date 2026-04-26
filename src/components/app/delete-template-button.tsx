import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useWorkoutMutations } from "@/lib/stores";
import { cn } from "@/lib/utils";

export function DeleteTemplateButton({
  templateId,
  name,
  className,
}: {
  templateId: string;
  name: string;
  className?: string;
}) {
  const { deleteTemplate } = useWorkoutMutations();
  const [pending, setPending] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  async function onDelete() {
    setDialogOpen(false);
    setPending(true);
    try {
      await deleteTemplate(templateId);
      toast.success("Workout deleted");
    } catch {
      toast.error("Could not delete");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <ConfirmDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={`Delete “${name}”?`}
        description="This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="destructive"
        onConfirm={onDelete}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(
          "text-destructive hover:text-destructive min-h-11 shrink-0 gap-1.5",
          className
        )}
        disabled={pending}
        onClick={() => setDialogOpen(true)}
      >
        <Trash2 className="size-4" aria-hidden />
        Delete
      </Button>
    </>
  );
}
