"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AuthGate from "../components/AuthGate";
import { supabase } from "../lib/supabaseClient";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type Status = "MENUNGGU" | "DITERIMA" | "SELESAI" | "BATAL";
type OrderType = "DINE_IN" | "TAKE_AWAY";

type OrderItemRow = {
  name: string;
  qty: number;
  price_label: string | null;
  price_value: number | null;
};

type OrderRow = {
  id: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  order_type: OrderType;
  status: Status;
  subtotal: number | null;
  tax: number | null;
  total: number | null;
  order_items?: OrderItemRow[];
};

function rupiah(n: number) {
  return "Rp " + (n ?? 0).toLocaleString("id-ID");
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function fmtDay(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function KasirPage() {
  const [range, setRange] = useState<"today" | "week" | "month">("today");
  const [activeStatus, setActiveStatus] = useState<Status>("MENUNGGU");

  // counts
  const [countMenunggu, setCountMenunggu] = useState(0);
  const [countDiterima, setCountDiterima] = useState(0);
  const [countSelesai, setCountSelesai] = useState(0);

  // chart series
  const [series, setSeries] = useState<Array<{ label: string; orders: number; revenue: number }>>(
    []
  );

  // order list
  const [queueMap, setQueueMap] = useState<Record<string, number>>({});
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const prevMenungguCountRef = useRef<number>(0);

  async function loadCounts() {
    const { data, error } = await supabase.from("orders").select("status");
    if (error) {
      console.error(error);
      return;
    }
    const rows = (data ?? []) as Array<{ status: Status }>;
    const m = rows.filter((r) => r.status === "MENUNGGU").length;
    const d = rows.filter((r) => r.status === "DITERIMA").length;
    const s = rows.filter((r) => r.status === "SELESAI").length;

    // bunyi notif kalau ada order baru masuk MENUNGGU
    if (prevMenungguCountRef.current !== 0 && m > prevMenungguCountRef.current) {
      try {
        const audio = new Audio("/notif.mp3");
        await audio.play();
      } catch { }
    }
    prevMenungguCountRef.current = m;

    setCountMenunggu(m);
    setCountDiterima(d);
    setCountSelesai(s);
  }
  async function loadQueueToday() {
    const now = new Date();
    const start = startOfDay(now);
    const end = addDays(start, 1);

    const { data, error } = await supabase
      .from("orders")
      .select("id, created_at")
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString())
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    const map: Record<string, number> = {};
    (data ?? []).forEach((o: any, idx: number) => {
      map[o.id] = idx + 1; // nomor antrian harian
    });

    setQueueMap(map);
  }
  async function loadChart() {
    const now = new Date();

    // TODAY: bucket per jam 0-23
    if (range === "today") {
      const start = startOfDay(now);
      const end = addDays(start, 1);

      const { data, error } = await supabase
        .from("orders")
        .select("created_at,total")
        .gte("created_at", start.toISOString())
        .lt("created_at", end.toISOString());

      if (error) {
        console.error(error);
        return;
      }

      const buckets = new Map<number, { orders: number; revenue: number }>();
      for (let h = 0; h < 24; h++) buckets.set(h, { orders: 0, revenue: 0 });

      for (const o of (data ?? []) as any[]) {
        const d = new Date(o.created_at);
        const h = d.getHours();
        const b = buckets.get(h)!;
        b.orders += 1;
        b.revenue += o.total ?? 0;
      }

      setSeries(
        Array.from({ length: 24 }, (_, h) => ({
          label: String(h).padStart(2, "0") + ":00",
          orders: buckets.get(h)!.orders,
          revenue: buckets.get(h)!.revenue,
        }))
      );
      return;
    }

    // WEEK/MONTH: bucket per hari
    const days = range === "week" ? 7 : 30;
    const end = startOfDay(addDays(now, 1));
    const start = startOfDay(addDays(now, -(days - 1)));

    const { data, error } = await supabase
      .from("orders")
      .select("created_at,total")
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString());

    if (error) {
      console.error(error);
      return;
    }

    const map = new Map<string, { orders: number; revenue: number }>();
    for (let i = 0; i < days; i++) map.set(fmtDay(addDays(start, i)), { orders: 0, revenue: 0 });

    for (const o of (data ?? []) as any[]) {
      const key = fmtDay(new Date(o.created_at));
      const b = map.get(key);
      if (!b) continue;
      b.orders += 1;
      b.revenue += o.total ?? 0;
    }

    setSeries(
      [...map.entries()].map(([date, v]) => ({
        label: date.slice(5), // MM-DD
        orders: v.orders,
        revenue: v.revenue,
      }))
    );
  }

  async function loadOrders() {
    setLoadingOrders(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(
          "id,created_at,customer_name,customer_phone,order_type,status,subtotal,tax,total,order_items(name,qty,price_label,price_value)"
        )
        .eq("status", activeStatus)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        return;
      }
      setOrders((data ?? []) as OrderRow[]);
    } finally {
      setLoadingOrders(false);
    }
  }

  // init + realtime refresh
  useEffect(() => {
    loadCounts();
    loadChart();
    loadQueueToday();
    loadOrders();

    const channel = supabase
      .channel("kasir-dashboard-v2")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, async () => {
        await Promise.all([loadCounts(), loadChart(), loadQueueToday(), loadOrders()]);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, async () => {
        await loadOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, activeStatus]);

  async function logout() {
    await supabase.auth.signOut();
    location.href = "/";
  }

  async function updateStatus(orderId: string, status: Status) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
    if (error) {
      alert(error.message);
      return;
    }
    loadCounts();
    loadOrders();
  }

  async function cancelOrder(orderId: string) {
    const ok = confirm("Batalkan pesanan ini? (status akan menjadi BATAL)");
    if (!ok) return;

    const { error } = await supabase.from("orders").update({ status: "BATAL" }).eq("id", orderId);
    if (error) {
      alert(error.message);
      return;
    }
    loadCounts();
    loadOrders();
  }

  const headerLabel = useMemo(() => {
    if (range === "today") return "Hari ini";
    if (range === "week") return "Mingguan";
    return "Bulanan";
  }, [range]);

  return (
    <AuthGate allow={["admin", "cashier"]} nextPath="/kasir">
      <main className="min-h-screen bg-white text-neutral-900">
        {/* Topbar */}
        <div className="border-b">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="text-xl">☕</div>
              <div>
                <div className="font-semibold">Pilona Coffee</div>
                <div className="text-xs text-neutral-500">Dashboard Kasir</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-neutral-500">Cashier</div>
                <div className="text-xs text-neutral-400">cashier</div>
              </div>
              <button
                onClick={logout}
                className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-neutral-50"
              >
                Keluar
              </button>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-5 py-8">
          {/* Range Tabs */}
          <div className="flex gap-2">
            <RangeBtn active={range === "today"} onClick={() => setRange("today")}>
              Hari ini
            </RangeBtn>
            <RangeBtn active={range === "week"} onClick={() => setRange("week")}>
              Mingguan
            </RangeBtn>
            <RangeBtn active={range === "month"} onClick={() => setRange("month")}>
              Bulanan
            </RangeBtn>
          </div>

          {/* Status Cards (klik untuk filter list) */}
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <StatusCard
              title="MENUNGGU KONFIRMASI"
              value={countMenunggu}
              accent="orange"
              active={activeStatus === "MENUNGGU"}
              onClick={() => setActiveStatus("MENUNGGU")}
            />
            <StatusCard
              title="SEDANG DIPROSES"
              value={countDiterima}
              accent="blue"
              active={activeStatus === "DITERIMA"}
              onClick={() => setActiveStatus("DITERIMA")}
            />
            <StatusCard
              title="SUDAH SIAP"
              value={countSelesai}
              accent="green"
              active={activeStatus === "SELESAI"}
              onClick={() => setActiveStatus("SELESAI")}
            />
          </div>

          {/* Chart */}
          <div className="mt-6 rounded-2xl border bg-white p-6">
            <div className="flex items-center gap-2 font-semibold">
              <span>📊</span>
              <span>Grafik Pesanan & Pendapatan</span>
              <span className="ml-2 text-xs font-normal text-neutral-400">({headerLabel})</span>
            </div>

            <div className="mt-4 w-full" style={{ height: 320 }}>
              {series.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-neutral-500">
                  Belum ada data untuk ditampilkan.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={series} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(val: any, name?: string) =>
                        name === "revenue" ? rupiah(Number(val)) : val
                      }
                      labelStyle={{ fontSize: 12 }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="orders"
                      name="Pesanan"
                      stroke="#2563EB"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      name="Pendapatan"
                      stroke="#16A34A"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                      strokeDasharray="6 6"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Orders List */}
          <div className="mt-6 rounded-2xl border bg-white p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold">Daftar Pesanan</div>
                <div className="text-sm text-neutral-500">
                  Semua pesanan yang masuk • Filter:{" "}
                  {activeStatus === "MENUNGGU"
                    ? "Menunggu Konfirmasi"
                    : activeStatus === "DITERIMA"
                      ? "Sedang Diproses"
                      : "Sudah Siap"}
                </div>
              </div>

              <button
                onClick={loadOrders}
                className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-neutral-50"
              >
                Refresh
              </button>
            </div>

            <div className="mt-5 max-h-520px space-y-4 overflow-auto pr-2">
              {loadingOrders ? (
                <div className="rounded-xl border p-5 text-sm text-neutral-500">Loading...</div>
              ) : orders.length === 0 ? (
                <div className="rounded-xl border p-5 text-sm text-neutral-500">
                  Belum ada pesanan pada status ini.
                </div>
              ) : (
                orders.map((o) => (
                  <OrderCard
                    key={o.id}
                    order={o}
                    status={activeStatus}
                    queueNo={queueMap[o.id]}  // <-- tambah ini
                    onAccept={() => updateStatus(o.id, "DITERIMA")}
                    onDone={() => updateStatus(o.id, "SELESAI")}
                    onCancel={() => cancelOrder(o.id)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </AuthGate>
  );
}

function RangeBtn({ active, onClick, children }: any) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl px-4 py-2 text-sm font-semibold"
      style={{
        background: active ? "#111827" : "transparent",
        color: active ? "white" : "#111827",
        border: "1px solid #E5E7EB",
      }}
    >
      {children}
    </button>
  );
}

function StatusCard({
  title,
  value,
  accent,
  active,
  onClick,
}: {
  title: string;
  value: number;
  accent: "orange" | "blue" | "green";
  active: boolean;
  onClick: () => void;
}) {
  const color = accent === "orange" ? "#F97316" : accent === "blue" ? "#3B82F6" : "#22C55E";
  return (
    <button
      onClick={onClick}
      className="rounded-2xl border bg-white p-6 text-left hover:bg-neutral-50"
      style={{
        borderColor: active ? color : "#E5E7EB",
        boxShadow: active ? "0 0 0 3px rgba(0,0,0,0.03)" : "none",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="text-xs text-neutral-500">{title}</div>
        <div className="text-2xl font-bold" style={{ color }}>
          {value}
        </div>
      </div>
      <div className="mt-3 h-1 w-full rounded-full bg-neutral-100">
        <div className="h-1 rounded-full" style={{ width: "18%", background: color }} />
      </div>
    </button>
  );
}

function badgeStatus(status: Status) {
  if (status === "MENUNGGU") return { text: "MENUNGGU KONFIRMASI", bg: "#FFF7ED", fg: "#C2410C", bd: "#FED7AA" };
  if (status === "DITERIMA") return { text: "SEDANG DIPROSES", bg: "#EFF6FF", fg: "#1D4ED8", bd: "#BFDBFE" };
  return { text: "SUDAH SIAP", bg: "#ECFDF5", fg: "#15803D", bd: "#BBF7D0" };
}

function OrderCard({
  order,
  status,
  queueNo,
  onAccept,
  onDone,
  onCancel,
}: {
  order: OrderRow;
  status: Status;
  queueNo: number;
  onAccept: () => void;
  onDone: () => void;
  onCancel: () => void;
}) {
  const b = badgeStatus(order.status);
  const time = new Date(order.created_at).toLocaleString("id-ID");

  const itemTitle = order.order_items?.[0]?.name ?? "Pesanan";
  const itemCount = (order.order_items ?? []).reduce((s, it) => s + (it.qty ?? 1), 0);

  return (
    <div className="rounded-2xl border p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-lg font-semibold">{itemTitle}</div>

            <span
              className="rounded-full border px-2 py-1 text-xs font-semibold"
              style={{ background: b.bg, color: b.fg, borderColor: b.bd }}
            >
              {order.order_type === "DINE_IN" ? "Dine In" : "Take Away"}
            </span>

            <span
              className="rounded-full border px-2 py-1 text-xs font-semibold"
              style={{ background: b.bg, color: b.fg, borderColor: b.bd }}
            >
              {b.text}
            </span>
          </div>

          <div className="mt-2 text-sm text-neutral-500">
            {queueNo ? (
              <>
                Antrian <b>#{queueNo}</b> •{" "}
              </>
            ) : null}
            {order.customer_name} • {order.customer_phone}
          </div>
          <div className="mt-1 text-xs text-neutral-400">{time}</div>

          <div className="mt-3 text-sm">
            <div className="text-neutral-500">Items ({itemCount})</div>
            <div className="mt-1 space-y-1">
              {(order.order_items ?? []).slice(0, 4).map((it, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <div className="truncate">
                    {it.qty}x {it.name}
                  </div>
                  <div className="text-neutral-500">{it.price_label ?? (it.price_value ? rupiah(it.price_value) : "")}</div>
                </div>
              ))}
              {(order.order_items ?? []).length > 4 && (
                <div className="text-xs text-neutral-400">+ {(order.order_items!.length - 4)} item lainnya</div>
              )}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-neutral-400">Total</div>
          <div className="text-lg font-semibold">{rupiah(order.total ?? 0)}</div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {status === "MENUNGGU" && (
          <>
            <button
              onClick={onAccept}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Mulai Masak
            </button>
            <button
              onClick={onCancel}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Batalkan
            </button>
          </>
        )}

        {status === "DITERIMA" && (
          <button
            onClick={onDone}
            className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Selesai / Siap
          </button>
        )}
      </div>
    </div>
  );
}