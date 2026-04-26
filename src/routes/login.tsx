import { createFileRoute, Link } from "@tanstack/react-router";
import { LogIn } from "lucide-react";
import { z } from "zod";

import { SanitizeLoginUrl } from "@/components/auth/sanitize-login-url";
import { LoginForm } from "@/components/auth/login-form";
import { BrandMark } from "@/components/app/brand-mark";
import { AuthThemeMenu } from "@/components/theme-appearance";

const searchSchema = z.object({
  callbackUrl: z.string().optional(),
});

export const Route = createFileRoute("/login")({
  validateSearch: searchSchema,
  component: LoginPage,
});

function LoginPage() {
  const { callbackUrl } = Route.useSearch();

  return (
    <div className="auth-shell relative flex min-h-dvh flex-col justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <SanitizeLoginUrl />
      <AuthThemeMenu />
      <div className="mx-auto w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <BrandMark className="size-14 [&_svg]:size-8 shadow-md shadow-primary/20" />
          </div>
          <h1 className="flex items-center justify-center gap-2 text-2xl font-semibold tracking-tight">
            <LogIn className="text-primary size-7 shrink-0" aria-hidden />
            Welcome back
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Sign in to continue your training log
          </p>
        </div>
        <LoginForm callbackUrl={callbackUrl} />
        <p className="text-muted-foreground text-center text-sm">
          No account?{" "}
          <Link
            to="/register"
            className="text-primary min-h-11 inline-flex items-center font-medium underline-offset-4 hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
