"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function ThemeToggle() {
  const pathname = usePathname();

  // ✅ HARD BLOCK: jangan tampil di /admin & /kasir (dan turunannya)
  if (pathname.startsWith("/admin") || pathname.startsWith("/kasir")) return null;

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="rounded-2xl border px-4 py-2 text-sm font-semibold hover:opacity-90"
      style={{
        borderColor: "rgb(var(--border))",
        background: "rgb(var(--surface))",
        color: "rgb(var(--text))",
      }}
    >
      {isDark ? "Bright Minimal" : "Premium Gelap"}
    </button>
  );
}