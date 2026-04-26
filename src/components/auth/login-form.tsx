import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Lock, LogIn, Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/client/auth-client";
import { bootstrapDeviceSession } from "@/lib/client/bootstrap-session";

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    if (!email || !password) {
      toast.error("Enter your email and password.");
      return;
    }
    setPending(true);
    try {
      const res = await authClient.signIn.email({ email, password });
      if (!res.data?.user?.id) {
        toast.error(res.error?.message ?? "Invalid email or password.");
        return;
      }
      await bootstrapDeviceSession({
        userId: res.data.user.id,
        email: res.data.user.email ?? email,
        name: res.data.user.name ?? null,
      });
      await navigate({ to: callbackUrl ?? "/app" });
    } catch {
      toast.error(
        "Could not reach the server. Check your connection and try again."
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form method="post" action="#" onSubmit={onSubmit} className="space-y-8">
      <div className="space-y-2">
        <Label htmlFor="email" className="flex items-center gap-2">
          <Mail className="text-primary size-4" aria-hidden />
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="min-h-12 text-base"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="flex items-center gap-2">
          <Lock className="text-primary size-4" aria-hidden />
          Password
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="min-h-12 text-base"
        />
      </div>
      <Button
        type="submit"
        className="min-h-12 w-full gap-2 text-base shadow-sm"
        disabled={pending}
      >
        <LogIn className="size-4 opacity-90" aria-hidden />
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
