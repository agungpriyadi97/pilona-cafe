import { NextResponse } from "next/server";
import { requireUserAndRole } from "../../../lib/authServer";
import { supabaseService } from "../../../lib/supabaseServer";

type OrderRow = {
  id: string;
  total: number | null;
  order_type: "DINE_IN" | "TAKE_AWAY";
  created_at: string;
  status?: string | null;
};

type ItemRow = {
  name: string;
  qty: number | null;
};

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}
function startOfYear(d: Date) {
  return new Date(d.getFullYear(), 0, 1, 0, 0, 0, 0);
}

async function sumRevenueBetween(
  svc: ReturnType<typeof supabaseService>,
  fromISO: string,
  toISO: string
) {
  const { data, error } = await svc
    .from("orders")
    .select("total")
    .eq("status", "SELESAI") // ✅ pendapatan = yang selesai
    .gte("created_at", fromISO)
    .lt("created_at", toISO);

  if (error) throw error;
  return (data ?? []).reduce((sum: number, r: any) => sum + (r.total ?? 0), 0);
}

export async function GET(req: Request) {
  try {
    // Admin & Cashier boleh lihat summary (kalau mau Admin only, ganti jadi ["admin"])
    await requireUserAndRole(req.headers.get("authorization"), ["admin", "cashier"]);

    const svc = supabaseService();

    // Ambil orders (exclude BATAL kalau ada)
    const { data: orders, error: e1 } = await svc
      .from("orders")
      .select("id,total,order_type,created_at,status")
      .neq("status", "BATAL")
      .order("created_at", { ascending: false });

    if (e1) throw e1;

    const o = (orders ?? []) as OrderRow[];

    const totalOrders = o.length;
    const totalRevenue = o.reduce((sum, x) => sum + (x.total ?? 0), 0);
    const avgOrder = totalOrders ? Math.round(totalRevenue / totalOrders) : 0;

    // ✅ Pendapatan Harian/Bulanan/Tahunan (berdasarkan SELESAI)
    const now = new Date();

    const fromDay = startOfDay(now);
    const toDay = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));

    const fromMonth = startOfMonth(now);
    const toMonth = startOfMonth(new Date(now.getFullYear(), now.getMonth() + 1, 1));

    const fromYear = startOfYear(now);
    const toYear = startOfYear(new Date(now.getFullYear() + 1, 0, 1));

    const [revenueDaily, revenueMonthly, revenueYearly] = await Promise.all([
      sumRevenueBetween(svc, fromDay.toISOString(), toDay.toISOString()),
      sumRevenueBetween(svc, fromMonth.toISOString(), toMonth.toISOString()),
      sumRevenueBetween(svc, fromYear.toISOString(), toYear.toISOString()),
    ]);

    // Top menu (sum qty)
    const { data: items, error: e2 } = await svc.from("order_items").select("name,qty");
    if (e2) throw e2;

    const it = (items ?? []) as ItemRow[];
    const countMap = new Map<string, number>();
    for (const row of it) {
      const q = row.qty ?? 1;
      countMap.set(row.name, (countMap.get(row.name) ?? 0) + q);
    }
    const topMenu = [...countMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Peak hours (Top 3)
    const hourMap = new Map<string, number>();
    for (const row of o) {
      const d = new Date(row.created_at);
      const h = String(d.getHours()).padStart(2, "0");
      const label = `${h}:00 - ${String(d.getHours() + 1).padStart(2, "0")}:00`;
      hourMap.set(label, (hourMap.get(label) ?? 0) + 1);
    }
    const peakHours = [...hourMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour, count]) => ({ hour, count }));

    // Type distribution
    const dineIn = o.filter((x) => x.order_type === "DINE_IN").length;
    const takeAway = o.filter((x) => x.order_type === "TAKE_AWAY").length;

    return NextResponse.json({
      totalOrders,
      totalRevenue,
      avgOrder,
      revenueDaily,
      revenueMonthly,
      revenueYearly,
      topMenu,
      peakHours,
      typeDist: { dineIn, takeAway },
    });
  } catch (e: any) {
    const msg = e?.message ?? "ERROR";
    const code = msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: msg }, { status: code });
  }
}