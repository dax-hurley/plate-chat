/**
 * After credentials sign-in, navigate on the **current** origin using path + query only.
 * Avoids `localhost` vs `127.0.0.1` / emulator host mismatches that drop session cookies.
 */
export function navigateAfterLogin(callbackUrl: string | undefined): void {
  const fallback = "/app";
  const raw = callbackUrl?.trim();
  if (!raw) {
    window.location.assign(fallback);
    return;
  }
  try {
    let pathWithQuery: string;
    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      const u = new URL(raw);
      pathWithQuery = u.pathname + u.search + u.hash;
    } else {
      const u = new URL(raw, window.location.origin);
      pathWithQuery = u.pathname + u.search + u.hash;
    }
    if (!pathWithQuery.startsWith("/")) {
      window.location.assign(fallback);
      return;
    }
    window.location.assign(pathWithQuery);
  } catch {
    window.location.assign(fallback);
  }
}
