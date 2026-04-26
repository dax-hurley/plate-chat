import { jsxs, jsx } from "react/jsx-runtime";
import { useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ClipboardList, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { b as buttonVariants, B as Button } from "./button-DbVXcFD_.mjs";
import { L as Label, I as Input } from "./label-BX01hlq_.mjs";
import "@capacitor/core";
import { b as useWorkoutMutations } from "./workouts-DSVvumuN.mjs";
import "dexie";
import "./router-CUOzYYmk.mjs";
import "dexie-react-hooks";
import { c as cn } from "./utils-H80jjgLf.mjs";
import "@base-ui/react/button";
import "class-variance-authority";
import "@base-ui/react/input";
import "./writes-C61wFNCm.mjs";
import "./ids-zMPBJmub.mjs";
import "drizzle-zod";
import "drizzle-orm";
import "drizzle-orm/sqlite-core";
import "next-themes";
import "zod";
import "@libsql/client";
import "drizzle-orm/libsql";
import "jose";
import "@ai-sdk/anthropic";
import "ai";
import "node:crypto";
import "@better-auth/core/db";
import "@better-auth/core/env";
import "@better-auth/core/error";
import "@better-auth/kysely-adapter";
import "@better-auth/core/db/adapter";
import "kysely";
import "@better-auth/utils/password";
import "@noble/hashes/hkdf.js";
import "@noble/hashes/sha2.js";
import "@better-auth/core/utils/db";
import "@better-auth/core/utils/json";
import "@better-auth/utils/base64";
import "@better-auth/utils/binary";
import "@better-auth/utils/hmac";
import "@better-auth/core/utils/ip";
import "@better-auth/utils/hash";
import "@better-auth/core/context";
import "@better-auth/core/instrumentation";
import "@better-auth/core/utils/id";
import "defu";
import "@better-auth/core/utils/host";
import "@better-auth/core/utils/is-api-error";
import "@better-auth/core/utils/url";
import "@better-auth/core/api";
import "@better-auth/core/utils/deprecate";
import "@better-auth/utils/random";
import "@better-auth/utils";
import "@noble/ciphers/chacha.js";
import "@noble/ciphers/utils.js";
import "@better-auth/core/social-providers";
import "jose/errors";
import "better-call";
import "@better-auth/telemetry";
import "@better-auth/drizzle-adapter";
import "clsx";
import "tailwind-merge";
function NewWorkoutPage() {
  const navigate = useNavigate();
  const {
    createTemplate
  } = useWorkoutMutations();
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);
  async function onSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Give your workout a name.");
      return;
    }
    setPending(true);
    try {
      const id = await createTemplate({
        name: trimmed,
        notes: notes.trim() || null,
        routineGroupId: null,
        routineOrder: null
      });
      toast.success("Workout created", {
        description: "Add exercises next."
      });
      await navigate({
        to: "/app/workouts/$id",
        params: {
          id
        }
      });
    } catch {
      toast.error("Could not create workout.");
      setPending(false);
    }
  }
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-xl space-y-8", children: [
    /* @__PURE__ */ jsxs(Link, { to: "/app/workouts", className: cn(buttonVariants({
      variant: "ghost",
      size: "sm"
    }), "min-h-11 -ml-2 gap-2"), children: [
      /* @__PURE__ */ jsx(ArrowLeft, { className: "size-4", "aria-hidden": true }),
      "Back"
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("h1", { className: "flex items-center gap-2.5 text-2xl font-semibold tracking-tight", children: [
        /* @__PURE__ */ jsx("span", { className: "bg-primary/15 text-primary ring-primary/15 inline-flex size-10 items-center justify-center rounded-2xl ring-1", children: /* @__PURE__ */ jsx(ClipboardList, { className: "size-5", strokeWidth: 2.25, "aria-hidden": true }) }),
        "New workout"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mt-2 text-sm", children: "Name your routine, then add lifts on the next screen." })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit, className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "name", className: "text-base", children: "Name" }),
        /* @__PURE__ */ jsx(Input, { id: "name", required: true, value: name, onChange: (e) => setName(e.target.value), placeholder: "e.g. StrongLifts A", className: "min-h-14 text-base touch-manipulation" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "notes", className: "text-base", children: "Notes (optional)" }),
        /* @__PURE__ */ jsx(Input, { id: "notes", value: notes, onChange: (e) => setNotes(e.target.value), placeholder: "Warm-up tips, etc.", className: "min-h-14 text-base touch-manipulation" })
      ] }),
      /* @__PURE__ */ jsxs(Button, { type: "submit", disabled: pending, className: "inline-flex min-h-14 w-full touch-manipulation items-center justify-center gap-2 text-base shadow-sm", children: [
        pending ? "Creating…" : "Continue",
        !pending ? /* @__PURE__ */ jsx(ArrowRight, { className: "size-4", "aria-hidden": true }) : null
      ] })
    ] })
  ] });
}
export {
  NewWorkoutPage as component
};
