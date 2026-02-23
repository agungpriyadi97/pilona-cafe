import { NextResponse } from "next/server";
import { requireUserAndRole } from "../../../lib/authServer";
import { supabaseService } from "../../../lib/supabaseServer";

export async function GET(req: Request) {
  try {
    await requireUserAndRole(req.headers.get("authorization"), ["admin"]);
    const svc = supabaseService();

    const { data: orders, error } = await svc
      .from("orders")
      .select("id,created_at,customer_name,customer_phone,order_type,status,subtotal,tax,total")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const header = [
      "id",
      "created_at",
      "customer_name",
      "customer_phone",
      "order_type",
      "status",
      "subtotal",
      "tax",
      "total",
    ];

    const rows = (orders ?? []).map((o: any) =>
      header.map((h) => {
        const v = o[h];
        const s = v == null ? "" : String(v);
        // escape CSV
        if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
        return s;
      })
    );

    const csv = [header.join(","), ...rows.map((r: string[]) => r.join(","))].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="pilona-report.csv"`,
      },
    });
  } catch (e: any) {
    const msg = e?.message ?? "ERROR";
    const code = msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: msg }, { status: code });
  }
}