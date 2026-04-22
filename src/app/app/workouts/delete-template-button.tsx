"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { actionDeleteTemplate } from "./actions";

export function DeleteTemplateButton({
  templateId,
  name,
  className,
}: {
  templateId: string;
  name: string;
  className?: string;
}) {
  const [pending, start] = useTransition();

  function onDelete() {
    if (!confirm(`Delete “${name}”? This cannot be undone.`)) return;
    start(async () => {
      try {
        await actionDeleteTemplate(templateId);
        toast.success("Workout deleted");
      } catch {
        toast.error("Could not delete");
      }
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn(
        "text-destructive hover:text-destructive min-h-11 shrink-0 gap-1.5",
        className
      )}
      disabled={pending}
      onClick={onDelete}
    >
      <Trash2 className="size-4" aria-hidden />
      Delete
    </Button>
  );
}
