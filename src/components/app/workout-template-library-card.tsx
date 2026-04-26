import { Link } from "@tanstack/react-router";

import { WorkoutRoutineCardActions } from "@/components/app/workout-routine-card-actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { DeleteTemplateButton } from "@/components/app/delete-template-button";

type TemplateRow = {
  id: string;
  name: string;
  /** Epoch milliseconds. */
  createdAt: number;
  itemCount?: number;
};

export function WorkoutTemplateLibraryCard({ template: t }: { template: TemplateRow }) {
  const exerciseCount = t.itemCount ?? 0;
  return (
    <li>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <Link
              to="/app/workouts/$id"
              params={{ id: t.id }}
              className="min-h-11 min-w-0 flex-1 touch-manipulation py-0.5"
            >
              <CardTitle className="text-lg hover:underline">{t.name}</CardTitle>
              <CardDescription>
                {exerciseCount} exercise
                {exerciseCount === 1 ? "" : "s"}
                {" · "}
                Created{" "}
                {new Date(t.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </CardDescription>
            </Link>
            <div className="hidden shrink-0 md:block">
              <DeleteTemplateButton templateId={t.id} name={t.name} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 pt-0">
          <WorkoutRoutineCardActions
            templateId={t.id}
            name={t.name}
            mobileExtra={
              <DeleteTemplateButton
                templateId={t.id}
                name={t.name}
                className="min-h-12 w-full justify-center touch-manipulation"
              />
            }
          />
        </CardContent>
      </Card>
    </li>
  );
}
