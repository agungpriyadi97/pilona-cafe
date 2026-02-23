"use client";

import { useEffect, useState } from "react";
import AuthGate from "../../components/AuthGate";
import { supabase } from "../../lib/supabaseClient";

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) {
        setLoading(false);
        setErr("Silakan login dulu.");
        return;
      }

      const res = await fetch("/api/admin/audit", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();
      if (!res.ok) {
        setErr(json?.error ?? "Gagal load audit");
        setLogs([]);
        setLoading(false);
        return;
      }

      setLogs(json.logs ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <AuthGate allow={["admin"]} nextPath="/admin/audit">
      <main className="min-h-screen bg-white text-neutral-900">
        <div className="border-b">
          <div className="mx-auto max-w-6xl px-5 py-4">
            <div className="font-semibold">Riwayat Login</div>
            <div className="text-xs text-neutral-500">Audit Logs (latest 200)</div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-5 py-6">
          {loading ? (
            <div className="text-sm text-neutral-500">Loading...</div>
          ) : err ? (
            <div className="rounded-2xl border p-6 text-sm text-red-600">Error: {err}</div>
          ) : (
            <div className="overflow-auto rounded-2xl border">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50">
                  <tr className="text-left">
                    <th className="p-3">Waktu</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">User</th>
                    <th className="p-3">Meta</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l) => (
                    <tr key={l.id} className="border-t">
                      <td className="p-3">{new Date(l.created_at).toLocaleString("id-ID")}</td>
                      <td className="p-3">{l.action}</td>
                      <td className="p-3">{String(l.user_id).slice(0, 8)}…</td>
                      <td className="p-3 text-neutral-500">{JSON.stringify(l.meta ?? {})}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4">
            <a className="text-sm underline" href="/admin">
              Kembali ke Admin
            </a>
          </div>
        </div>
      </main>
    </AuthGate>
  );
}