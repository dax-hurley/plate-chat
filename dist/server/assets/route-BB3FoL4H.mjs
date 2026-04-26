import { jsxs, jsx } from "react/jsx-runtime";
import { useLocation, Link, Outlet } from "@tanstack/react-router";
import { A as AppSubNav, a as appSubNavTriggerClassName } from "./app-sub-nav--2r0057W.mjs";
import { c as cn } from "./utils-H80jjgLf.mjs";
import "clsx";
import "tailwind-merge";
function NutritionLayout() {
  const pathname = useLocation({
    select: (s) => s.pathname
  });
  const isLibrary = pathname.startsWith("/app/nutrition/library");
  const isPlan = pathname.startsWith("/app/nutrition/plan");
  const isDaily = !isLibrary && !isPlan;
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs(AppSubNav, { className: "mx-auto mb-8 w-full max-w-xl md:max-w-7xl", "aria-label": "Nutrition sections", children: [
      /* @__PURE__ */ jsx(Link, { to: "/app/nutrition", role: "tab", "aria-selected": isDaily, className: cn(appSubNavTriggerClassName(isDaily)), children: "Daily log" }),
      /* @__PURE__ */ jsx(Link, { to: "/app/nutrition/library", role: "tab", "aria-selected": isLibrary, className: cn(appSubNavTriggerClassName(isLibrary)), children: "Recipe library" }),
      /* @__PURE__ */ jsx(Link, { to: "/app/nutrition/plan", role: "tab", "aria-selected": isPlan, className: cn(appSubNavTriggerClassName(isPlan)), children: "Meal plan" })
    ] }),
    /* @__PURE__ */ jsx(Outlet, {})
  ] });
}
export {
  NutritionLayout as component
};
