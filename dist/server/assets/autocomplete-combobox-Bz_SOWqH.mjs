import { jsx, jsxs } from "react/jsx-runtime";
import { useId, useState, useRef, useMemo, useCallback, useLayoutEffect, useEffect } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { I as Input } from "./label-BX01hlq_.mjs";
import { c as cn } from "./utils-H80jjgLf.mjs";
const NONE = "__combobox_none__";
const PANEL_MAX_PX = 288;
const VIEWPORT_GUTTER = 8;
const PANEL_GAP = 4;
function AutocompleteCombobox({
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
  noneLabel = "None"
}) {
  const autoId = useId();
  const listboxId = `${idProp ?? autoId}-listbox`;
  const inputId = idProp;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const inputRef = useRef(null);
  const [panelPos, setPanelPos] = useState({ left: 0, width: 0, top: 0, maxHeight: 288 });
  const labelById = useMemo(() => {
    const m = /* @__PURE__ */ new Map();
    for (const o of options) m.set(o.value, o);
    return m;
  }, [options]);
  const selected = value != null ? labelById.get(value) : void 0;
  const inputDisplay = open ? query : clearAfterSelect ? "" : selected?.label ?? "";
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || o.group != null && o.group.toLowerCase().includes(q) || o.description != null && o.description.toLowerCase().includes(q)
    );
  }, [options, query]);
  const flatRows = useMemo(() => {
    const rows = [];
    if (allowNone) {
      rows.push({
        type: "opt",
        id: NONE,
        opt: { value: NONE, label: noneLabel }
      });
    }
    let lastGroup;
    for (const o of visible) {
      if (o.group != null && o.group !== lastGroup) {
        lastGroup = o.group;
        rows.push({ type: "group", id: `g-${o.group}`, group: o.group });
      } else if (o.group == null) {
        lastGroup = void 0;
      }
      rows.push({ type: "opt", id: o.value, opt: o });
    }
    return rows;
  }, [visible, allowNone, noneLabel]);
  const pickableRowIndices = useMemo(
    () => flatRows.map((r, i) => r.type === "opt" ? i : -1).filter((i) => i >= 0),
    [flatRows]
  );
  const pick = useCallback(
    (v) => {
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
    const spaceBelow = Math.max(0, vwH - r.bottom - PANEL_GAP - VIEWPORT_GUTTER);
    const roomAbove = Math.max(0, r.top - PANEL_GAP - VIEWPORT_GUTTER);
    const preferAbove = spaceBelow < cap && roomAbove > spaceBelow;
    if (preferAbove) {
      setPanelPos({
        left,
        width: w,
        top: void 0,
        bottom: vwH - r.top + PANEL_GAP,
        maxHeight: Math.min(cap, roomAbove)
      });
    } else {
      setPanelPos({
        left,
        width: w,
        top: r.bottom + PANEL_GAP,
        bottom: void 0,
        maxHeight: Math.min(cap, spaceBelow)
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
    const onScroll = (e) => {
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
    const onPointer = (e) => {
      const t = e.target;
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
  const activePickIndex = pickCount === 0 ? 0 : Math.min(highlight, pickCount - 1);
  const onKeyDown = (e) => {
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
      setHighlight((h) => h + 1 >= pickCount ? 0 : h + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (pickCount === 0) return;
      setHighlight((h) => h - 1 < 0 ? pickCount - 1 : h - 1);
    } else if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (pickCount === 0) return;
      const rowIdx = pickableRowIndices[activePickIndex];
      if (rowIdx === void 0) return;
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
  const panel = open && typeof document !== "undefined" ? createPortal(
    /* @__PURE__ */ jsx(
      "div",
      {
        ref: panelRef,
        className: "border-border bg-popover text-popover-foreground fixed z-[200] flex flex-col overflow-y-auto overflow-x-hidden overscroll-contain rounded-lg border p-0 py-1 shadow-md ring-1 ring-foreground/10",
        style: {
          left: panelPos.left,
          width: panelPos.width,
          maxHeight: panelPos.maxHeight,
          top: panelPos.bottom != null ? "auto" : panelPos.top ?? 0,
          bottom: panelPos.bottom != null ? panelPos.bottom : "auto"
        },
        id: listboxId,
        role: "listbox",
        "aria-label": ariaLabel,
        children: /* @__PURE__ */ jsx("ul", { className: "p-1", role: "none", children: flatRows.length === 0 ? /* @__PURE__ */ jsx("li", { className: "text-muted-foreground px-2 py-6 text-center text-sm", children: emptyText }) : flatRows.map((row, i) => {
          if (row.type === "group" && row.group) {
            return /* @__PURE__ */ jsx(
              "li",
              {
                role: "presentation",
                className: "text-muted-foreground px-2 pt-2 pb-0.5 text-xs font-semibold tracking-wide uppercase",
                children: row.group
              },
              row.id
            );
          }
          if (row.type === "opt" && row.opt) {
            const o = row.opt;
            const isNone = o.value === NONE;
            const selectedRow = isNone ? value == null : o.value === value;
            const pickIdx = pickableRowIndices.indexOf(i);
            const isHi = pickIdx === activePickIndex;
            return /* @__PURE__ */ jsx(
              "li",
              {
                className: "list-none",
                children: /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    role: "option",
                    tabIndex: -1,
                    "aria-selected": selectedRow,
                    className: cn(
                      "hover:bg-muted focus:bg-muted flex w-full min-w-0 items-center gap-2 rounded-md px-2 py-2 text-left text-sm outline-none",
                      selectedRow && "bg-muted/80",
                      isHi && "bg-muted"
                    ),
                    onClick: () => {
                      if (isNone) pick(null);
                      else pick(o.value);
                    },
                    children: [
                      /* @__PURE__ */ jsxs(
                        "span",
                        {
                          className: cn(
                            "min-w-0 flex-1",
                            isNone && "text-muted-foreground italic"
                          ),
                          children: [
                            /* @__PURE__ */ jsx("span", { className: "truncate", children: isNone ? noneLabel : o.label }),
                            o.description && !isNone ? /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
                              " ",
                              "· ",
                              o.description
                            ] }) : null
                          ]
                        }
                      ),
                      selectedRow ? /* @__PURE__ */ jsx(Check, { className: "text-primary size-4 shrink-0" }) : null
                    ]
                  }
                )
              },
              o.value === NONE ? "none" : o.value
            );
          }
          return null;
        }) })
      }
    ),
    document.body
  ) : null;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ref: triggerRef,
      className: cn("relative w-full min-w-0", className),
      children: [
        /* @__PURE__ */ jsxs("div", { className: "relative flex w-full min-w-0", children: [
          /* @__PURE__ */ jsx(
            Input,
            {
              ref: inputRef,
              id: inputId,
              type: "search",
              autoComplete: "off",
              role: "combobox",
              "aria-expanded": open,
              "aria-controls": open ? listboxId : void 0,
              "aria-autocomplete": "list",
              "aria-label": ariaLabel,
              disabled,
              placeholder,
              className: cn(
                "border-input h-11 pr-9 shadow-xs",
                !inputDisplay && "text-muted-foreground",
                inputClassName
              ),
              value: inputDisplay,
              onClick: () => {
                if (disabled) return;
                if (!open) setOpen(true);
              },
              onChange: (e) => {
                setQuery(e.target.value);
                if (!open) setOpen(true);
              },
              onFocus: () => {
                if (disabled) return;
                setOpen(true);
              },
              onKeyDown
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              tabIndex: -1,
              disabled,
              className: "text-muted-foreground hover:text-foreground absolute top-1/2 right-1.5 -translate-y-1/2 rounded p-1.5",
              "aria-label": "Toggle suggestions",
              onClick: () => {
                if (disabled) return;
                setOpen((v) => !v);
              },
              children: /* @__PURE__ */ jsx(
                ChevronDown,
                {
                  className: cn(
                    "size-4 opacity-70 transition-transform",
                    open && "rotate-180"
                  ),
                  "aria-hidden": true
                }
              )
            }
          )
        ] }),
        panel
      ]
    }
  );
}
export {
  AutocompleteCombobox as A
};
