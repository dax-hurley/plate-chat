/**
 * Network layer with silent refresh. Every sync and authenticated request
 * funnels through `authFetch`; a 401 triggers a single refresh attempt and
 * retry. Refreshes are serialized so concurrent requests don't race.
 */
import {
  clearTokens,
  loadTokens,
  saveTokens,
  type StoredTokenBundle,
} from "./token-storage";

let refreshInFlight: Promise<StoredTokenBundle | null> | null = null;

async function refreshOnce(): Promise<StoredTokenBundle | null> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const existing = await loadTokens();
    if (!existing) return null;
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: existing.refreshToken }),
      });
      if (!res.ok) {
        if (res.status === 401) await clearTokens();
        return null;
      }
      const data = (await res.json()) as Omit<StoredTokenBundle, "userId">;
      const bundle: StoredTokenBundle = { ...existing, ...data };
      await saveTokens(bundle);
      return bundle;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(init.headers);
  let tokens = await loadTokens();
  if (tokens) {
    if (tokens.accessExpiresAt - 30_000 < Date.now()) {
      tokens = (await refreshOnce()) ?? tokens;
    }
    headers.set("Authorization", `Bearer ${tokens.accessToken}`);
  }
  const res = await fetch(input, { ...init, headers });
  if (res.status !== 401) return res;
  const rotated = await refreshOnce();
  if (!rotated) return res;
  const retryHeaders = new Headers(init.headers);
  retryHeaders.set("Authorization", `Bearer ${rotated.accessToken}`);
  return fetch(input, { ...init, headers: retryHeaders });
}
