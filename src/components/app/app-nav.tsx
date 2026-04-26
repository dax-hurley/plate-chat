import { Link, useLocation } from "@tanstack/react-router";
import {
  Activity,
  Dumbbell,
  Home,
  Sparkles,
  UserRound,
  UtensilsCrossed,
} from "lucide-react";

import { BrandMark } from "@/components/app/brand-mark";
import { APP_BRAND_NAME } from "@/lib/brand";
import { useCoachRuntime } from "@/components/app/coach-runtime";
import { cn } from "@/lib/utils";

const mainLinks = [
  { href: "/app", label: "Home", icon: Home },
  { href: "/app/workouts", label: "Workouts", icon: Dumbbell },
  { href: "/app/nutrition", label: "Nutrition", icon: UtensilsCrossed },
  { href: "/app/progress", label: "Progress", icon: Activity },
  { href: "/app/coach", label: "AI Coach", icon: Sparkles },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/app") return pathname === "/app";
  return pathname.startsWith(href);
}

type CoachNavGlyphVariant = "sidebar" | "sidebarActive" | "tabActive" | "tabIdle";

function CoachNavWorkingDots({ dotClassName }: { dotClassName: string }) {
  return (
    <span className="flex items-center justify-center gap-[1.5px]" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn("coach-nav-dot size-[2.5px] shrink-0 rounded-full", dotClassName)}
          style={{ animationDelay: `${i * 140}ms` }}
        />
      ))}
    </span>
  );
}

function CoachNavGlyph({
  coachAgentWorking,
  coachHasUnreadFromAssistant,
  sparklesClassName,
  variant,
}: {
  coachAgentWorking: boolean;
  coachHasUnreadFromAssistant: boolean;
  sparklesClassName: string;
  variant: CoachNavGlyphVariant;
}) {
  /** Coach row / tab is selected (open): solid white badge, green (primary) dots. */
  const coachHighlighted =
    variant === "sidebarActive" || variant === "tabActive";
  const workingBadgeClass = coachHighlighted
    ? "bg-white ring-2 ring-primary shadow-sm dark:bg-white dark:ring-primary dark:shadow-sm"
    : "bg-primary ring-2 ring-white shadow-sm dark:bg-primary dark:ring-white dark:shadow-sm";
  const workingDotClass = coachHighlighted
    ? "bg-primary dark:bg-primary"
    : "bg-white dark:bg-white";
  const unreadRing =
    variant === "sidebar" || variant === "sidebarActive"
      ? variant === "sidebarActive"
        ? "ring-white dark:ring-zinc-100"
        : "ring-background"
      : variant === "tabActive"
        ? "ring-white dark:ring-zinc-100"
        : "ring-background";

  return (
    <span className="relative inline-flex shrink-0 items-center justify-center">
      <Sparkles className={sparklesClassName} aria-hidden />
      {coachAgentWorking ? (
        <span
          className={cn(
            "absolute -top-0.5 -right-0.5 flex size-[0.9375rem] items-center justify-center rounded-full md:size-4",
            workingBadgeClass
          )}
          aria-hidden
        >
          <CoachNavWorkingDots dotClassName={workingDotClass} />
        </span>
      ) : coachHasUnreadFromAssistant ? (
        <span
          className={cn(
            "absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-destructive ring-2",
            unreadRing
          )}
          aria-hidden
        />
      ) : null}
    </span>
  );
}

