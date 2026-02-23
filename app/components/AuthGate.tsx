"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function AuthGate({
  allow,
  nextPath,
  children,
}: {
  allow: Array<"admin" | "cashier">;
  nextPath: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ok, setOk] = useState<null | boolean>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session) {
        router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
        return;
      }

      const { data: prof, error } = await supabase.from("profiles").select("role").eq("user_id", session.user.id).single();
      if (error || !prof?.role || !allow.includes(prof.role)) {
        router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
        return;
      }

      setOk(true);
    })();
  }, [router, allow, nextPath]);

  if (ok === null) return <div className="min-h-screen flex items-center justify-center" style={{ color: "rgb(var(--muted))" }}>Loading...</div>;
  return <>{children}</>;
}