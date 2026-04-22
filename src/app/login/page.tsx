import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LogIn } from "lucide-react";

import { SanitizeLoginUrl } from "@/components/auth/sanitize-login-url";
import { LoginForm } from "@/components/auth/login-form";
import { BrandMark } from "@/components/app/brand-mark";
import { AuthThemeMenu } from "@/components/theme-appearance";
import { auth } from "@/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const { callbackUrl } = await searchParams;
  if (session?.user) {
    redirect(callbackUrl ?? "/app");
  }

  return (
    <div className="auth-shell relative flex min-h-dvh flex-col justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <Suspense fallback={null}>
        <SanitizeLoginUrl />
      </Suspense>
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
            href="/register"
            className="text-primary min-h-11 inline-flex items-center font-medium underline-offset-4 hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
