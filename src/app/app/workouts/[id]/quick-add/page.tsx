import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { requireUserId } from "@/lib/auth-user";
import { getTemplate } from "@/lib/services/workouts";
import { cn } from "@/lib/utils";

import { QuickAddExerciseForm } from "../quick-add-form";

export default async function QuickAddPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await requireUserId();
  const template = await getTemplate(userId, id);
  if (!template) notFound();

  return (
    <div className="mx-auto w-full max-w-xl space-y-8">
      <Link
        href={`/app/workouts/${template.id}`}
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "min-h-11 -ml-2 gap-2"
        )}
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to workout
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Quick add exercise
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Add a new exercise to <span className="font-medium">{template.name}</span>.
        </p>
      </div>
      <QuickAddExerciseForm
        templateId={template.id}
        templateName={template.name}
      />
    </div>
  );
}
