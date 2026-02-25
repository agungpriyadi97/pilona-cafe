"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/navigation";

type Role = "admin" | "cashier";

export default function AuthGate({
  allow,
  nextPath,
  children,
}: {
  allow: Role[];
  nextPath: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ok, setOk] = useState<null | boolean>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      // belum login -> ke login
      if (!session) {
        router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
        return;
      }

      // cek role via API
      const res = await fetch("/api/me", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!res.ok) {
        router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
        return;
      }

      const json = await res.json().catch(() => null);
      const role = json?.role as Role | null;

      // role tidak sesuai -> tetap lempar ke login (biar kamu bisa ganti akun)
      if (!role || !allow.includes(role)) {
        router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
        return;
      }

      if (alive) setOk(true);
    })();

    return () => {
      alive = false;
    };
  }, [router, allow, nextPath]);

  if (ok === null) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ color: "rgb(var(--muted))" }}
      >
        Loading...
      </div>
    );
  }

  return <>{children}</>;
}