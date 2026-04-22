import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";

export const Route = createFileRoute("/app/nutrition")({
  component: NutritionLayout,
});

const tabs = [
  { to: "/app/nutrition", label: "Log" },
  { to: "/app/nutrition/library", label: "Library" },
  { to: "/app/nutrition/plan", label: "Plan" },
];

function NutritionLayout() {
  const location = useLocation();
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b">
        {tabs.map((t) => {
          const active =
            t.to === "/app/nutrition"
              ? location.pathname === "/app/nutrition"
              : location.pathname.startsWith(t.to);
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
