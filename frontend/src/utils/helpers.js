// Generic helper functions

export function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

export function formatDateStr(dateStr) {
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
  } catch {
    return dateStr;
  }
}

export const isGitHubUrl = (val) =>
  /^(https?:\/\/)?(www\.)?github\.com\/.+/.test(String(val || "").trim());

// window size hook
import { useState, useEffect } from "react";
export function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    function onResize() {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    }
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return size;
}
