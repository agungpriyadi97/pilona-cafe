"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

export default function LoginPage() {
  const params = useSearchParams();
  const next = params.get("next") || "/";

  const { title, desc } = useMemo(() => {
    if (next.startsWith("/admin")) {
      return {
        title: "Login Admin",
        desc: "Login untuk masuk Dashboard Admin.",
      };
    }
    if (next.startsWith("/kasir")) {
      return {
        title: "Login Kasir",
        desc: "Login untuk masuk Dashboard Kasir.",
      };
    }
    // default untuk customer / halaman publik
    return {
      title: "Login Customer",
      desc: "Login untuk checkout pesanan.",
    };
  }, [next]);

  async function loginGoogle() {
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });

    if (error) alert(error.message);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-5">
      <div
        className="w-full max-w-md rounded-3xl border p-6"
        style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--surface))" }}
      >
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm" style={{ color: "rgb(var(--muted))" }}>
          {desc}
        </p>

        <button
          onClick={loginGoogle}
          className="mt-6 w-full rounded-2xl px-4 py-3 text-sm font-semibold hover:opacity-90"
          style={{ background: "rgb(var(--brand))", color: "rgb(var(--brandText))" }}
        >
          Login dengan Gmail
        </button>

        {/* opsional: info next */}
        <div className="mt-3 text-xs" style={{ color: "rgb(var(--muted))" }}>
          Setelah login kamu akan diarahkan ke: <b>{next}</b>
        </div>
      </div>
    </main>
  );
}