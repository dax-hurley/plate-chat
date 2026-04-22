"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { MealPlanLibraryOption } from "@/types/meal-plan";

type LibraryMealPickerProps = {
  options: MealPlanLibraryOption[];
  value: string | null;
  onSelect: (libraryItemId: string | null) => void;
  disabled?: boolean;
  /** Accessible label for the trigger (e.g. slot name). */
  label: string;
};

export function LibraryMealPicker({
  options,
  value,
  onSelect,
  disabled,
  label,
}: LibraryMealPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [panelPos, setPanelPos] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  const selectedName = useMemo(() => {
    if (!value) return null;
    return options.find((o) => o.id === value)?.name ?? null;
  }, [options, value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = !q
      ? options
      : options.filter((o) => o.name.toLowerCase().includes(q));
    return [...list].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    );
  }, [options, query]);

  const updatePanelPosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPanelPos({
      top: r.bottom + 4,
      left: r.left,
      width: Math.max(r.width, 280),
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePanelPosition();
  }, [open, updatePanelPosition]);

  useEffect(() => {
    if (!open) return;
    const onWin = () => updatePanelPosition();
    window.addEventListener("resize", onWin);
    return () => window.removeEventListener("resize", onWin);
  }, [open, updatePanelPosition]);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => setOpen(false);
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent | PointerEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery("");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const pick = useCallback(
    (id: string | null) => {
      onSelect(id);
      setOpen(false);
    },
    [onSelect]
  );

  const panel =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={panelRef}
            className="border-border bg-popover text-popover-foreground fixed z-[200] flex max-h-[min(18rem,calc(100vh-2rem))] flex-col overflow-hidden rounded-lg border p-0 shadow-md ring-1 ring-foreground/10"
            style={{
              top: panelPos.top,
              left: panelPos.left,
              width: panelPos.width,
            }}
            role="listbox"
            aria-label={`Search meals for ${label}`}
          >
            <div className="border-border shrink-0 border-b p-2">
              <Input
                ref={inputRef}
                type="search"
                autoComplete="off"
                placeholder="Search meals…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-9"
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.stopPropagation();
                    setOpen(false);
                  }
                }}
              />
            </div>
            <ScrollArea className="max-h-[min(14rem,calc(100vh-6rem))]">
              <ul className="p-1">
                <li>
                  <button
                    type="button"
                    role="option"
                    aria-selected={value == null}
                    className={cn(
                      "hover:bg-muted focus:bg-muted flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm outline-none",
                      value == null && "bg-muted/80"
                    )}
                    onClick={() => pick(null)}
                  >
                    <span className="text-muted-foreground shrink-0 italic">
                      None
                    </span>
                    {value == null ? (
                      <Check className="text-primary ml-auto size-4 shrink-0" />
                    ) : (
                      <span className="ml-auto size-4 shrink-0" />
                    )}
                  </button>
                </li>
                {filtered.length === 0 ? (
                  <li className="text-muted-foreground px-2 py-6 text-center text-sm">
                    No meals match your search.
                  </li>
                ) : (
                  filtered.map((o) => {
                    const selected = o.id === value;
                    return (
                      <li key={o.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={selected}
                          className={cn(
                            "hover:bg-muted focus:bg-muted flex w-full min-w-0 items-center gap-2 rounded-md px-2 py-2 text-left text-sm outline-none",
                            selected && "bg-muted/80"
                          )}
                          onClick={() => pick(o.id)}
                        >
                          <span className="min-w-0 flex-1 truncate">
                            {o.name}
                          </span>
                          {selected ? (
                            <Check className="text-primary size-4 shrink-0" />
                          ) : null}
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
            </ScrollArea>
          </div>,
          document.body
        )
      : null;

  return (
    <div ref={triggerRef} className="relative w-full min-w-0">
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        className={cn(
          "border-input bg-background h-11 w-full min-w-0 justify-between px-3 font-normal shadow-xs",
          !selectedName && "text-muted-foreground"
        )}
        onClick={() => {
          if (disabled) return;
          setOpen((v) => !v);
        }}
      >
        <span className="min-w-0 flex-1 truncate text-left text-sm">
          {options.length === 0
            ? "Add meals in the library first"
            : selectedName ?? "Choose a meal…"}
        </span>
        <ChevronDown
          className={cn(
            "text-muted-foreground size-4 shrink-0 opacity-70 transition-transform",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </Button>
      {panel}
    </div>
  );
}
