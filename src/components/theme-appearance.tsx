"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

function subscribeToNothing() {
  return () => {};
}

function useIsClient() {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false
  );
}

const themeItems = [
  { value: "light" as const, label: "Light", icon: Sun },
  { value: "dark" as const, label: "Dark", icon: Moon },
  { value: "system" as const, label: "System", icon: Monitor },
];

function ThemeRadioItems() {
  const { theme, setTheme } = useTheme();
  const value = theme ?? "system";

  return (
    <DropdownMenuRadioGroup value={value} onValueChange={setTheme}>
      {themeItems.map(({ value: v, label, icon: Icon }) => (
        <DropdownMenuRadioItem key={v} value={v}>
          <Icon className="size-4 opacity-70" aria-hidden />
          {label}
        </DropdownMenuRadioItem>
      ))}
    </DropdownMenuRadioGroup>
  );
}

function ThemeMenuDropdown({
  triggerClassName,
}: {
  triggerClassName?: string;
}) {
  const mounted = useIsClient();
  const { resolvedTheme } = useTheme();
  const ActiveIcon =
    resolvedTheme === "dark"
      ? Moon
      : resolvedTheme === "light"
        ? Sun
        : Monitor;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={!mounted}
        className={cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          "size-10 shrink-0 rounded-full border-primary/25",
          triggerClassName
        )}
        aria-label="Color theme"
      >
        <ActiveIcon className="size-4" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[10rem]">
        {mounted ? (
          <ThemeRadioItems />
        ) : (
          <p className="text-muted-foreground px-2 py-1.5 text-xs">Loading…</p>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** App shell top bar — sits next to the profile menu. */
export function AppHeaderThemeMenu({ className }: { className?: string }) {
  return (
    <div className={cn("shrink-0", className)}>
      <ThemeMenuDropdown />
    </div>
  );
}

/** Auth pages — fixed corner control. */
export function AuthThemeMenu({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 pt-[max(0rem,env(safe-area-inset-top))] pr-[max(0rem,env(safe-area-inset-right))]",
        className
      )}
    >
      <ThemeMenuDropdown triggerClassName="bg-background/80 shadow-sm backdrop-blur-sm" />
    </div>
  );
}
