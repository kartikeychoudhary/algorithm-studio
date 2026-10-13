"use client";
import { useEffect, useState } from "react";
const key = "algorithm-studio-progress-v1";
function read() {
  try {
    const p = JSON.parse(localStorage.getItem(key));
    return p && typeof p === "object" && !Array.isArray(p) ? p : {};
  } catch {
    return {};
  }
}
export function useProgress() {
  const [progress, setProgress] = useState({});
  useEffect(() => {
    const refresh = () => setProgress(read());
    refresh();
    window.addEventListener("studio-progress", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("studio-progress", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  function update(id, patch) {
    const next = read();
    next[id] = { ...(next[id] || {}), ...patch };
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {}
    setProgress(next);
    window.dispatchEvent(new Event("studio-progress"));
  }
  return { progress, update };
}