export function AppNav() {
  const pathname = useLocation({ select: (s) => s.pathname });
  const {
    openCoach,
    closeCoach,
    isCoachOpen,
    coachAgentWorking,
    coachHasUnreadFromAssistant,
  } = useCoachRuntime();

  function onNavLinkClick() {
    if (isCoachOpen) closeCoach();
  }

  return (
    <>
      {/* Desktop: fixed sidebar */}
      <aside
        className="bg-sidebar/98 supports-[backdrop-filter]:bg-sidebar/90 border-sidebar-border fixed left-0 top-0 z-50 hidden h-dvh w-60 flex-col border-r pt-[max(0.75rem,env(safe-area-inset-top))] shadow-[2px_0_24px_-12px_oklch(0.12_0.02_260_/_0.45)] backdrop-blur-md md:flex"
        aria-label="Main navigation"
      >
        <div className="border-sidebar-border border-b px-5 py-6">
          <Link
            to="/app"
            onClick={onNavLinkClick}
            className="hover:bg-sidebar-accent/80 flex items-center gap-3.5 rounded-xl p-1.5 transition-colors"
          >
            <BrandMark />
            <span className="text-sidebar-foreground text-lg font-semibold tracking-tight">
              {APP_BRAND_NAME}
            </span>
          </Link>
        </div>
        <nav className="flex flex-1 flex-col gap-2 p-4">
          {mainLinks.map(({ href, label, icon: Icon }) => {
            if (href === "/app/coach") {
              const active = isCoachOpen;
              return (
                <button
                  key={href}
                  type="button"
                  aria-label="Open AI Coach"
                  aria-busy={coachAgentWorking}
                  onClick={() => (isCoachOpen ? closeCoach() : openCoach())}
                  className={cn(
                    "text-sidebar-foreground/75 flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-medium transition-colors",
                    active &&
                      "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  )}
                >
                  <CoachNavGlyph
                    coachAgentWorking={coachAgentWorking}
                    coachHasUnreadFromAssistant={coachHasUnreadFromAssistant}
                    sparklesClassName="size-5 shrink-0"
                    variant={active ? "sidebarActive" : "sidebar"}
                  />
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    {label}
                  </span>
                </button>
              );
            }
            const active = !isCoachOpen && isActive(pathname, href);
            return (
              <Link
                key={href}
                to={href}
                onClick={onNavLinkClick}
                className={cn(
                  "text-sidebar-foreground/75 flex min-h-12 items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-colors",
                  active &&
                    "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                )}
              >
                <Icon className="size-5 shrink-0" aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-sidebar-border border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Link
            to="/app/profile"
            onClick={onNavLinkClick}
            className={cn(
              "text-sidebar-foreground/75 flex min-h-12 items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-colors",
              !isCoachOpen &&
                pathname.startsWith("/app/profile") &&
                "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
            )}
          >
            <UserRound className="size-5 shrink-0" aria-hidden />
            Profile
          </Link>
        </div>
      </aside>

      {/* Mobile: bottom bar */}
      <nav
        className="bg-sidebar/95 supports-[backdrop-filter]:bg-sidebar/90 border-sidebar-border fixed bottom-0 left-0 right-0 z-50 border-t pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-4px_24px_-12px_oklch(0.12_0.02_260_/_0.4)] backdrop-blur-md md:hidden"
        aria-label="Main"
      >
        <div className="mx-auto flex max-w-xl items-stretch justify-around gap-2 px-4">
          {mainLinks.map(({ href, label, icon: Icon }) => {
            if (href === "/app/coach") {
              const active = isCoachOpen;
              return (
                <button
                  key={href}
                  type="button"
                  aria-label="Open AI Coach"
                  aria-busy={coachAgentWorking}
                  onClick={() => (isCoachOpen ? closeCoach() : openCoach())}
                  className={cn(
                    "text-muted-foreground flex min-h-[3.25rem] min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-2 text-[0.65rem] leading-tight font-medium transition-colors sm:text-xs",
                    active &&
                      "bg-primary text-primary-foreground shadow-inner"
                  )}
                >
                  <CoachNavGlyph
                    coachAgentWorking={coachAgentWorking}
                    coachHasUnreadFromAssistant={coachHasUnreadFromAssistant}
                    sparklesClassName="size-6 shrink-0"
                    variant={active ? "tabActive" : "tabIdle"}
                  />
                  {label}
                </button>
              );
            }
            const active = !isCoachOpen && isActive(pathname, href);
            return (
              <Link
                key={href}
                to={href}
                onClick={onNavLinkClick}
                className={cn(
                  "text-muted-foreground flex min-h-[3.25rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-2 text-[0.65rem] leading-tight font-medium transition-colors sm:text-xs",
                  active &&
                    "bg-primary text-primary-foreground shadow-inner"
                )}
              >
                <Icon className="size-6 shrink-0" aria-hidden />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
