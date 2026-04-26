import { jsx } from "react/jsx-runtime";
import { c as cn } from "./utils-H80jjgLf.mjs";
function AppSubNav({
  className,
  "aria-label": ariaLabel = "Section navigation",
  children
}) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: cn(
        "border-border flex w-full gap-1 rounded-xl border bg-muted/40 p-1",
        className
      ),
      role: "tablist",
      "aria-label": ariaLabel,
      children
    }
  );
}
function appSubNavTriggerClassName(active) {
  return cn(
    "inline-flex min-h-10 flex-1 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors touch-manipulation",
    active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
  );
}
export {
  AppSubNav as A,
  appSubNavTriggerClassName as a
};
