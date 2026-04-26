import { createFileRoute } from "@tanstack/react-router";

import {
  ProgressScreen,
  defaultProgressRange,
} from "@/components/progress/progress-screen";
import { useProfile } from "@/lib/stores";

export const Route = createFileRoute("/app/progress")({
  component: ProgressPage,
});

function ProgressPage() {
  const { data: profile } = useProfile();
  const { from, to } = defaultProgressRange();
  return (
    <ProgressScreen
      defaultFrom={from}
      defaultTo={to}
      loseWeightQuickLog={profile?.goalPreset === "lose_weight"}
    />
  );
}
