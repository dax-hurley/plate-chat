import { createFileRoute, redirect } from "@tanstack/react-router";
import { loadTokens } from "@/lib/client/token-storage";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { useLocalSession } from "@/lib/stores/session";

export const Route = createFileRoute("/app/onboarding")({
  component: OnboardingPage,
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const tokens = await loadTokens();
    if (!tokens) throw redirect({ to: "/login" });
  },
});

function OnboardingPage() {
  const { userId, loading } = useLocalSession();
  if (loading) {
    return (
      <div className="text-muted-foreground flex h-full min-h-0 w-full min-w-0 flex-1 items-center justify-center p-6 text-sm md:bg-muted/40">
        Loading…
      </div>
    );
  }
  if (!userId) return null;
  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-x-hidden bg-background md:bg-muted/40 md:px-6 md:py-6 lg:px-10">
      <OnboardingFlow userId={userId} />
    </div>
  );
}
