"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) router.replace(next);
    })();
  }, [router, next]);

  async function login() {
    setLoading(true);
    setMsg(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) { setMsg(error.message); return; }

    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;

    if (token) {
      await fetch("/api/audit/event", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "LOGIN_SUCCESS", meta: { next } }),
      });
    }

    router.replace(next);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-5">
      <div className="w-full max-w-md rounded-3xl border p-6" style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--surface))" }}>
        <h1 className="text-2xl font-semibold">Login</h1>
        <p className="mt-2 text-sm" style={{ color: "rgb(var(--muted))" }}>Masuk untuk akses dashboard.</p>

        <div className="mt-6 space-y-3">
          <input className="w-full rounded-2xl border px-4 py-3 text-sm outline-none"
                 style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--bg))", color: "rgb(var(--text))" }}
                 placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="w-full rounded-2xl border px-4 py-3 text-sm outline-none"
                 style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--bg))", color: "rgb(var(--text))" }}
                 placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

          {msg && <div className="text-sm text-red-400">{msg}</div>}

          <button onClick={login} disabled={loading}
                  className="w-full rounded-2xl px-4 py-3 text-sm font-semibold"
                  style={{ background: "rgb(var(--brand))", color: "rgb(var(--brandText))", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Loading..." : "Login"}
          </button>
        </div>
      </div>
    </main>
  );
}