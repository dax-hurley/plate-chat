import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";

export const Route = createFileRoute("/app/workouts")({
  component: WorkoutsLayout,
});

const tabs = [
  { to: "/app/workouts", label: "Routines" },
  { to: "/app/workouts/calendar", label: "Calendar" },
];

function WorkoutsLayout() {
  const location = useLocation();
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b">
        {tabs.map((t) => {
          const active =
            t.to === "/app/workouts"
              ? location.pathname === "/app/workouts" ||
                location.pathname.startsWith("/app/workouts/new") ||
                /^\/app\/workouts\/[^/]+$/.test(location.pathname)
              : location.pathname === t.to;
          return (
            <Link
              key={t.to}
              to={t.to}
              className={
                "px-3 py-2 text-sm border-b-2 -mb-px " +
                (active
                  ? "border-primary text-primary font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground")
              }
            >
              {t.label}
            </Link>
          );
        })}
      </div>
      <Outlet />
    </div>
  );
}
