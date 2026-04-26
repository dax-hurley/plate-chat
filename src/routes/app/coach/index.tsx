import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useCallback, useLayoutEffect, useState } from "react";
import { z } from "zod";

import { CoachShell } from "@/components/app/coach-shell";

const searchSchema = z.object({
  prompt: z.string().optional(),
});

function CoachPageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="text-card-foreground -mx-5 -mt-7 flex min-h-0 flex-col md:-mx-12 md:-mt-10">
      {children}
    </div>
  );
}

export const Route = createFileRoute("/app/coach/")({
  validateSearch: searchSchema,
  component: CoachIndex,
});

function CoachIndex() {
  const { prompt: promptFromUrl } = Route.useSearch();
  const navigate = useNavigate();
  const [prepopulatedUserPrompt, setPrepopulatedUserPrompt] = useState<
    string | null
  >(null);
  const clearPrepopulatedUserPrompt = useCallback(
    () => setPrepopulatedUserPrompt(null),
    []
  );

  useLayoutEffect(() => {
    if (!promptFromUrl) return;
    setPrepopulatedUserPrompt(promptFromUrl);
    void navigate({ to: "/app/coach", search: {}, replace: true });
  }, [promptFromUrl, navigate]);

  return (
    <CoachPageLayout>
      <div className="bg-background flex min-h-[min(100dvh,40rem)] flex-1 flex-col md:min-h-[min(100dvh,48rem)]">
        <CoachShell
          prepopulatedUserPrompt={prepopulatedUserPrompt}
          onPrepopulatedUserPromptApplied={clearPrepopulatedUserPrompt}
        />
      </div>
    </CoachPageLayout>
  );
}
