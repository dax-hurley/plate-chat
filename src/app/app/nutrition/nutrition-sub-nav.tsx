"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  AppSubNav,
  appSubNavTriggerClassName,
} from "@/components/app/app-sub-nav";
import { cn } from "@/lib/utils";

export function NutritionSubNav() {
  const pathname = usePathname();
  const isLibrary = pathname.startsWith("/app/nutrition/library");
  const isPlan = pathname.startsWith("/app/nutrition/plan");
  const isDaily = !isLibrary && !isPlan;

  return (
    <AppSubNav
      className="mx-auto mb-8 w-full max-w-xl md:max-w-7xl"
      aria-label="Nutrition sections"
    >
      <Link
        href="/app/nutrition"
        role="tab"
        aria-selected={isDaily}
        className={cn(appSubNavTriggerClassName(isDaily))}
      >
        Daily log
      </Link>
      <Link
        href="/app/nutrition/library"
        role="tab"
        aria-selected={isLibrary}
        className={cn(appSubNavTriggerClassName(isLibrary))}
      >
        Meal library
      </Link>
      <Link
        href="/app/nutrition/plan"
        role="tab"
        aria-selected={isPlan}
        className={cn(appSubNavTriggerClassName(isPlan))}
      >
        Meal plan
      </Link>
    </AppSubNav>
  );
}
