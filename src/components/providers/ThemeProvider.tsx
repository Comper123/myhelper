"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (t: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolved] = useState<"light" | "dark">("light");

  // при монтировании читаем сохранённое
  useEffect(() => {
    const timer = setTimeout(() => {
        const stored = (localStorage.getItem("theme") as Theme) || "system";
        setThemeState(stored);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // реагируем на изменение темы и системной темы
  useEffect(() => {
    const root = document.documentElement;

    const apply = () => {
      const system = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      const active = theme === "system" ? system : theme;

      root.classList.remove("light", "dark");
      root.classList.add(active);
      root.style.colorScheme = active;
      setResolved(active);
    };

    apply();

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme]);

  const setTheme = (t: Theme) => {
    localStorage.setItem("theme", t);
    setThemeState(t);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}