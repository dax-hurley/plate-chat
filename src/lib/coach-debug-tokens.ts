/** Rough token estimate for English-ish text (not provider-accurate). */
export function approxTokensFromText(text: string): number {
  const t = text.trim();
  if (t.length === 0) return 0;
  return Math.max(1, Math.ceil(t.length / 4));
}

export function truncateForDebugPreview(text: string, maxChars = 80): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (t.length <= maxChars) return t;
  return `${t.slice(0, Math.max(0, maxChars - 1))}…`;
}
