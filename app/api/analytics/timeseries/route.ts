import { NextResponse } from "next/server";
import { requireUserAndRole } from "../../../lib/authServer";
import { supabaseService } from "../../../lib/supabaseServer";

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate()+n); return x; }
function fmtDay(d: Date) { const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,"0"); const day=String(d.getDate()).padStart(2,"0"); return `${y}-${m}-${day}`; }

export async function GET(req: Request) {
  try {
    await requireUserAndRole(req.headers.get("authorization"), ["admin", "cashier"]);

    const url = new URL(req.url);
    const mode = (url.searchParams.get("mode") || "week") as "week" | "month";
    const days = mode === "week" ? 7 : 30;

    const svc = supabaseService();
    const now = new Date();
    const end = startOfDay(addDays(now, 1));
    const start = startOfDay(addDays(now, -(days - 1)));

    const { data: orders, error } = await svc
      .from("orders")
      .select("created_at,total")
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString());

    if (error) throw error;

    const map = new Map<string, { revenue: number; orders: number }>();
    for (let i = 0; i < days; i++) map.set(fmtDay(addDays(start,i)), { revenue: 0, orders: 0 });

    for (const o of orders ?? []) {
      const key = fmtDay(new Date(o.created_at));
      const b = map.get(key);
      if (!b) continue;
      b.orders += 1;
      b.revenue += o.total ?? 0;
    }

    const series = [...map.entries()].map(([date, v]) => ({ date, orders: v.orders, revenue: v.revenue }));
    return NextResponse.json({ mode, start: start.toISOString(), end: end.toISOString(), series });
  } catch (e: any) {
    const msg = e?.message ?? "ERROR";
    const code = msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: msg }, { status: code });
  }
}
