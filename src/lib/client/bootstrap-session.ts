import { saveTokens, type StoredTokenBundle } from "./token-storage";

/**
 * After a successful browser-side sign-in we trade the better-auth session
 * cookie for a device-token bundle. The sync layer uses the Bearer access
 * token (no cookies required) — this is what makes sync work from Capacitor
 * WebViews and across origins.
 */
export async function bootstrapDeviceSession(args: {
  userId: string;
  email: string | null;
  name?: string | null;
  deviceName?: string;
}): Promise<StoredTokenBundle> {
  const res = await fetch("/api/auth/device-tokens", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceName: args.deviceName ?? "" }),
  });
  if (!res.ok) {
    throw new Error(`device-tokens ${res.status}`);
  }
  const data = (await res.json()) as Omit<
    StoredTokenBundle,
    "userId" | "email" | "name"
  >;
  const bundle: StoredTokenBundle = {
    ...data,
    userId: args.userId,
    email: args.email,
    name: args.name ?? null,
  };
  await saveTokens(bundle);
  return bundle;
}
