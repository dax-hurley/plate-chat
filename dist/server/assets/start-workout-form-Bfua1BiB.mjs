import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { toast } from "sonner";
import { B as Button } from "./button-DbVXcFD_.mjs";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogDescription, e as DialogFooter } from "./dialog-OkPnLnLD.mjs";
import "@capacitor/core";
import { b as useWorkoutMutations, u as useActiveSession, c as useWorkoutTemplate } from "./workouts-DSVvumuN.mjs";
import "dexie";
import "./router-CUOzYYmk.mjs";
import "dexie-react-hooks";
import { c as cn } from "./utils-H80jjgLf.mjs";
function StartWorkoutForm({
  templateId,
  name,
  formClassName,
  buttonClassName
}) {
  const navigate = useNavigate();
  const { startSession } = useWorkoutMutations();
  const { data: activeSession, loading: activeSessionLoading } = useActiveSession();
  const { data: activeTemplate } = useWorkoutTemplate(
    activeSession?.templateId ?? null
  );
  const [pending, setPending] = useState(false);
  const [replaceOpen, setReplaceOpen] = useState(false);
  const inProgressName = activeSession ? activeSession.templateId ? activeTemplate?.name ?? "Workout" : "Workout" : "";
  async function startNow() {
    if (pending) return;
    setPending(true);
    try {
      const id = await startSession(templateId);
      setReplaceOpen(false);
      await navigate({
        to: "/app/workouts/session/$sessionId",
        params: { sessionId: id }
      });
    } catch {
      toast.error("Could not start workout");
    } finally {
      setPending(false);
    }
  }
  function onSubmit(e) {
    e.preventDefault();
    if (activeSessionLoading) return;
    if (activeSession) {
      setReplaceOpen(true);
      return;
    }
    void startNow();
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("form", { onSubmit, className: cn("min-w-0", formClassName), children: /* @__PURE__ */ jsxs(
      Button,
      {
        type: "submit",
        disabled: pending || activeSessionLoading,
        className: cn(
          "min-h-12 w-full justify-between gap-3 text-base shadow-sm",
          buttonClassName
        ),
        children: [
          /* @__PURE__ */ jsx("span", { className: "truncate font-medium", children: name }),
          /* @__PURE__ */ jsxs("span", { className: "text-primary-foreground/90 inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold", children: [
            /* @__PURE__ */ jsx(Play, { className: "size-4 fill-current opacity-90", "aria-hidden": true }),
            "Start"
          ] })
        ]
      }
    ) }),
    /* @__PURE__ */ jsx(Dialog, { open: replaceOpen, onOpenChange: setReplaceOpen, children: /* @__PURE__ */ jsxs(DialogContent, { className: "gap-4", children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsx(DialogTitle, { children: "Abandon in-progress workout?" }),
        /* @__PURE__ */ jsxs(DialogDescription, { children: [
          /* @__PURE__ */ jsx("span", { className: "text-foreground font-medium", children: inProgressName }),
          " ",
          "is in progress. Starting",
          " ",
          /* @__PURE__ */ jsx("span", { className: "text-foreground font-medium", children: name }),
          " will abandon that session. Unlogged sets will not be saved, and this cannot be undone."
        ] })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { className: "gap-2 sm:gap-0", children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            type: "button",
            variant: "outline",
            className: "touch-manipulation",
            disabled: pending,
            onClick: () => setReplaceOpen(false),
            children: "Cancel"
          }
        ),
        /* @__PURE__ */ jsx(
          Button,
          {
            type: "button",
            variant: "destructive",
            className: "touch-manipulation",
            disabled: pending,
            onClick: () => void startNow(),
            children: pending ? "Starting…" : "Abandon and start"
          }
        )
      ] })
    ] }) })
  ] });
}
export {
  StartWorkoutForm as S
};
