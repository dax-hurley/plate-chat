/**
 * Remove markdown images and hyperlinks from recipe text (keep link label text).
 * Also drops common GFM autolinks in angle brackets and bare <img> / <a> HTML.
 */
export function stripRecipeMarkdownImagesAndLinks(text: string): string {
  let s = text.replace(/\r\n/g, "\n");

  s = s.replace(/!\[[^\]]*\]\([^)]*\)/g, "");
  s = s.replace(/!\[[^\]]*\]\[[^\]]*\]/g, "");
  s = s.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
  s = s.replace(/\[([^\]]+)\]\[[^\]]*\]/g, "$1");

  s = s.replace(/<https?:\/\/[^>\s]+>/gi, "");

  s = s.replace(/<img\b[^>]*>/gi, "");
  s = s.replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, "$1");

  s = s.replace(/\n{3,}/g, "\n\n");
  return s.trim();
}
