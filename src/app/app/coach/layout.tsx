import type { ReactNode } from "react";

/**
 * Relative to padded `<main>`: cancel horizontal padding (same pattern as other full-bleed pages).
 */
export default function CoachLayout({ children }: { children: ReactNode }) {
  return (
    <div className="text-card-foreground -mx-5 -mt-7 flex min-h-0 flex-col md:-mx-12 md:-mt-10">
      {children}
    </div>
  );
}
