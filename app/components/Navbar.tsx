"use client";

import ThemeToggle from "../components/ThemeToggle";
import { SITE } from "../data/site";
import { supabase } from "../lib/supabaseClient";
import { useEffect, useRef, useState } from "react";
import { useOrder } from "./OrderProvider"; // ✅ tambah ini

function IconMenu() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconCart() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 6h15l-1.5 8.5a2 2 0 0 1-2 1.7H9a2 2 0 0 1-2-1.6L5 3H2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9 22a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" fill="currentColor" />
      <path d="M18 22a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" fill="currentColor" />
    </svg>
  );
}

export default function Navbar({ hideThemeToggle = false }: { hideThemeToggle?: boolean }) {
  const [token, setToken] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // ✅ cart
  const { cartCount, openCart } = useOrder();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      setToken(data.session?.access_token ?? null);
    })();
  }, []);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!open) return;
      if (!panelRef.current) return;
      if (panelRef.current.contains(e.target as Node)) return;
      setOpen(false);
    }
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  async function logout() {
    try {
      if (token) {
        await fetch("/api/audit/event", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ action: "LOGOUT" }),
        });
      }
    } finally {
      await supabase.auth.signOut();
      location.href = "/";
    }
  }

  const btnClass = "rounded-2xl border px-4 py-2 text-sm font-semibold hover:opacity-90 transition";
  const btnStyle = { borderColor: "rgb(var(--border))" } as const;

  return (
    <header
      className="sticky top-0 z-50 border-b backdrop-blur"
      style={{
        borderColor: "rgb(var(--border))",
        background: "color-mix(in oklab, rgb(var(--bg)) 88%, transparent)",
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
        {/* Brand */}
        <a href="/" className="min-w-0">
          <div className="truncate font-semibold">
            {SITE.brand}{" "}
            <span className="hidden sm:inline" style={{ color: "rgb(var(--muted))" }}>
              • {SITE.outlet}
            </span>
          </div>
          <div className="sm:hidden text-xs" style={{ color: "rgb(var(--muted))" }}>
            {SITE.outlet}
          </div>
        </a>

        {/* Desktop actions */}
        <div className="hidden sm:flex items-center gap-3">
          <a className={btnClass} style={btnStyle} href={SITE.instagram} target="_blank" rel="noreferrer">
            Instagram
          </a>
          <a className={btnClass} style={btnStyle} href={SITE.gofood} target="_blank" rel="noreferrer">
            GoFood
          </a>

          {/* ✅ Cart button */}
          <button
            onClick={openCart}
            className="relative rounded-2xl border px-4 py-2 text-sm font-semibold hover:opacity-90 transition"
            style={{ borderColor: "rgb(var(--border))" }}
          >
            <span className="inline-flex items-center gap-2">
              <IconCart />
              Keranjang
            </span>

            {cartCount > 0 && (
              <span
                className="absolute -right-2 -top-2 min-w-[20px] rounded-full px-1.5 py-0.5 text-[11px] font-bold text-center"
                style={{ background: "rgb(var(--brand))", color: "rgb(var(--brandText))" }}
              >
                {cartCount}
              </span>
            )}
          </button>

          {token && (
            <button className={btnClass} style={btnStyle} onClick={logout}>
              Logout
            </button>
          )}

          {!hideThemeToggle && <ThemeToggle />}
        </div>

        {/* Mobile actions */}
        <div className="flex sm:hidden items-center gap-2">
          {/* ✅ Cart icon (mobile) */}
          <button
            onClick={openCart}
            className="relative rounded-2xl border p-2 hover:opacity-90 transition"
            style={btnStyle}
            aria-label="Open cart"
          >
            <IconCart />
            {cartCount > 0 && (
              <span
                className="absolute -right-2 -top-2 min-w-[18px] rounded-full px-1 py-0.5 text-[10px] font-bold text-center"
                style={{ background: "rgb(var(--brand))", color: "rgb(var(--brandText))" }}
              >
                {cartCount}
              </span>
            )}
          </button>

          {!hideThemeToggle && <ThemeToggle />}

          <div className="relative" ref={panelRef}>
            <button
              className="rounded-2xl border p-2 hover:opacity-90 transition"
              style={btnStyle}
              onClick={() => setOpen((v) => !v)}
              aria-label="Open menu"
            >
              <IconMenu />
            </button>

            {open && (
              <div
                className="absolute right-0 mt-2 w-56 rounded-2xl border p-2 shadow-lg"
                style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--surface))" }}
              >
                <a
                  className="block rounded-xl px-3 py-2 text-sm font-semibold hover:opacity-90"
                  href={SITE.instagram}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setOpen(false)}
                >
                  Instagram
                </a>

                <a
                  className="block rounded-xl px-3 py-2 text-sm font-semibold hover:opacity-90"
                  href={SITE.gofood}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setOpen(false)}
                >
                  GoFood
                </a>

                <div className="my-2 h-px" style={{ background: "rgb(var(--border))" }} />

                {token ? (
                  <button
                    className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold hover:opacity-90"
                    onClick={logout}
                  >
                    Logout
                  </button>
                ) : (
                  <a
                    className="block rounded-xl px-3 py-2 text-sm font-semibold hover:opacity-90"
                    href="/login"
                    onClick={() => setOpen(false)}
                  >
                    Login
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}