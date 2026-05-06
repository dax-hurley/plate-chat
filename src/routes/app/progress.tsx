import { createFileRoute } from "@tanstack/react-router";

import {
  ProgressScreen,
  defaultProgressRange,
} from "@/components/progress/progress-screen";
import { useSyncScope } from "@/lib/client/db/sync-scope";
import { PROGRESS_SYNC_SCOPE } from "@/lib/client/db/sync-scopes";
import { useProfile } from "@/lib/stores";

export const Route = createFileRoute("/app/progress")({
  component: ProgressPage,
});

function ProgressPage() {
  useSyncScope(PROGRESS_SYNC_SCOPE);
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
