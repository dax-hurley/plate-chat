import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { a as useMealLibrary, b as useNutritionMutations, d as useMealLibraryIngredients } from "./nutrition-D49dj8bQ.mjs";
import "dexie";
import "./session-CyYyvQL9.mjs";
import "./router-kvjOiOR_.mjs";
import "@tanstack/react-router";
import "@capacitor/core";
import "drizzle-zod";
import "drizzle-orm";
import "drizzle-orm/sqlite-core";
import "jose";
import "@libsql/client";
import "drizzle-orm/libsql";
import "@ai-sdk/anthropic";
import "ai";
import "zod";
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
import "./hooks-Ccy1wbDZ.mjs";
import "dexie-react-hooks";
import "./writes-CNff-rob.mjs";
import "./ids-zMPBJmub.mjs";
function LibraryPage() {
  const {
    data: items
  } = useMealLibrary();
  const {
    saveLibraryItem,
    deleteLibraryItem
  } = useNutritionMutations();
  const [editingId, setEditingId] = useState(null);
  const [showNew, setShowNew] = useState(false);
  return /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("h2", { className: "text-sm font-medium text-muted-foreground", children: [
        items.length,
        " saved meals"
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: () => {
        setShowNew(true);
        setEditingId(null);
      }, className: "rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm", children: "New meal" })
    ] }),
    showNew ? /* @__PURE__ */ jsx(LibraryEditor, { onSave: async (input) => {
      await saveLibraryItem(input);
      setShowNew(false);
    }, onCancel: () => setShowNew(false) }) : null,
    items.length === 0 && !showNew ? /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "No meals saved. Tap “New meal” to add one." }) : null,
    /* @__PURE__ */ jsx("ul", { className: "space-y-2", children: items.map((m) => editingId === m.id ? /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(LibraryEditor, { initial: m, onSave: async (input) => {
      await saveLibraryItem({
        ...input,
        id: m.id
      });
      setEditingId(null);
    }, onCancel: () => setEditingId(null) }) }, m.id) : /* @__PURE__ */ jsxs("li", { className: "rounded-xl border bg-card p-3 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsx("div", { className: "font-medium truncate", children: m.name }),
        /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
          m.calories,
          " kcal · P",
          m.proteinG,
          " C",
          m.carbsG,
          " F",
          m.fatG
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsx("button", { onClick: () => {
          setEditingId(m.id);
          setShowNew(false);
        }, className: "text-xs rounded-md border px-2 py-1", children: "Edit" }),
        /* @__PURE__ */ jsx("button", { onClick: () => {
          if (confirm(`Delete ${m.name}?`)) void deleteLibraryItem(m.id);
        }, className: "text-xs rounded-md border px-2 py-1 text-destructive", children: "Remove" })
      ] })
    ] }, m.id)) })
  ] });
}
function LibraryEditor({
  initial,
  onSave,
  onCancel
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [instructions, setInstructions] = useState(initial?.instructions ?? "");
  const [calories, setCalories] = useState(String(initial?.calories ?? 0));
  const [proteinG, setProteinG] = useState(String(initial?.proteinG ?? 0));
  const [carbsG, setCarbsG] = useState(String(initial?.carbsG ?? 0));
  const [fatG, setFatG] = useState(String(initial?.fatG ?? 0));
  const {
    data: existingIngs
  } = useMealLibraryIngredients(initial?.id ?? null);
  const [ings, setIngs] = useState(existingIngs.map((e) => e.line).join("\n"));
  return /* @__PURE__ */ jsxs("form", { onSubmit: async (e) => {
    e.preventDefault();
    const lines = ings.split("\n").map((s) => s.trim()).filter(Boolean);
    await onSave({
      name,
      instructions,
      calories: Number(calories) || 0,
      proteinG: Number(proteinG) || 0,
      carbsG: Number(carbsG) || 0,
      fatG: Number(fatG) || 0,
      ingredients: lines.map((line, i) => ({
        line,
        sortOrder: i
      }))
    });
  }, className: "rounded-xl border bg-card p-3 space-y-2", children: [
    /* @__PURE__ */ jsx("input", { value: name, onChange: (e) => setName(e.target.value), placeholder: "Name", required: true, className: "w-full rounded-md border bg-background px-3 py-2 text-sm" }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-4 gap-2", children: [
      /* @__PURE__ */ jsx("input", { value: calories, onChange: (e) => setCalories(e.target.value), placeholder: "kcal", inputMode: "numeric", className: "rounded-md border bg-background px-2 py-1 text-sm" }),
      /* @__PURE__ */ jsx("input", { value: proteinG, onChange: (e) => setProteinG(e.target.value), placeholder: "P", inputMode: "decimal", className: "rounded-md border bg-background px-2 py-1 text-sm" }),
      /* @__PURE__ */ jsx("input", { value: carbsG, onChange: (e) => setCarbsG(e.target.value), placeholder: "C", inputMode: "decimal", className: "rounded-md border bg-background px-2 py-1 text-sm" }),
      /* @__PURE__ */ jsx("input", { value: fatG, onChange: (e) => setFatG(e.target.value), placeholder: "F", inputMode: "decimal", className: "rounded-md border bg-background px-2 py-1 text-sm" })
    ] }),
    /* @__PURE__ */ jsx("textarea", { value: ings, onChange: (e) => setIngs(e.target.value), placeholder: "Ingredients (one per line)", rows: 4, className: "w-full rounded-md border bg-background px-3 py-2 text-sm" }),
    /* @__PURE__ */ jsx("textarea", { value: instructions, onChange: (e) => setInstructions(e.target.value), placeholder: "Instructions", rows: 3, className: "w-full rounded-md border bg-background px-3 py-2 text-sm" }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ jsx("button", { className: "flex-1 rounded-md bg-primary text-primary-foreground py-2 text-sm", children: "Save" }),
      /* @__PURE__ */ jsx("button", { type: "button", onClick: onCancel, className: "rounded-md border px-3 py-2 text-sm", children: "Cancel" })
    ] })
  ] });
}
export {
  LibraryPage as component
};
