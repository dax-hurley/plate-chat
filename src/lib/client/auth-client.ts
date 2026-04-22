import { createAuthClient } from "better-auth/client";

/**
 * Thin wrapper around `better-auth/client` bound to this app. After a
 * successful sign-in / sign-up we immediately mint device tokens and hand
 * off to RxDB replication — that's the only networked auth we keep after
 * bootstrap.
 */
export const authClient = createAuthClient({
  baseURL: typeof window === "undefined" ? "" : window.location.origin,
});
