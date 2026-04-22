import {
  createFileRoute,
  Outlet,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { loadTokens } from "@/lib/client/token-storage";
import { useLocalSession } from "@/lib/stores/session";
import { AppShell } from "@/components/app/app-shell";

export const Route = createFileRoute("/app")({
  component: AppLayout,
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const tokens = await loadTokens();
    if (!tokens) throw redirect({ to: "/login" });
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
