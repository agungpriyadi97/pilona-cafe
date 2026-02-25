"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import Navbar from "../../components/Navbar";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  async function loginGoogle() {
    try {
      setLoading(true);
      const origin = window.location.origin;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback`,
        },
      });

      if (error) alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen">
      <Navbar />

      <div className="mx-auto max-w-md px-5 py-16">
        <h1 className="text-2xl font-semibold">Login</h1>
        <p className="mt-2 text-sm" style={{ color: "rgb(var(--muted))" }}>
          Untuk pesan menu, silakan login dulu.
        </p>

        <button
          disabled={loading}
          onClick={loginGoogle}
          className="mt-6 w-full rounded-2xl px-4 py-3 text-sm font-semibold hover:opacity-90 disabled:opacity-60"
          style={{ background: "rgb(var(--brand))", color: "rgb(var(--brandText))" }}
        >
          {loading ? "Memproses..." : "Login dengan Google"}
        </button>
      </div>
    </main>
  );
}