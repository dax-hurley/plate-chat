"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  AppSubNav,
  appSubNavTriggerClassName,
} from "@/components/app/app-sub-nav";
import { cn } from "@/lib/utils";

export function WorkoutsSubNav() {
  const pathname = usePathname();
  const isCalendar = pathname.startsWith("/app/workouts/calendar");

  return (
    <AppSubNav
      className="mx-auto mb-8 max-w-xl sm:max-w-5xl"
      aria-label="Workouts sections"
    >
      <Link
        href="/app/workouts"
        role="tab"
        aria-selected={!isCalendar}
        className={cn(appSubNavTriggerClassName(!isCalendar))}
      >
        Workouts
      </Link>
      <Link
        href="/app/workouts/calendar"
        role="tab"
        aria-selected={isCalendar}
        className={cn(appSubNavTriggerClassName(isCalendar))}
      >
        Calendar
      </Link>
    </AppSubNav>
  );
}
