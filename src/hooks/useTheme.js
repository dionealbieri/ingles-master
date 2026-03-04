import { useState, useEffect } from "react";
import { themes } from "../utils/theme.js";

export function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("im_theme");
    return saved !== null ? saved === "dark" : true;
  });

  const theme = isDark ? themes.dark : themes.light;

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("im_theme", next ? "dark" : "light");
  };

  useEffect(() => {
    document.body.style.background = theme.bg;
    document.body.style.color = theme.text;
  }, [isDark]);

  return { theme, isDark, toggle };
}
