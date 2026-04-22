/**
 * Device-token persistence. Uses Capacitor Preferences on native (survives
 * app restarts, lives in encrypted app sandbox) and `localStorage` on web.
 *
 * We deliberately do NOT store tokens in IndexedDB: RxDB ejects its storage
 * on logout, and we want tokens to live independently of the offline DB so
 * we can clear them without wiping data (and vice versa).
 */
import { Capacitor } from "@capacitor/core";

export interface StoredTokenBundle {
  accessToken: string;
  accessExpiresAt: number;
  refreshToken: string;
  refreshExpiresAt: number;
  deviceId: string;
  userId: string;
}

const KEY = "trainlog.device-tokens";

interface PreferencesAPI {
  get(opts: { key: string }): Promise<{ value: string | null }>;
  set(opts: { key: string; value: string }): Promise<void>;
  remove(opts: { key: string }): Promise<void>;
}

let preferencesCache: PreferencesAPI | null | undefined;
async function getPreferences(): Promise<PreferencesAPI | null> {
  if (preferencesCache !== undefined) return preferencesCache;
  if (!Capacitor.isNativePlatform()) {
    preferencesCache = null;
    return null;
  }
  try {
    const mod = (await import("@capacitor/preferences")) as unknown as {
      Preferences: PreferencesAPI;
    };
    preferencesCache = mod.Preferences;
  } catch {
    preferencesCache = null;
  }
  return preferencesCache;
}

export async function saveTokens(bundle: StoredTokenBundle): Promise<void> {
  const serialized = JSON.stringify(bundle);
  const prefs = await getPreferences();
  if (prefs) {
    await prefs.set({ key: KEY, value: serialized });
    return;
  }
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(KEY, serialized);
  }
}

export async function loadTokens(): Promise<StoredTokenBundle | null> {
  const prefs = await getPreferences();
  let raw: string | null = null;
  if (prefs) {
    raw = (await prefs.get({ key: KEY })).value;
  } else if (typeof localStorage !== "undefined") {
    raw = localStorage.getItem(KEY);
  }
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredTokenBundle;
  } catch {
    return null;
  }
}

export async function clearTokens(): Promise<void> {
  const prefs = await getPreferences();
  if (prefs) {
    await prefs.remove({ key: KEY });
  } else if (typeof localStorage !== "undefined") {
    localStorage.removeItem(KEY);
  }
}
