import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";

import {
  AppSubNav,
  appSubNavTriggerClassName,
} from "@/components/app/app-sub-nav";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/workouts")({
  component: WorkoutsLayout,
});

function WorkoutsLayout() {
  const pathname = useLocation({ select: (s) => s.pathname });
  const isCalendar = pathname.startsWith("/app/workouts/calendar");

  return (
    <div>
      <AppSubNav
        className="mx-auto mb-8 max-w-xl sm:max-w-5xl"
        aria-label="Workouts sections"
      >
        <Link
          to="/app/workouts"
          role="tab"
          aria-selected={!isCalendar}
          className={cn(appSubNavTriggerClassName(!isCalendar))}
        >
          Workouts
        </Link>
        <Link
          to="/app/workouts/calendar"
          role="tab"
          aria-selected={isCalendar}
          className={cn(appSubNavTriggerClassName(isCalendar))}
        >
          Calendar
        </Link>
      </AppSubNav>
      <Outlet />
    </div>
  );
}
