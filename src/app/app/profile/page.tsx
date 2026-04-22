import { UserRound } from "lucide-react";
import { desc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { personalAccessTokens } from "@/db/schema";
import { requireUserId } from "@/lib/auth-user";
import { getProfileForUser } from "@/lib/services/profile";
import { UserProfileForm } from "@/components/profile/user-profile-form";

import {
  AdvancedPatSection,
  type PatTokenForList,
} from "./advanced-pat-section";

export default async function ProfilePage() {
  const userId = await requireUserId();

  const [profile, tokens] = await Promise.all([
    getProfileForUser(userId),
    db.query.personalAccessTokens.findMany({
      where: eq(personalAccessTokens.userId, userId),
      orderBy: [desc(personalAccessTokens.createdAt)],
      columns: {
        id: true,
        name: true,
        createdAt: true,
        lastUsedAt: true,
      },
    }),
  ]);

  const tokensForList: PatTokenForList[] = tokens.map((t) => ({
    id: t.id,
    name: t.name,
    createdAt: t.createdAt,
    lastUsedAt: t.lastUsedAt ?? null,
  }));

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

      <UserProfileForm initialProfile={profile} />

      <AdvancedPatSection tokens={tokensForList} />
    </div>
  );
}
