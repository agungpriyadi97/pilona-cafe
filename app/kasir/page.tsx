"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AuthGate from "../components/AuthGate";
import Navbar from "../components/Navbar";
import ThemeLock from "../components/ThemeLock";
import { supabase } from "../lib/supabaseClient";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/* =========================
   Types
========================= */
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

type SeriesPoint = { label: string; orders: number; revenue: number };

/* =========================
   Utils
========================= */
function rupiah(n: number) {
  const v = typeof n === "number" && Number.isFinite(n) ? n : 0;
  return "Rp " + v.toLocaleString("id-ID");
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

function badgeStatus(status: Status) {
  if (status === "MENUNGGU") {
    return { text: "MENUNGGU KONFIRMASI", bg: "#FFF7ED", fg: "#C2410C", bd: "#FED7AA" };
  }
  if (status === "DITERIMA") {
    return { text: "SEDANG DIPROSES", bg: "#EFF6FF", fg: "#1D4ED8", bd: "#BFDBFE" };
  }
  if (status === "SELESAI") {
    return { text: "SUDAH SIAP", bg: "#ECFDF5", fg: "#15803D", bd: "#BBF7D0" };
  }
  return { text: "BATAL", bg: "#FEF2F2", fg: "#B91C1C", bd: "#FECACA" };
}

/* =========================
   Page
========================= */
export default function KasirPage() {
  const [range, setRange] = useState<"today" | "week" | "month">("today");
  const [activeStatus, setActiveStatus] = useState<Status>("MENUNGGU");

  // keep latest values without resubscribe
  const rangeRef = useRef(range);
  const activeStatusRef = useRef(activeStatus);
  useEffect(() => void (rangeRef.current = range), [range]);
  useEffect(() => void (activeStatusRef.current = activeStatus), [activeStatus]);

  // counts
  const [countMenunggu, setCountMenunggu] = useState(0);
  const [countDiterima, setCountDiterima] = useState(0);
  const [countSelesai, setCountSelesai] = useState(0);

  // chart
  const [series, setSeries] = useState<SeriesPoint[]>([]);

  // orders
  const [queueMap, setQueueMap] = useState<Record<string, number>>({});
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // sound
  const [soundEnabled, setSoundEnabled] = useState(false);
  const soundEnabledRef = useRef(soundEnabled);
  useEffect(() => void (soundEnabledRef.current = soundEnabled), [soundEnabled]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUnlockedRef = useRef(false);

  // anti double beep
  const lastBeepAtRef = useRef(0);
  const lastStatusByIdRef = useRef<Record<string, Status>>({});

  /* ---------- Audio init ---------- */
  useEffect(() => {
    const a = new Audio("/notif.mp3");
    a.preload = "auto";
    audioRef.current = a;
  }, []);

  function shouldBeepNow() {
    const now = Date.now();
    if (now - lastBeepAtRef.current < 1200) return false;
    lastBeepAtRef.current = now;
    return true;
  }

  async function unlockAudio() {
    const a = audioRef.current;
    if (!a) return;

    a.volume = 0;
    a.currentTime = 0;
    await a.play();
    a.pause();
    a.currentTime = 0;
    a.volume = 1;

    audioUnlockedRef.current = true;
  }

  async function enableSound() {
    if (soundEnabledRef.current) return;
    setSoundEnabled(true);
    try {
      await unlockAudio();
    } catch {
      alert("Browser masih memblokir autoplay. Klik Enable Sound sekali lagi.");
    }
  }

  async function playNotif() {
    const a = audioRef.current;
    if (!a) return;
    if (!soundEnabledRef.current) return;
    if (!audioUnlockedRef.current) return;

    try {
      a.currentTime = 0;
      await a.play();
    } catch {
      // ignore
    }
  }

  /* ---------- Loaders ---------- */
  async function loadCounts() {
    const { data, error } = await supabase.from("orders").select("status");
    if (error) return console.error("loadCounts error:", error);

    const rows = (data ?? []) as Array<{ status: Status }>;
    setCountMenunggu(rows.filter((r) => r.status === "MENUNGGU").length);
    setCountDiterima(rows.filter((r) => r.status === "DITERIMA").length);
    setCountSelesai(rows.filter((r) => r.status === "SELESAI").length);
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

    if (error) return console.error("loadQueueToday error:", error);

    const map: Record<string, number> = {};
    (data ?? []).forEach((o: any, idx: number) => {
      map[o.id] = idx + 1;
    });
    setQueueMap(map);
  }

  async function loadOrders() {
    setLoadingOrders(true);
    try {
      const st = activeStatusRef.current;

      const { data, error } = await supabase
        .from("orders")
        .select(
          "id,created_at,customer_name,customer_phone,order_type,status,subtotal,tax,total,order_items(name,qty,price_label,price_value)"
        )
        .eq("status", st)
        .order("created_at", { ascending: false });

      if (error) return console.error("loadOrders error:", error);
      setOrders((data ?? []) as OrderRow[]);
    } finally {
      setLoadingOrders(false);
    }
  }

  async function loadChart() {
    const now = new Date();
    const r = rangeRef.current;

    // TODAY: per jam
    if (r === "today") {
      const start = startOfDay(now);
      const end = addDays(start, 1);

      const { data, error } = await supabase
        .from("orders")
        .select("created_at,total")
        .gte("created_at", start.toISOString())
        .lt("created_at", end.toISOString());

      if (error) return console.error("loadChart(today) error:", error);

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
          label: `${String(h).padStart(2, "0")}:00`,
          orders: buckets.get(h)!.orders,
          revenue: buckets.get(h)!.revenue,
        }))
      );
      return;
    }

    // WEEK/MONTH: per hari
    const days = r === "week" ? 7 : 30;
    const end = startOfDay(addDays(now, 1));
    const start = startOfDay(addDays(now, -(days - 1)));

    const { data, error } = await supabase
      .from("orders")
      .select("created_at,total")
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString());

    if (error) return console.error("loadChart(days) error:", error);

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
        label: date.slice(5),
        orders: v.orders,
        revenue: v.revenue,
      }))
    );
  }

  async function refreshAll() {
    await Promise.all([loadCounts(), loadChart(), loadQueueToday(), loadOrders()]);
  }

  /* ---------- Realtime subscribe ONCE + polling fallback ---------- */
  useEffect(() => {
    let alive = true;

    const safe = async (fn: () => Promise<any>) => {
      try {
        if (!alive) return;
        await fn();
      } catch (e) {
        console.log("handler error:", e);
      }
    };

    const refreshAllLocal = () => Promise.all([loadCounts(), loadChart(), loadQueueToday(), loadOrders()]);

    // initial load
    safe(refreshAllLocal);

    const channel = supabase
      .channel("kasir-orders-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (payload) => {
        const row = payload.new as any;
        const id = row?.id as string | undefined;
        const st = row?.status as Status | undefined;

        if (id && st) lastStatusByIdRef.current[id] = st;

        if (st === "MENUNGGU" && shouldBeepNow()) {
          safe(playNotif);
        }

        safe(refreshAllLocal);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, (payload) => {
        const row = payload.new as any;
        const id = row?.id as string | undefined;
        const nextStatus = row?.status as Status | undefined;

        if (!id || !nextStatus) return void safe(refreshAllLocal);

        const prevStatus = lastStatusByIdRef.current[id];
        lastStatusByIdRef.current[id] = nextStatus;

        if (!prevStatus) return void safe(refreshAllLocal);

        const changed = prevStatus !== nextStatus;
        const shouldBeep =
          changed &&
          ((prevStatus === "MENUNGGU" && nextStatus === "DITERIMA") ||
            (prevStatus === "MENUNGGU" && nextStatus === "BATAL") ||
            (prevStatus === "DITERIMA" && nextStatus === "SELESAI"));

        if (shouldBeep && shouldBeepNow()) {
          safe(playNotif);
        }

        safe(refreshAllLocal);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, () => {
        safe(loadOrders);
      })
      .subscribe();

    const timer = setInterval(() => safe(refreshAllLocal), 4000);

    return () => {
      alive = false;
      clearInterval(timer);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // refresh when range/status change (no resubscribe)
  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, activeStatus]);

  async function logout() {
    await supabase.auth.signOut();
    location.href = "/";
  }

  async function updateStatus(orderId: string, status: Status) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
    if (error) return alert(error.message);
    await refreshAll();
  }

  async function cancelOrder(orderId: string) {
    const ok = confirm("Batalkan pesanan ini? (status akan menjadi BATAL)");
    if (!ok) return;

    const { error } = await supabase.from("orders").update({ status: "BATAL" }).eq("id", orderId);
    if (error) return alert(error.message);
    await refreshAll();
  }

  const headerLabel = useMemo(() => {
    if (range === "today") return "Hari ini";
    if (range === "week") return "Mingguan";
    return "Bulanan";
  }, [range]);

  return (
    <AuthGate allow={["admin", "cashier"]} nextPath="/kasir">
      <ThemeLock mode="light" />
      <main className="min-h-screen">
        <Navbar hideThemeToggle />

        <div className="mx-auto max-w-6xl px-5 py-6">
          {/* Action bar */}
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              onClick={enableSound}
              className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-neutral-50"
            >
              {soundEnabled ? "Sound: ON" : "Enable Sound"}
            </button>

            <button
              onClick={async () => {
                try {
                  if (!soundEnabledRef.current) setSoundEnabled(true);
                  if (!audioUnlockedRef.current) await unlockAudio();
                  await playNotif();
                } catch { }
              }}
              className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-neutral-50"
            >
              Test Sound
            </button>

            <button
              onClick={logout}
              className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-neutral-50"
            >
              Keluar
            </button>
          </div>

          {/* Range Tabs */}
          <div className="mt-6 flex gap-2">
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

          {/* Status Cards */}
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
                      formatter={(val: any, name?: string) => (name === "revenue" ? rupiah(Number(val)) : val)}
                      labelStyle={{ fontSize: 12 }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="orders" name="Pesanan" stroke="#2563EB" strokeWidth={3} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="revenue" name="Pendapatan" stroke="#16A34A" strokeWidth={3} dot={{ r: 3 }} strokeDasharray="6 6" />
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

            <div className="mt-5 max-h-[520px] space-y-4 overflow-auto pr-2">
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
                    queueNo={queueMap[o.id]}
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

/* =========================
   Components
========================= */
function RangeBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
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
  queueNo?: number;
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
                  <div className="text-neutral-500">
                    {it.price_label ?? (it.price_value ? rupiah(it.price_value) : "")}
                  </div>
                </div>
              ))}
              {(order.order_items ?? []).length > 4 && (
                <div className="text-xs text-neutral-400">
                  + {(order.order_items!.length - 4)} item lainnya
                </div>
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
              className="flex-1 rounded-xl bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600"
            >
              Terima
            </button>
            <button
              onClick={onCancel}
              className="flex-1 rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-50"
            >
              Batalkan
            </button>
          </>
        )}

        {status === "DITERIMA" && (
          <button
            onClick={onDone}
            className="flex-1 rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
          >
            Selesai
          </button>
        )}
      </div>
    </div>
  );
}