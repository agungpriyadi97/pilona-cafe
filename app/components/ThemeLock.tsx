"use client";

import { useEffect, useRef } from "react";

export default function ThemeLock({ mode = "light" }: { mode?: "light" | "dark" }) {
  const prevClassRef = useRef<string>("");

  useEffect(() => {
    // simpan class sebelumnya
    prevClassRef.current = document.documentElement.className;

    // paksa class TANPA next-themes (jadi tidak nulis localStorage)
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(mode);

    // optional: biar scrollbar/form ikut theme
    document.documentElement.style.colorScheme = mode;

    return () => {
      // restore class semula
      document.documentElement.className = prevClassRef.current || "";
      document.documentElement.style.colorScheme = "";

      // safety: kalau class sebelumnya kosong, balikin ke dark default
      if (!document.documentElement.classList.contains("light") && !document.documentElement.classList.contains("dark")) {
        document.documentElement.classList.add("dark");
      }
    };
  }, [mode]);

  return null;
}