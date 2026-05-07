/**
 * Length of a prefix of `text` that ends at a "stable" boundary for incremental
 * markdown: outside fenced code blocks and right after a blank line (`\n\n`).
 * The suffix can be shown as plain text while streaming; the prefix is safe to
 * feed through a full markdown parse repeatedly (it only grows when this length increases).
 */
export function committedAssistantMarkdownPrefixLen(text: string): number {
  let inFence = false;
  let i = 0;
  let lastSafe = 0;
  const len = text.length;

  const isFenceLine = (idx: number): boolean => {
    const lineStart = idx === 0 || text[idx - 1] === "\n";
    if (!lineStart) return false;
    const slice3 = text.slice(idx, idx + 3);
    return slice3 === "```" || slice3 === "~~~";
  };

  while (i < len) {
    if (isFenceLine(i)) {
      inFence = !inFence;
      const eol = text.indexOf("\n", i);
      i = eol === -1 ? len : eol + 1;
      continue;
    }
    if (!inFence && i + 1 < len && text[i] === "\n" && text[i + 1] === "\n") {
      lastSafe = i + 2;
      i += 2;
      continue;
    }
    i += 1;
  }
  return lastSafe;
}
