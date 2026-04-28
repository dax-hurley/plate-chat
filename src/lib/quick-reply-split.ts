/**
 * Split one optional leading emoji (grapheme cluster) from a quick-reply line.
 * Used so the model can pass a single JSON string (UTF-8) instead of a separate
 * `emoji` field that is often emitted with invalid `\\uXXXX` escapes.
 */
export function splitLeadingEmoji(s: string): { emoji: string; text: string } {
  const t = s.trim();
  if (!t) return { emoji: "", text: "" };

  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const seg = new Intl.Segmenter("en", { granularity: "grapheme" });
    const segments = [...seg.segment(t)];
    if (segments.length === 0) return { emoji: "", text: t };

    const first = segments[0].segment;
    if (!/\p{Extended_Pictographic}/u.test(first)) {
      return { emoji: "", text: t };
    }

    let idx = segments[0].index + first.length;
    while (idx < t.length && /\s/.test(t.charAt(idx))) idx += 1;

    const rest = t.slice(idx).trim();
    if (!rest) {
      return { emoji: "", text: t };
    }
    return { emoji: first.slice(0, 8), text: rest };
  }

  return { emoji: "", text: t };
}
