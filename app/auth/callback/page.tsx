"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    (async () => {
      const next = params.get("next") || "/";

      // penting: tukar code dari Google jadi session Supabase
      const code = params.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error(error);
          router.replace("/login?next=" + encodeURIComponent(next));
          return;
        }
      }

      router.replace(next);
    })();
  }, [params, router]);

  return (
    <main className="min-h-screen flex items-center justify-center px-5">
      <div className="text-sm" style={{ color: "rgb(var(--muted))" }}>
        Memproses login…
      </div>
    </main>
  );
}