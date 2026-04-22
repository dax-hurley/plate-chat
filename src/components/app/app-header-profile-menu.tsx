"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, User, UserRound } from "lucide-react";

import { signOutAction } from "@/app/app/actions";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

function profileInitial(name: string | undefined, email: string | undefined) {
  const raw = name?.trim() || email?.trim();
  if (!raw) return "?";
  const c = raw[0];
  return c ? c.toUpperCase() : "?";
}

type AppHeaderProfileMenuProps = {
  email?: string | null;
  name?: string | null;
};

export function AppHeaderProfileMenu({
  email,
  name,
}: AppHeaderProfileMenuProps) {
  const router = useRouter();
  const [isSigningOut, startSignOut] = useTransition();
  const initial = profileInitial(name ?? undefined, email ?? undefined);
  const displayName = name?.trim() || null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "h-10 gap-2 rounded-full border-primary/25 pr-2.5 pl-1.5 aria-expanded:bg-muted"
        )}
        aria-label="Account menu"
      >
        <span className="bg-primary/15 text-primary flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
          {initial}
        </span>
        <ChevronDown className="size-4 opacity-60" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[14rem] w-[min(100vw-2rem,16rem)]">
        <div className="px-2 py-2">
          {displayName ? (
            <p className="truncate text-sm font-medium leading-tight">
              {displayName}
            </p>
          ) : null}
          {email ? (
            <p
              className={cn(
                "truncate text-muted-foreground text-xs leading-snug",
                displayName ? "mt-1" : ""
              )}
            >
              {email}
            </p>
          ) : (
            <p className="text-muted-foreground flex items-center gap-2 text-xs">
              <User className="size-3.5 shrink-0 opacity-70" aria-hidden />
              Signed in
            </p>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            router.push("/app/profile");
          }}
        >
          <UserRound className="size-4" aria-hidden />
          Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={isSigningOut}
          onClick={() => {
            startSignOut(() => {
              void signOutAction();
            });
          }}
        >
          <LogOut className="size-4" aria-hidden />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
