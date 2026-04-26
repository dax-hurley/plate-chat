import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Lock, Mail, User, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_BRAND_NAME } from "@/lib/brand";
import { authClient } from "@/lib/client/auth-client";
import { bootstrapDeviceSession } from "@/lib/client/bootstrap-session";

export function RegisterForm() {
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "")
      .trim()
      .toLowerCase();
    const password = String(form.get("password") ?? "");
    if (!email || !password) {
      toast.error("Email and password are required.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setPending(true);
    try {
      const res = await authClient.signUp.email({ email, password, name });
      if (!res.data?.user?.id) {
        toast.error(res.error?.message ?? "Could not create account.");
        return;
      }
      await bootstrapDeviceSession({
        userId: res.data.user.id,
        email: res.data.user.email ?? email,
        name: res.data.user.name ?? name ?? null,
      });
      toast.success(`Welcome to ${APP_BRAND_NAME}!`);
      await navigate({ to: "/app" });
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form method="post" action="#" onSubmit={onSubmit} className="space-y-8">
      <div className="space-y-2">
        <Label htmlFor="name" className="flex items-center gap-2">
          <User className="text-primary size-4" aria-hidden />
          Name (optional)
        </Label>
        <Input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          className="min-h-12 text-base"
        />
      </div>
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
          autoComplete="new-password"
          required
          minLength={8}
          className="min-h-12 text-base"
        />
      </div>
      <Button
        type="submit"
        className="min-h-12 w-full gap-2 text-base shadow-sm"
        disabled={pending}
      >
        <UserPlus className="size-4 opacity-90" aria-hidden />
        {pending ? "Creating…" : "Create account"}
      </Button>
    </form>
  );
}
