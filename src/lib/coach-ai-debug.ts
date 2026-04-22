/**
 * Coach AI debug UI (token usage, etc.). Use bracket access so Next.js does not
 * replace this with `undefined` at compile time when the var was absent during build.
 */
export function isCoachAiDebugEnabled(): boolean {
  const raw = process.env["COACH_AI_DEBUG"];
  if (raw == null || raw === "") return false;
  const v = String(raw).trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

/** Client-visible flag so the composer can show debug token hints without an extra round-trip. */
export function isCoachAiDebugUiEnabled(): boolean {
  const raw = process.env["NEXT_PUBLIC_COACH_AI_DEBUG"];
  if (raw == null || raw === "") return false;
  const v = String(raw).trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}
