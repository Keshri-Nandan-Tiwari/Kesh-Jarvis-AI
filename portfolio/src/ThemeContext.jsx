import { createContext, useContext, useEffect, useState } from "react";

export const THEMES = {
  black: { id: "black", label: "Obsidian", swatch: "#e6e6e6" },
  blue: { id: "blue", label: "Midnight", swatch: "#3b82f6" },
  red: { id: "red", label: "Crimson", swatch: "#e0263f" },
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("kt-theme") || "black");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("kt-theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
