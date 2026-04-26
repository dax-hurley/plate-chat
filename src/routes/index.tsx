import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { loadTokens } from "@/lib/client/token-storage";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  useEffect(() => {
    void (async () => {
      const t = await loadTokens();
      if (t?.userId) {
        await navigate({ to: "/app", replace: true });
      } else {
        await navigate({ to: "/login", replace: true });
      }
    })();
  }, [navigate]);
  return null;
}
