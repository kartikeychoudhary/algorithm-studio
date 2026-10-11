"use client";
import { createContext, useContext, useEffect, useState } from "react";

const StudioContext = createContext(null);

export function StudioProvider({ children }) {
  const [features, setFeatures] = useState({});
  const [theme, setTheme] = useState("dark");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("algorithm-studio-theme");
      if (saved === "light" || saved === "dark") setTheme(saved);
    } catch {}
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem("algorithm-studio-theme", next);
    } catch {}
  }
  return (
    <StudioContext.Provider
      value={{ features, setFeatures, theme, toggleTheme }}
    >
      {children}
    </StudioContext.Provider>
  );
}

export function useStudio() {
  const context = useContext(StudioContext);
  if (!context) throw new Error("StudioProvider is required");
  return context;
}

export function useLessonState(key, initial) {
  const { features, setFeatures } = useStudio();
  const value = features[key] ?? initial;
  const setValue = (update) =>
    setFeatures((previous) => ({
      ...previous,
      [key]:
        typeof update === "function"
          ? update(previous[key] ?? initial)
          : update,
    }));
  return [value, setValue];
}
