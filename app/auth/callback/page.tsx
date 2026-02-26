// app/auth/callback/page.tsx
"use client";

import { Suspense, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();

  const next = useMemo(() => params.get("next") || "/", [params]);
  const code = useMemo(() => params.get("code"), [params]);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        // 1) Tukar code -> session Supabase
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error("exchangeCodeForSession error:", error);
            if (!alive) return;
            router.replace(`/login?next=${encodeURIComponent(next)}`);
            return;
          }
        }

        // 2) Pastikan session sudah ada
        const { data: sess } = await supabase.auth.getSession();
        const session = sess.session;
        if (!session) {
          if (!alive) return;
          router.replace(`/login?next=${encodeURIComponent(next)}`);
          return;
        }

        // 3) Kalau next ke admin/kasir => cek role
        const needsRoleCheck = next.startsWith("/admin") || next.startsWith("/kasir");
        if (needsRoleCheck) {
          const { data: prof, error } = await supabase
            .from("profiles")
            .select("role")
            .eq("user_id", session.user.id)
            .single();

          const role = prof?.role as "admin" | "cashier" | undefined;

          // role rules
          const okForAdmin = next.startsWith("/admin") && role === "admin";
          const okForKasir = next.startsWith("/kasir") && (role === "admin" || role === "cashier");

          if (error || !role || (!okForAdmin && !okForKasir)) {
            if (!alive) return;
            router.replace(`/login?next=${encodeURIComponent(next)}&denied=1`);
            return;
          }
        }

        // 4) Redirect ke tujuan
        if (!alive) return;
        router.replace(next);
      } catch (e) {
        console.error("callback error:", e);
        if (!alive) return;
        router.replace(`/login?next=${encodeURIComponent(next)}`);
      }
    })();

    return () => {
      alive = false;
    };
  }, [router, next, code]);

  return (
    <main className="min-h-screen flex items-center justify-center px-5">
      <div className="text-sm" style={{ color: "rgb(var(--muted))" }}>
        Memproses login…
      </div>
    </main>
  );
}

export default function AuthCallbackPage() {
  // ✅ FIX Vercel: useSearchParams harus di Suspense boundary
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center px-5">
          <div className="text-sm" style={{ color: "rgb(var(--muted))" }}>
            Memproses login…
          </div>
        </main>
      }
    >
      <CallbackInner />
    </Suspense>
  );
}