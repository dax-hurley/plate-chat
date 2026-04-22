import { useEffect, useState } from "react";
import { loadTokens, type StoredTokenBundle } from "@/lib/client/token-storage";

/**
 * Active local session. Unlike NextAuth's `useSession`, this reads the
 * client-side token bundle (which is always present after initial login)
 * and does NOT round-trip to the server. Works fully offline.
 */
export function useLocalSession(): {
  userId: string | null;
  loading: boolean;
  tokens: StoredTokenBundle | null;
} {
  const [state, setState] = useState<{
    userId: string | null;
    loading: boolean;
    tokens: StoredTokenBundle | null;
  }>({ userId: null, loading: true, tokens: null });

  useEffect(() => {
    let alive = true;
    loadTokens().then((t) => {
      if (!alive) return;
      setState({
        userId: t?.userId ?? null,
        loading: false,
        tokens: t,
      });
    });
    return () => {
      alive = false;
    };
  }, []);

  return state;
}
