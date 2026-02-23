"use client";

import { useEffect, useMemo, useState } from "react";
import AuthGate from "../components/AuthGate";
import { supabase } from "../lib/supabaseClient";

function rupiah(n: number) {
  return "Rp " + (n ?? 0).toLocaleString("id-ID");
}

function pct(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

const medal = (i: number) => (i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`);

type Summary = {
  totalOrders: number;
  totalRevenue: number;
  avgOrder: number;
  topMenu: Array<{ name: string; count: number }>;
  peakHours: Array<{ hour: string; count: number }>;
  typeDist: { dineIn: number; takeAway: number };
};

type SummaryOrError = Summary | { error: string };

export default function AdminPage() {
  const [data, setData] = useState<SummaryOrError | null>(null);
  const [loading, setLoading] = useState(true);

  async function downloadFile(kind: "csv" | "xlsx") {
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    if (!token) {
      alert("Silakan login dulu.");
      return;
    }

    const url = kind === "csv" ? "/api/admin/export.csv" : "/api/admin/export.xlsx";
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      const j = await res.json().catch(() => null);
      alert(j?.error ?? "Gagal export");
      return;
    }

    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = kind === "csv" ? "pilona-report.csv" : "pilona-report.xlsx";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  }

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;

      // kalau belum login, biarin AuthGate yang redirect
      if (!token) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const res = await fetch("/api/admin/summary", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = (await res.json()) as SummaryOrError;
      setData(json);
      setLoading(false);
    })();
  }, []);

  const isError = (data as any)?.error;

  const dineIn = useMemo(() => {
    if (!data || isError) return 0;
    return (data as Summary).typeDist?.dineIn ?? 0;
  }, [data, isError]);

  const takeAway = useMemo(() => {
    if (!data || isError) return 0;
    return (data as Summary).typeDist?.takeAway ?? 0;
  }, [data, isError]);

  const totalOrders = useMemo(() => {
    if (!data || isError) return 0;
    return (data as Summary).totalOrders ?? 0;
  }, [data, isError]);

  const dinePct = useMemo(() => pct(dineIn, totalOrders), [dineIn, totalOrders]);
  const takePct = useMemo(() => pct(takeAway, totalOrders), [takeAway, totalOrders]);

  return (
    <AuthGate allow={["admin"]} nextPath="/admin">
      <main className="min-h-screen bg-white text-neutral-900">
        {/* Topbar */}
        <div className="border-b">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
            <div>
              <div className="font-semibold">☕ Pilona Coffee</div>
              <div className="text-xs text-neutral-500">Dashboard Admin</div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="/admin/audit"
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-neutral-50"
              >
                Riwayat Login
              </a>

              <button
                onClick={() => downloadFile("csv")}
                className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-neutral-50"
              >
                Export CSV
              </button>

              <button
                onClick={() => downloadFile("xlsx")}
                className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-neutral-50"
              >
                Export Excel
              </button>
              <a
                href="/kasir"
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-neutral-50"
              >
                Dashboard Kasir
              </a>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-5 py-8">
          <h1 className="text-2xl font-semibold">Ringkasan</h1>
          <p className="mt-1 text-sm text-neutral-500">Summary • Top 5 • Jam Ramai • Distribusi Tipe</p>

          {loading ? (
            <div className="mt-8 text-sm text-neutral-500">Loading...</div>
          ) : !data ? (
            <div className="mt-8 text-sm text-neutral-500">Tidak ada data.</div>
          ) : isError ? (
            <div className="mt-8 rounded-2xl border p-6 text-sm text-red-600">
              Error: {(data as any).error}
              <div className="mt-2 text-neutral-600">
                Pastikan user kamu punya role <b>admin</b> di tabel <b>profiles</b>.
              </div>
            </div>
          ) : (
            <>
              {/* 📊 Summary Cards */}
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <SummaryCard title="Total Pesanan" value={String((data as Summary).totalOrders)} />
                <SummaryCard title="Total Pendapatan" value={rupiah((data as Summary).totalRevenue)} />
                <SummaryCard title="Rata-rata / pesanan" value={rupiah((data as Summary).avgOrder)} />
              </div>

              {/* 🏆 Top 5 + ⏰ Jam Ramai */}
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <Panel title="🏆 Menu Terlaris (Top 5)" subtitle="Menu paling banyak dipesan">
                  <div className="space-y-2">
                    {((data as Summary).topMenu ?? []).slice(0, 5).map((x, i) => (
                      <Row key={x.name} left={`${medal(i)} ${x.name}`} right={`${x.count} pesanan`} />
                    ))}
                    {(!(data as Summary).topMenu || (data as Summary).topMenu.length === 0) && (
                      <div className="text-sm text-neutral-500">Belum ada data.</div>
                    )}
                  </div>
                </Panel>

                <Panel title="⏰ Jam Ramai" subtitle="Jam dengan pesanan terbanyak">
                  <div className="space-y-2">
                    {((data as Summary).peakHours ?? []).slice(0, 3).map((x, i) => (
                      <Row key={x.hour} left={`📈 #${i + 1}: ${x.hour}`} right={`${x.count} pesanan`} />
                    ))}
                    {(!(data as Summary).peakHours || (data as Summary).peakHours.length === 0) && (
                      <div className="text-sm text-neutral-500">Belum ada data.</div>
                    )}
                  </div>
                </Panel>
              </div>

              {/* ☕ Distribusi Tipe */}
              <div className="mt-6 rounded-2xl border bg-white p-6">
                <div className="font-semibold">☕ Distribusi Tipe</div>
                <div className="mt-1 text-sm text-neutral-500">Dine-in vs Take Away</div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <TypeBox icon="☕" title="Dine-in" value={`${dineIn} (${dinePct}%)`} />
                  <TypeBox icon="🛍️" title="Take Away" value={`${takeAway} (${takePct}%)`} />
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </AuthGate>
  );
}

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-white p-6">
      <div className="text-sm text-neutral-500">{title}</div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-white p-6">
      <div className="font-semibold">{title}</div>
      {subtitle ? <div className="mt-1 text-sm text-neutral-500">{subtitle}</div> : null}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Row({ left, right }: { left: string; right: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3">
      <div className="min-w-0 truncate text-sm font-medium">{left}</div>
      <div className="shrink-0 text-sm text-neutral-500">{right}</div>
    </div>
  );
}

function TypeBox({ icon, title, value }: { icon: string; title: string; value: string }) {
  return (
    <div className="rounded-2xl border p-6 text-center">
      <div className="text-3xl">{icon}</div>
      <div className="mt-2 font-semibold">{title}</div>
      <div className="mt-1 text-sm text-neutral-500">{value}</div>
    </div>
  );
}