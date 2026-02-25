"use client";

import { useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

export default function LoginPage() {
  const params = useSearchParams();
  const next = params.get("next") || "/";

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
      <div className="w-full max-w-md rounded-3xl border p-6" style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--surface))" }}>
        <h1 className="text-2xl font-semibold">Login</h1>
        <p className="mt-2 text-sm" style={{ color: "rgb(var(--muted))" }}>
          Login untuk lanjut ke dashboard.
        </p>

        <button
          onClick={loginGoogle}
          className="mt-6 w-full rounded-2xl px-4 py-3 text-sm font-semibold hover:opacity-90"
          style={{ background: "rgb(var(--brand))", color: "rgb(var(--brandText))" }}
        >
          Login dengan Gmail
        </button>
      </div>
    </main>
  );
}