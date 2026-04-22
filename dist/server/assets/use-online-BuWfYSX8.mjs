import { useState, useEffect } from "react";
function useOnline() {
  const [online, setOnline] = useState(
    () => typeof navigator === "undefined" ? true : navigator.onLine
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online;
}
export {
  useOnline as u
};
