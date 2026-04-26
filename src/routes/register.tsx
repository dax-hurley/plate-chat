import { createFileRoute, Link } from "@tanstack/react-router";
import { UserPlus } from "lucide-react";

import { RegisterForm } from "@/components/auth/register-form";
import { BrandMark } from "@/components/app/brand-mark";
import { AuthThemeMenu } from "@/components/theme-appearance";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

function RegisterPage() {
  return (
    <div className="auth-shell relative flex min-h-dvh flex-col justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <AuthThemeMenu />
      <div className="mx-auto w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <BrandMark className="size-14 [&_svg]:size-8 shadow-md shadow-primary/20" />
          </div>
          <h1 className="flex items-center justify-center gap-2 text-2xl font-semibold tracking-tight">
            <UserPlus className="text-primary size-7 shrink-0" aria-hidden />
            Create account
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Track workouts and nutrition in one place
          </p>
        </div>
        <RegisterForm />
        <p className="text-muted-foreground text-center text-sm">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-primary min-h-11 inline-flex items-center font-medium underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
