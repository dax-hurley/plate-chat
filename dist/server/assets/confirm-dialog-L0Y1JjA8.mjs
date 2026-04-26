import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { B as Button } from "./button-DbVXcFD_.mjs";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogDescription, e as DialogFooter } from "./dialog-OkPnLnLD.mjs";
import { c as cn } from "./utils-H80jjgLf.mjs";
function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  confirmVariant = "default",
  className
}) {
  const [confirming, setConfirming] = useState(false);
  async function handleConfirm() {
    setConfirming(true);
    try {
      await onConfirm();
    } finally {
      setConfirming(false);
    }
  }
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs(
    DialogContent,
    {
      showCloseButton: false,
      className: cn("gap-0 sm:max-w-md", className),
      children: [
        /* @__PURE__ */ jsxs(DialogHeader, { children: [
          /* @__PURE__ */ jsx(DialogTitle, { children: title }),
          description ? /* @__PURE__ */ jsx(DialogDescription, { children: description }) : null
        ] }),
        /* @__PURE__ */ jsxs(DialogFooter, { className: "mt-4 gap-2 sm:justify-stretch sm:space-x-0", children: [
          /* @__PURE__ */ jsx(
            Button,
            {
              type: "button",
              variant: "outline",
              className: "min-h-11 w-full sm:flex-1",
              disabled: confirming,
              onClick: () => onOpenChange(false),
              children: cancelLabel
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              type: "button",
              variant: confirmVariant,
              className: "min-h-11 w-full sm:flex-1",
              disabled: confirming,
              onClick: () => void handleConfirm(),
              children: confirmLabel
            }
          )
        ] })
      ]
    }
  ) });
}
export {
  ConfirmDialog as C
};
