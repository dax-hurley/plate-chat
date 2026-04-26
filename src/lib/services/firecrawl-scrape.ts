/**
 * Server-only: single-page scrape via Firecrawl v2 for recipe import.
 */

const FIRECRAWL_SCRAPE_URL = "https://api.firecrawl.dev/v2/scrape";
const MAX_MARKDOWN_CHARS = 120_000;

export function normalizeRecipeImportUrl(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    return null;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  if (u.username || u.password) return null;
  return u.toString();
}

function normalizeMetadataTitle(raw: unknown): string | undefined {
  if (typeof raw === "string") {
    const t = raw.trim();
    return t.length > 0 ? t : undefined;
  }
  if (Array.isArray(raw)) {
    for (const x of raw) {
      if (typeof x === "string") {
        const t = x.trim();
        if (t.length > 0) return t;
      }
    }
  }
  return undefined;
}

export type FirecrawlScrapeOk = {
  ok: true;
  sourceUrl: string;
  markdown: string;
  title?: string;
  truncated: boolean;
};

export type FirecrawlScrapeErr = {
  ok: false;
  error: string;
  status?: number;
};

export async function scrapeUrlToMarkdown(
  url: string
): Promise<FirecrawlScrapeOk | FirecrawlScrapeErr> {
  const normalized = normalizeRecipeImportUrl(url);
  if (!normalized) {
    return { ok: false, error: "Invalid URL (http and https only)." };
  }

  const apiKey = process.env.FIRECRAWL_API_KEY?.trim();
  if (!apiKey) {
    return {
      ok: false,
      error:
        "Recipe import is not configured (missing FIRECRAWL_API_KEY on the server).",
    };
  }

  let res: Response;
  try {
    res = await fetch(FIRECRAWL_SCRAPE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: normalized,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error";
    return { ok: false, error: `Firecrawl request failed: ${msg}` };
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    return {
      ok: false,
      error: "Firecrawl returned a non-JSON response.",
      status: res.status,
    };
  }

  if (!res.ok) {
    const errMsg =
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof (body as { error: unknown }).error === "string"
        ? (body as { error: string }).error
        : `Firecrawl error (${res.status})`;
    return { ok: false, error: errMsg, status: res.status };
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("success" in body) ||
    (body as { success: unknown }).success !== true
  ) {
    const errMsg =
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof (body as { error: unknown }).error === "string"
        ? (body as { error: string }).error
        : "Firecrawl scrape was not successful.";
    return { ok: false, error: errMsg, status: res.status };
  }

  const data = (body as { data?: unknown }).data;
  if (typeof data !== "object" || data === null) {
    return { ok: false, error: "Firecrawl response missing data." };
  }

  const md =
    "markdown" in data && typeof (data as { markdown: unknown }).markdown === "string"
      ? (data as { markdown: string }).markdown
      : "";

  if (!md.trim()) {
    return {
      ok: false,
      error: "No markdown content returned for this page.",
    };
  }

  const meta = "metadata" in data ? (data as { metadata?: unknown }).metadata : undefined;
  const title =
    typeof meta === "object" && meta !== null && "title" in meta
      ? normalizeMetadataTitle((meta as { title: unknown }).title)
      : undefined;

  const truncated = md.length > MAX_MARKDOWN_CHARS;
  const markdown = truncated ? md.slice(0, MAX_MARKDOWN_CHARS) : md;

  return {
    ok: true,
    sourceUrl: normalized,
    markdown,
    title,
    truncated,
  };
}
