import { useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect } from "react";

const SENSITIVE_KEYS = ["email", "password", "passwd", "pwd", "pass"] as const;

/** Strip credential-like query params if they ever appear in the URL (e.g. mistaken GET submit). */
export function SanitizeLoginUrl() {
  const search = useSearch({ strict: false }) as Record<string, unknown>;
  const navigate = useNavigate();

  useEffect(() => {
    const next: Record<string, unknown> = { ...search };
    let dirty = false;
    for (const k of SENSITIVE_KEYS) {
      if (k in next) {
        delete next[k];
        dirty = true;
      }
    }
    if (dirty) {
      void navigate({ to: "/login", search: next, replace: true });
    }
  }, [search, navigate]);

  return null;
}
