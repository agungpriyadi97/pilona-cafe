"use client";

import Link from "next/link";
import ThemeToggle from "../components/ThemeToggle";
import { SITE } from "../data/site";
import { supabase } from "../lib/supabaseClient";
import { useEffect, useRef, useState } from "react";

function IconMenu() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function Navbar() {
  const [token, setToken] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

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

  const btn = "btn-ghost rounded-2xl px-4 py-2 text-sm font-semibold";
  const menuItem = "block rounded-xl px-3 py-2 text-sm font-semibold hover:opacity-90";

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
        <Link
          href="/"
          className="min-w-0 block select-none rounded-xl px-2 py-1 -mx-2 hover:opacity-90 transition"
          aria-label="Kembali ke Beranda"
        >
          <div className="truncate font-semibold">
            {SITE.brand}{" "}
            <span className="hidden sm:inline" style={{ color: "rgb(var(--muted))" }}>
              • {SITE.outlet}
            </span>
          </div>
          <div className="sm:hidden text-xs" style={{ color: "rgb(var(--muted))" }}>
            {SITE.outlet}
          </div>
        </Link>

        {/* Desktop actions */}
        <div className="hidden sm:flex items-center gap-3">
          <a className={btn} href={SITE.instagram} target="_blank" rel="noreferrer">
            Instagram
          </a>
          <a className={btn} href={SITE.gofood} target="_blank" rel="noreferrer">
            GoFood
          </a>

          {token && (
            <button className={btn} onClick={logout}>
              Logout
            </button>
          )}

          <ThemeToggle />
        </div>

        {/* Mobile actions */}
        <div className="flex sm:hidden items-center gap-2">
          <ThemeToggle />

          <div className="relative" ref={panelRef}>
            <button
              className="btn-ghost rounded-2xl p-2"
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
                  className={menuItem}
                  href={SITE.instagram}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setOpen(false)}
                >
                  Instagram
                </a>

                <a
                  className={menuItem}
                  href={SITE.gofood}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setOpen(false)}
                >
                  GoFood
                </a>

                <div className="my-2 h-px" style={{ background: "rgb(var(--border))" }} />

                {token ? (
                  <button className={`${menuItem} w-full text-left`} onClick={logout}>
                    Logout
                  </button>
                ) : (
                  <a className={menuItem} href="/login" onClick={() => setOpen(false)}>
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