"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

export default function ThemeLock({ mode = "light" }: { mode?: "light" | "dark" }) {
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme(mode);
    localStorage.setItem("theme", mode);
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(mode);
  }, [mode, setTheme]);

  return null;
}