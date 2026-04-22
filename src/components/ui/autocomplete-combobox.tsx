"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type ComboboxOption = {
  value: string;
  label: string;
  group?: string;
  description?: string;
};

const NONE = "__combobox_none__";

/** Max list height; keep in sync with previous `max-h-72` (18rem). */
const PANEL_MAX_PX = 288;
const VIEWPORT_GUTTER = 8;
const PANEL_GAP = 4;

type AutocompleteComboboxProps = {
  id?: string;
  options: ComboboxOption[];
  value: string | null;
  onValueChange: (v: string | null) => void;
  allowNone?: boolean;
  clearAfterSelect?: boolean;
  placeholder?: string;
  emptyText?: string;
  disabled?: boolean;
  "aria-label"?: string;
  className?: string;
  inputClassName?: string;
  noneLabel?: string;
};

export function AutocompleteCombobox({
  id: idProp,
  options,
  value,
  onValueChange,
  allowNone = false,
  clearAfterSelect = false,
  placeholder = "Search…",
  emptyText = "No results.",
  disabled,
  "aria-label": ariaLabel,
  className,
  inputClassName,
  noneLabel = "None",
}: AutocompleteComboboxProps) {
  const autoId = useId();
  const listboxId = `${idProp ?? autoId}-listbox`;
  const inputId = idProp;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [panelPos, setPanelPos] = useState<{
    left: number;
    width: number;
    top?: number;
    bottom?: number;
    maxHeight: number;
  }>({ left: 0, width: 0, top: 0, maxHeight: 288 });

  const labelById = useMemo(() => {
    const m = new Map<string, ComboboxOption>();
    for (const o of options) m.set(o.value, o);
    return m;
  }, [options]);

  const selected = value != null ? labelById.get(value) : undefined;
  const inputDisplay = open
    ? query
    : clearAfterSelect
      ? ""
      : (selected?.label ?? "");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.group != null && o.group.toLowerCase().includes(q)) ||
        (o.description != null && o.description.toLowerCase().includes(q))
    );
  }, [options, query]);

  const flatRows = useMemo(() => {
    const rows: {
      type: "group" | "opt";
      id: string;
      group?: string;
      opt?: ComboboxOption;
    }[] = [];
    if (allowNone) {
      rows.push({
        type: "opt" as const,
        id: NONE,
        opt: { value: NONE, label: noneLabel },
      });
    }
    let lastGroup: string | undefined;
    for (const o of visible) {
      if (o.group != null && o.group !== lastGroup) {
        lastGroup = o.group;
        rows.push({ type: "group" as const, id: `g-${o.group}`, group: o.group });
      } else if (o.group == null) {
        lastGroup = undefined;
      }
      rows.push({ type: "opt" as const, id: o.value, opt: o });
    }
    return rows;
  }, [visible, allowNone, noneLabel]);

  const pickableRowIndices = useMemo(
    () =>
      flatRows
        .map((r, i) => (r.type === "opt" ? i : -1))
        .filter((i) => i >= 0),
    [flatRows]
  );

  const pick = useCallback(
    (v: string | null) => {
      onValueChange(v);
      setOpen(false);
      setQuery("");
    },
    [onValueChange]
  );

  const updatePanelPosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vwH = window.innerHeight;
    const vwW = window.innerWidth;
    const w = Math.max(r.width, 280);
    const left = Math.max(
      VIEWPORT_GUTTER,
      Math.min(r.left, vwW - w - VIEWPORT_GUTTER)
    );

    const cap = Math.min(PANEL_MAX_PX, vwH - 2 * VIEWPORT_GUTTER);
    /** Room below the gap under the input to the bottom of the viewport. */
    const spaceBelow = Math.max(0, vwH - r.bottom - PANEL_GAP - VIEWPORT_GUTTER);
    /** Room from top gutter to the gap above the input (panel opens upward). */
    const roomAbove = Math.max(0, r.top - PANEL_GAP - VIEWPORT_GUTTER);
    const preferAbove = spaceBelow < cap && roomAbove > spaceBelow;

    if (preferAbove) {
      setPanelPos({
        left,
        width: w,
        top: undefined,
        bottom: vwH - r.top + PANEL_GAP,
        maxHeight: Math.min(cap, roomAbove),
      });
    } else {
      setPanelPos({
        left,
        width: w,
        top: r.bottom + PANEL_GAP,
        bottom: undefined,
        maxHeight: Math.min(cap, spaceBelow),
      });
    }
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
    const onScroll = (e: Event) => {
      const target = e.target;
      if (!(target instanceof Node)) return;
      if (panelRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      setOpen(false);
    };
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  const updatePanelPositionRef = useRef(updatePanelPosition);
  updatePanelPositionRef.current = updatePanelPosition;
  useEffect(() => {
    if (!open) return;
    const ro = new ResizeObserver(() => updatePanelPositionRef.current());
    if (triggerRef.current) ro.observe(triggerRef.current);
    return () => ro.disconnect();
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setHighlight(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setHighlight(0);
  }, [open, query, visible.length, allowNone]);

  const pickCount = pickableRowIndices.length;
  const activePickIndex =
    pickCount === 0 ? 0 : Math.min(highlight, pickCount - 1);

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      setOpen(false);
      return;
    }
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (pickCount === 0) return;
      setHighlight((h) => (h + 1 >= pickCount ? 0 : h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (pickCount === 0) return;
      setHighlight((h) => (h - 1 < 0 ? pickCount - 1 : h - 1));
    } else if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (pickCount === 0) return;
      const rowIdx = pickableRowIndices[activePickIndex];
      if (rowIdx === undefined) return;
      const row = flatRows[rowIdx];
      if (row?.type !== "opt" || !row.opt) return;
      if (row.opt.value === NONE) {
        pick(null);
      } else {
        pick(row.opt.value);
      }
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  const panel =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={panelRef}
            className="border-border bg-popover text-popover-foreground fixed z-[200] flex flex-col overflow-y-auto overflow-x-hidden overscroll-contain rounded-lg border p-0 py-1 shadow-md ring-1 ring-foreground/10"
            style={{
              left: panelPos.left,
              width: panelPos.width,
              maxHeight: panelPos.maxHeight,
              top: panelPos.bottom != null ? "auto" : (panelPos.top ?? 0),
              bottom: panelPos.bottom != null ? panelPos.bottom : "auto",
            }}
            id={listboxId}
            role="listbox"
            aria-label={ariaLabel}
          >
            <ul className="p-1" role="none">
                {flatRows.length === 0 ? (
                  <li className="text-muted-foreground px-2 py-6 text-center text-sm">
                    {emptyText}
                  </li>
                ) : (
                  flatRows.map((row, i) => {
                    if (row.type === "group" && row.group) {
                      return (
                        <li
                          key={row.id}
                          role="presentation"
                          className="text-muted-foreground px-2 pt-2 pb-0.5 text-xs font-semibold tracking-wide uppercase"
                        >
                          {row.group}
                        </li>
                      );
                    }
                    if (row.type === "opt" && row.opt) {
                      const o = row.opt;
                      const isNone = o.value === NONE;
                      const selectedRow = isNone
                        ? value == null
                        : o.value === value;
                      const pickIdx = pickableRowIndices.indexOf(i);
                      const isHi = pickIdx === activePickIndex;
                      return (
                        <li
                          key={o.value === NONE ? "none" : o.value}
                          className="list-none"
                        >
                          <button
                            type="button"
                            role="option"
                            tabIndex={-1}
                            aria-selected={selectedRow}
                            className={cn(
                              "hover:bg-muted focus:bg-muted flex w-full min-w-0 items-center gap-2 rounded-md px-2 py-2 text-left text-sm outline-none",
                              selectedRow && "bg-muted/80",
                              isHi && "bg-muted"
                            )}
                            onClick={() => {
                              if (isNone) pick(null);
                              else pick(o.value);
                            }}
                          >
                            <span
                              className={cn(
                                "min-w-0 flex-1",
                                isNone && "text-muted-foreground italic"
                              )}
                            >
                              <span className="truncate">
                                {isNone ? noneLabel : o.label}
                              </span>
                              {o.description && !isNone ? (
                                <span className="text-muted-foreground">
                                  {" "}
                                  · {o.description}
                                </span>
                              ) : null}
                            </span>
                            {selectedRow ? (
                              <Check className="text-primary size-4 shrink-0" />
                            ) : null}
                          </button>
                        </li>
                      );
                    }
                    return null;
                  })
                )}
              </ul>
          </div>,
          document.body
        )
      : null;

  return (
    <div
      ref={triggerRef}
      className={cn("relative w-full min-w-0", className)}
    >
      <div className="relative flex w-full min-w-0">
        <Input
          ref={inputRef}
          id={inputId}
          type="search"
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          aria-autocomplete="list"
          aria-label={ariaLabel}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            "border-input h-11 pr-9 shadow-xs",
            !inputDisplay && "text-muted-foreground",
            inputClassName
          )}
          value={inputDisplay}
          onClick={() => {
            if (disabled) return;
            if (!open) setOpen(true);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            if (disabled) return;
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-1.5 -translate-y-1/2 rounded p-1.5"
          aria-label="Toggle suggestions"
          onClick={() => {
            if (disabled) return;
            setOpen((v) => !v);
          }}
        >
          <ChevronDown
            className={cn(
              "size-4 opacity-70 transition-transform",
              open && "rotate-180"
            )}
            aria-hidden
          />
        </button>
      </div>
      {panel}
    </div>
  );
}
