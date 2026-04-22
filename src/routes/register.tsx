import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/client/auth-client";
import { bootstrapDeviceSession } from "@/lib/client/bootstrap-session";
import { useOnline } from "@/lib/client/use-online";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const online = useOnline();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await authClient.signUp.email({
        email,
        password,
        name,
      });
      if (!res.data?.user?.id) {
        setError(res.error?.message ?? "Sign-up failed");
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
          <h1 className="text-2xl font-semibold">Create account</h1>
          <p className="text-sm text-muted-foreground">
            You&apos;ll stay signed in on this device — no network needed after
            the first login.
          </p>
        </div>
        {!online ? (
          <div className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-200">
            You&apos;re offline. Reconnect to register.
          </div>
        ) : null}
        <label className="block">
          <span className="text-sm">Name</span>
          <input
            className="mt-1 block w-full rounded-md border bg-background px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        </label>
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
            autoComplete="new-password"
            minLength={8}
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
          {loading ? "Creating…" : "Create account"}
        </button>
        <p className="text-sm text-center text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
