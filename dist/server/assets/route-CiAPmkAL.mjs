import { jsxs, jsx } from "react/jsx-runtime";
import { useLocation, Link, Outlet } from "@tanstack/react-router";
const tabs = [{
  to: "/app/workouts",
  label: "Routines"
}, {
  to: "/app/workouts/calendar",
  label: "Calendar"
}];
function WorkoutsLayout() {
  const location = useLocation();
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 border-b", children: tabs.map((t) => {
      const active = t.to === "/app/workouts" ? location.pathname === "/app/workouts" || location.pathname.startsWith("/app/workouts/new") || /^\/app\/workouts\/[^/]+$/.test(location.pathname) : location.pathname === t.to;
      return /* @__PURE__ */ jsx(Link, { to: t.to, className: "px-3 py-2 text-sm border-b-2 -mb-px " + (active ? "border-primary text-primary font-medium" : "border-transparent text-muted-foreground hover:text-foreground"), children: t.label }, t.to);
    }) }),
    /* @__PURE__ */ jsx(Outlet, {})
  ] });
}
export {
  WorkoutsLayout as component
};
