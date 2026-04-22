import { useState, useEffect } from "react";
import { l as loadTokens } from "./router-kvjOiOR_.mjs";
function useLocalSession() {
  const [state, setState] = useState({ userId: null, loading: true, tokens: null });
  useEffect(() => {
    let alive = true;
    loadTokens().then((t) => {
      if (!alive) return;
      setState({
        userId: t?.userId ?? null,
        loading: false,
        tokens: t
      });
    });
    return () => {
      alive = false;
    };
  }, []);
  return state;
}
export {
  useLocalSession as u
};
