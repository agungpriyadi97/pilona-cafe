"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function LoginClient() {
  const router = useRouter();
  const params = useSearchParams();

  const nextPath = useMemo(() => params.get("next") || "/", [params]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      setErr(error.message);
      return;
    }

    router.push(nextPath);
  }

  return (
    <main className="min-h-screen bg-white text-neutral-900">
      <div className="mx-auto max-w-md px-5 py-14">
        <h1 className="text-2xl font-bold">Login</h1>
        <p className="mt-1 text-sm text-neutral-500">Masuk untuk akses dashboard.</p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-xl border px-4 py-3 text-sm"
              placeholder="email@contoh.com"
              type="email"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-xl border px-4 py-3 text-sm"
              placeholder="••••••••"
              type="password"
              required
            />
          </div>

          {err ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div> : null}

          <button
            disabled={loading}
            className="w-full rounded-xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Masuk..." : "Masuk"}
          </button>

          <div className="text-xs text-neutral-500">
            Setelah login akan redirect ke: <b>{nextPath}</b>
          </div>
        </form>
      </div>
    </main>
  );
}
