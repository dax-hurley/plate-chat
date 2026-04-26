import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { Sparkles, UserRound } from "lucide-react";

import { UserProfileForm } from "@/components/profile/user-profile-form";
import { buttonVariants } from "@/components/ui/button";
import { pullSyncCollections } from "@/lib/client/db/sync";
import { useOnline } from "@/lib/client/use-online";
import { useProfile } from "@/lib/stores";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const online = useOnline();
  const { data: profile } = useProfile();

  useEffect(() => {
    if (!online) return;
    void pullSyncCollections(["userProfiles"]);
  }, [online]);

  return (
    <div className="mx-auto w-full max-w-xl space-y-8 lg:max-w-5xl">
      <div>
        <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight">
          <span className="bg-primary/15 text-primary ring-primary/15 inline-flex size-10 items-center justify-center rounded-2xl ring-1">
            <UserRound className="size-5" strokeWidth={2.25} aria-hidden />
          </span>
          Profile
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Personal info, fitness goals, and preferences.
        </p>
      </div>

      <div className="bg-muted/30 border-border flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium">Setup walkthrough</p>
          <p className="text-muted-foreground text-sm">
            Re-run the guided meal plan and workout intro any time.
          </p>
        </div>
        <Link
          to="/app/onboarding"
          className={cn(
            buttonVariants({ variant: "secondary" }),
            "inline-flex min-h-12 shrink-0 touch-manipulation items-center justify-center gap-2"
          )}
        >
          <Sparkles className="size-4" />
          Open onboarding
        </Link>
      </div>

      <UserProfileForm initialProfile={profile} />
    </div>
  );
}
