"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const SENSITIVE_KEYS = ["email", "password", "passwd", "pwd", "pass"] as const;

/** Strip credential-like query params if they ever appear in the URL (e.g. mistaken GET submit). */
export function SanitizeLoginUrl() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const p = new URLSearchParams(searchParams.toString());
    let dirty = false;
    for (const k of SENSITIVE_KEYS) {
      if (p.has(k)) {
        p.delete(k);
        dirty = true;
      }
    }
    if (dirty) {
      const q = p.toString();
      router.replace(q ? `/login?${q}` : "/login", { scroll: false });
    }
  }, [searchParams, router]);

  return null;
}
