import {
  createFileRoute,
  Outlet,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { authFetch } from "@/lib/client/auth-fetch";
import { onboardingCacheKey } from "@/lib/client/onboarding-guard";
import { loadTokens } from "@/lib/client/token-storage";
import { useLocalSession } from "@/lib/stores/session";
import { AppShell } from "@/components/app/app-shell";

export const Route = createFileRoute("/app")({
  component: AppLayout,
  beforeLoad: async ({ location }) => {
    if (typeof window === "undefined") return;
    const tokens = await loadTokens();
    if (!tokens) throw redirect({ to: "/login" });
    if (location.pathname.includes("/onboarding")) return;
    if (sessionStorage.getItem(onboardingCacheKey(tokens.userId)) === "1") {
      return;
    }
    let profile: { onboardingCompletedAt: number | null };
    try {
      const res = await authFetch("/api/user/profile");
      if (!res.ok) return;
      profile = (await res.json()) as { onboardingCompletedAt: number | null };
    } catch {
      return;
    }
    if (profile.onboardingCompletedAt == null) {
      throw redirect({ to: "/app/onboarding" });
    }
    sessionStorage.setItem(onboardingCacheKey(tokens.userId), "1");
  },
});

function AppLayout() {
  const navigate = useNavigate();
  const { userId, loading } = useLocalSession();
  useEffect(() => {
    if (!loading && !userId) void navigate({ to: "/login" });
  }, [loading, userId, navigate]);

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
