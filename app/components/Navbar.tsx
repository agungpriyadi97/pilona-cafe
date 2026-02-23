"use client";

import ThemeToggle from "../components/ThemeToggle";
import { SITE } from "../data/site";
import { supabase } from "../lib/supabaseClient";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      setToken(data.session?.access_token ?? null);
    })();
  }, []);

  async function logout() {
    if (token) {
      await fetch("/api/audit/event", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "LOGOUT" }),
      });
    }
    await supabase.auth.signOut();
    location.href = "/";
  }

  return (
    <header
      className="sticky top-0 z-50 border-b backdrop-blur"
      style={{ borderColor: "rgb(var(--border))", background: "color-mix(in oklab, rgb(var(--bg)) 88%, transparent)" }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <div className="font-semibold">
          {SITE.brand} <span style={{ color: "rgb(var(--muted))" }}>• {SITE.outlet}</span>
        </div>

        <div className="flex items-center gap-3">
          <a className="rounded-2xl border px-4 py-2 text-sm font-semibold hover:opacity-90"
             style={{ borderColor: "rgb(var(--border))" }} href={SITE.instagram} target="_blank" rel="noreferrer">
            Instagram
          </a>
          <a className="rounded-2xl border px-4 py-2 text-sm font-semibold hover:opacity-90"
             style={{ borderColor: "rgb(var(--border))" }} href={SITE.gofood} target="_blank" rel="noreferrer">
            GoFood
          </a>

          {token && (
            <button className="rounded-2xl border px-4 py-2 text-sm font-semibold hover:opacity-90"
                    style={{ borderColor: "rgb(var(--border))" }} onClick={logout}>
              Logout
            </button>
          )}

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}