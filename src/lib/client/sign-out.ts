import { authClient } from "./auth-client";
import { clearTokens } from "./token-storage";
import { stopSyncRunner } from "./db/sync";
import { resetDb } from "./db/database";

/**
 * Full sign-out: stop replication, clear local data, drop device tokens,
 * and end the better-auth session. Safe to call offline (server call is
 * best-effort).
 */
export async function signOutLocal(): Promise<void> {
  stopSyncRunner();
  try {
    await authClient.signOut();
  } catch {
    // best-effort while offline
  }
  await clearTokens();
  await resetDb();
}
