import { jsxs, jsx } from "react/jsx-runtime";
import { useLocation, Link, Outlet } from "@tanstack/react-router";
import { A as AppSubNav, a as appSubNavTriggerClassName } from "./app-sub-nav--2r0057W.mjs";
import { c as cn } from "./utils-H80jjgLf.mjs";
import "clsx";
import "tailwind-merge";
function WorkoutsLayout() {
  const pathname = useLocation({
    select: (s) => s.pathname
  });
  const isCalendar = pathname.startsWith("/app/workouts/calendar");
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs(AppSubNav, { className: "mx-auto mb-8 max-w-xl sm:max-w-5xl", "aria-label": "Workouts sections", children: [
      /* @__PURE__ */ jsx(Link, { to: "/app/workouts", role: "tab", "aria-selected": !isCalendar, className: cn(appSubNavTriggerClassName(!isCalendar)), children: "Workouts" }),
      /* @__PURE__ */ jsx(Link, { to: "/app/workouts/calendar", role: "tab", "aria-selected": isCalendar, className: cn(appSubNavTriggerClassName(isCalendar)), children: "Calendar" })
    ] }),
    /* @__PURE__ */ jsx(Outlet, {})
  ] });
}
export {
  WorkoutsLayout as component
};
