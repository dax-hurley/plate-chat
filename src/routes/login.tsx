import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/client/auth-client";
import { bootstrapDeviceSession } from "@/lib/client/bootstrap-session";
import { useOnline } from "@/lib/client/use-online";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const online = useOnline();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await authClient.signIn.email({ email, password });
      if (!res.data?.user?.id) {
        setError(res.error?.message ?? "Sign-in failed");
        return;
      }
      await bootstrapDeviceSession({ userId: res.data.user.id });
      await navigate({ to: "/app" });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell min-h-dvh flex items-center justify-center p-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 bg-card border rounded-2xl p-6 shadow-sm"
      >
        <div>
          <h1 className="text-2xl font-semibold">Sign in</h1>
          <p className="text-sm text-muted-foreground">
            A connection is required for first sign-in. After that the app
            works offline.
          </p>
        </div>
        {!online ? (
          <div className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-200">
            You&apos;re offline. Reconnect to sign in.
          </div>
        ) : null}
        <label className="block">
          <span className="text-sm">Email</span>
          <input
            className="mt-1 block w-full rounded-md border bg-background px-3 py-2"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label className="block">
          <span className="text-sm">Password</span>
          <input
            className="mt-1 block w-full rounded-md border bg-background px-3 py-2"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading || !online}
          className="w-full rounded-md bg-primary text-primary-foreground py-2 font-medium disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
        <p className="text-sm text-center text-muted-foreground">
          No account?{" "}
          <Link to="/register" className="text-primary hover:underline">
            Create one
          </Link>
        </p>
      </form>
    </div>
  );
}
