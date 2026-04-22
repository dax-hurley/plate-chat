"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, User, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerUser } from "@/app/register/actions";

export function RegisterForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim().toLowerCase();
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
      const result = await registerUser({ name, email, password });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Account created. You can sign in now.");
      router.push("/login");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      method="post"
      action="#"
      onSubmit={onSubmit}
      className="space-y-8"
    >
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
