"use client";

import { useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function AuthCallbackPage() {
  useEffect(() => {
    (async () => {
      // Tukar "code" -> session (wajib di App Router)
      const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
      if (error) console.error("exchangeCodeForSession:", error);

      // balik ke home
      window.location.replace("/");
    })();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-sm" style={{ color: "rgb(var(--muted))" }}>
        Menghubungkan akun...
      </div>
    </div>
  );
}