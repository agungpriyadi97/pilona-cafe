import { NextResponse } from "next/server";
import { requireUserAndRole } from "../../../lib/authServer";
import { supabaseService } from "../../../lib/supabaseServer";

function startOfDay(d: Date){ const x=new Date(d); x.setHours(0,0,0,0); return x; }
function addDays(d: Date, n:number){ const x=new Date(d); x.setDate(x.getDate()+n); return x; }
function growthPct(nowVal:number, prevVal:number){ if(prevVal<=0) return nowVal>0?100:0; return ((nowVal-prevVal)/prevVal)*100; }

export async function GET(req: Request) {
  try {
    await requireUserAndRole(req.headers.get("authorization"), ["admin"]);

    const url = new URL(req.url);
    const mode = (url.searchParams.get("mode") || "week") as "week" | "month";
    const days = mode === "week" ? 7 : 30;

    const svc = supabaseService();
    const now = new Date();
    const end = startOfDay(addDays(now, 1));
    const startNow = startOfDay(addDays(now, -(days - 1)));
    const startPrev = startOfDay(addDays(startNow, -days));
    const endPrev = startOfDay(addDays(startNow, 0));

    const [{ data: cur, error: e1 }, { data: prev, error: e2 }] = await Promise.all([
      svc.from("orders").select("total,created_at").gte("created_at", startNow.toISOString()).lt("created_at", end.toISOString()),
      svc.from("orders").select("total,created_at").gte("created_at", startPrev.toISOString()).lt("created_at", endPrev.toISOString()),
    ]);
    if (e1) throw e1;
    if (e2) throw e2;

    const curOrders = cur?.length ?? 0;
    const prevOrders = prev?.length ?? 0;
    const curRevenue = (cur ?? []).reduce((s:number,o:any)=>s+(o.total??0),0);
    const prevRevenue = (prev ?? []).reduce((s:number,o:any)=>s+(o.total??0),0);

    return NextResponse.json({
      mode,
      current: { start: startNow.toISOString(), end: end.toISOString(), orders: curOrders, revenue: curRevenue },
      previous: { start: startPrev.toISOString(), end: endPrev.toISOString(), orders: prevOrders, revenue: prevRevenue },
      growth: { ordersPct: growthPct(curOrders, prevOrders), revenuePct: growthPct(curRevenue, prevRevenue) },
    });
  } catch (e:any) {
    const msg=e?.message ?? "ERROR";
    const code = msg==="UNAUTHORIZED"?401:msg==="FORBIDDEN"?403:500;
    return NextResponse.json({ error: msg }, { status: code });
  }
}