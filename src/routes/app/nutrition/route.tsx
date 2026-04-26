import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";

import {
  AppSubNav,
  appSubNavTriggerClassName,
} from "@/components/app/app-sub-nav";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/nutrition")({
  component: NutritionLayout,
});

function NutritionLayout() {
  const pathname = useLocation({ select: (s) => s.pathname });
  const isLibrary = pathname.startsWith("/app/nutrition/library");
  const isPlan = pathname.startsWith("/app/nutrition/plan");
  const isDaily = !isLibrary && !isPlan;

  return (
    <div>
      <AppSubNav
        className="mx-auto mb-8 w-full max-w-xl md:max-w-7xl"
        aria-label="Nutrition sections"
      >
        <Link
          to="/app/nutrition"
          role="tab"
          aria-selected={isDaily}
          className={cn(appSubNavTriggerClassName(isDaily))}
        >
          Daily log
        </Link>
        <Link
          to="/app/nutrition/library"
          role="tab"
          aria-selected={isLibrary}
          className={cn(appSubNavTriggerClassName(isLibrary))}
        >
          Recipe library
        </Link>
        <Link
          to="/app/nutrition/plan"
          role="tab"
          aria-selected={isPlan}
          className={cn(appSubNavTriggerClassName(isPlan))}
        >
          Meal plan
        </Link>
      </AppSubNav>
      <Outlet />
    </div>
  );
}
